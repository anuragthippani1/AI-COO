import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { runAgent } from "@/ai/agent_manager";

/**
 * Agent Run API
 * Handles user-initiated agent commands, queries, and manual overrides.
 * For event-driven automation, see agent_loop.js
 */
export async function POST(request) {
  try {
    const userId = requireAuth(request);
    const body = await request.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { type, content, metadata } = body;

    if (!type || !content) {
      return NextResponse.json(
        { error: "Missing required fields: type and content" },
        { status: 400 }
      );
    }

    const response = await runAgent({
      userId,
      type,
      content,
      metadata,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Agent run error:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
