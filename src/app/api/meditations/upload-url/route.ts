import { NextRequest, NextResponse } from "next/server";
import { generateClientTokenFromReadWriteToken } from "@vercel/blob/client";
import { createClient } from "@supabase/supabase-js";

// Using generateClientTokenFromReadWriteToken instead of handleUpload so that
// NO callbackUrl is embedded in the signed token. Vercel Blob then returns 200
// to the browser's PUT immediately after storing the file — no server round-trip,
// no cold-start delay, no hang at 100%.
export const runtime = "edge";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "rng@thejourneymencollective.com";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as Record<string, unknown>;

  // Safety valve: if Vercel somehow calls back anyway, return 200 immediately.
  if (body?.type === "blob.upload-completed") {
    return NextResponse.json({ type: "blob.upload-completed" });
  }

  // browser upload() sends: { type: "blob.generate-client-token", payload: { pathname, clientPayload } }
  const payload = (body?.payload ?? {}) as Record<string, string>;
  const { pathname, clientPayload } = payload;

  if (!clientPayload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
  const { data: { user } } = await supabase.auth.getUser(clientPayload);
  if (user?.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!pathname) {
    return NextResponse.json({ error: "pathname required" }, { status: 400 });
  }

  // Generate token with NO onUploadCompleted → no callbackUrl in the token →
  // Vercel Blob sends 200 back to the browser immediately after storing the file.
  const clientToken = await generateClientTokenFromReadWriteToken({
    token: process.env.BLOB_READ_WRITE_TOKEN!,
    pathname,
    allowedContentTypes: [
      "audio/mpeg", "audio/mp4", "audio/wav", "audio/aac",
      "audio/x-m4a", "audio/*", "image/*",
    ],
    maximumSizeInBytes: 200 * 1024 * 1024,
    addRandomSuffix: false,
    validUntil: Date.now() + 30 * 60 * 1000,
  });

  // Return in the exact shape upload() expects from handleUploadUrl
  return NextResponse.json({ type: "blob.generate-client-token", clientToken });
}
