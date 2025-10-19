"use client";

import { motion } from "framer-motion";
import { CircularProgress } from "@/components/ui/circular-progress";
import { useCountUp } from "@/hooks/use-count-up";
import type { AnalysisReport, AIAgentRecommendation } from "@/lib/report-types";

interface BrandAnalysisSectionProps {
  report: AnalysisReport;
}

export function BrandAnalysisSection({ report }: BrandAnalysisSectionProps) {
  const { brandAnalysis } = report;
  if (!brandAnalysis) return null;

  const { openaiPerception, claudePerception } = brandAnalysis;
  const avgPositioning = Math.round(
    (openaiPerception.positioningClarity + claudePerception.positioningClarity) / 2
  );
  const avgDifferentiation = Math.round(
    (openaiPerception.differentiationScore + claudePerception.differentiationScore) / 2
  );
  const avgTargetAudience = Math.round(
    (openaiPerception.targetAudienceClarity + claudePerception.targetAudienceClarity) / 2
  );

  const brandClarityScore = useCountUp(brandAnalysis.overallBrandClarityScore, 2000, 300);

  const getPriorityColor = (priority: AIAgentRecommendation["priority"]) => {
    switch (priority) {
      case "High":
        return "border-red-200 bg-red-50 text-red-800";
      case "Medium":
        return "border-yellow-200 bg-yellow-50 text-yellow-800";
      case "Low":
        return "border-blue-200 bg-blue-50 text-blue-800";
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="rounded-2xl border border-border bg-card p-8 shadow-lg"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-2xl font-semibold flex items-center gap-2">
            <svg className="size-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
            AI Brand Perception Analysis
          </h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-3xl">
            How ChatGPT, Claude, Gemini, and other AI agents perceive your brand when scanning your website.
            This analysis reveals brand strengths, weaknesses, and actionable optimizations for AI-native search.
          </p>
        </div>
        <CircularProgress value={brandAnalysis.overallBrandClarityScore} delay={300} size={120} strokeWidth={8} />
      </div>

      {/* Overall Brand Clarity Score */}
      <div className="mt-8 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 p-6">
        <h4 className="text-lg font-semibold text-primary">Brand Clarity for AI Agents</h4>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-6xl font-bold bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent">
            {brandClarityScore}
          </span>
          <span className="text-xl text-muted-foreground">/100</span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Average score across positioning, differentiation, and target audience clarity
        </p>
      </div>

      {/* Perception Scores Grid */}
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <ScoreCard
          title="Positioning Clarity"
          value={avgPositioning}
          description="How clearly AI agents understand who you serve and what makes you different"
        />
        <ScoreCard
          title="Differentiation"
          value={avgDifferentiation}
          description="How well AI can distinguish your brand from competitors"
        />
        <ScoreCard
          title="Target Audience"
          value={avgTargetAudience}
          description="Clarity of your intended customer base to AI systems"
        />
      </div>

      {/* Detected Brand Name */}
      {(openaiPerception.brandName || claudePerception.brandName) && (
        <div className="mt-6 rounded-xl border border-border bg-background p-6">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Detected Brand Name
          </h4>
          <div className="mt-3 flex flex-wrap gap-4">
            {openaiPerception.brandName && (
              <div className="flex items-center gap-2">
                <span className="text-blue-600">●</span>
                <span className="text-lg font-medium">{openaiPerception.brandName}</span>
                <span className="text-xs text-muted-foreground">(Primary Agent)</span>
              </div>
            )}
            {claudePerception.brandName && claudePerception.brandName !== openaiPerception.brandName && (
              <div className="flex items-center gap-2">
                <span className="text-purple-600">●</span>
                <span className="text-lg font-medium">{claudePerception.brandName}</span>
                <span className="text-xs text-muted-foreground">(Secondary Agent)</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Consensus Brand Attributes */}
      {brandAnalysis.consensusBrandAttributes.length > 0 && (
        <div className="mt-6 rounded-xl border border-border bg-gradient-to-br from-muted/50 to-muted/30 p-6">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-foreground flex items-center gap-2">
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Agreed Brand Attributes (Both AI Agents Detected)
          </h4>
          <div className="mt-4 flex flex-wrap gap-2">
            {brandAnalysis.consensusBrandAttributes.map((attr, idx) => (
              <span
                key={idx}
                className="rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary"
              >
                {attr}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Brand Voice & Emotional Tone */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-background p-6">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
            <span className="text-blue-600">●</span>
            Primary Agent Perception
          </h4>
          <div className="mt-4 space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Brand Voice</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {openaiPerception.brandVoiceCharacteristics.map((char, idx) => (
                  <span key={idx} className="text-sm text-foreground">{char}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Emotional Tone</p>
              <p className="mt-1 text-sm font-medium text-foreground">{openaiPerception.emotionalTone}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Detected Attributes</p>
              <div className="mt-2 space-y-1">
                {openaiPerception.detectedBrandAttributes.map((attr, idx) => (
                  <p key={idx} className="text-sm text-foreground/90">• {attr}</p>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-background p-6">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
            <span className="text-purple-600">●</span>
            Secondary Agent Perception
          </h4>
          <div className="mt-4 space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Brand Voice</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {claudePerception.brandVoiceCharacteristics.map((char, idx) => (
                  <span key={idx} className="text-sm text-foreground">{char}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Emotional Tone</p>
              <p className="mt-1 text-sm font-medium text-foreground">{claudePerception.emotionalTone}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Detected Attributes</p>
              <div className="mt-2 space-y-1">
                {claudePerception.detectedBrandAttributes.map((attr, idx) => (
                  <p key={idx} className="text-sm text-foreground/90">• {attr}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {brandAnalysis.brandStrengths.length > 0 && (
          <div className="rounded-xl border border-border bg-background p-6">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
              <svg className="size-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Brand Strengths
            </h4>
            <ul className="mt-4 space-y-2">
              {brandAnalysis.brandStrengths.map((strength, idx) => (
                <li key={idx} className="flex gap-3 text-sm text-foreground/90">
                  <span className="mt-0.5 flex-shrink-0 size-1.5 rounded-full bg-green-600" />
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {brandAnalysis.brandWeaknesses.length > 0 && (
          <div className="rounded-xl border border-border bg-background p-6">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
              <svg className="size-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Areas for Improvement
            </h4>
            <ul className="mt-4 space-y-2">
              {brandAnalysis.brandWeaknesses.map((weakness, idx) => (
                <li key={idx} className="flex gap-3 text-sm text-foreground/90">
                  <span className="mt-0.5 flex-shrink-0 size-1.5 rounded-full bg-orange-600" />
                  <span>{weakness}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Competitive Positioning */}
      <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-6">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-primary">
          Competitive Positioning
        </h4>
        <p className="mt-2 text-foreground">{brandAnalysis.competitivePositioning}</p>
      </div>

      {/* AI Agent Specific Optimizations */}
      {brandAnalysis.aiAgentOptimizations.length > 0 && (
        <div className="mt-6">
          <h4 className="text-lg font-semibold mb-4">AI Agent-Specific Optimizations</h4>
          <div className="grid gap-4 md:grid-cols-2">
            {brandAnalysis.aiAgentOptimizations.map((opt, idx) => (
              <div
                key={idx}
                className={`rounded-xl border p-5 ${getPriorityColor(opt.priority)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <AgentIcon agent={opt.agent} />
                    <span className="font-semibold">{opt.agent}</span>
                  </div>
                  <span className="rounded-full bg-white/50 px-2 py-1 text-xs font-bold">
                    {opt.priority}
                  </span>
                </div>
                <p className="mt-3 text-sm font-medium">{opt.recommendation}</p>
                <p className="mt-2 text-xs opacity-90">
                  <strong>Why:</strong> {opt.rationale}
                </p>
                <p className="mt-2 text-xs opacity-90">
                  <strong>How:</strong> {opt.implementation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actionable Recommendations */}
      <div className="mt-6 space-y-6">
        {brandAnalysis.metadataRecommendations.length > 0 && (
          <RecommendationCard
            title="Metadata Optimizations"
            icon="📝"
            recommendations={brandAnalysis.metadataRecommendations}
          />
        )}

        {brandAnalysis.contentRecommendations.length > 0 && (
          <RecommendationCard
            title="Content Improvements"
            icon="✏️"
            recommendations={brandAnalysis.contentRecommendations}
          />
        )}

        {brandAnalysis.designRecommendations.length > 0 && (
          <RecommendationCard
            title="Design & UX Changes"
            icon="🎨"
            recommendations={brandAnalysis.designRecommendations}
          />
        )}
      </div>
    </motion.section>
  );
}

function ScoreCard({ title, value, description }: { title: string; value: number; description: string }) {
  const animatedValue = useCountUp(value, 1500, 400);

  return (
    <div className="rounded-xl border border-border bg-background p-5">
      <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <div className="mt-2 flex items-baseline gap-2">
        <p className="text-4xl font-bold text-primary">{animatedValue}</p>
        <span className="text-sm text-muted-foreground">/100</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-primary/60"
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
        />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function RecommendationCard({ title, icon, recommendations }: {
  title: string;
  icon: string;
  recommendations: string[];
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-6">
      <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
        <span>{icon}</span>
        {title}
      </h4>
      <ul className="mt-4 space-y-2">
        {recommendations.map((rec, idx) => (
          <li key={idx} className="flex gap-3 text-sm text-foreground/90">
            <span className="mt-0.5 flex-shrink-0 size-1.5 rounded-full bg-primary" />
            <span>{rec}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AgentIcon({ agent }: { agent: string }) {
  const icons = {
    "ChatGPT": "🤖",
    "Claude": "🧠",
    "Gemini": "💎",
    "Perplexity": "🔍",
    "General": "⚡"
  };
  return <span className="text-lg">{icons[agent as keyof typeof icons] || "🤖"}</span>;
}
