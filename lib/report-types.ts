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

export interface SecurityHeaders {
  checked: boolean;
  grade: string;
  url?: string;
  error?: string;
}

export interface SSLGrade {
  hasSSL: boolean;
  grade: string;
  issuer?: Record<string, string>;
  validUntil?: string;
  message?: string;
  error?: string;
}

export interface OpenGraphTags {
  hasOGTitle: boolean;
  hasOGDescription: boolean;
  hasOGImage: boolean;
  hasOGUrl: boolean;
  score: number;
  tags: Record<string, string | null>;
}

export interface TwitterCardTags {
  hasCard: boolean;
  hasTitle: boolean;
  hasDescription: boolean;
  hasImage: boolean;
  score: number;
  tags: Record<string, string | null>;
}

export interface SocialTags {
  openGraph: OpenGraphTags;
  twitterCard: TwitterCardTags;
  overallScore: number;
  recommendations: string[];
}

export interface SchemaMarkup {
  hasSchema: boolean;
  schemaTypes: string[];
  count: number;
  recommendations: string[];
  rawData?: Record<string, unknown>[];
}

export interface AhrefsMetrics {
  available: boolean;
  domainRating?: number;
  backlinks?: number;
  referringDomains?: number;
  organicTraffic?: number;
  organicKeywords?: number;
  error?: string;
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
  security?: SecurityHeaders;
  ssl?: SSLGrade;
  socialTags?: SocialTags;
  schema?: SchemaMarkup;
  ahrefs?: AhrefsMetrics;
}

export interface AnalysisRequestBody {
  url: string;
}

export interface ErrorResponse {
  message: string;
  status?: number;
  details?: string;
}
