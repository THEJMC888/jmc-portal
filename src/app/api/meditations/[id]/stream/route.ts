import { NextRequest, NextResponse } from "next/server";
import { head, list } from "@vercel/blob";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

async function getAuthUser(request: NextRequest) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (token) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    );
    const { data: { user } } = await supabase.auth.getUser(token);
    if (user) return user;
  }
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: () => {},
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user ?? null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) return new Response(null, { status: 401 });

  const { id } = await params;
  if (!id || !/^[\w-]+$/.test(id)) {
    return new Response(null, { status: 400 });
  }

  const { blobs } = await list({ prefix: `jmc-meditations/audio/${id}` });
  if (!blobs.length) return new Response(null, { status: 404 });

  const blobInfo = await head(blobs[0].url);
  // Redirect to the signed download URL; the browser <audio> element follows the redirect
  // and the CDN handles range requests for seeking.
  return NextResponse.redirect(blobInfo.downloadUrl, { status: 302 });
}
