import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    version: "1.2.1",
    features: [
      "Comprehensive error handling",
      "Admin diagnostics dashboard",
      "Debug mode with detailed logging",
      "Graceful API failure handling",
      "Optimized token usage for AI analysis",
      "Claude rate limit retry logic"
    ],
    timestamp: new Date().toISOString(),
    diagnosticsEndpoint: "/admin",
  });
}
