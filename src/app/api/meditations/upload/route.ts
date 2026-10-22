import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAIL      = process.env.ADMIN_EMAIL ?? "rng@thejourneymencollective.com";
const STORAGE_ZONE     = process.env.BUNNY_STORAGE_ZONE!;
const STORAGE_PASSWORD = process.env.BUNNY_STORAGE_PASSWORD!;
const STORAGE_ENDPOINT = (process.env.BUNNY_STORAGE_ENDPOINT ?? "https://storage.bunnycdn.com").replace(/\/$/, "");
const CDN_URL          = (process.env.BUNNY_CDN_URL ?? "").replace(/\/$/, "");

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

  // Upload to Bunny.net Storage
  const uploadRes = await fetch(
    `${STORAGE_ENDPOINT}/${STORAGE_ZONE}/${remotePath}`,
    {
      method: "PUT",
      headers: {
        "AccessKey": STORAGE_PASSWORD,
        "Content-Type": contentType,
      },
      body: await file.arrayBuffer(),
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
