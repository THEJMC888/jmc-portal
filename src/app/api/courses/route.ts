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

// GET /api/courses — list published courses with access status for current user
export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = serviceClient();

  const { data: courses, error } = await db
    .from("courses")
    .select("*")
    .eq("is_published", true)
    .order("order_index");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fetch this user's access grants in one query
  const courseIds = courses.map((c: { id: string }) => c.id);
  const { data: accessRows } = await db
    .from("user_course_access")
    .select("course_id, expires_at")
    .eq("user_id", user.id)
    .in("course_id", courseIds);

  const now = new Date();
  const grantedSet = new Set(
    (accessRows ?? [])
      .filter((a: { expires_at: string | null }) => !a.expires_at || new Date(a.expires_at) > now)
      .map((a: { course_id: string }) => a.course_id)
  );

  const result = courses.map((c: Record<string, unknown>) => ({
    ...c,
    hasAccess: !c.requires_access || grantedSet.has(c.id as string),
  }));

  return NextResponse.json(result);
}

// POST /api/courses — admin: create a course
export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const db = serviceClient();

  const { data, error } = await db
    .from("courses")
    .insert(body)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// PATCH /api/courses — admin: update a course
export async function PATCH(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, ...updates } = await request.json();
  const db = serviceClient();

  const { data, error } = await db
    .from("courses")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
