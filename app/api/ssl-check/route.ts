import { NextResponse } from "next/server";
import type { SSLGrade } from "@/lib/report-types";

interface SSLLabsResponse {
  status: string;
  endpoints?: Array<{
    statusMessage: string;
    grade?: string;
    hasWarnings: boolean;
    isExceptional: boolean;
    progress: number;
    eta: number;
    delegation: number;
  }>;
  certs?: Array<{
    subject: string;
    issuerLabel: string;
    notAfter: number;
  }>;
}

/**
 * Checks SSL certificate and security grade using SSL Labs API
 * Free API, no authentication required
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json(
        { error: "URL parameter is required" },
        { status: 400 }
      );
    }

    // Extract hostname from URL
    const hostname = new URL(url).hostname;

    // SSL Labs API endpoint
    const sslLabsUrl = `https://api.ssllabs.com/api/v3/analyze?host=${encodeURIComponent(hostname)}&fromCache=on&maxAge=24`;

    console.log(`Checking SSL for: ${hostname}`);

    const response = await fetch(sslLabsUrl, {
      headers: {
        "User-Agent": "AI-Auditor-App",
      },
    });

    if (!response.ok) {
      throw new Error(`SSL Labs API error: ${response.statusText}`);
    }

    const data = (await response.json()) as SSLLabsResponse;

    // Check if analysis is in progress or complete
    if (data.status === "IN_PROGRESS" || data.status === "DNS") {
      return NextResponse.json({
        hasSSL: true,
        grade: "Pending",
        message: "SSL analysis in progress. This may take a few minutes.",
      } satisfies SSLGrade);
    }

    if (data.status === "ERROR") {
      return NextResponse.json({
        hasSSL: false,
        grade: "Error",
        error: "Unable to analyze SSL certificate",
      } satisfies SSLGrade);
    }

    // Parse SSL data
    const endpoint = data.endpoints?.[0];
    const cert = data.certs?.[0];

    const sslData: SSLGrade = {
      hasSSL: url.startsWith("https://"),
      grade: endpoint?.grade || "N/A",
      validUntil: cert?.notAfter
        ? new Date(cert.notAfter).toLocaleDateString()
        : undefined,
      message: endpoint?.hasWarnings
        ? "SSL certificate has warnings"
        : endpoint?.isExceptional
        ? "Excellent SSL configuration"
        : "SSL certificate is valid",
    };

    return NextResponse.json(sslData);
  } catch (error) {
    console.error("SSL check failed:", error);

    return NextResponse.json(
      {
        hasSSL: false,
        grade: "Error",
        error: error instanceof Error ? error.message : "SSL check failed",
      } satisfies SSLGrade,
      { status: 500 }
    );
  }
}
