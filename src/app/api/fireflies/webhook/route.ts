import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHmac } from "crypto";

const ADMIN_EMAIL = "rng@thejourneymencollective.com";
const FIREFLIES_GQL = "https://api.fireflies.ai/graphql";

// ─── Fireflies types ──────────────────────────────────────────────────────────
interface FirefliesSentence {
  speaker_name: string;
  text: string;
  start_time?: number;
}

interface FirefliesTranscript {
  id: string;
  title: string;
  date: string;
  duration: number;
  organizer_email: string;
  participants: string[];           // array of email strings
  sentences: FirefliesSentence[];
  summary: {
    overview?: string;
    bullet_gist?: string | string[];
    action_items?: string | string[];
    keywords?: string[];
  };
}

interface ActionItem {
  id: string;
  text: string;
  completed: boolean;
}

// ─── Signature verification ───────────────────────────────────────────────────
function verifySignature(rawBody: string, sigHeader: string | null): boolean {
  const secret = process.env.FIREFLIES_WEBHOOK_SECRET;
  if (!secret) return true; // skip in dev if no secret configured
  if (!sigHeader) return false;

  const expected = "sha256=" + createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  // Timing-safe compare
  if (expected.length !== sigHeader.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sigHeader.charCodeAt(i);
  return diff === 0;
}

// ─── Fireflies GraphQL fetch ──────────────────────────────────────────────────
async function fetchTranscript(transcriptId: string): Promise<FirefliesTranscript | null> {
  const apiKey = process.env.FIREFLIES_API_KEY;
  if (!apiKey) throw new Error("FIREFLIES_API_KEY not configured");

  const query = `
    query GetTranscript($id: String!) {
      transcript(id: $id) {
        id
        title
        date
        duration
        organizer_email
        participants
        sentences {
          speaker_name
          text
          start_time
        }
        summary {
          overview
          bullet_gist
          action_items
          keywords
        }
      }
    }
  `;

  const res = await fetch(FIREFLIES_GQL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ query, variables: { id: transcriptId } }),
  });

  if (!res.ok) {
    console.error("Fireflies GQL error", res.status, await res.text());
    return null;
  }

  const json = await res.json();
  if (json.errors) {
    console.error("Fireflies GQL errors", JSON.stringify(json.errors));
    return null;
  }

  return json.data?.transcript ?? null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toStringArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return (value as string[]).filter(Boolean);
  if (typeof value === "string") return value.split("\n").map(s => s.trim()).filter(Boolean);
  return [];
}

function buildTranscriptText(sentences: FirefliesSentence[]): string {
  return sentences
    .map(s => `${s.speaker_name || "Speaker"}: ${s.text}`)
    .join("\n");
}

// ─── Webhook handler ──────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  // Verify Fireflies signature
  const sigHeader =
    req.headers.get("x-hub-signature-256") ??
    req.headers.get("x-fireflies-signature") ??
    null;

  if (!verifySignature(rawBody, sigHeader)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Only process transcript completion events — ignore others
  const eventType = payload.eventType as string | undefined;
  if (eventType && eventType !== "Transcription completed") {
    return NextResponse.json({ ok: true, skipped: true, eventType });
  }

  // Extract transcript ID from payload
  // Fireflies sends: { eventType, data: { transcript_id: "..." } }
  const transcriptId =
    (payload.transcriptId as string | undefined) ??
    ((payload.data as Record<string, string> | undefined)?.transcript_id) ??
    null;

  if (!transcriptId) {
    return NextResponse.json({ error: "No transcript ID in payload" }, { status: 400 });
  }

  // Fetch transcript data from Fireflies GraphQL
  let transcript: FirefliesTranscript | null;
  try {
    transcript = await fetchTranscript(transcriptId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  if (!transcript) {
    return NextResponse.json({ error: "Transcript not found in Fireflies" }, { status: 404 });
  }

  // Determine member email: first participant who isn't Robert
  const participants: string[] = (transcript.participants ?? []).filter(Boolean);
  const memberEmail =
    participants.find(e => e.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) ?? null;

  // Build structured session data from Fireflies summary
  const summary = transcript.summary ?? {};
  const takeaways: string[] = toStringArray(summary.bullet_gist);

  const actionItemStrings: string[] = toStringArray(summary.action_items);
  const actionItems: ActionItem[] = actionItemStrings.map((text, i) => ({
    id: `ff-${transcriptId.slice(-8)}-${i}`,
    text,
    completed: false,
  }));

  const transcriptText = Array.isArray(transcript.sentences)
    ? buildTranscriptText(transcript.sentences)
    : "";

  // Normalise date (Fireflies returns a Unix timestamp in ms or an ISO string)
  let sessionDate: string;
  if (transcript.date) {
    const ts = Number(transcript.date);
    sessionDate = isNaN(ts)
      ? new Date(transcript.date).toISOString().split("T")[0]
      : new Date(ts).toISOString().split("T")[0];
  } else {
    sessionDate = new Date().toISOString().split("T")[0];
  }

  // Group if more than 2 participants (admin + multiple clients)
  const sessionType: "solo" | "group" = participants.length > 2 ? "group" : "solo";

  // Write to Supabase using service role key (bypasses RLS — webhook has no user session)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error: dbError } = await supabase.from("coaching_sessions").upsert(
    {
      fireflies_id: transcriptId,
      member_email: memberEmail,
      title: transcript.title || "Coaching Session",
      date: sessionDate,
      session_type: sessionType,
      summary: summary.overview ?? "",
      takeaways,
      action_items: actionItems,
      coach_notes: "",
      transcript: transcriptText,
    },
    { onConflict: "fireflies_id" }   // safe to re-deliver — upserts on duplicate
  );

  if (dbError) {
    console.error("Supabase upsert error:", dbError);
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  console.log(`Fireflies webhook processed: ${transcriptId} → ${memberEmail ?? "unassigned"}`);
  return NextResponse.json({ ok: true, transcriptId, memberEmail, sessionDate });
}
