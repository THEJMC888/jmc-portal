import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "rng@thejourneymencollective.com";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
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

// POST /api/courses/videos — admin: add an episode to a course
export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { course_id, bunny_video_id, title, description, duration_seconds, order_index } =
    await request.json();

  if (!course_id || !bunny_video_id || !title) {
    return NextResponse.json({ error: "course_id, bunny_video_id, and title are required" }, { status: 400 });
  }

  const db = serviceClient();

  // Auto-calculate order_index if not provided
  let idx = order_index;
  if (idx == null) {
    const { data: last } = await db
      .from("course_videos")
      .select("order_index")
      .eq("course_id", course_id)
      .order("order_index", { ascending: false })
      .limit(1)
      .single();
    idx = last ? last.order_index + 1 : 0;
  }

  const { data, error } = await db
    .from("course_videos")
    .insert({
      course_id,
      bunny_video_id: bunny_video_id.trim(),
      title: title.trim(),
      description: description?.trim() ?? null,
      duration_seconds: duration_seconds ?? 0,
      order_index: idx,
      is_published: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// PATCH /api/courses/videos — admin: update an episode
export async function PATCH(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, ...updates } = await request.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const allowed = ["title", "description", "duration_seconds", "order_index", "is_published", "bunny_video_id"];
  const patch = Object.fromEntries(
    Object.entries(updates).filter(([k]) => allowed.includes(k))
  );

  const db = serviceClient();
  const { data, error } = await db
    .from("course_videos")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/courses/videos — admin: remove an episode
export async function DELETE(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const db = serviceClient();
  const { error } = await db.from("course_videos").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
