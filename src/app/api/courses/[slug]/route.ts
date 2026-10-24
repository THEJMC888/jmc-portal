import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

// GET /api/courses/[slug] — course detail + videos, with access check
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = serviceClient();

  const { data: course, error: courseErr } = await db
    .from("courses")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (courseErr || !course) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Check access
  let hasAccess = !course.requires_access;
  if (!hasAccess) {
    const { data: access } = await db
      .from("user_course_access")
      .select("expires_at")
      .eq("user_id", user.id)
      .eq("course_id", course.id)
      .single();

    if (access) {
      hasAccess = !access.expires_at || new Date(access.expires_at) > new Date();
    }
  }

  // Always return course metadata; only return videos if access is granted
  if (!hasAccess) {
    return NextResponse.json({ course: { ...course, hasAccess: false }, videos: [] });
  }

  const { data: videos } = await db
    .from("course_videos")
    .select("*")
    .eq("course_id", course.id)
    .eq("is_published", true)
    .order("order_index");

  return NextResponse.json({ course: { ...course, hasAccess: true }, videos: videos ?? [] });
}
