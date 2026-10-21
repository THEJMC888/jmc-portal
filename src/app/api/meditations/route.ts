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
  imageUrl?: string;
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
  return NextResponse.json(meditations.map(m => ({ ...m, audioUrl: `/api/meditations/${m.id}/stream` })));
}

export async function POST(request: NextRequest) {
  const admin = await getAdminUser(request);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = await request.json();
    const { id: clientId, audioUrl, imageUrl, title, description = "", category = "General" } = body;

    if (!clientId || !audioUrl || !(title as string)?.trim()) {
      return NextResponse.json({ error: "id, audioUrl, and title are required" }, { status: 400 });
    }

    const meditation: Meditation = {
      id: clientId as string,
      title: (title as string).trim(),
      description: (description as string).trim(),
      category: ((category as string).trim()) || "General",
      audioUrl: audioUrl as string,
      imageUrl: imageUrl as string | undefined,
      createdAt: new Date().toISOString(),
    };

    const existing = await getIndex();
    await setIndex([...existing, meditation]);
    return NextResponse.json(meditation, { status: 201 });
  }

  const formData = await request.formData();
  const file = formData.get("audio") as File | null;
  const imageFile = formData.get("image") as File | null;
  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() ?? "";
  const category = (formData.get("category") as string)?.trim() ?? "General";

  if (!file || !title) {
    return NextResponse.json({ error: "audio and title are required" }, { status: 400 });
  }

  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const ext = file.name.split(".").pop() ?? "mp3";

  const blob = await put(`jmc-meditations/audio/${id}.${ext}`, file, {
    access: "public",
  });

  let imageUrl: string | undefined;
  if (imageFile && imageFile.size > 0) {
    const imgExt = imageFile.name.split(".").pop() ?? "jpg";
    const imgBlob = await put(`jmc-meditations/images/${id}.${imgExt}`, imageFile, {
      access: "public",
    });
    imageUrl = imgBlob.url;
  }

  const meditation: Meditation = {
    id,
    title,
    description,
    category,
    audioUrl: blob.url,
    imageUrl,
    createdAt: new Date().toISOString(),
  };

  const existing = await getIndex();
  await setIndex([...existing, meditation]);

  return NextResponse.json(meditation, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const admin = await getAdminUser(request);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const formData = await request.formData();
  const id = (formData.get("id") as string)?.trim();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const existing = await getIndex();
  const idx = existing.findIndex(m => m.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const current = existing[idx];
  const title = ((formData.get("title") as string)?.trim()) || current.title;
  const description = (formData.get("description") as string)?.trim() ?? current.description;
  const category = (formData.get("category") as string)?.trim() || current.category;
  const imageFile = formData.get("image") as File | null;

  let imageUrl = current.imageUrl;
  if (imageFile && imageFile.size > 0) {
    if (current.imageUrl) {
      try { await del(current.imageUrl); } catch { /* already gone */ }
    }
    const imgExt = imageFile.name.split(".").pop() ?? "jpg";
    const imgBlob = await put(`jmc-meditations/images/${id}.${imgExt}`, imageFile, {
      access: "public",
    });
    imageUrl = imgBlob.url;
  }

  const updated: Meditation = { ...current, title, description, category, imageUrl };
  const next = [...existing];
  next[idx] = updated;
  await setIndex(next);

  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest) {
  const admin = await getAdminUser(request);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const existing = await getIndex();
  const target = existing.find(m => m.id === id);
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try { await del(target.audioUrl); } catch { /* already gone */ }
  if (target.imageUrl) {
    try { await del(target.imageUrl); } catch { /* already gone */ }
  }

  await setIndex(existing.filter(m => m.id !== id));
  return NextResponse.json({ ok: true });
}
