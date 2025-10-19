"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface DiagnosticStep {
  step: string;
  status: 'started' | 'success' | 'error' | 'skipped';
  timestamp: number;
  duration?: number;
  error?: string;
  data?: unknown;
}

interface DiagnosticsData {
  totalDuration: number;
  steps: DiagnosticStep[];
  summary: {
    totalSteps: number;
    successful: number;
    failed: number;
    skipped: number;
  };
}

interface AnalysisResult {
  success: boolean;
  url: string;
  analyzedAt: string;
  diagnostics?: DiagnosticsData;
  [key: string]: unknown;
}

export default function AdminDashboard() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runDiagnosticTest = async () => {
    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: url.trim(),
          debug: true,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.message || "Analysis failed");
        setResult(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: DiagnosticStep['status']) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'skipped':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getStatusIcon = (status: DiagnosticStep['status']) => {
    switch (status) {
      case 'success':
        return '✓';
      case 'error':
        return '✗';
      case 'skipped':
        return '⊘';
      default:
        return '○';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-primary/5 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground">
            Admin Diagnostics Dashboard
          </h1>
          <p className="mt-2 text-muted-foreground">
            Monitor API integrations, processing times, and debug analysis workflows
          </p>
        </div>

        {/* Test Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-card p-6 shadow-lg"
        >
          <h2 className="mb-4 text-2xl font-semibold">Run Diagnostic Test</h2>
          <div className="flex gap-4">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter website URL (e.g., https://example.com)"
              className="flex-1 rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={loading}
            />
            <button
              onClick={runDiagnosticTest}
              disabled={loading}
              className="rounded-lg bg-primary px-8 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Analyzing..." : "Analyze"}
            </button>
          </div>
          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
              <strong>Error:</strong> {error}
            </div>
          )}
        </motion.div>

        {/* Results */}
        {result && result.diagnostics && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 space-y-6"
          >
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-xl border border-border bg-card p-6 shadow">
                <div className="text-3xl font-bold text-primary">
                  {result.diagnostics.summary.totalSteps}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">Total Steps</div>
              </div>
              <div className="rounded-xl border border-green-200 bg-green-50 p-6 shadow">
                <div className="text-3xl font-bold text-green-600">
                  {result.diagnostics.summary.successful}
                </div>
                <div className="mt-1 text-sm text-green-600">Successful</div>
              </div>
              <div className="rounded-xl border border-red-200 bg-red-50 p-6 shadow">
                <div className="text-3xl font-bold text-red-600">
                  {result.diagnostics.summary.failed}
                </div>
                <div className="mt-1 text-sm text-red-600">Failed</div>
              </div>
              <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-6 shadow">
                <div className="text-3xl font-bold text-yellow-600">
                  {result.diagnostics.summary.skipped}
                </div>
                <div className="mt-1 text-sm text-yellow-600">Skipped</div>
              </div>
            </div>

            {/* Total Duration */}
            <div className="rounded-xl border border-border bg-card p-6 shadow">
              <h3 className="text-xl font-semibold">Performance</h3>
              <div className="mt-4 text-3xl font-bold text-primary">
                {(result.diagnostics.totalDuration / 1000).toFixed(2)}s
              </div>
              <div className="text-sm text-muted-foreground">Total Processing Time</div>
            </div>

            {/* Detailed Steps */}
            <div className="rounded-xl border border-border bg-card p-6 shadow">
              <h3 className="mb-6 text-xl font-semibold">Processing Steps</h3>
              <div className="space-y-4">
                {result.diagnostics.steps.map((step, index) => {
                  const hasData = step.data !== undefined;
                  return (
                    <div
                      key={index}
                      className={`rounded-lg border p-4 ${getStatusColor(step.status)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{getStatusIcon(step.status)}</span>
                          <div>
                            <h4 className="font-semibold">{step.step}</h4>
                            <div className="mt-1 text-sm opacity-75">
                              Status: <span className="font-medium">{step.status}</span>
                            </div>
                            {step.duration !== undefined && (
                              <div className="mt-1 text-sm opacity-75">
                                Duration: <span className="font-medium">{step.duration}ms</span>
                              </div>
                            )}
                            {step.error && (
                              <div className="mt-2 rounded bg-white/50 p-2 text-sm font-mono">
                                Error: {step.error}
                              </div>
                            )}
                            {hasData && (
                              <details className="mt-2">
                                <summary className="cursor-pointer text-sm font-medium">
                                  View Data
                                </summary>
                                <pre className="mt-2 overflow-auto rounded bg-white/50 p-2 text-xs">
                                  {JSON.stringify(step.data, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* API Contribution Analysis */}
            <div className="rounded-xl border border-border bg-card p-6 shadow">
              <h3 className="mb-6 text-xl font-semibold">API Contribution Analysis</h3>
              <div className="space-y-4">
                <div className="rounded-lg border border-border bg-background p-4">
                  <h4 className="font-semibold text-primary">PageSpeed Insights API</h4>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Provides: Performance scores, Core Web Vitals, Lighthouse metrics
                  </p>
                  <div className="mt-2 text-sm">
                    Status:{" "}
                    <span className="font-medium">
                      {result.diagnostics.steps.find(s => s.step === 'Fetch PageSpeed data')?.status || 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-background p-4">
                  <h4 className="font-semibold text-primary">Web Scraper</h4>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Provides: Schema.org markup, Open Graph tags, Twitter Cards
                  </p>
                  <div className="mt-2 text-sm">
                    Status:{" "}
                    <span className="font-medium">
                      {result.diagnostics.steps.find(s => s.step === 'Scrape website')?.status || 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-background p-4">
                  <h4 className="font-semibold text-primary">SSL Labs API</h4>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Provides: SSL certificate grade, security analysis, expiration dates
                  </p>
                  <div className="mt-2 text-sm">
                    Status:{" "}
                    <span className="font-medium">
                      {result.diagnostics.steps.find(s => s.step === 'Check SSL')?.status || 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-background p-4">
                  <h4 className="font-semibold text-primary">OpenAI GPT-4o</h4>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Provides: Marketing analysis, UX recommendations, brand voice assessment
                  </p>
                  <div className="mt-2 text-sm">
                    Status:{" "}
                    <span className="font-medium">
                      {result.diagnostics.steps.find(s => s.step === 'Analyze with OpenAI')?.status || 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-background p-4">
                  <h4 className="font-semibold text-primary">Anthropic Claude 3.5 Sonnet</h4>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Provides: GEO analysis, AI readiness assessment, structured data insights
                  </p>
                  <div className="mt-2 text-sm">
                    Status:{" "}
                    <span className="font-medium">
                      {result.diagnostics.steps.find(s => s.step === 'Analyze with Claude')?.status || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Workflow Diagram */}
            <div className="rounded-xl border border-border bg-card p-6 shadow">
              <h3 className="mb-6 text-xl font-semibold">Analysis Workflow</h3>
              <div className="flex flex-col gap-2 font-mono text-sm">
                <div>1. Parse Request & Validate URL</div>
                <div className="ml-4">↓</div>
                <div>2. Check API Keys Configuration</div>
                <div className="ml-4">↓</div>
                <div>3. Parallel Data Fetching:</div>
                <div className="ml-8">• PageSpeed Insights API</div>
                <div className="ml-8">• Web Scraping (Schema.org + Social Tags)</div>
                <div className="ml-8">• SSL Labs API</div>
                <div className="ml-4">↓</div>
                <div>4. Parallel AI Analysis:</div>
                <div className="ml-8">• OpenAI GPT-4o → Marketing & UX insights</div>
                <div className="ml-8">• Anthropic Claude → GEO & AI readiness</div>
                <div className="ml-4">↓</div>
                <div>5. Create Consensus Analysis</div>
                <div className="ml-8">• Find agreed insights</div>
                <div className="ml-8">• Combine recommendations</div>
                <div className="ml-8">• Calculate confidence level</div>
                <div className="ml-4">↓</div>
                <div>6. Generate Final Report</div>
              </div>
            </div>

            {/* Raw Response */}
            <div className="rounded-xl border border-border bg-card p-6 shadow">
              <h3 className="mb-4 text-xl font-semibold">Raw API Response</h3>
              <details>
                <summary className="cursor-pointer font-medium text-primary">
                  View Full Response Data
                </summary>
                <pre className="mt-4 overflow-auto rounded bg-muted p-4 text-xs">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </div>
          </motion.div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Admin Dashboard v1.2.0 • Diagnostics Mode Enabled</p>
        </div>
      </div>
    </div>
  );
}
