import { NextResponse } from "next/server";

export async function GET() {
  try {
    const apiKey = process.env.PAGESPEED_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "PAGESPEED_API_KEY not found" });
    }

    const testUrl = "https://overabove.com";
    const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(testUrl)}&key=${apiKey}&strategy=mobile`;

    const response = await fetch(endpoint);

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({
        error: "PageSpeed API failed",
        status: response.status,
        details: error
      }, { status: 500 });
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      score: data.lighthouseResult?.categories?.performance?.score * 100,
      url: testUrl
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
