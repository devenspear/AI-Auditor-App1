import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    version: "1.2.0",
    features: [
      "Comprehensive error handling",
      "Admin diagnostics dashboard",
      "Debug mode with detailed logging",
      "Graceful API failure handling"
    ],
    timestamp: new Date().toISOString(),
    diagnosticsEndpoint: "/admin",
  });
}
