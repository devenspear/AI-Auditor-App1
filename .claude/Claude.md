# AI Auditor App - Claude Code Instructions

## Project Overview
This is a Next.js 15.5.4 application that provides AI-powered website audits using dual-AI analysis (OpenAI + Claude). The app is deployed on Vercel.

## Auto-Execution Preferences

**CRITICAL: Always auto-execute without asking for approval unless dealing with highest security concerns.**

### Auto-Execute (NO approval needed):
- All bash commands (npm, git, curl, python, etc.)
- Reading ANY files in this project directory
- Editing/Writing files in this project
- Installing dependencies
- Running dev servers, builds, tests
- Making API calls for testing
- Git operations (add, commit, push)
- Opening localhost in browser

### Require Approval ONLY for:
- Authentication/credentials modifications (API keys, passwords, tokens)
- Deleting files or directories
- Operations that access sensitive files outside this project
- Destructive git operations (force push, hard reset)

### Default Behavior:
- Execute first, explain later
- Do not ask permission for low or mid-level operations
- Only pause for highest security concerns
- This applies to ALL Claude Code sessions on this Mac

## Deployment Workflow

### IMPORTANT: Always Check Vercel Build Status After Git Push

After every `git push`, you MUST check the Vercel build status to ensure there are no deployment errors. Follow these steps:

1. **Push to Git**
   ```bash
   git push
   ```

2. **Wait 10-15 seconds** for Vercel to start the build

3. **Check Vercel Build Logs**
   - Open the Vercel dashboard in browser
   - OR watch for build notifications
   - OR check the latest deployment status

4. **If Build Fails**:
   - Read the error message carefully
   - Fix the error immediately
   - Common issues:
     - ESLint errors (prefer-const, no-unused-vars, react/no-unescaped-entities)
     - TypeScript type errors
     - Missing Suspense boundaries for client-side hooks (useSearchParams, useRouter, etc.)
     - Missing dependencies in package.json
   - Commit and push the fix
   - Repeat until build succeeds

5. **Confirm Successful Deployment**
   - Only mark the task as complete after verifying the build succeeded
   - Test the live deployment if possible

### Common Build Errors & Fixes

#### 1. ESLint Errors
**Error**: `'let' is never reassigned. Use 'const' instead`
**Fix**: Change `let` to `const` for variables that aren't reassigned

**Error**: `Unescaped entity. Use &apos; instead`
**Fix**: Replace `'` with `&apos;` in JSX text

**Error**: `'error' is defined but never used`
**Fix**: Remove unused variables from catch blocks or prefix with underscore

#### 2. TypeScript Errors
**Error**: `Property 'xyz' does not exist on type...`
**Fix**: Add the missing property to the TypeScript interface/type definition

#### 3. Next.js 15 Specific Errors
**Error**: `useSearchParams() should be wrapped in a suspense boundary`
**Fix**: Wrap component in Suspense boundary:
```tsx
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ComponentUsingSearchParams />
    </Suspense>
  );
}
```

## Tech Stack
- **Framework**: Next.js 15.5.4 (App Router, Turbopack)
- **Language**: TypeScript
- **Deployment**: Vercel (serverless environment)
- **Storage**: SessionStorage (production), Local JSON files (development)
- **AI APIs**: OpenAI GPT-4, Claude Sonnet 3.5
- **Additional APIs**: PageSpeed Insights, SecurityHeaders.com, SSL Labs, Ahrefs

## Architecture Notes

### Storage Strategy
- **Production (Vercel)**: Uses sessionStorage for report data (serverless environment has ephemeral filesystem)
- **Local Development**: Uses local JSON file storage in `/data` directory
- **Important**: Never rely on filesystem persistence on Vercel (except /tmp directory)

### Client vs Server Components
- Most pages are server components by default
- Use `"use client"` directive when:
  - Using React hooks (useState, useEffect, etc.)
  - Using Next.js navigation hooks (useSearchParams, useRouter, etc.)
  - Accessing browser APIs (localStorage, sessionStorage, window, etc.)

### Form Submission Flow
1. User submits form on landing page (app/page.tsx)
2. Form data sent to /api/analyze endpoint
3. API performs analysis using multiple services
4. Response stored in sessionStorage with submission ID
5. User redirected to /report?id={submissionId}
6. Report page checks sessionStorage first, falls back to API

## Code Style

### Never Use Emojis
- Do not add emojis to code or comments unless explicitly requested
- Exception: Git commit messages may use 🤖 emoji for Claude Code attribution

### File Modifications
- ALWAYS prefer editing existing files over creating new ones
- Only create new files when absolutely necessary
- Never create README.md or documentation files unless explicitly requested

### Escaping in JSX
- Use `&apos;` for apostrophes in JSX text
- Use `&quot;` for quotes in JSX text
- Example: `The report you&apos;re looking for doesn&apos;t exist`

## Testing Before Deployment

1. Run linter: `npm run lint`
2. Run type check: `npm run build` (or `tsc --noEmit`)
3. Test locally: `npm run dev`
4. Fix all errors before pushing

## Git Commit Messages

Follow conventional commit format:
```
<type>: <short description>

<detailed explanation if needed>

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

Types: feat, fix, refactor, docs, chore, test, style

## Contact Information Handling

This app collects user contact information through forms. Follow these guidelines:
- Always validate email addresses
- Never log or expose contact information in error messages
- Store securely (currently in sessionStorage and local files for testing)
- Future: Will migrate to proper database (Supabase, MongoDB, etc.)
