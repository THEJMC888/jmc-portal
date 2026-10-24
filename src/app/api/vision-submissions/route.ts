import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 60;

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "rng@thejourneymencollective.com";
const STORAGE_ZONE     = process.env.BUNNY_STORAGE_ZONE!;
const STORAGE_PASSWORD = process.env.BUNNY_STORAGE_PASSWORD!;
const STORAGE_ENDPOINT = (process.env.BUNNY_STORAGE_ENDPOINT ?? "https://storage.bunnycdn.com").replace(/\/$/, "");

export interface VisionSubmission {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  visionId: string;
  visionTitle: string;
  status: "pending" | "approved" | "needs_revision";
  feedback?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  slideCount: number;
}

async function getIndex(): Promise<VisionSubmission[]> {
  try {
    const res = await fetch(
      `${STORAGE_ENDPOINT}/${STORAGE_ZONE}/visions/submissions/index.json`,
      { headers: { "AccessKey": STORAGE_PASSWORD }, cache: "no-store" },
    );
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function setIndex(submissions: VisionSubmission[]): Promise<void> {
  await fetch(
    `${STORAGE_ENDPOINT}/${STORAGE_ZONE}/visions/submissions/index.json`,
    {
      method: "PUT",
      headers: { "AccessKey": STORAGE_PASSWORD, "Content-Type": "application/json" },
      body: JSON.stringify(submissions, null, 2),
    },
  );
}

async function storeVisionData(id: string, data: unknown): Promise<void> {
  await fetch(
    `${STORAGE_ENDPOINT}/${STORAGE_ZONE}/visions/submissions/${id}/data.json`,
    {
      method: "PUT",
      headers: { "AccessKey": STORAGE_PASSWORD, "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
  );
}

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

// GET — admin: all submissions; member: own submissions
export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const submissions = await getIndex();
  const isAdmin = user.email === ADMIN_EMAIL;

  if (isAdmin) return NextResponse.json(submissions);
  return NextResponse.json(submissions.filter(s => s.userId === user.id));
}

// POST — member submits vision for review
export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { visionId: string; visionTitle: string; visionData: unknown; slideCount: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { visionId, visionTitle, visionData, slideCount } = body;
  if (!visionId || !visionTitle || !visionData) {
    return NextResponse.json({ error: "visionId, visionTitle, and visionData are required" }, { status: 400 });
  }

  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const submission: VisionSubmission = {
    id,
    userId: user.id,
    userEmail: user.email ?? "",
    userName: user.user_metadata?.full_name ?? user.email ?? "Member",
    visionId: visionId as string,
    visionTitle: (visionTitle as string).trim(),
    status: "pending",
    submittedAt: new Date().toISOString(),
    slideCount: (slideCount as number) ?? 0,
  };

  // Store full vision data separately
  await storeVisionData(id, visionData);

  // Update index
  const existing = await getIndex();
  // Replace any existing pending submission from same user for same vision
  const filtered = existing.filter(
    s => !(s.userId === user.id && s.visionId === visionId && s.status === "pending"),
  );
  await setIndex([...filtered, submission]);

  return NextResponse.json(submission, { status: 201 });
}

// PATCH — admin updates status and/or feedback
export async function PATCH(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, status, feedback } = await request.json();
  if (!id || !status) {
    return NextResponse.json({ error: "id and status are required" }, { status: 400 });
  }
  if (!["pending", "approved", "needs_revision"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const existing = await getIndex();
  const idx = existing.findIndex(s => s.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated: VisionSubmission = {
    ...existing[idx],
    status,
    feedback: feedback ?? existing[idx].feedback,
    reviewedAt: new Date().toISOString(),
    reviewedBy: user.email ?? undefined,
  };
  const next = [...existing];
  next[idx] = updated;
  await setIndex(next);

  return NextResponse.json(updated);
}

// GET ?data=id — fetch full vision data for a submission (admin only)
export async function PUT(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const res = await fetch(
    `${STORAGE_ENDPOINT}/${STORAGE_ZONE}/visions/submissions/${id}/data.json`,
    { headers: { "AccessKey": STORAGE_PASSWORD }, cache: "no-store" },
  );
  if (!res.ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const data = await res.json();
  return NextResponse.json(data);
}
