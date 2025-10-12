"use client";

import { FormEvent, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { CircularProgress } from "@/components/ui/circular-progress";
import { useCountUp } from "@/hooks/use-count-up";
import { designSystem } from "@/lib/design-system";
import {
  AnalysisReport,
  AnalysisRequestBody,
  ErrorResponse,
} from "@/lib/report-types";

// Demo report for testing (unused in production)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const demoReport: AnalysisReport = {
  url: "https://www.hillwoodcommunities.com/lifestyle-communities/treeline/",
  analyzedAt: new Date().toISOString(),
  summary:
    "Your current Treeline microsite offers a compelling lifestyle story, but the narrative is buried beneath long-form paragraphs and lacks the direct answers AI systems prefer. Technical foundations are solid, yet the brand voice feels diluted across pages.",
  keyThemes: [
    "Lifestyle community positioning",
    "Family-first amenities",
    "Outdoor recreation",
    "Master-planned growth",
  ],
  readabilityLevel: "College",
  score: {
    overall: 64,
    grade: "C+",
    brandVoice: 58,
    geoReadiness: 62,
    technicalHealth: 76,
    clarityNotes: [
      "Headlines emphasize experience but rarely answer direct buyer questions.",
      "Long paragraphs dilute key differentiators.",
      "Calls-to-action lack urgency for AI agents summarizing intent.",
    ],
  },
  performance: {
    mobileScore: 58,
    desktopScore: 82,
    overallScore: 70,
    coreVitals: {
      lcp: "3.8s",
      fid: "18ms",
      cls: "0.11",
    },
  },
  content: {
    title: "Treeline | A Hillwood Communities Lifestyle Destination",
    metaDescription:
      "Treeline is where North Austin families find a future-ready community, vibrant amenities, and nature-forward living.",
    h1: ["Treeline Lifestyle Community"],
    h2: [
      "Where modern living meets rooted community",
      "Explore the amenities",
      "Life powered by families",
      "Own your future in Leander",
    ],
    wordCount: 12840,
    robotsTxtFound: true,
    sitemapXmlFound: true,
  },
  narrative: [
    {
      headline: "Brand Meaning",
      body:
        "Treeline signals warmth and connection, yet the supporting copy leans into poetic language at the expense of direct clarity. AI judges confidence via explicit statements of who you serve and why you win.",
    },
    {
      headline: "AI Visibility",
      body:
        "Your sitemap coverage and structured data are adequate, but answers to high-intent questions such as pricing, schools, and timelines remain implicit. Generative engines prefer explicit, scannable facts.",
    },
  ],
  actionPlan: [
    {
      title: "Publish a Q&A section answering the top 10 relocation questions",
      summary:
        "Summarize family-focused differentiators in bullet form to feed AI answer boxes and reduce ambiguity.",
      category: "Quick Win",
      impact: "High",
    },
    {
      title: "Launch an AI-ready amenity hub page",
      summary:
        "Structure amenities with schema, short descriptions, and proof points so AI models can cite Treeline as an authoritative source.",
      category: "Opportunity",
      impact: "Medium",
    },
    {
      title: "Create a GEO playbook for future neighborhoods",
      summary:
        "Document persona narratives, FAQ schema, and prompt-ready snippets so every launch meets AI visibility standards from day one.",
      category: "Foundation",
      impact: "Medium",
    },
  ],
};

export default function Home() {
  const [url, setUrl] = useState("");
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  const lastAnalyzed = useMemo(() => {
    if (!report) return null;
    return new Date(report.analyzedAt).toLocaleString();
  }, [report]);

  async function handleAnalyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!url) return;

    // Auto-prepend https:// if missing protocol
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }

    // Validate URL format before submission
    try {
      const parsedUrl = new URL(formattedUrl);
      if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
        setError("Please enter a valid HTTP or HTTPS URL");
        setStatus("error");
        return;
      }
    } catch {
      setError("Please enter a valid URL (e.g., example.com or https://example.com)");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setError(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: formattedUrl } satisfies AnalysisRequestBody),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | ErrorResponse
          | null;
        throw new Error(payload?.message ?? "Unable to analyze the website.");
      }

      const payload = (await response.json()) as AnalysisReport;
      setReport(payload);
      setStatus("success");
    } catch (err) {
      console.error(err);
      setStatus("error");
      setError(
        err instanceof Error
          ? err.message
          : "We could not complete the analysis. Please try again.",
      );
    }
  }

  const showReport = status === "success" && report;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <main className={`${designSystem.spacing.section}`}>
        <div className={designSystem.spacing.containerNarrow}>
          <HeaderSection />
          <form
            onSubmit={handleAnalyze}
            className="mt-10 flex flex-col gap-4 sm:flex-row"
          >
            <input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://example.com"
              className="w-full rounded-xl border border-input bg-card px-4 py-3 text-base shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              type="text"
              required
            />
            <Button size="lg" className="sm:w-auto" disabled={status === "loading"}>
              {status === "loading" ? "Analyzing…" : "Analyze"}
            </Button>
          </form>
          <p className="mt-4 text-sm text-muted-foreground">
            We run a multi-step audit: on-page clarity, PageSpeed performance, and an AI
            brand assessment powered by GPT-4o.
          </p>

          {status === "loading" && <LoadingState />}

          {status === "error" && error && (
            <div className="mt-16 rounded-xl border border-red-300 bg-red-100/60 p-6 text-sm text-red-900">
              <p className="font-semibold">Analysis Failed</p>
              <p className="mt-2">{error}</p>
            </div>
          )}

          {showReport && report && (
            <div className="mt-16 space-y-8">
              {error && (
                <div className="rounded-xl border border-yellow-300 bg-yellow-100/60 p-4 text-sm text-yellow-900">
                  {error}
                </div>
              )}
              <ReportHeader
                url={report.url}
                grade={report.score.grade}
                overallScore={report.score.overall}
                analyzedAt={lastAnalyzed ?? report.analyzedAt}
                summary={report.summary}
              />
              <ScoreGrid report={report} />
              <PerformanceSection report={report} />
              {(report.ssl || report.security) && <SecuritySection report={report} />}
              {report.socialTags && <SocialTagsSection report={report} />}
              {report.schema && <SchemaSection report={report} />}
              <ContentSection report={report} />
              <InsightsSection report={report} />
              <ActionPlanSection report={report} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function HeaderSection() {
  return (
    <section className="text-center">
      {/* Logo placeholder - replace with new logo in future */}
      {/* <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary">
        Brand™ AI Auditor
      </div> */}
      <h1 className="mt-6 text-4xl font-bold tracking-tight md:text-5xl">
        Transform any website into a strategic AI roadmap
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Drop a URL and receive a boardroom-ready briefing on brand clarity, GEO
        readiness, and the exact actions to win AI-native search moments.
      </p>
    </section>
  );
}

function LoadingState() {
  return (
    <div className="mt-16 rounded-2xl border border-border bg-card p-8 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="size-12 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <div>
          <p className="text-lg font-semibold">Running full-stack analysis…</p>
          <p className="text-sm text-muted-foreground">
            Scraping site content, fetching PageSpeed Insights, and routing data through
            GPT-4o for strategic scoring.
          </p>
        </div>
      </div>
    </div>
  );
}

interface ReportHeaderProps {
  url: string;
  analyzedAt: string;
  grade: string;
  overallScore: number;
  summary: string;
}

function ReportHeader({ url, analyzedAt, grade, overallScore, summary }: ReportHeaderProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl border border-border bg-gradient-to-br from-card to-card/50 p-8 shadow-lg backdrop-blur-sm"
    >
      <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3 flex-1">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-sm font-semibold uppercase tracking-widest text-muted-foreground"
          >
            AI Readiness Report
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold md:text-3xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent"
          >
            {url}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-sm text-muted-foreground"
          >
            Analyzed on {analyzedAt}
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-base text-muted-foreground leading-relaxed"
          >
            {summary}
          </motion.p>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="flex items-center gap-8"
        >
          <div className="text-center">
            <motion.p
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
              className="text-6xl font-bold text-primary drop-shadow-lg"
            >
              {grade}
            </motion.p>
            <p className="mt-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Overall Grade
            </p>
          </div>
          <CircularProgress value={overallScore} delay={700} size={140} strokeWidth={10} />
        </motion.div>
      </div>
    </motion.section>
  );
}

function ScoreGrid({ report }: { report: AnalysisReport }) {
  const scores = [
    {
      title: "Brand Voice Score",
      value: report.score.brandVoice,
      description: "Assesses clarity, consistency, and confidence across the entire narrative.",
      delay: 0,
    },
    {
      title: "GEO Readiness",
      value: report.score.geoReadiness,
      description: "Measures how well content structure answers multi-intent questions for AI search.",
      delay: 100,
    },
    {
      title: "Technical Health",
      value: report.score.technicalHealth,
      description: "Pulls from PageSpeed, Core Web Vitals, and structured data signals surfaced during the audit.",
      delay: 200,
    },
  ];

  return (
    <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {scores.map((score) => (
        <ScoreCard key={score.title} {...score} />
      ))}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 p-6 shadow-md md:col-span-2 lg:col-span-3"
      >
        <p className="text-sm font-semibold uppercase tracking-wide text-primary flex items-center gap-2">
          <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Clarity Signals
        </p>
        <ul className="mt-4 space-y-3">
          {report.score.clarityNotes.map((note, index) => (
            <motion.li
              key={note}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="flex gap-3 text-sm text-foreground/90"
            >
              <span className="mt-0.5 flex-shrink-0 size-1.5 rounded-full bg-primary" />
              <span>{note}</span>
            </motion.li>
          ))}
        </ul>
      </motion.div>
    </section>
  );
}

function ScoreCard({ title, value, description, delay }: {
  title: string;
  value: number;
  description: string;
  delay: number;
}) {
  const animatedValue = useCountUp(value, 2000, delay);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay / 1000 }}
      whileHover={{ y: -4, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
      className="group rounded-xl border border-border bg-gradient-to-br from-card to-card/50 p-6 shadow-md hover:shadow-xl hover:border-primary/30 transition-all duration-300"
    >
      <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground group-hover:text-primary transition-colors">
        {title}
      </p>
      <div className="mt-3 flex items-baseline gap-2">
        <p className="text-5xl font-bold bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent">
          {animatedValue}
        </p>
        <span className="text-sm text-muted-foreground">/100</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-primary/60"
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1.5, delay: (delay + 500) / 1000, ease: "easeOut" }}
        />
      </div>
      <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}

function PerformanceSection({ report }: { report: AnalysisReport }) {
  const { performance } = report;
  return (
    <section className="rounded-2xl border border-border bg-card p-8 shadow-sm">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="lg:max-w-lg">
          <h3 className="text-xl font-semibold">Site Performance Snapshot</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            We query Google PageSpeed Insights for both mobile and desktop to understand
            how reliably AI agents will parse and prioritize your experience.
          </p>
        </div>
        <div className="grid flex-1 gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-background p-6">
            <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Mobile Score
            </p>
            <p className="mt-2 text-4xl font-bold text-primary">
              {performance.mobileScore}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-background p-6">
            <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Desktop Score
            </p>
            <p className="mt-2 text-4xl font-bold text-primary">
              {performance.desktopScore}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-background p-6 md:col-span-2">
            <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Core Web Vitals
            </p>
            <dl className="mt-4 grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
              <div>
                <dt className="text-muted-foreground">Largest Contentful Paint</dt>
                <dd className="mt-1 text-lg font-semibold text-primary">
                  {performance.coreVitals.lcp}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">First Input Delay</dt>
                <dd className="mt-1 text-lg font-semibold text-primary">
                  {performance.coreVitals.fid}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Cumulative Layout Shift</dt>
                <dd className="mt-1 text-lg font-semibold text-primary">
                  {performance.coreVitals.cls}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}

function ContentSection({ report }: { report: AnalysisReport }) {
  const { content, keyThemes, readabilityLevel } = report;
  return (
    <section className="rounded-2xl border border-border bg-card p-8 shadow-sm">
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <h3 className="text-xl font-semibold">Content Snapshot</h3>
          <dl className="mt-6 space-y-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Page Title</dt>
              <dd className="mt-1 text-base font-medium text-foreground">
                {content.title ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Meta Description</dt>
              <dd className="mt-1 text-base text-muted-foreground">
                {content.metaDescription ?? "No meta description detected."}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Primary H1</dt>
              <dd className="mt-1 text-base text-foreground">
                {content.h1.join(" · ") || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Supporting H2s</dt>
              <dd className="mt-1 text-sm text-muted-foreground space-y-1">
                {content.h2.length > 0 ? (
                  content.h2.map((item) => <p key={item}>• {item}</p>)
                ) : (
                  <p>None detected</p>
                )}
              </dd>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <MetricPill label="Word Count" value={content.wordCount.toLocaleString()} />
              <MetricPill label="Readability" value={readabilityLevel} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <MetricPill label="robots.txt" value={content.robotsTxtFound ? "Present" : "Missing"} />
              <MetricPill label="sitemap.xml" value={content.sitemapXmlFound ? "Present" : "Missing"} />
            </div>
          </dl>
        </div>
        <div>
          <h3 className="text-xl font-semibold">Themes AI Associates with You</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            These represent the top topics GPT-4o identified across the scraped body
            content. Strengthen alignment between these themes and your commercial
            intent.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {keyThemes.map((theme) => (
              <span
                key={theme}
                className="rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary"
              >
                {theme}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background p-3 text-center">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold text-primary">{value}</p>
    </div>
  );
}

function InsightsSection({ report }: { report: AnalysisReport }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-8 shadow-sm">
      <div className="grid gap-6 lg:grid-cols-2">
        {report.narrative.map((insight) => (
          <div key={insight.headline} className="rounded-xl border border-border bg-background p-6">
            <h4 className="text-lg font-semibold">{insight.headline}</h4>
            <p className="mt-3 text-sm text-muted-foreground">{insight.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ActionPlanSection({ report }: { report: AnalysisReport }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-8 shadow-sm">
      <h3 className="text-xl font-semibold">Top Priorities for the Next 90 Days</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        GPT-4o consolidates every signal into a focused action plan, scored by impact
        and effort so your team knows where to move first.
      </p>
      <div className="mt-6 space-y-4">
        {report.actionPlan.map((task) => (
          <div
            key={task.title}
            className="rounded-xl border border-border bg-background p-5"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-base font-semibold text-foreground">
                  {task.title}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{task.summary}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <span className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                  {task.category}
                </span>
                <span className="rounded-full border border-muted/40 bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Impact: {task.impact}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SecuritySection({ report }: { report: AnalysisReport }) {
  const { ssl, security } = report;

  return (
    <section className="rounded-2xl border border-border bg-card p-8 shadow-sm">
      <h3 className="text-xl font-semibold">Security & Trust Signals</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        SSL certificates and security headers help build user trust and improve search rankings.
      </p>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {ssl && (
          <div className="rounded-xl border border-border bg-background p-6">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                SSL/TLS Certificate
              </h4>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                ssl.grade === 'A' || ssl.grade === 'A+' || ssl.grade === 'B'
                  ? 'bg-green-100 text-green-800'
                  : ssl.grade === 'F'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                Grade: {ssl.grade}
              </span>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">Status: </span>
                <span className="font-medium">
                  {ssl.hasSSL ? '✓ Secured with HTTPS' : '✗ No SSL detected'}
                </span>
              </p>
              {ssl.validUntil && (
                <p>
                  <span className="text-muted-foreground">Valid Until: </span>
                  <span className="font-medium">{ssl.validUntil}</span>
                </p>
              )}
              {ssl.message && (
                <p className="text-muted-foreground">{ssl.message}</p>
              )}
            </div>
          </div>
        )}
        {security && (
          <div className="rounded-xl border border-border bg-background p-6">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Security Headers
              </h4>
              {security.checked && (
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
                  Grade: {security.grade}
                </span>
              )}
            </div>
            <div className="mt-4 text-sm">
              <p className="text-muted-foreground">
                {security.checked
                  ? 'Security headers help protect against common web vulnerabilities.'
                  : 'Unable to check security headers at this time.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function SocialTagsSection({ report }: { report: AnalysisReport }) {
  const { socialTags } = report;
  if (!socialTags) return null;

  return (
    <section className="rounded-2xl border border-border bg-card p-8 shadow-sm">
      <h3 className="text-xl font-semibold">Social Media Optimization</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Open Graph and Twitter Card tags control how your content appears when shared on social platforms.
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-background p-6">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Open Graph (Facebook)
            </h4>
            <span className="text-2xl font-bold text-primary">
              {socialTags.openGraph.score}/100
            </span>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <p>
              {socialTags.openGraph.hasOGTitle ? '✓' : '✗'}
              <span className="ml-2">og:title</span>
            </p>
            <p>
              {socialTags.openGraph.hasOGDescription ? '✓' : '✗'}
              <span className="ml-2">og:description</span>
            </p>
            <p>
              {socialTags.openGraph.hasOGImage ? '✓' : '✗'}
              <span className="ml-2">og:image</span>
            </p>
            <p>
              {socialTags.openGraph.hasOGUrl ? '✓' : '✗'}
              <span className="ml-2">og:url</span>
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-background p-6">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Twitter Cards
            </h4>
            <span className="text-2xl font-bold text-primary">
              {socialTags.twitterCard.score}/100
            </span>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <p>
              {socialTags.twitterCard.hasCard ? '✓' : '✗'}
              <span className="ml-2">twitter:card</span>
            </p>
            <p>
              {socialTags.twitterCard.hasTitle ? '✓' : '✗'}
              <span className="ml-2">twitter:title</span>
            </p>
            <p>
              {socialTags.twitterCard.hasDescription ? '✓' : '✗'}
              <span className="ml-2">twitter:description</span>
            </p>
            <p>
              {socialTags.twitterCard.hasImage ? '✓' : '✗'}
              <span className="ml-2">twitter:image</span>
            </p>
          </div>
        </div>
      </div>

      {socialTags.recommendations.length > 0 && (
        <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <h4 className="text-sm font-semibold text-primary">Recommendations</h4>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {socialTags.recommendations.map((rec, idx) => (
              <li key={idx}>• {rec}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function SchemaSection({ report }: { report: AnalysisReport }) {
  const { schema } = report;
  if (!schema) return null;

  return (
    <section className="rounded-2xl border border-border bg-card p-8 shadow-sm">
      <h3 className="text-xl font-semibold">Structured Data (Schema.org)</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Schema markup helps search engines and AI systems understand your content for rich results and better visibility.
      </p>

      <div className="mt-6 rounded-xl border border-border bg-background p-6">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Schema Types Found
          </h4>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${
            schema.hasSchema ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {schema.count} {schema.count === 1 ? 'Schema' : 'Schemas'}
          </span>
        </div>

        {schema.schemaTypes.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {schema.schemaTypes.map((type) => (
              <span
                key={type}
                className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary"
              >
                {type}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            No structured data detected on this page.
          </p>
        )}
      </div>

      {schema.recommendations.length > 0 && (
        <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <h4 className="text-sm font-semibold text-primary">Recommendations</h4>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {schema.recommendations.map((rec, idx) => (
              <li key={idx}>• {rec}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
