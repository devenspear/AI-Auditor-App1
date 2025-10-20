"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { SubmissionData, AnalysisReport } from "@/lib/report-types";
import { ProgressBar } from "@/components/ProgressBar";
import { VersionFooter } from "@/components/VersionFooter";
import "./print.css";

interface StoredSubmission {
  submissionData: SubmissionData;
  analysisReport: AnalysisReport;
  createdAt: string;
}

function ReportContent() {
  const searchParams = useSearchParams();
  const submissionId = searchParams.get('id');
  const [submission, setSubmission] = useState<StoredSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!submissionId) {
      setError('no-id');
      setLoading(false);
      return;
    }

    // Try to load from sessionStorage first (for production/Vercel)
    const sessionData = sessionStorage.getItem(`report_${submissionId}`);
    if (sessionData) {
      try {
        const data = JSON.parse(sessionData);
        setSubmission(data);
        setLoading(false);
        return;
      } catch (err) {
        console.error('Failed to parse session data:', err);
      }
    }

    // Fall back to API call for server-side data (for local development with file storage)
    fetch(`/api/submission?id=${submissionId}`)
      .then(res => {
        if (!res.ok) throw new Error('Submission not found');
        return res.json();
      })
      .then(data => {
        setSubmission(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load submission:', err);
        setError('not-found');
        setLoading(false);
      });
  }, [submissionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading report...</p>
        </div>
      </div>
    );
  }

  if (error === 'no-id') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">No Report ID</h1>
          <p className="text-muted-foreground mb-8">
            Please provide a report ID in the URL.
          </p>
          <Link
            href="/"
            className="inline-block rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90 transition"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (error === 'not-found' || !submission) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <div className="text-6xl font-bold text-primary mb-4">404</div>
          <h1 className="text-3xl font-bold text-foreground mb-4">Report Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The report you&apos;re looking for doesn&apos;t exist or may have been deleted.
          </p>
          <Link
            href="/"
            className="inline-block rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90 transition"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const { submissionData, analysisReport } = submission;
  const { score, brandAnalysis, dualAI, performance, ssl, schema, socialTags } = analysisReport;

  // Helper to get grade color
  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-green-600';
    if (grade.startsWith('B')) return 'text-blue-600';
    if (grade.startsWith('C')) return 'text-yellow-600';
    if (grade.startsWith('D')) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header - Sticky Navigation */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded"></div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">AI Readiness Assessment</h1>
              <p className="text-xs text-slate-500">
                {new Date(analysisReport.analyzedAt).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric'
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition no-print"
              title="Print or save as PDF"
            >
              🖨️ Print Report
            </button>
            <Link
              href="/"
              className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 transition no-print"
            >
              ← New Analysis
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-5xl">
        {/* Cover Page */}
        <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 rounded-xl p-12 mb-8 text-white shadow-2xl">
          <div className="border-l-4 border-blue-400 pl-6">
            <p className="text-blue-300 text-sm font-semibold uppercase tracking-wider mb-2">Confidential Report</p>
            <h1 className="text-4xl font-bold mb-4">AI & GEO Readiness Assessment</h1>
            <p className="text-xl text-slate-300 mb-8">Comprehensive Analysis for {submissionData.companyName}</p>
            <div className="grid grid-cols-2 gap-6 text-sm">
              <div>
                <p className="text-slate-400 mb-1">Prepared For</p>
                <p className="font-semibold">{submissionData.firstName} {submissionData.lastName}</p>
                <p className="text-slate-300">{submissionData.jobTitle || 'Decision Maker'}</p>
              </div>
              <div>
                <p className="text-slate-400 mb-1">Report Date</p>
                <p className="font-semibold">
                  {new Date(analysisReport.analyzedAt).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <section className="bg-white rounded-xl border border-slate-200 p-8 mb-8 shadow-sm">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 font-bold text-lg">📊</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Executive Summary</h2>
              <p className="text-slate-600">Overall assessment and key findings</p>
            </div>
          </div>

          {/* Overall Score - Prominent */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 mb-6 border border-blue-100">
            <div className="text-center">
              <p className="text-slate-600 text-sm font-medium uppercase tracking-wide mb-2">Overall Score</p>
              <div className={`text-6xl font-black mb-2 ${getGradeColor(score.grade)}`}>
                {score.grade}
              </div>
              <p className="text-2xl font-bold text-slate-700 mb-4">{score.overall}/100</p>
              <ProgressBar value={score.overall} color={score.overall >= 70 ? 'green' : score.overall >= 50 ? 'yellow' : 'red'} size="lg" showPercentage={false} />
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="border border-slate-200 rounded-lg p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Brand Voice Clarity</p>
              <p className="text-3xl font-bold text-slate-900 mb-2">{score.brandVoice}</p>
              <ProgressBar value={score.brandVoice} color={score.brandVoice >= 70 ? 'green' : 'yellow'} showPercentage={false} />
            </div>
            <div className="border border-slate-200 rounded-lg p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">GEO Readiness</p>
              <p className="text-3xl font-bold text-slate-900 mb-2">{score.geoReadiness}</p>
              <ProgressBar value={score.geoReadiness} color={score.geoReadiness >= 70 ? 'green' : 'yellow'} showPercentage={false} />
            </div>
            <div className="border border-slate-200 rounded-lg p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Technical Health</p>
              <p className="text-3xl font-bold text-slate-900 mb-2">{score.technicalHealth}</p>
              <ProgressBar value={score.technicalHealth} color={score.technicalHealth >= 70 ? 'green' : 'yellow'} showPercentage={false} />
            </div>
          </div>
        </section>

        {/* Client Information Card */}
        <section className="bg-white rounded-xl border border-slate-200 p-8 mb-8 shadow-sm">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-slate-600 font-bold text-lg">🏢</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Client Information</h2>
              <p className="text-slate-600">Company and contact details</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Company Details</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-muted-foreground">Company Name</label>
                  <p className="font-medium text-foreground">{submissionData.companyName}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Website</label>
                  <p className="font-medium text-foreground">
                    <a href={submissionData.companyUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {submissionData.companyUrl}
                    </a>
                  </p>
                </div>
                {submissionData.industry && (
                  <div>
                    <label className="text-sm text-muted-foreground">Industry</label>
                    <p className="font-medium text-foreground">{submissionData.industry}</p>
                  </div>
                )}
                {submissionData.companySize && (
                  <div>
                    <label className="text-sm text-muted-foreground">Company Size</label>
                    <p className="font-medium text-foreground">{submissionData.companySize}</p>
                  </div>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Contact Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-muted-foreground">Contact Person</label>
                  <p className="font-medium text-foreground">
                    {submissionData.firstName} {submissionData.lastName}
                  </p>
                </div>
                {submissionData.jobTitle && (
                  <div>
                    <label className="text-sm text-muted-foreground">Job Title</label>
                    <p className="font-medium text-foreground">{submissionData.jobTitle}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm text-muted-foreground">Email</label>
                  <p className="font-medium text-foreground">{submissionData.email}</p>
                </div>
                {submissionData.phone && (
                  <div>
                    <label className="text-sm text-muted-foreground">Phone</label>
                    <p className="font-medium text-foreground">{submissionData.phone}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Business Context (if provided) */}
        {(submissionData.productDescription || submissionData.challenges || submissionData.marketingGoals) && (
          <section className="bg-white rounded-xl border border-slate-200 p-8 mb-8 shadow-sm">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-indigo-600 font-bold text-lg">💼</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Business Context</h2>
                <p className="text-slate-600">Your company&apos;s unique situation and goals</p>
              </div>
            </div>
            <div className="space-y-6">
              {submissionData.productDescription && (
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Product/Service Description</h3>
                  <p className="text-muted-foreground">{submissionData.productDescription}</p>
                </div>
              )}
              {submissionData.challenges && (
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Current Challenges</h3>
                  <p className="text-muted-foreground">{submissionData.challenges}</p>
                </div>
              )}
              {submissionData.competitors && (
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Key Competitors</h3>
                  <p className="text-muted-foreground">{submissionData.competitors}</p>
                </div>
              )}
              {submissionData.marketingGoals && (
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Marketing Goals</h3>
                  <p className="text-muted-foreground">{submissionData.marketingGoals}</p>
                </div>
              )}
              {submissionData.timeline && (
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Timeline</h3>
                  <p className="text-muted-foreground">{submissionData.timeline}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Dual AI Analysis */}
        {dualAI && (
          <section className="bg-white rounded-xl border border-slate-200 p-8 mb-8 shadow-sm">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-purple-600 font-bold text-lg">🤖</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Dual AI Analysis</h2>
                <p className="text-slate-600">Consensus insights from OpenAI and Claude</p>
              </div>
            </div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2">
              <span className="text-sm font-medium text-primary">
                Confidence Level: {dualAI.confidence.toUpperCase()}
              </span>
            </div>

            {/* Consensus Insights */}
            {dualAI.consensus.agreedInsights.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 text-foreground">Consensus Insights</h3>
                <ul className="space-y-3">
                  {dualAI.consensus.agreedInsights.map((insight, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="text-green-600 mt-1">✓</span>
                      <span className="text-muted-foreground">{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommended Actions */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4 text-foreground">Recommended Actions</h3>
              <div className="space-y-3">
                {dualAI.consensus.recommendedActions.slice(0, 6).map((action, idx) => (
                  <div key={idx} className="rounded-lg border border-border bg-background p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                        {idx + 1}
                      </div>
                      <p className="text-muted-foreground">{action}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Individual AI Perspectives */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="rounded-lg border border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 p-6">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-4">OpenAI Analysis</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">{dualAI.openai.summary}</p>
                  </div>
                  {dualAI.openai.keyInsights.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">Key Insights:</h4>
                      <ul className="space-y-1">
                        {dualAI.openai.keyInsights.slice(0, 3).map((insight, idx) => (
                          <li key={idx} className="text-sm text-blue-700 dark:text-blue-300">• {insight}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-purple-200 bg-purple-50/50 dark:bg-purple-950/20 p-6">
                <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-4">Claude Analysis</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-purple-700 dark:text-purple-300 mb-2">{dualAI.claude.summary}</p>
                  </div>
                  {dualAI.claude.keyInsights.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-2">Key Insights:</h4>
                      <ul className="space-y-1">
                        {dualAI.claude.keyInsights.slice(0, 3).map((insight, idx) => (
                          <li key={idx} className="text-sm text-purple-700 dark:text-purple-300">• {insight}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Brand Analysis */}
        {brandAnalysis && (
          <section className="bg-white rounded-xl border border-slate-200 p-8 mb-8 shadow-sm">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-pink-600 font-bold text-lg">🎨</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Brand Perception Analysis</h2>
                <p className="text-slate-600">How AI agents perceive and understand your brand</p>
              </div>
            </div>

            {/* Overall Brand Clarity Score */}
            <div className="mb-8 text-center rounded-lg bg-gradient-to-br from-pink-50 to-purple-50 p-6 border border-pink-100">
              <p className="text-slate-600 text-sm font-medium uppercase tracking-wide mb-2">Overall Brand Clarity Score</p>
              <div className="text-5xl font-bold text-pink-600 mb-4">
                {brandAnalysis.overallBrandClarityScore}
              </div>
              <ProgressBar value={brandAnalysis.overallBrandClarityScore} color={brandAnalysis.overallBrandClarityScore >= 70 ? 'green' : 'yellow'} size="lg" showPercentage={false} />
            </div>

            {/* Consensus Brand Attributes */}
            {brandAnalysis.consensusBrandAttributes.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 text-foreground">Detected Brand Attributes</h3>
                <div className="flex flex-wrap gap-2">
                  {brandAnalysis.consensusBrandAttributes.map((attr, idx) => (
                    <span key={idx} className="rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                      {attr}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Strengths and Weaknesses */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="rounded-lg border border-green-200 bg-green-50/50 dark:bg-green-950/20 p-6">
                <h3 className="font-semibold text-green-900 dark:text-green-100 mb-4">Strengths</h3>
                <ul className="space-y-2">
                  {brandAnalysis.brandStrengths.map((strength, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-green-700 dark:text-green-300">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-lg border border-orange-200 bg-orange-50/50 dark:bg-orange-950/20 p-6">
                <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-4">Areas for Improvement</h3>
                <ul className="space-y-2">
                  {brandAnalysis.brandWeaknesses.map((weakness, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-orange-700 dark:text-orange-300">
                      <span className="text-orange-600 mt-0.5">!</span>
                      <span>{weakness}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Competitive Positioning */}
            <div className="mb-8 rounded-lg bg-background p-6 border border-border">
              <h3 className="font-semibold text-foreground mb-2">Competitive Positioning</h3>
              <p className="text-muted-foreground">{brandAnalysis.competitivePositioning}</p>
            </div>

            {/* AI Agent Optimizations */}
            {brandAnalysis.aiAgentOptimizations && brandAnalysis.aiAgentOptimizations.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4 text-foreground">AI Agent Optimization Recommendations</h3>
                <div className="space-y-4">
                  {brandAnalysis.aiAgentOptimizations.map((opt, idx) => (
                    <div key={idx} className="rounded-lg border border-border bg-background p-6">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-semibold text-foreground">{opt.agent}</h4>
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                          opt.priority === 'High' ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200' :
                          opt.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200' :
                          'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200'
                        }`}>
                          {opt.priority} Priority
                        </span>
                      </div>
                      <p className="text-muted-foreground mb-3">{opt.recommendation}</p>
                      <div className="text-sm space-y-2">
                        <div>
                          <span className="font-medium text-foreground">Rationale:</span>
                          <span className="text-muted-foreground ml-2">{opt.rationale}</span>
                        </div>
                        <div>
                          <span className="font-medium text-foreground">Implementation:</span>
                          <span className="text-muted-foreground ml-2">{opt.implementation}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Performance Metrics */}
        <section className="bg-white rounded-xl border border-slate-200 p-8 mb-8 shadow-sm">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-yellow-600 font-bold text-lg">⚡</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Performance Metrics</h2>
              <p className="text-slate-600">PageSpeed scores and Core Web Vitals</p>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-6">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Mobile Score</p>
              <div className="text-3xl font-bold text-slate-900 mb-3">{performance.mobileScore}</div>
              <ProgressBar value={performance.mobileScore} color={performance.mobileScore >= 90 ? 'green' : performance.mobileScore >= 50 ? 'yellow' : 'red'} showPercentage={false} />
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-6">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Desktop Score</p>
              <div className="text-3xl font-bold text-slate-900 mb-3">{performance.desktopScore}</div>
              <ProgressBar value={performance.desktopScore} color={performance.desktopScore >= 90 ? 'green' : performance.desktopScore >= 50 ? 'yellow' : 'red'} showPercentage={false} />
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-6">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Overall Performance</p>
              <div className="text-3xl font-bold text-slate-900 mb-3">{performance.overallScore}</div>
              <ProgressBar value={performance.overallScore} color={performance.overallScore >= 90 ? 'green' : performance.overallScore >= 50 ? 'yellow' : 'red'} showPercentage={false} />
            </div>
          </div>
        </section>

        {/* SSL Security */}
        {ssl && (
          <section className="bg-white rounded-xl border border-slate-200 p-8 mb-8 shadow-sm">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-green-600 font-bold text-lg">🔒</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">SSL Security</h2>
                <p className="text-slate-600">Certificate grade and encryption status</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className={`text-4xl font-bold ${ssl.grade === 'A+' || ssl.grade === 'A' ? 'text-green-600' : 'text-yellow-600'}`}>
                {ssl.grade}
              </div>
              <div>
                <p className="font-medium text-foreground">SSL Certificate Grade</p>
                <p className="text-sm text-muted-foreground">
                  {ssl.hasSSL ? 'SSL certificate is active' : 'No SSL certificate detected'}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Schema.org Structured Data */}
        {schema && (
          <section className="bg-white rounded-xl border border-slate-200 p-8 mb-8 shadow-sm">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-orange-600 font-bold text-lg">📋</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Structured Data</h2>
                <p className="text-slate-600">Schema.org markup for AI discoverability</p>
              </div>
            </div>
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className={`text-3xl font-bold ${schema.hasSchema ? 'text-green-600' : 'text-yellow-600'}`}>
                  {schema.count}
                </div>
                <div>
                  <p className="font-medium text-foreground">Schema.org Objects Found</p>
                  <p className="text-sm text-muted-foreground">
                    {schema.hasSchema ? 'Structured data detected' : 'No structured data found'}
                  </p>
                </div>
              </div>
              {schema.schemaTypes.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {schema.schemaTypes.map((type, idx) => (
                    <span key={idx} className="rounded-md bg-primary/10 px-3 py-1 text-sm text-primary font-mono">
                      {type}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {schema.recommendations.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold text-foreground mb-3">Recommendations</h3>
                <ul className="space-y-2">
                  {schema.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-primary mt-0.5">→</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {/* Social Media Tags */}
        {socialTags && (
          <section className="bg-white rounded-xl border border-slate-200 p-8 mb-8 shadow-sm">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-cyan-600 font-bold text-lg">📱</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Social Media Optimization</h2>
                <p className="text-slate-600">Open Graph and Twitter Card implementation</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Open Graph</h3>
                <div className="mb-4">
                  <div className="text-2xl font-bold text-slate-900 mb-2">{socialTags.openGraph.score}/100</div>
                  <ProgressBar value={socialTags.openGraph.score} color={socialTags.openGraph.score >= 80 ? 'green' : 'yellow'} size="sm" showPercentage={false} />
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Title:</span>
                    <span className={socialTags.openGraph.hasOGTitle ? 'text-green-600' : 'text-red-600'}>
                      {socialTags.openGraph.hasOGTitle ? '✓' : '✗'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Description:</span>
                    <span className={socialTags.openGraph.hasOGDescription ? 'text-green-600' : 'text-red-600'}>
                      {socialTags.openGraph.hasOGDescription ? '✓' : '✗'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Image:</span>
                    <span className={socialTags.openGraph.hasOGImage ? 'text-green-600' : 'text-red-600'}>
                      {socialTags.openGraph.hasOGImage ? '✓' : '✗'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Twitter Card</h3>
                <div className="mb-4">
                  <div className="text-2xl font-bold text-slate-900 mb-2">{socialTags.twitterCard.score}/100</div>
                  <ProgressBar value={socialTags.twitterCard.score} color={socialTags.twitterCard.score >= 80 ? 'green' : 'yellow'} size="sm" showPercentage={false} />
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Card Type:</span>
                    <span className={socialTags.twitterCard.hasCard ? 'text-green-600' : 'text-red-600'}>
                      {socialTags.twitterCard.hasCard ? '✓' : '✗'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Title:</span>
                    <span className={socialTags.twitterCard.hasTitle ? 'text-green-600' : 'text-red-600'}>
                      {socialTags.twitterCard.hasTitle ? '✓' : '✗'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Image:</span>
                    <span className={socialTags.twitterCard.hasImage ? 'text-green-600' : 'text-red-600'}>
                      {socialTags.twitterCard.hasImage ? '✓' : '✗'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {socialTags.recommendations.length > 0 && (
              <div>
                <h3 className="font-semibold text-foreground mb-3">Recommendations</h3>
                <ul className="space-y-2">
                  {socialTags.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-primary mt-0.5">→</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {/* Raw Data Viewer */}
        <section className="bg-white rounded-xl border border-slate-200 p-8 mb-8 shadow-sm no-print">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-slate-600 font-bold text-lg">💾</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Raw Data</h2>
              <p className="text-slate-600">View complete submission and analysis data</p>
            </div>
          </div>

          <details className="group">
            <summary className="cursor-pointer list-none">
              <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 transition">
                <span className="font-medium text-slate-900">Click to view JSON data</span>
                <svg
                  className="w-5 h-5 text-slate-500 transition-transform group-open:rotate-180"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </summary>

            <div className="mt-4 space-y-4">
              {/* Submission Data */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2">
                  Form Submission Data
                </h3>
                <pre className="bg-slate-900 text-green-400 rounded-lg p-4 overflow-auto text-xs font-mono max-h-96">
                  {JSON.stringify(submissionData, null, 2)}
                </pre>
              </div>

              {/* Analysis Report */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2">
                  Analysis Report Data
                </h3>
                <pre className="bg-slate-900 text-blue-400 rounded-lg p-4 overflow-auto text-xs font-mono max-h-96">
                  {JSON.stringify(analysisReport, null, 2)}
                </pre>
              </div>

              {/* Copy Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(submissionData, null, 2));
                    alert('Submission data copied to clipboard!');
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition"
                >
                  📋 Copy Submission Data
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(analysisReport, null, 2));
                    alert('Analysis report copied to clipboard!');
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                >
                  📋 Copy Analysis Data
                </button>
                <button
                  onClick={() => {
                    const fullData = { submissionData, analysisReport, createdAt: new Date().toISOString() };
                    navigator.clipboard.writeText(JSON.stringify(fullData, null, 2));
                    alert('Complete report data copied to clipboard!');
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition"
                >
                  📋 Copy Complete Data
                </button>
              </div>
            </div>
          </details>
        </section>

        {/* Footer CTA */}
        <section className="text-center rounded-2xl border border-border bg-gradient-to-r from-primary/10 to-primary/5 p-12 no-print">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to Optimize Your Website?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Let&apos;s discuss how to implement these recommendations and improve your AI discoverability.
          </p>
          <Link
            href="/"
            className="inline-block rounded-lg bg-primary px-8 py-4 font-semibold text-primary-foreground hover:bg-primary/90 transition shadow-lg"
          >
            Get Another Analysis
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/30 backdrop-blur-sm py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>AI Auditor • Powered by Dual-AI Analysis</p>
          <p className="mt-2">Report ID: {submissionId}</p>
        </div>
      </footer>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading report...</p>
        </div>
      </div>
    }>
      <ReportContent />
    </Suspense>
  );
}
