import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

function isValidHttpsUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

async function fetchPageSpeedData(url: string, apiKey: string) {
  const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${apiKey}&strategy=mobile&category=performance&category=accessibility&category=best-practices&category=seo`;

  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error(`PageSpeed API error: ${response.statusText}`);
  }

  return response.json();
}

async function analyzeWithAnthropic(url: string, pageSpeedData: any, anthropic: Anthropic) {
  const prompt = `You are an expert web marketing and UX auditor. Analyze the following website and PageSpeed data, then provide actionable recommendations.

Website URL: ${url}

PageSpeed Insights Data:
${JSON.stringify(pageSpeedData, null, 2)}

Please provide a comprehensive audit covering:
1. **Performance**: Load times, optimization opportunities
2. **SEO**: Meta tags, structure, mobile-friendliness
3. **Accessibility**: WCAG compliance, usability issues
4. **User Experience**: Design, navigation, conversion optimization
5. **Marketing**: Messaging clarity, calls-to-action, value proposition

Format your response as a structured JSON with the following schema:
{
  "summary": "Brief overall assessment",
  "scores": {
    "performance": 0-100,
    "seo": 0-100,
    "accessibility": 0-100,
    "ux": 0-100,
    "marketing": 0-100
  },
  "recommendations": [
    {
      "category": "performance|seo|accessibility|ux|marketing",
      "priority": "high|medium|low",
      "issue": "Description of the issue",
      "solution": "How to fix it",
      "impact": "Expected improvement"
    }
  ]
}`;

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

  const content = message.content[0];
  if (content.type === "text") {
    // Extract JSON from the response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return { rawResponse: content.text };
  }

  throw new Error("Unexpected response format from Claude");
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const url = typeof json?.url === "string" ? json.url.trim() : "";

    if (!isValidHttpsUrl(url)) {
      return NextResponse.json(
        { message: "Please provide a valid URL." },
        { status: 400 },
      );
    }

    // Check for required API keys
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const pageSpeedKey = process.env.PAGESPEED_API_KEY;

    if (!anthropicKey || !pageSpeedKey) {
      return NextResponse.json(
        {
          message: "Server configuration error. API keys not configured.",
        },
        { status: 500 },
      );
    }

    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: anthropicKey,
    });

    // Fetch PageSpeed data
    const pageSpeedData = await fetchPageSpeedData(url, pageSpeedKey);

    // Analyze with Claude
    const analysis = await analyzeWithAnthropic(url, pageSpeedData, anthropic);

    return NextResponse.json({
      success: true,
      url,
      analysis,
      pageSpeedData: {
        performanceScore: pageSpeedData.lighthouseResult?.categories?.performance?.score * 100,
        accessibilityScore: pageSpeedData.lighthouseResult?.categories?.accessibility?.score * 100,
        bestPracticesScore: pageSpeedData.lighthouseResult?.categories?.["best-practices"]?.score * 100,
        seoScore: pageSpeedData.lighthouseResult?.categories?.seo?.score * 100,
      },
    });
  } catch (error) {
    console.error("Analysis request failed:", error);
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Analysis failed. Please try again.",
      },
      { status: 500 },
    );
  }
}
