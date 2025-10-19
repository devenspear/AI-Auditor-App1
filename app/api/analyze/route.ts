import { NextResponse } from "next/server";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { scrapeWebsite } from "@/lib/web-scraper";
import type { SSLGrade, AIAnalysis, DualAIAnalysis } from "@/lib/report-types";

interface PageSpeedData {
  lighthouseResult?: {
    categories?: {
      performance?: { score: number };
      accessibility?: { score: number };
      "best-practices"?: { score: number };
      seo?: { score: number };
    };
  };
  [key: string]: unknown;
}

function isValidHttpsUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

async function fetchPageSpeedData(url: string, apiKey: string): Promise<PageSpeedData> {
  const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${apiKey}&strategy=mobile&category=performance&category=accessibility&category=best-practices&category=seo`;

  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error(`PageSpeed API error: ${response.statusText}`);
  }

  return response.json();
}

async function fetchSSLData(url: string): Promise<SSLGrade> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/ssl-check?url=${encodeURIComponent(url)}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`SSL check failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.warn('SSL check failed:', error);
    return {
      hasSSL: url.startsWith('https://'),
      grade: 'Error',
      error: error instanceof Error ? error.message : 'SSL check unavailable',
    };
  }
}

async function analyzeWithOpenAI(
  url: string,
  pageSpeedData: PageSpeedData,
  scrapedData: Awaited<ReturnType<typeof scrapeWebsite>>,
  openai: OpenAI
): Promise<AIAnalysis> {
  const startTime = Date.now();
  console.log('analyzeWithOpenAI: Starting analysis for URL:', url);

  const prompt = `You are an expert web marketing and UX auditor. Analyze the following website data and provide actionable recommendations.

Website URL: ${url}

PageSpeed Insights Data:
${JSON.stringify(pageSpeedData, null, 2)}

Schema.org Data:
${JSON.stringify(scrapedData.schema, null, 2)}

Social Media Tags:
${JSON.stringify(scrapedData.socialTags, null, 2)}

Please provide a comprehensive audit covering:
1. **Performance**: Load times, optimization opportunities
2. **SEO**: Meta tags, structure, mobile-friendliness, schema markup
3. **Accessibility**: WCAG compliance, usability issues
4. **User Experience**: Design, navigation, conversion optimization
5. **Marketing**: Messaging clarity, calls-to-action, value proposition
6. **AI Readiness**: How well the site is optimized for AI search engines and LLMs

Format your response as a structured JSON with the following schema:
{
  "summary": "Brief overall assessment (2-3 sentences)",
  "scores": {
    "brandVoice": 0-100,
    "geoReadiness": 0-100,
    "technicalHealth": 0-100
  },
  "keyInsights": [
    "Specific insight about the site",
    "Another key observation",
    "Third important point"
  ],
  "recommendations": [
    "Actionable recommendation 1",
    "Actionable recommendation 2",
    "Actionable recommendation 3"
  ]
}`;

  console.log('analyzeWithOpenAI: Calling OpenAI API...');

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are an expert web marketing and UX auditor. Always respond with valid JSON only, no additional text.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 4096,
    response_format: { type: "json_object" },
  });

  console.log('analyzeWithOpenAI: API call successful');
  const content = completion.choices[0].message.content;
  const processingTime = Date.now() - startTime;

  if (content) {
    try {
      const parsed = JSON.parse(content);
      return {
        provider: "openai",
        summary: parsed.summary || "Analysis complete",
        scores: parsed.scores,
        keyInsights: parsed.keyInsights || [],
        recommendations: parsed.recommendations || [],
        processingTime,
      };
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      throw new Error("Failed to parse OpenAI response");
    }
  }

  throw new Error("No content in OpenAI response");
}

async function analyzeWithClaude(
  url: string,
  pageSpeedData: PageSpeedData,
  scrapedData: Awaited<ReturnType<typeof scrapeWebsite>>,
  anthropic: Anthropic
): Promise<AIAnalysis> {
  const startTime = Date.now();
  console.log('analyzeWithClaude: Starting analysis for URL:', url);

  const prompt = `You are an expert web marketing and UX auditor specializing in AI-native optimization. Analyze the following website data and provide actionable recommendations.

Website URL: ${url}

PageSpeed Insights Data:
${JSON.stringify(pageSpeedData, null, 2)}

Schema.org Structured Data:
${JSON.stringify(scrapedData.schema, null, 2)}

Social Media Tags (Open Graph & Twitter Card):
${JSON.stringify(scrapedData.socialTags, null, 2)}

Please provide a comprehensive audit with special focus on:
1. **Brand Voice & Messaging**: Clarity, consistency, and confidence
2. **GEO (Generative Engine Optimization)**: How well the site is structured for AI search engines like ChatGPT, Perplexity, and Google SGE
3. **Technical Health**: Performance, accessibility, structured data completeness
4. **AI Readiness**: Schema markup, semantic HTML, clear value propositions that AI can understand

Format your response as a structured JSON with the following schema:
{
  "summary": "Brief overall assessment focused on AI optimization (2-3 sentences)",
  "scores": {
    "brandVoice": 0-100,
    "geoReadiness": 0-100,
    "technicalHealth": 0-100
  },
  "keyInsights": [
    "Specific insight about AI discoverability",
    "Another key observation about structured data",
    "Third important point about brand clarity for AI"
  ],
  "recommendations": [
    "Actionable GEO recommendation 1",
    "Actionable brand clarity recommendation 2",
    "Actionable technical improvement 3"
  ]
}`;

  console.log('analyzeWithClaude: Calling Anthropic API...');

  const message = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  console.log('analyzeWithClaude: API call successful');
  const processingTime = Date.now() - startTime;

  const content = message.content[0];
  if (content.type === "text") {
    try {
      // Claude might wrap JSON in markdown code blocks
      let jsonText = content.text;
      const jsonMatch = jsonText.match(/```json\n?([\s\S]*?)\n?```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      }

      const parsed = JSON.parse(jsonText);
      return {
        provider: "anthropic",
        summary: parsed.summary || "Analysis complete",
        scores: parsed.scores,
        keyInsights: parsed.keyInsights || [],
        recommendations: parsed.recommendations || [],
        processingTime,
      };
    } catch (parseError) {
      console.error('JSON parse error from Claude:', parseError);
      console.error('Claude response:', content.text);
      throw new Error("Failed to parse Claude response");
    }
  }

  throw new Error("No text content in Claude response");
}

function createDualAIConsensus(openai: AIAnalysis, claude: AIAnalysis): DualAIAnalysis["consensus"] {
  // Find agreed insights (similar concepts)
  const agreedInsights: string[] = [];
  const uniqueToOpenAI: string[] = [...openai.keyInsights];
  const uniqueToClaude: string[] = [...claude.keyInsights];

  // Simple keyword matching for consensus (can be improved with embeddings)
  openai.keyInsights.forEach((oInsight) => {
    const hasMatch = claude.keyInsights.some((cInsight) => {
      const oWords = oInsight.toLowerCase().split(' ');
      const cWords = cInsight.toLowerCase().split(' ');
      const commonWords = oWords.filter((word) => cWords.includes(word) && word.length > 4);
      return commonWords.length >= 2; // At least 2 common significant words
    });

    if (hasMatch) {
      agreedInsights.push(oInsight);
    }
  });

  // Combine recommendations
  const recommendedActions = [
    ...openai.recommendations.slice(0, 3),
    ...claude.recommendations.slice(0, 3),
  ];

  return {
    agreedInsights,
    uniqueToOpenAI,
    uniqueToClaude,
    recommendedActions,
  };
}

// Diagnostic logging helper
interface DiagnosticLog {
  step: string;
  status: 'started' | 'success' | 'error' | 'skipped';
  timestamp: number;
  duration?: number;
  error?: string;
  data?: unknown;
}

export async function POST(request: Request) {
  const diagnostics: DiagnosticLog[] = [];
  const startTime = Date.now();

  try {
    diagnostics.push({
      step: 'Parse request',
      status: 'started',
      timestamp: Date.now(),
    });

    const json = await request.json();
    const url = typeof json?.url === "string" ? json.url.trim() : "";
    const debug = json?.debug === true;

    diagnostics[diagnostics.length - 1].status = 'success';
    diagnostics[diagnostics.length - 1].duration = Date.now() - diagnostics[diagnostics.length - 1].timestamp;

    if (!isValidHttpsUrl(url)) {
      return NextResponse.json(
        { message: "Please provide a valid URL." },
        { status: 400 },
      );
    }

    // Check for required API keys
    diagnostics.push({
      step: 'Check API keys',
      status: 'started',
      timestamp: Date.now(),
    });

    const openaiKey = process.env.OPENAI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const pageSpeedKey = process.env.PAGESPEED_API_KEY;

    if (!openaiKey) {
      diagnostics[diagnostics.length - 1].status = 'error';
      diagnostics[diagnostics.length - 1].error = 'OpenAI API key not configured';
      return NextResponse.json(
        { message: "Server configuration error. OpenAI API key not configured.", diagnostics },
        { status: 500 },
      );
    }

    diagnostics[diagnostics.length - 1].status = 'success';
    diagnostics[diagnostics.length - 1].duration = Date.now() - diagnostics[diagnostics.length - 1].timestamp;
    diagnostics[diagnostics.length - 1].data = {
      hasOpenAI: !!openaiKey,
      hasAnthropic: !!anthropicKey,
      hasPageSpeed: !!pageSpeedKey,
    };

    // Initialize AI clients
    console.log('Initializing AI clients...');
    const openai = new OpenAI({ apiKey: openaiKey });
    const anthropic = anthropicKey ? new Anthropic({ apiKey: anthropicKey }) : null;
    console.log('AI clients initialized');

    // Fetch all data in parallel for speed
    console.log('Fetching all data sources in parallel...');

    diagnostics.push({
      step: 'Fetch PageSpeed data',
      status: 'started',
      timestamp: Date.now(),
    });
    diagnostics.push({
      step: 'Scrape website',
      status: 'started',
      timestamp: Date.now(),
    });
    diagnostics.push({
      step: 'Check SSL',
      status: 'started',
      timestamp: Date.now(),
    });

    const [pageSpeedData, scrapedData, sslData] = await Promise.allSettled([
      pageSpeedKey
        ? fetchPageSpeedData(url, pageSpeedKey).catch((err) => {
            console.warn('PageSpeed API failed:', err);
            diagnostics.find(d => d.step === 'Fetch PageSpeed data')!.status = 'error';
            diagnostics.find(d => d.step === 'Fetch PageSpeed data')!.error = err.message;
            return {};
          })
        : (() => {
            diagnostics.find(d => d.step === 'Fetch PageSpeed data')!.status = 'skipped';
            diagnostics.find(d => d.step === 'Fetch PageSpeed data')!.error = 'No API key';
            return Promise.resolve({});
          })(),
      scrapeWebsite(url).catch((err) => {
        console.warn('Web scraping failed:', err);
        diagnostics.find(d => d.step === 'Scrape website')!.status = 'error';
        diagnostics.find(d => d.step === 'Scrape website')!.error = err.message;
        return {
          schema: {
            hasSchema: false,
            schemaTypes: [],
            count: 0,
            recommendations: [`Unable to scrape website: ${err.message}`],
          },
          socialTags: {
            openGraph: {
              hasOGTitle: false,
              hasOGDescription: false,
              hasOGImage: false,
              hasOGUrl: false,
              score: 0,
              tags: {},
            },
            twitterCard: {
              hasCard: false,
              hasTitle: false,
              hasDescription: false,
              hasImage: false,
              score: 0,
              tags: {},
            },
            overallScore: 0,
            recommendations: [`Unable to scrape website: ${err.message}`],
          },
        };
      }),
      fetchSSLData(url).catch((err) => {
        console.warn('SSL check failed:', err);
        diagnostics.find(d => d.step === 'Check SSL')!.status = 'error';
        diagnostics.find(d => d.step === 'Check SSL')!.error = err.message;
        return {
          hasSSL: url.startsWith('https://'),
          grade: 'Error',
          error: err.message,
        };
      }),
    ]);

    const pageSpeed: PageSpeedData = pageSpeedData.status === 'fulfilled' ? pageSpeedData.value : {};
    const scraped = scrapedData.status === 'fulfilled' ? scrapedData.value : {
      schema: {
        hasSchema: false,
        schemaTypes: [],
        count: 0,
        recommendations: [],
      },
      socialTags: {
        openGraph: {
          hasOGTitle: false,
          hasOGDescription: false,
          hasOGImage: false,
          hasOGUrl: false,
          score: 0,
          tags: {},
        },
        twitterCard: {
          hasCard: false,
          hasTitle: false,
          hasDescription: false,
          hasImage: false,
          score: 0,
          tags: {},
        },
        overallScore: 0,
        recommendations: [],
      },
    };
    const ssl = sslData.status === 'fulfilled' ? sslData.value : null;

    // Update diagnostics for data fetching
    if (pageSpeedData.status === 'fulfilled') {
      const diag = diagnostics.find(d => d.step === 'Fetch PageSpeed data')!;
      diag.status = 'success';
      diag.duration = Date.now() - diag.timestamp;
      diag.data = {
        hasData: Object.keys(pageSpeed).length > 0,
        score: pageSpeed.lighthouseResult?.categories?.performance?.score,
      };
    }
    if (scrapedData.status === 'fulfilled') {
      const diag = diagnostics.find(d => d.step === 'Scrape website')!;
      diag.status = 'success';
      diag.duration = Date.now() - diag.timestamp;
      diag.data = {
        schemaCount: scraped.schema.count,
        socialScore: scraped.socialTags.overallScore,
      };
    }
    if (sslData.status === 'fulfilled') {
      const diag = diagnostics.find(d => d.step === 'Check SSL')!;
      diag.status = 'success';
      diag.duration = Date.now() - diag.timestamp;
      diag.data = {
        hasSSL: ssl?.hasSSL,
        grade: ssl?.grade,
      };
    }

    console.log('All data sources fetched');

    // Run AI analyses in parallel if both are available
    console.log('Starting AI analyses...');
    let dualAI: DualAIAnalysis | undefined;

    diagnostics.push({
      step: 'Analyze with OpenAI',
      status: 'started',
      timestamp: Date.now(),
    });
    diagnostics.push({
      step: 'Analyze with Claude',
      status: 'started',
      timestamp: Date.now(),
    });

    if (anthropic) {
      // Run both AIs in parallel
      const [openaiResult, claudeResult] = await Promise.allSettled([
        analyzeWithOpenAI(url, pageSpeed, scraped, openai),
        analyzeWithClaude(url, pageSpeed, scraped, anthropic),
      ]);

      // Update OpenAI diagnostics
      if (openaiResult.status === 'fulfilled') {
        const diag = diagnostics.find(d => d.step === 'Analyze with OpenAI')!;
        diag.status = 'success';
        diag.duration = Date.now() - diag.timestamp;
        diag.data = {
          processingTime: openaiResult.value.processingTime,
          scores: openaiResult.value.scores,
          insightCount: openaiResult.value.keyInsights.length,
        };
      } else {
        const diag = diagnostics.find(d => d.step === 'Analyze with OpenAI')!;
        diag.status = 'error';
        diag.duration = Date.now() - diag.timestamp;
        diag.error = openaiResult.reason?.message || 'Unknown error';
      }

      // Update Claude diagnostics
      if (claudeResult.status === 'fulfilled') {
        const diag = diagnostics.find(d => d.step === 'Analyze with Claude')!;
        diag.status = 'success';
        diag.duration = Date.now() - diag.timestamp;
        diag.data = {
          processingTime: claudeResult.value.processingTime,
          scores: claudeResult.value.scores,
          insightCount: claudeResult.value.keyInsights.length,
        };
      } else {
        const diag = diagnostics.find(d => d.step === 'Analyze with Claude')!;
        diag.status = 'error';
        diag.duration = Date.now() - diag.timestamp;
        diag.error = claudeResult.reason?.message || 'Unknown error';
      }

      if (openaiResult.status === 'fulfilled' && claudeResult.status === 'fulfilled') {
        const consensus = createDualAIConsensus(openaiResult.value, claudeResult.value);

        // Calculate confidence
        const avgScoreDiff = Math.abs(
          ((openaiResult.value.scores?.brandVoice || 0) - (claudeResult.value.scores?.brandVoice || 0)) +
          ((openaiResult.value.scores?.geoReadiness || 0) - (claudeResult.value.scores?.geoReadiness || 0)) +
          ((openaiResult.value.scores?.technicalHealth || 0) - (claudeResult.value.scores?.technicalHealth || 0))
        ) / 3;

        const confidence: "high" | "medium" | "low" =
          avgScoreDiff < 10 ? "high" : avgScoreDiff < 20 ? "medium" : "low";

        dualAI = {
          openai: openaiResult.value,
          claude: claudeResult.value,
          consensus,
          confidence,
        };
        console.log('Dual AI analysis completed');
      } else {
        console.warn('One or both AI analyses failed:', {
          openai: openaiResult.status,
          claude: claudeResult.status,
        });
      }
    } else {
      diagnostics.find(d => d.step === 'Analyze with Claude')!.status = 'skipped';
      diagnostics.find(d => d.step === 'Analyze with Claude')!.error = 'No API key';
    }

    console.log('Analysis complete, preparing response...');

    const totalDuration = Date.now() - startTime;

    const response = {
      success: true,
      url,
      analyzedAt: new Date().toISOString(),
      // Combine data from all sources
      summary: dualAI?.consensus.recommendedActions[0] || "Analysis complete",
      score: {
        overall: Math.round(
          ((dualAI?.openai.scores?.brandVoice || 50) +
            (dualAI?.openai.scores?.geoReadiness || 50) +
            (dualAI?.openai.scores?.technicalHealth || 50)) / 3
        ),
        grade: "B+", // Calculate based on overall score
        brandVoice: dualAI?.openai.scores?.brandVoice || 50,
        geoReadiness: dualAI?.openai.scores?.geoReadiness || 50,
        technicalHealth: dualAI?.openai.scores?.technicalHealth || 50,
        clarityNotes: dualAI?.consensus.agreedInsights || [],
      },
      performance: {
        mobileScore: Math.round((pageSpeed.lighthouseResult?.categories?.performance?.score ?? 0) * 100),
        desktopScore: Math.round((pageSpeed.lighthouseResult?.categories?.performance?.score ?? 0) * 100),
        overallScore: Math.round((pageSpeed.lighthouseResult?.categories?.performance?.score ?? 0) * 100),
        coreVitals: {
          lcp: "N/A",
          fid: "N/A",
          cls: "N/A",
        },
      },
      content: {
        title: "Website Title",
        metaDescription: "Description",
        h1: [],
        h2: [],
        wordCount: 0,
        robotsTxtFound: true,
        sitemapXmlFound: true,
      },
      keyThemes: dualAI?.openai.keyInsights.slice(0, 4) || [],
      readabilityLevel: "College",
      narrative: [
        {
          headline: "AI-Powered Dual Analysis",
          body: dualAI?.consensus.agreedInsights.join('. ') || "Analysis complete",
        },
      ],
      actionPlan: dualAI?.consensus.recommendedActions.slice(0, 5).map((rec) => ({
        title: rec,
        summary: rec,
        category: "Opportunity" as const,
        impact: "High" as const,
      })) || [],
      // New integrations
      ssl: ssl || undefined,
      schema: scraped.schema || undefined,
      socialTags: scraped.socialTags || undefined,
      dualAI: dualAI || undefined,
      // Diagnostics (only in debug mode)
      ...(debug && {
        diagnostics: {
          totalDuration,
          steps: diagnostics,
          summary: {
            totalSteps: diagnostics.length,
            successful: diagnostics.filter(d => d.status === 'success').length,
            failed: diagnostics.filter(d => d.status === 'error').length,
            skipped: diagnostics.filter(d => d.status === 'skipped').length,
          },
        },
      }),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Analysis request failed:", error);

    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Analysis failed. Please try again.",
        details: error instanceof Error ? error.stack : undefined,
        diagnostics,
      },
      { status: 500 },
    );
  }
}
