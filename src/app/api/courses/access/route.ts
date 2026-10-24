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

// GET /api/courses/access?course_id=... — admin: list all members with access to a course
export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const courseId = request.nextUrl.searchParams.get("course_id");
  const db = serviceClient();

  const query = db
    .from("user_course_access")
    .select("*, auth_users:user_id(email)")
    .order("granted_at", { ascending: false });

  if (courseId) query.eq("course_id", courseId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/courses/access — admin: grant access to a user
export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { user_email, course_id, expires_at } = await request.json();
  const db = serviceClient();

  // Resolve email → user id
  const { data: profile, error: profileErr } = await db
    .from("auth.users")
    .select("id")
    .eq("email", user_email)
    .single();

  // auth.users isn't directly queryable via RLS — use admin API
  const { data: { users }, error: adminErr } = await db.auth.admin.listUsers();
  if (adminErr) return NextResponse.json({ error: adminErr.message }, { status: 500 });

  const target = users.find((u) => u.email === user_email);
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  void profile; void profileErr; // unused after switching to admin API

  const { data, error } = await db
    .from("user_course_access")
    .upsert({
      user_id: target.id,
      course_id,
      granted_by: user.id,
      expires_at: expires_at ?? null,
    }, { onConflict: "user_id,course_id" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/courses/access — admin: revoke access
export async function DELETE(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { user_id, course_id } = await request.json();
  const db = serviceClient();

  const { error } = await db
    .from("user_course_access")
    .delete()
    .eq("user_id", user_id)
    .eq("course_id", course_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
