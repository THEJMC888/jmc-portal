import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 300; // Dolby.io processing needs up to 5 min (Vercel Pro required)

const ADMIN_EMAIL      = process.env.ADMIN_EMAIL ?? "rng@thejourneymencollective.com";
const STORAGE_ZONE     = process.env.BUNNY_STORAGE_ZONE!;
const STORAGE_PASSWORD = process.env.BUNNY_STORAGE_PASSWORD!;
const STORAGE_ENDPOINT = (process.env.BUNNY_STORAGE_ENDPOINT ?? "https://storage.bunnycdn.com").replace(/\/$/, "");
const CDN_URL          = (process.env.BUNNY_CDN_URL ?? "").replace(/\/$/, "");

// ─── Dolby.io Audio Enhancement ──────────────────────────────────────────────
// Sends audio through Dolby.io's Enhance API (noise reduction, EQ, compression).
// Returns the original buffer untouched if DOLBY_APP_KEY / DOLBY_APP_SECRET are
// not set, or if the job fails for any reason — never blocks a successful upload.
async function enhanceAudio(buf: ArrayBuffer, ext: string): Promise<ArrayBuffer> {
  const appKey    = process.env.DOLBY_APP_KEY;
  const appSecret = process.env.DOLBY_APP_SECRET;
  if (!appKey || !appSecret) return buf;

  try {
    const auth    = Buffer.from(`${appKey}:${appSecret}`).toString("base64");
    const headers = { Authorization: `Basic ${auth}`, "Content-Type": "application/json" };
    const jobSlug = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const inputDlb  = `dlb://in/${jobSlug}.${ext}`;
    const outputDlb = `dlb://out/${jobSlug}.${ext}`;
    const mimeType  = ext === "mp3" ? "audio/mpeg" : ext === "m4a" ? "audio/mp4" : `audio/${ext}`;

    // 1. Get presigned upload URL
    const inputRes = await fetch(
      `https://api.dolby.com/media/input?url=${encodeURIComponent(inputDlb)}`,
      { method: "POST", headers, body: "{}" },
    );
    if (!inputRes.ok) return buf;
    const { url: uploadUrl } = await inputRes.json() as { url: string };

    // 2. Upload raw audio to Dolby input storage
    const putRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": mimeType },
      body: buf,
    });
    if (!putRes.ok) return buf;

    // 3. Start enhancement job (podcast profile = best for voice/meditation)
    const enhRes = await fetch("https://api.dolby.com/media/enhance", {
      method: "POST",
      headers,
      body: JSON.stringify({ input: inputDlb, output: outputDlb, content: { type: "podcast" } }),
    });
    if (!enhRes.ok) return buf;
    const { job_id } = await enhRes.json() as { job_id: string };

    // 4. Poll until complete (max 4 min, 4-second intervals)
    const deadline = Date.now() + 240_000;
    let done = false;
    while (Date.now() < deadline) {
      await new Promise(r => setTimeout(r, 4000));
      const poll = await fetch(`https://api.dolby.com/media/enhance?job_id=${encodeURIComponent(job_id)}`, { headers });
      if (!poll.ok) break;
      const { status } = await poll.json() as { status: string };
      if (status === "Success") { done = true; break; }
      if (status === "Failed" || status === "Canceled") break;
    }
    if (!done) return buf;

    // 5. Get presigned download URL
    const outRes = await fetch(
      `https://api.dolby.com/media/output?url=${encodeURIComponent(outputDlb)}`,
      { method: "POST", headers, body: "{}" },
    );
    if (!outRes.ok) return buf;
    const { url: downloadUrl } = await outRes.json() as { url: string };

    // 6. Download enhanced audio
    const dlRes = await fetch(downloadUrl);
    if (!dlRes.ok) return buf;
    return await dlRes.arrayBuffer();
  } catch {
    return buf; // always fall back to original
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Auth: verify admin session token
  const authHeader = request.headers.get("x-supabase-token");
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
  const { data: { user } } = await supabase.auth.getUser(authHeader);
  if (user?.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!STORAGE_ZONE || !STORAGE_PASSWORD) {
    return NextResponse.json({ error: "Bunny.net not configured" }, { status: 500 });
  }

  // Parse multipart form: file + metadata
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const title = (formData.get("title") as string) || "";
  const category = (formData.get("category") as string) || "General";

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "mp3";
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const remotePath = `meditations/audio/${id}.${ext}`;
  const contentType = ext === "mp3" ? "audio/mpeg" : ext === "m4a" ? "audio/mp4" : `audio/${ext}`;

  // Enhance audio quality via Dolby.io (no-op if API keys not set)
  const rawBuffer      = await file.arrayBuffer();
  const audioBuffer    = await enhanceAudio(rawBuffer, ext);

  // Upload to Bunny.net Storage
  const uploadRes = await fetch(
    `${STORAGE_ENDPOINT}/${STORAGE_ZONE}/${remotePath}`,
    {
      method: "PUT",
      headers: {
        "AccessKey": STORAGE_PASSWORD,
        "Content-Type": contentType,
      },
      body: audioBuffer,
    }
  );

  if (!uploadRes.ok) {
    const msg = await uploadRes.text();
    return NextResponse.json({ error: `Bunny upload failed: ${msg}` }, { status: 502 });
  }

  const cdnBase = CDN_URL || `https://${STORAGE_ZONE}.b-cdn.net`;
  const audioUrl = `${cdnBase}/${remotePath}`;
  const displayTitle = title || file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").replace(/\b\w/g, c => c.toUpperCase());

  // Read + update meditations index in Bunny.net
  const indexPath = "meditations/index.json";
  const indexCdn  = `${cdnBase}/${indexPath}`;

  let meditations: object[] = [];
  const indexStorageRes = await fetch(`${STORAGE_ENDPOINT}/${STORAGE_ZONE}/${indexPath}`, {
    headers: { "AccessKey": STORAGE_PASSWORD },
  }).catch(() => null);
  if (indexStorageRes?.ok) {
    meditations = await indexStorageRes.json().catch(() => []);
  }

  meditations.push({
    id,
    title: displayTitle,
    description: "",
    category,
    audioUrl,
    createdAt: new Date().toISOString(),
  });

  await fetch(`${STORAGE_ENDPOINT}/${STORAGE_ZONE}/${indexPath}`, {
    method: "PUT",
    headers: {
      "AccessKey": STORAGE_PASSWORD,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(meditations, null, 2),
  });

  return NextResponse.json({ id, title: displayTitle, audioUrl });
}
