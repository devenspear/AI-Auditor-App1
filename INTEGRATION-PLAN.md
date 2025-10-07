# AI Auditor - Enterprise Integration Plan

## 🎯 Project Vision

Transform two separate websites into a unified, enterprise-grade SaaS platform that provides AI-powered website readiness assessments with premium features and monetization.

---

## 📊 Current State

### Site 1: Marketing Website
- **URL**: https://ai-auditor.web0101.com
- **Purpose**: Lead capture and qualification
- **Features**:
  - Comprehensive assessment form
  - Collects business context, challenges, goals
  - Professional marketing design

### Site 2: Analysis App
- **URL**: https://ai-auditor-app1.vercel.app
- **Purpose**: Technical analysis and reporting
- **Features**:
  - GPT-4o powered analysis
  - PageSpeed integration
  - Animated Fortune 100-style dashboard
  - Real-time report generation

---

## 🏗️ Target Architecture

### Unified Platform Structure

```
ai-auditor-app1/ (Next.js 15.5.4)
├── app/
│   ├── (public)
│   │   ├── page.tsx                    # Assessment form (replaces web0101)
│   │   ├── login/page.tsx              # Clerk authentication
│   │   └── pricing/page.tsx            # Pricing tiers
│   ├── (authenticated)
│   │   ├── dashboard/page.tsx          # User dashboard with reports list
│   │   └── reports/
│   │       └── [id]/page.tsx           # Individual report view
│   ├── report/
│   │   └── [shareId]/page.tsx          # Public shareable report
│   └── api/
│       ├── submit-assessment/route.ts  # Form submission endpoint
│       ├── analyze/route.ts            # Analysis engine (enhanced)
│       ├── webhooks/
│       │   ├── clerk/route.ts          # User sync
│       │   └── stripe/route.ts         # Payment processing
│       └── send-report/route.ts        # Email delivery
├── lib/
│   ├── db.ts                           # Prisma client
│   ├── auth.ts                         # Clerk helpers
│   ├── email.ts                        # Resend integration
│   ├── stripe.ts                       # Payment processing
│   └── prompts/
│       └── enhanced-analysis.ts        # GPT-4o with user context
├── prisma/
│   └── schema.prisma                   # Database models
└── components/
    ├── forms/
    │   └── assessment-form.tsx         # Migrated from web0101
    └── reports/
        └── report-components.tsx       # Reusable report UI
```

---

## 🗄️ Database Schema (Vercel Postgres + Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// USER MANAGEMENT (Clerk Integration)
// ============================================

model User {
  id              String           @id @default(cuid())
  clerkId         String           @unique
  email           String           @unique
  firstName       String?
  lastName        String?
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  // Subscription
  subscriptionTier SubscriptionTier @default(FREE)
  stripeCustomerId String?         @unique

  // Relations
  assessments     Assessment[]
  reports         Report[]

  @@index([email])
  @@index([clerkId])
}

enum SubscriptionTier {
  FREE          // 1 report/month
  STARTER       // 10 reports/month - $49/mo
  PROFESSIONAL  // 50 reports/month - $149/mo
  ENTERPRISE    // Unlimited - $499/mo
}

// ============================================
// ASSESSMENT & ANALYSIS
// ============================================

model Assessment {
  id                    String   @id @default(cuid())
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  // User relationship
  userId                String
  user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Contact Info (from form)
  email                 String
  phoneNumber           String?

  // Company Info
  companyName           String
  companyWebsite        String   // URL to analyze
  industry              String?
  companySize           String?
  jobTitle              String?

  // Business Context (Rich data for GPT-4o)
  productsServices      String?  @db.Text
  marketingChallenges   String?  @db.Text
  keyCompetitors        String?  @db.Text
  primaryGoals          String?  @db.Text
  timeline              String?
  additionalInfo        String?  @db.Text

  // Analysis Status
  status                AnalysisStatus @default(PENDING)

  // Relations
  report                Report?

  @@index([userId])
  @@index([email])
  @@index([status])
  @@index([createdAt])
}

enum AnalysisStatus {
  PENDING      // Form submitted, not yet processed
  PROCESSING   // Currently running GPT-4o analysis
  COMPLETED    // Analysis complete
  FAILED       // Analysis failed
}

model Report {
  id                    String   @id @default(cuid())
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  // Relationships
  userId                String
  user                  User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  assessmentId          String     @unique
  assessment            Assessment @relation(fields: [assessmentId], references: [id], onDelete: Cascade)

  // Share Settings
  shareId               String     @unique @default(cuid()) // Public share URL
  isPublic              Boolean    @default(false)

  // Analysis Results (JSON data)
  reportData            Json       // Full GPT-4o response
  analyzedAt            DateTime

  // PageSpeed Data
  pageSpeedData         Json?

  // Deliverables
  pdfUrl                String?    // S3/Vercel Blob URL
  emailSent             Boolean    @default(false)
  emailSentAt           DateTime?

  // Metrics
  viewCount             Int        @default(0)
  lastViewedAt          DateTime?

  @@index([userId])
  @@index([shareId])
  @@index([createdAt])
}

// ============================================
// PAYMENTS & BILLING
// ============================================

model Subscription {
  id                String   @id @default(cuid())
  userId            String   @unique

  stripeSubscriptionId String @unique
  stripePriceId     String
  stripeCurrentPeriodEnd DateTime

  status            String   // active, canceled, past_due

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([userId])
}

model Invoice {
  id                String   @id @default(cuid())
  userId            String

  stripeInvoiceId   String   @unique
  amount            Int      // in cents
  status            String   // paid, pending, failed
  pdfUrl            String?

  createdAt         DateTime @default(now())

  @@index([userId])
  @@index([createdAt])
}

// ============================================
// ANALYTICS & METRICS
// ============================================

model AnalyticsEvent {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())

  userId      String?
  reportId    String?

  eventType   String   // form_submit, report_view, pdf_download, email_open
  metadata    Json?

  ipAddress   String?
  userAgent   String?

  @@index([userId])
  @@index([reportId])
  @@index([eventType])
  @@index([createdAt])
}
```

---

## 🔄 User Flow & Data Journey

### Phase 1: Assessment Submission

```mermaid
User → Assessment Form → Submit
  ↓
POST /api/submit-assessment
  ↓
├─ Create User (if new) via Clerk
├─ Create Assessment record
├─ Check subscription limits
└─ Trigger analysis job
  ↓
Background: Analyze with GPT-4o
  ├─ Fetch PageSpeed data
  ├─ Scrape website content
  ├─ Enrich GPT-4o prompt with form context
  └─ Generate comprehensive report
  ↓
Create Report record
  ↓
Send email notification with report link
  ↓
User receives: /reports/[shareId]
```

### Phase 2: Report Viewing

```
Authenticated: /dashboard → View all reports
Public Share: /report/[shareId] → Anyone with link
```

---

## 🎨 Enhanced GPT-4o Analysis Prompting

### Context Enrichment Strategy

```typescript
// lib/prompts/enhanced-analysis.ts

export function buildEnhancedPrompt(
  assessment: Assessment,
  scrapedData: ScrapedData,
  pageSpeedData: PageSpeedData
) {
  return `You are an expert AI consultant analyzing a website for AI readiness and digital marketing optimization.

# CLIENT PROFILE

**Company**: ${assessment.companyName}
**Industry**: ${assessment.industry || 'Not specified'}
**Company Size**: ${assessment.companySize || 'Not specified'}
**Contact**: ${assessment.firstName} ${assessment.lastName}, ${assessment.jobTitle || 'Decision Maker'}

# BUSINESS CONTEXT FROM CLIENT

**Products/Services**:
${assessment.productsServices || 'Not provided'}

**Current Marketing Challenges**:
${assessment.marketingChallenges || 'Not specified'}

**Key Competitors**:
${assessment.keyCompetitors || 'Not specified'}

**Primary Marketing Goals**:
${assessment.primaryGoals || 'Not specified'}

**Timeline**: ${assessment.timeline || 'Not specified'}

**Additional Context**:
${assessment.additionalInfo || 'None provided'}

# TECHNICAL ANALYSIS DATA

## Website URL
${assessment.companyWebsite}

## Scraped Content
- Title: ${scrapedData.title}
- Meta Description: ${scrapedData.metaDescription}
- H1 Tags: ${scrapedData.h1.join(', ')}
- Word Count: ${scrapedData.wordCount}
- Content Sample: ${scrapedData.text.substring(0, 3000)}

## Performance Metrics
${JSON.stringify(pageSpeedData, null, 2)}

# YOUR TASK

Provide a comprehensive AI readiness assessment that:

1. **Addresses Their Specific Challenges**: Reference their stated marketing challenges and provide solutions
2. **Competitive Analysis**: If competitors mentioned, compare positioning and opportunities
3. **Goal Alignment**: Ensure recommendations directly support their primary goals
4. **Timeline Sensitivity**: Prioritize quick wins if timeline is urgent
5. **Industry Context**: Apply industry-specific best practices for ${assessment.industry}
6. **Personalized Recommendations**: Use company name and specific business context throughout

# OUTPUT FORMAT

Return a JSON object with this exact structure:

{
  "summary": "Personalized 2-3 sentence executive summary mentioning ${assessment.companyName}",
  "brandVoiceScore": 0-100,
  "geoReadiness": 0-100,
  "technicalHealthScore": 0-100,
  "readabilityLevel": "string",
  "keyThemes": ["theme1", "theme2", ...],
  "clarityNotes": [
    "Specific observation about their messaging",
    "How their content addresses (or doesn't) their stated challenges",
    "Competitive positioning insights if competitors provided"
  ],
  "narrativeInsights": [
    {
      "headline": "Insight specific to their business",
      "body": "Detailed analysis with context from form"
    }
  ],
  "actionPlan": [
    {
      "title": "Action tied to their goals",
      "summary": "How this addresses their challenges",
      "category": "Quick Win|Opportunity|Foundation",
      "impact": "High|Medium|Low",
      "timeline": "Based on their stated timeline",
      "relatedGoal": "Reference to their specific goal"
    }
  ]
}

Make the analysis feel like a $5,000 consulting report, not a generic audit.`;
}
```

---

## 🔐 Authentication & Access Control (Clerk)

### Implementation Plan

```typescript
// lib/auth.ts
import { auth, currentUser } from '@clerk/nextjs/server';

export async function requireAuth() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }
  return userId;
}

export async function getOrCreateUser() {
  const user = await currentUser();
  if (!user) return null;

  // Sync with our database
  const dbUser = await prisma.user.upsert({
    where: { clerkId: user.id },
    create: {
      clerkId: user.id,
      email: user.emailAddresses[0].emailAddress,
      firstName: user.firstName,
      lastName: user.lastName,
    },
    update: {
      email: user.emailAddresses[0].emailAddress,
      firstName: user.firstName,
      lastName: user.lastName,
    },
  });

  return dbUser;
}
```

### Protected Routes

```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/reports(.*)',
  '/api/submit-assessment',
]);

export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) auth().protect();
});
```

---

## 💰 Monetization Strategy

### Pricing Tiers

| Tier | Price | Reports/Month | Features |
|------|-------|---------------|----------|
| **Free** | $0 | 1 | Basic report, no PDF |
| **Starter** | $49/mo | 10 | PDF export, email delivery |
| **Professional** | $149/mo | 50 | Priority analysis, white-label |
| **Enterprise** | $499/mo | Unlimited | Custom branding, API access, dedicated support |

### Stripe Integration

```typescript
// lib/stripe.ts
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const PRICE_IDS = {
  STARTER: 'price_starter_monthly',
  PROFESSIONAL: 'price_pro_monthly',
  ENTERPRISE: 'price_enterprise_monthly',
};

export async function createCheckoutSession(
  userId: string,
  priceId: string
) {
  const session = await stripe.checkout.sessions.create({
    customer_email: user.email,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/pricing`,
    metadata: { userId },
  });

  return session;
}
```

---

## 📧 Email Delivery System (Resend)

### Report Email Template

```typescript
// lib/email.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendReportEmail(
  report: Report,
  assessment: Assessment
) {
  const shareUrl = `${process.env.NEXT_PUBLIC_URL}/report/${report.shareId}`;

  await resend.emails.send({
    from: 'AI Auditor <reports@ai-auditor.com>',
    to: assessment.email,
    subject: `Your AI Readiness Report for ${assessment.companyName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>Your AI Readiness Report is Ready! 🎉</h1>

        <p>Hi ${assessment.firstName || 'there'},</p>

        <p>We've completed a comprehensive AI readiness analysis for <strong>${assessment.companyWebsite}</strong>.</p>

        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0;">Key Findings</h2>
          <p><strong>Overall Score:</strong> ${report.reportData.score?.overall}/100</p>
          <p><strong>Grade:</strong> ${report.reportData.score?.grade}</p>
        </div>

        <a href="${shareUrl}" style="display: inline-block; background: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          View Full Report →
        </a>

        <p style="color: #666; font-size: 14px;">
          This report is personalized based on your business goals and challenges.
        </p>

        ${report.pdfUrl ? `
          <p>
            <a href="${report.pdfUrl}">Download PDF Version</a>
          </p>
        ` : ''}

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">

        <p style="font-size: 12px; color: #999;">
          This report was generated by AI Auditor for ${assessment.companyName}.
          If you have questions, reply to this email.
        </p>
      </div>
    `,
  });

  // Track email sent
  await prisma.report.update({
    where: { id: report.id },
    data: {
      emailSent: true,
      emailSentAt: new Date(),
    },
  });
}
```

---

## 📊 Analytics & Metrics Dashboard

### Tracking Events

```typescript
// lib/analytics.ts

export async function trackEvent(
  eventType: string,
  data: {
    userId?: string;
    reportId?: string;
    metadata?: any;
    req?: Request;
  }
) {
  const ipAddress = data.req?.headers.get('x-forwarded-for') ||
                    data.req?.headers.get('x-real-ip');
  const userAgent = data.req?.headers.get('user-agent');

  await prisma.analyticsEvent.create({
    data: {
      eventType,
      userId: data.userId,
      reportId: data.reportId,
      metadata: data.metadata,
      ipAddress,
      userAgent,
    },
  });
}

// Usage:
await trackEvent('form_submit', { userId, metadata: { companyName } });
await trackEvent('report_view', { userId, reportId, req });
await trackEvent('pdf_download', { userId, reportId });
await trackEvent('email_open', { reportId }); // Via Resend webhook
```

### Admin Dashboard Queries

```typescript
// app/admin/dashboard/page.tsx

const metrics = await prisma.$transaction([
  // Total reports generated
  prisma.report.count(),

  // Reports this month
  prisma.report.count({
    where: {
      createdAt: { gte: startOfMonth }
    }
  }),

  // Revenue (from Stripe)
  prisma.subscription.count({
    where: { status: 'active' }
  }),

  // Most popular industries
  prisma.assessment.groupBy({
    by: ['industry'],
    _count: true,
    orderBy: { _count: { industry: 'desc' } },
    take: 10,
  }),

  // Conversion rate (form → paid)
  // Average report score
  // Top converting pages
]);
```

---

## 🚀 Implementation Roadmap

### Week 1: Foundation
- [ ] Set up Vercel Postgres database
- [ ] Create Prisma schema
- [ ] Run initial migrations
- [ ] Integrate Clerk authentication
- [ ] Migrate assessment form from web0101.com

### Week 2: Core Features
- [ ] Enhance `/api/analyze` with user context
- [ ] Build `/dashboard` with reports list
- [ ] Create `/report/[shareId]` public view
- [ ] Implement email delivery with Resend
- [ ] Add analytics tracking

### Week 3: Monetization
- [ ] Integrate Stripe checkout
- [ ] Implement subscription tiers
- [ ] Add usage limits enforcement
- [ ] Build pricing page
- [ ] Create billing portal

### Week 4: Polish & Launch
- [ ] PDF generation (react-pdf or Puppeteer)
- [ ] Email templates refinement
- [ ] Admin analytics dashboard
- [ ] Performance optimization
- [ ] Launch to production

### Phase 2 (Future)
- [ ] API access for Enterprise tier
- [ ] White-label capabilities
- [ ] Custom branding options
- [ ] Bulk analysis uploads
- [ ] Team collaboration features
- [ ] Zapier/Make.com integrations

---

## 🛠️ Technical Stack Summary

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Framework** | Next.js 15.5.4 | Full-stack React framework |
| **Database** | Vercel Postgres | Production PostgreSQL |
| **ORM** | Prisma | Type-safe database client |
| **Auth** | Clerk | User authentication & management |
| **Payments** | Stripe | Subscription billing |
| **Email** | Resend | Transactional emails |
| **AI** | OpenAI GPT-4o | Website analysis |
| **Monitoring** | Vercel Analytics | Performance tracking |
| **Styling** | Tailwind CSS + Framer Motion | UI & animations |
| **Storage** | Vercel Blob (optional) | PDF storage |

---

## 💡 Key Differentiators

1. **Personalized Analysis**: Every report references user's specific business context
2. **Competitive Insights**: Compares against stated competitors
3. **Goal-Driven Recommendations**: Actions tied to user's actual goals
4. **Timeline Awareness**: Prioritizes based on urgency
5. **Industry Expertise**: GPT-4o applies industry-specific knowledge
6. **Fortune 100 UX**: Professional animations and design
7. **White-Glove Delivery**: Email + PDF + shareable link

---

## 🎯 Success Metrics

### Business KPIs
- Monthly Recurring Revenue (MRR)
- Customer Acquisition Cost (CAC)
- Lifetime Value (LTV)
- Conversion rate: Form → Paid
- Churn rate by tier

### Product Metrics
- Reports generated/month
- Average report score
- Email open rate
- Report share rate
- Time to complete assessment
- Analysis completion time
- PDF download rate

---

## 🔧 Environment Variables Required

```bash
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."  # For Prisma migrations

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/login"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/signup"

# AI
OPENAI_API_KEY="sk-..."

# Performance
PAGESPEED_API_KEY="AIza..."

# Payments (Stripe)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email (Resend)
RESEND_API_KEY="re_..."

# App
NEXT_PUBLIC_URL="https://ai-auditor-app1.vercel.app"
```

---

## 📝 Migration Checklist

### From web0101.com
- [x] Assessment form HTML structure
- [x] Form field definitions
- [ ] Convert to React components
- [ ] Add validation with Zod
- [ ] Style with Tailwind
- [ ] Connect to database

### From Current App
- [x] Analysis engine
- [x] GPT-4o integration
- [x] PageSpeed integration
- [x] Report UI components
- [x] Animations
- [ ] Add user context to prompts
- [ ] Add authentication checks
- [ ] Add subscription limits

---

## 🎓 Learning Resources

- **Clerk Docs**: https://clerk.com/docs
- **Stripe Subscriptions**: https://stripe.com/docs/billing/subscriptions
- **Prisma Guide**: https://www.prisma.io/docs
- **Resend Email**: https://resend.com/docs
- **GPT-4o Best Practices**: https://platform.openai.com/docs/guides/prompt-engineering

---

**Ready to build tomorrow! 🚀**

_Last Updated: Oct 6, 2025_
_Version: 1.0 - Integration Planning Phase_
