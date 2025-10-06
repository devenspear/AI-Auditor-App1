export type TaskCategory = "Quick Win" | "Opportunity" | "Foundation";
export type TaskImpact = "High" | "Medium" | "Low";

export interface AnalysisTask {
  title: string;
  summary: string;
  category: TaskCategory;
  impact: TaskImpact;
}

export interface CoreWebVitals {
  lcp: string;
  fid: string;
  cls: string;
}

export interface PageSpeedSummary {
  mobileScore: number;
  desktopScore: number;
  overallScore: number;
  coreVitals: CoreWebVitals;
}

export interface ContentSnapshot {
  title: string | null;
  metaDescription: string | null;
  h1: string[];
  h2: string[];
  wordCount: number;
  robotsTxtFound: boolean;
  sitemapXmlFound: boolean;
}

export interface ScoreBreakdown {
  overall: number;
  grade: string;
  brandVoice: number;
  geoReadiness: number;
  technicalHealth: number;
  clarityNotes: string[];
}

export interface NarrativeInsight {
  headline: string;
  body: string;
}

export interface AnalysisReport {
  url: string;
  analyzedAt: string;
  summary: string;
  keyThemes: string[];
  readabilityLevel: string;
  score: ScoreBreakdown;
  performance: PageSpeedSummary;
  content: ContentSnapshot;
  narrative: NarrativeInsight[];
  actionPlan: AnalysisTask[];
}

export interface AnalysisRequestBody {
  url: string;
}

export interface ErrorResponse {
  message: string;
  status?: number;
  details?: string;
}
