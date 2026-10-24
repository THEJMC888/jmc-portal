import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 30;

const client = new Anthropic({ apiKey: process.env.ANTHROPICA_API_KEY });

async function getAuthUser(request: NextRequest) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
  const { data: { user } } = await supabase.auth.getUser(token);
  return user ?? null;
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { statements, visionTexts } = await request.json() as {
    statements: Array<{ category: string; being: string; doing: string }>;
    visionTexts: string[];
  };

  const statementsBlock = statements
    .filter(s => s.being?.trim() || s.doing?.trim())
    .map(s => `${s.category}:\n  Being: ${s.being}\n  Doing: ${s.doing}`)
    .join("\n\n");

  const visionBlock = visionTexts.filter(Boolean).join(" · ");

  const prompt = `You are crafting a deeply personal Primary Attunement statement for a member of The Journeymen Collective — a high-performance personal development community for men.

Their Being/Doing Statements:
${statementsBlock || "(not yet written)"}

Key phrases from their Vision Video:
${visionBlock || "(none)"}

Write exactly TWO short lines that form their Primary Attunement. Rules:
- Line 1 must start with "I AM" — 8 to 14 words, bold and declarative
- Line 2 must start with "I" — 8 to 14 words, present-tense action/embodiment
- Distill the most essential truth from their statements and vision
- Powerful, personal, masculine energy — not generic affirmations
- No quotes, no labels, no explanation — just the two lines

Respond with ONLY the two lines, separated by a newline.`;

  const message = await client.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 120,
    messages: [{ role: "user", content: prompt }],
  });

  const text = (message.content[0] as { type: string; text: string }).text.trim();
  const lines = text.split("\n").filter(Boolean);
  const line1 = lines[0]?.trim() ?? "";
  const line2 = lines[1]?.trim() ?? "";

  return NextResponse.json({ line1, line2 });
}
