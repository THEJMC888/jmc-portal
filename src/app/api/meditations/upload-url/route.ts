import { NextRequest, NextResponse } from "next/server";
import { generateClientTokenFromReadWriteToken } from "@vercel/blob/client";
import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "rng@thejourneymencollective.com";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { pathname, clientPayload } = await request.json() as { pathname: string; clientPayload: string };

  if (!clientPayload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
  const { data: { user } } = await supabase.auth.getUser(clientPayload);
  if (user?.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rwToken = process.env.BLOB_READ_WRITE_TOKEN ?? "";
  const clientToken = await generateClientTokenFromReadWriteToken({
    pathname,
    allowedContentTypes: [
      "audio/mpeg", "audio/mp4", "audio/wav", "audio/aac",
      "audio/x-m4a", "audio/*", "image/*",
    ],
    maximumSizeInBytes: 200 * 1024 * 1024,
    addRandomSuffix: false,
    token: rwToken,
  });

  // storeId is the 4th underscore-delimited segment of the read-write token
  // (format: vercel_blob_rw_{storeId}) — needed as x-vercel-blob-store-id header
  const storeId = rwToken.split("_")[3] ?? "";

  return NextResponse.json({ clientToken, storeId });
}
