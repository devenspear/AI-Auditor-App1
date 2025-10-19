import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    version: "1.2.2",
    features: [
      "Comprehensive error handling",
      "Admin diagnostics dashboard",
      "Debug mode with detailed logging",
      "Graceful API failure handling",
      "Optimized token usage for AI analysis",
      "Claude rate limit retry logic",
      "Generic AI model references (trade secret protection)",
      "Monochrome UI for dark mode compatibility"
    ],
    timestamp: new Date().toISOString(),
    diagnosticsEndpoint: "/admin",
  });
}
