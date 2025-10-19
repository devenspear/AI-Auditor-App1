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

export interface AIAnalysis {
  provider: "openai" | "anthropic";
  summary: string;
  scores?: {
    brandVoice?: number;
    geoReadiness?: number;
    technicalHealth?: number;
  };
  keyInsights: string[];
  recommendations: string[];
  processingTime: number;
}

export interface DualAIAnalysis {
  openai: AIAnalysis;
  claude: AIAnalysis;
  consensus: {
    agreedInsights: string[];
    uniqueToOpenAI: string[];
    uniqueToClaude: string[];
    recommendedActions: string[];
  };
  confidence: "high" | "medium" | "low";
}

export interface BrandPerception {
  brandName: string | null;
  detectedBrandAttributes: string[];
  brandVoiceCharacteristics: string[];
  positioningClarity: number; // 0-100
  differentiationScore: number; // 0-100
  emotionalTone: string;
  targetAudienceClarity: number; // 0-100
}

export interface AIAgentRecommendation {
  agent: "ChatGPT" | "Claude" | "Gemini" | "Perplexity" | "General";
  priority: "High" | "Medium" | "Low";
  recommendation: string;
  rationale: string;
  implementation: string;
}

export interface BrandAnalysis {
  openaiPerception: BrandPerception;
  claudePerception: BrandPerception;
  consensusBrandAttributes: string[];
  brandStrengths: string[];
  brandWeaknesses: string[];
  competitivePositioning: string;
  metadataRecommendations: string[];
  contentRecommendations: string[];
  designRecommendations: string[];
  aiAgentOptimizations: AIAgentRecommendation[];
  overallBrandClarityScore: number; // 0-100
}

export interface SubmissionData {
  // Contact Information
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;

  // Company Information
  companyName: string;
  companyUrl: string;
  industry?: string;
  companySize?: string;
  jobTitle?: string;

  // Business Context (Optional)
  productDescription?: string;
  challenges?: string;
  competitors?: string;
  marketingGoals?: string;
  timeline?: string;
  additionalInfo?: string;

  // Metadata
  submittedAt: string;
  submissionId: string;
}

export interface AnalysisReport {
  success: boolean;
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
  dualAI?: DualAIAnalysis;
  brandAnalysis?: BrandAnalysis;
  submissionData?: SubmissionData;
}

export interface AnalysisRequestBody {
  url: string;
  submissionData?: SubmissionData;
}

export interface ErrorResponse {
  message: string;
  status?: number;
  details?: string;
}
