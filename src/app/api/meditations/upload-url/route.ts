import { NextRequest, NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { createClient } from "@supabase/supabase-js";

// Edge runtime eliminates serverless cold-start (was 2-3 s).
// Vercel Blob calls this endpoint after storing the file and waits for
// a 200 before returning the PUT response to the browser. With serverless
// the cold-start caused that wait to hang indefinitely. Edge starts in ms.
export const runtime = "edge";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "rng@thejourneymencollective.com";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  const jsonResponse = await handleUpload({
    body,
    request,
    onBeforeGenerateToken: async (_pathname, clientPayload) => {
      if (!clientPayload) throw new Error("Unauthorized");
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
      );
      const { data: { user } } = await supabase.auth.getUser(clientPayload);
      if (user?.email !== ADMIN_EMAIL) throw new Error("Forbidden");
      return {
        allowedContentTypes: [
          "audio/mpeg", "audio/mp4", "audio/wav", "audio/aac",
          "audio/x-m4a", "audio/*", "image/*",
        ],
        maximumSizeInBytes: 200 * 1024 * 1024,
        addRandomSuffix: false,
      };
    },
    onUploadCompleted: async () => {},
  });

  return NextResponse.json(jsonResponse);
}
