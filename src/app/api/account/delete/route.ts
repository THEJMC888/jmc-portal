import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// POST /api/account/delete: the signed in member erases their account and
// every record the portal holds for them (Swiss FADP / GDPR right to erasure).
// Logs never include content; there is none in plaintext to log anyway.

function serviceClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

export async function POST(request: NextRequest) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
  const { data: { user } } = await anon.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  if (body?.confirm !== "DELETE") return NextResponse.json({ error: "Confirmation missing" }, { status: 400 });

  const db = serviceClient();

  // Sealed files in the member's vault folder
  for (;;) {
    const { data: files, error } = await db.storage.from("vault").list(user.id, { limit: 1000 });
    if (error || !files?.length) break;
    await db.storage.from("vault").remove(files.map((f) => `${user.id}/${f.name}`));
    if (files.length < 1000) break;
  }

  const steps = [
    db.from("journal_entries").delete().eq("user_id", user.id),
    db.from("user_vault").delete().eq("user_id", user.id),
    db.from("user_keys").delete().eq("user_id", user.id),
    db.from("user_course_access").delete().eq("user_id", user.id),
    user.email ? db.from("coaching_sessions").delete().eq("member_email", user.email) : null,
  ];
  for (const step of steps) {
    if (!step) continue;
    const { error } = await step;
    if (error) return NextResponse.json({ error: "Some records could not be deleted. Please try again." }, { status: 500 });
  }

  const { error } = await db.auth.admin.deleteUser(user.id);
  if (error) return NextResponse.json({ error: "Your content was removed but the sign in could not be. Please contact us." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
