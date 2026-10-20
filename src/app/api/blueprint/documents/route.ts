import { NextRequest, NextResponse } from "next/server";
import { put, list, del } from "@vercel/blob";
import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "rng@thejourneymencollective.com";
const INDEX_PREFIX = "jmc-blueprint/docs-index";

interface BlueprintDoc {
  id: string;
  label: string;
  filename: string;
  url: string;
  uploadedAt: string;
}

async function getIndex(): Promise<BlueprintDoc[]> {
  try {
    const { blobs } = await list({ prefix: INDEX_PREFIX });
    if (!blobs.length) return [];
    const res = await fetch(blobs[0].url, { cache: "no-store" });
    return res.json();
  } catch { return []; }
}

async function setIndex(docs: BlueprintDoc[]): Promise<void> {
  const { blobs } = await list({ prefix: INDEX_PREFIX });
  if (blobs.length) await del(blobs.map(b => b.url));
  await put(`${INDEX_PREFIX}.json`, JSON.stringify(docs), {
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
  const docs = await getIndex();
  // Return proxy URLs instead of direct blob URLs
  return NextResponse.json(docs.map(d => ({ ...d, url: `/api/blueprint/documents/${d.id}/download` })));
}

export async function POST(request: NextRequest) {
  const admin = await getAdminUser(request);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const label = (formData.get("label") as string)?.trim();

  if (!file || !label) {
    return NextResponse.json({ error: "file and label are required" }, { status: 400 });
  }
  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Only PDF files are accepted" }, { status: 400 });
  }

  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const blob = await put(`jmc-blueprint/docs/${id}.pdf`, file, { access: "private" });

  const doc: BlueprintDoc = {
    id,
    label,
    filename: file.name,
    url: blob.url,
    uploadedAt: new Date().toISOString(),
  };

  const existing = await getIndex();
  // Replace any existing doc with the same label
  await setIndex([...existing.filter(d => d.label !== label), doc]);

  return NextResponse.json(doc, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const admin = await getAdminUser(request);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await request.json() as { id: string };
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const existing = await getIndex();
  const target = existing.find(d => d.id === id);
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try { await del(target.url); } catch { /* already gone */ }
  await setIndex(existing.filter(d => d.id !== id));

  return NextResponse.json({ ok: true });
}
