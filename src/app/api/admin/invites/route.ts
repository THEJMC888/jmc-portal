import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "rng@thejourneymencollective.com";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

async function getAdminUser(request: NextRequest) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
  const { data: { user } } = await supabase.auth.getUser(token);
  return user?.email === ADMIN_EMAIL ? user : null;
}

// GET /api/admin/invites — admin: list every member and whether they've accepted
export async function GET(request: NextRequest) {
  if (!await getAdminUser(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await serviceClient().auth.admin.listUsers({ perPage: 1000 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const members = data.users
    .map((u) => ({
      id: u.id,
      email: u.email ?? "",
      invited_at: u.invited_at ?? null,
      last_sign_in_at: u.last_sign_in_at ?? null,
      created_at: u.created_at,
      status: u.last_sign_in_at ? "active" : "pending",
    }))
    .sort((a, b) => (b.invited_at ?? b.created_at).localeCompare(a.invited_at ?? a.created_at));

  return NextResponse.json(members);
}

// POST /api/admin/invites — admin: send (or resend) an invite email
export async function POST(request: NextRequest) {
  if (!await getAdminUser(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { email } = await request.json();
  const address = String(email ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(address)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });

  // Invite links land on the choose-a-password screen, which handles type=invite
  const { error } = await serviceClient().auth.admin.inviteUserByEmail(address, {
    redirectTo: `${request.nextUrl.origin}/auth/reset-password`,
  });
  if (error) {
    const msg = /already been registered/i.test(error.message)
      ? "This person already has an active account."
      : /sending|smtp|rate limit/i.test(error.message)
        ? `${error.message}. Check the SMTP settings in Supabase (the built-in sender only allows a few emails an hour).`
        : error.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/invites — admin: withdraw an invite that hasn't been accepted yet
export async function DELETE(request: NextRequest) {
  if (!await getAdminUser(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await request.json();
  const db = serviceClient();

  const { data, error: getErr } = await db.auth.admin.getUserById(id);
  if (getErr || !data.user) return NextResponse.json({ error: "Member not found." }, { status: 404 });
  // Never delete someone who has signed in — they may have journal entries and sessions
  if (data.user.last_sign_in_at || data.user.email === ADMIN_EMAIL) {
    return NextResponse.json({ error: "Only pending invites can be withdrawn." }, { status: 400 });
  }

  const { error } = await db.auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
