import { NextRequest, NextResponse } from "next/server";
import { put, list, del } from "@vercel/blob";
import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "rng@thejourneymencollective.com";
const INDEX_PREFIX = "jmc-meditations/index";

export interface Meditation {
  id: string;
  title: string;
  description: string;
  category: string;
  audioUrl: string;
  createdAt: string;
}

async function getIndex(): Promise<Meditation[]> {
  try {
    const { blobs } = await list({ prefix: INDEX_PREFIX });
    if (!blobs.length) return [];
    const res = await fetch(blobs[0].url, { cache: "no-store" });
    return res.json();
  } catch {
    return [];
  }
}

async function setIndex(meditations: Meditation[]): Promise<void> {
  const { blobs } = await list({ prefix: INDEX_PREFIX });
  if (blobs.length) {
    await del(blobs.map(b => b.url));
  }
  await put(`${INDEX_PREFIX}.json`, JSON.stringify(meditations), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
  });
}

async function getAuthUser(request: NextRequest) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
  const { data: { user } } = await supabase.auth.getUser(token);
  return user ?? null;
}

async function getAdminUser(request: NextRequest) {
  const user = await getAuthUser(request);
  return user?.email === ADMIN_EMAIL ? user : null;
}

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const meditations = await getIndex();
  // Return proxy stream URLs instead of direct blob URLs
  return NextResponse.json(meditations.map(m => ({ ...m, audioUrl: `/api/meditations/${m.id}/stream` })));
}

export async function POST(request: NextRequest) {
  const admin = await getAdminUser(request);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const formData = await request.formData();
  const file = formData.get("audio") as File | null;
  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() ?? "";
  const category = (formData.get("category") as string)?.trim() ?? "General";

  if (!file || !title) {
    return NextResponse.json({ error: "audio and title are required" }, { status: 400 });
  }

  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const ext = file.name.split(".").pop() ?? "mp3";

  const blob = await put(`jmc-meditations/audio/${id}.${ext}`, file, {
    access: "private",
  });

  const meditation: Meditation = {
    id,
    title,
    description,
    category,
    audioUrl: blob.url,
    createdAt: new Date().toISOString(),
  };

  const existing = await getIndex();
  await setIndex([...existing, meditation]);

  return NextResponse.json(meditation, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const admin = await getAdminUser(request);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const existing = await getIndex();
  const target = existing.find(m => m.id === id);
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Remove audio blob
  try { await del(target.audioUrl); } catch { /* already gone */ }

  await setIndex(existing.filter(m => m.id !== id));
  return NextResponse.json({ ok: true });
}
