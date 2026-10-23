import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "rng@thejourneymencollective.com";

const STORAGE_ZONE     = process.env.BUNNY_STORAGE_ZONE!;
const STORAGE_PASSWORD = process.env.BUNNY_STORAGE_PASSWORD!;
const STORAGE_ENDPOINT = (process.env.BUNNY_STORAGE_ENDPOINT ?? "https://storage.bunnycdn.com").replace(/\/$/, "");
const CDN_URL          = (process.env.BUNNY_CDN_URL ?? "").replace(/\/$/, "");

function cdnBase() {
  return CDN_URL || `https://${STORAGE_ZONE}.b-cdn.net`;
}

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
    const res = await fetch(
      `${STORAGE_ENDPOINT}/${STORAGE_ZONE}/meditations/index.json`,
      { headers: { "AccessKey": STORAGE_PASSWORD }, cache: "no-store" },
    );
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function setIndex(meditations: Meditation[]): Promise<void> {
  await fetch(
    `${STORAGE_ENDPOINT}/${STORAGE_ZONE}/meditations/index.json`,
    {
      method: "PUT",
      headers: {
        "AccessKey": STORAGE_PASSWORD,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(meditations, null, 2),
    }
  );
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
  return NextResponse.json(meditations);
}

// POST: register a completed upload (browser already PUT the file to Bunny.net directly)
export async function POST(request: NextRequest) {
  const admin = await getAdminUser(request);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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
    const imgExt = imageFile.name.split(".").pop() ?? "jpg";
    const imgPath = `meditations/images/${id}.${imgExt}`;
    const imgRes = await fetch(
      `${STORAGE_ENDPOINT}/${STORAGE_ZONE}/${imgPath}`,
      {
        method: "PUT",
        headers: {
          "AccessKey": STORAGE_PASSWORD,
          "Content-Type": imageFile.type || "image/jpeg",
        },
        body: await imageFile.arrayBuffer(),
      }
    );
    if (imgRes.ok) imageUrl = `${cdnBase()}/${imgPath}`;
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

  // Best-effort delete from Bunny.net storage
  const extractPath = (url: string) => url.replace(cdnBase() + "/", "");
  const deletePath = async (path: string) => {
    await fetch(`${STORAGE_ENDPOINT}/${STORAGE_ZONE}/${path}`, {
      method: "DELETE",
      headers: { "AccessKey": STORAGE_PASSWORD },
    }).catch(() => {});
  };

  await deletePath(extractPath(target.audioUrl));
  if (target.imageUrl) await deletePath(extractPath(target.imageUrl));

  await setIndex(existing.filter(m => m.id !== id));
  return NextResponse.json({ ok: true });
}
