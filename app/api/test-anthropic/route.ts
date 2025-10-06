import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export async function GET() {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        error: "ANTHROPIC_API_KEY not found",
        env: Object.keys(process.env).filter(k => k.includes('ANTHROPIC'))
      });
    }

    const anthropic = new Anthropic({
      apiKey: apiKey,
    });

    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: "Say hello in 5 words",
        },
      ],
    });

    return NextResponse.json({
      success: true,
      response: message.content[0],
    });
  } catch (error) {
    console.error("Test failed:", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
