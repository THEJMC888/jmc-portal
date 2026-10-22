import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAIL      = process.env.ADMIN_EMAIL ?? "rng@thejourneymencollective.com";
const STORAGE_ZONE     = process.env.BUNNY_STORAGE_ZONE!;
const STORAGE_PASSWORD = process.env.BUNNY_STORAGE_PASSWORD!;
const STORAGE_ENDPOINT = (process.env.BUNNY_STORAGE_ENDPOINT ?? "https://storage.bunnycdn.com").replace(/\/$/, "");
const CDN_URL          = (process.env.BUNNY_CDN_URL ?? "").replace(/\/$/, "");

function cdnBase() {
  return CDN_URL || `https://${STORAGE_ZONE}.b-cdn.net`;
}

export async function POST(request: NextRequest) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
  const { data: { user } } = await supabase.auth.getUser(token);
  if (user?.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Read current index
  const indexRes = await fetch(
    `${STORAGE_ENDPOINT}/${STORAGE_ZONE}/meditations/index.json`,
    { headers: { AccessKey: STORAGE_PASSWORD } },
  ).catch(() => null);

  const meditations: { audioUrl?: string; imageUrl?: string }[] =
    indexRes?.ok ? await indexRes.json().catch(() => []) : [];

  // Delete every audio + image file from Bunny.net (best-effort, don't block on failures)
  const extractPath = (url: string) => url.replace(cdnBase() + "/", "");
  await Promise.allSettled(
    meditations.flatMap(m => {
      const tasks = [
        fetch(`${STORAGE_ENDPOINT}/${STORAGE_ZONE}/${extractPath(m.audioUrl ?? "")}`, {
          method: "DELETE",
          headers: { AccessKey: STORAGE_PASSWORD },
        }),
      ];
      if (m.imageUrl) {
        tasks.push(
          fetch(`${STORAGE_ENDPOINT}/${STORAGE_ZONE}/${extractPath(m.imageUrl)}`, {
            method: "DELETE",
            headers: { AccessKey: STORAGE_PASSWORD },
          }),
        );
      }
      return tasks;
    }),
  );

  // Reset index to empty
  await fetch(`${STORAGE_ENDPOINT}/${STORAGE_ZONE}/meditations/index.json`, {
    method: "PUT",
    headers: { AccessKey: STORAGE_PASSWORD, "Content-Type": "application/json" },
    body: "[]",
  });

  return NextResponse.json({ ok: true, cleared: meditations.length });
}
