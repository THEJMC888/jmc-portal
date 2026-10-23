import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import ffmpegPath from "ffmpeg-static";
import { execFile } from "child_process";
import { promisify } from "util";
import { writeFile, readFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

export const maxDuration = 300;

const ADMIN_EMAIL      = process.env.ADMIN_EMAIL ?? "rng@thejourneymencollective.com";
const STORAGE_ZONE     = process.env.BUNNY_STORAGE_ZONE!;
const STORAGE_PASSWORD = process.env.BUNNY_STORAGE_PASSWORD!;
const STORAGE_ENDPOINT = (process.env.BUNNY_STORAGE_ENDPOINT ?? "https://storage.bunnycdn.com").replace(/\/$/, "");
const CDN_URL          = (process.env.BUNNY_CDN_URL ?? "").replace(/\/$/, "");

const execFileAsync = promisify(execFile);

async function enhanceAudio(
  buf: ArrayBuffer,
  inputExt: string,
): Promise<{ buffer: ArrayBuffer; ext: string }> {
  if (!ffmpegPath) return { buffer: buf, ext: inputExt };

  const id     = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const tmpIn  = join(tmpdir(), `med-in-${id}.${inputExt}`);
  const tmpOut = join(tmpdir(), `med-out-${id}.mp3`);

  try {
    await writeFile(tmpIn, Buffer.from(buf));

    await execFileAsync(ffmpegPath, [
      "-i", tmpIn,
      "-af", [
        "highpass=f=80",
        "lowpass=f=16000",
        "equalizer=f=8000:width_type=o:width=2:g=-3",
        "acompressor=threshold=0.089:ratio=4:attack=5:release=50:makeup=2",
        "loudnorm=I=-16:LRA=11:TP=-1.5",
      ].join(","),
      "-ar", "44100",
      "-ab", "192k",
      "-y",
      tmpOut,
    ]);

    const enhanced = await readFile(tmpOut);
    const ab = enhanced.buffer.slice(
      enhanced.byteOffset,
      enhanced.byteOffset + enhanced.byteLength,
    ) as ArrayBuffer;
    return { buffer: ab, ext: "mp3" };
  } catch {
    return { buffer: buf, ext: inputExt };
  } finally {
    await Promise.allSettled([unlink(tmpIn), unlink(tmpOut)]);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const authHeader = request.headers.get("x-supabase-token");
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
  const { data: { user } } = await supabase.auth.getUser(authHeader);
  if (user?.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!STORAGE_ZONE || !STORAGE_PASSWORD) {
    return NextResponse.json({ error: "Bunny.net not configured" }, { status: 500 });
  }

  const formData = await request.formData();
  const file     = formData.get("file") as File | null;
  const title    = (formData.get("title") as string) || "";
  const category = (formData.get("category") as string) || "General";

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const inputExt = file.name.split(".").pop()?.toLowerCase() ?? "mp3";
  const id       = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const rawBuffer              = await file.arrayBuffer();
  const { buffer: audioBuffer, ext } = await enhanceAudio(rawBuffer, inputExt);

  const remotePath  = `meditations/audio/${id}.${ext}`;
  const contentType = ext === "mp3" ? "audio/mpeg" : ext === "m4a" ? "audio/mp4" : `audio/${ext}`;

  // Upload to Bunny.net Storage
  const uploadRes = await fetch(
    `${STORAGE_ENDPOINT}/${STORAGE_ZONE}/${remotePath}`,
    {
      method: "PUT",
      headers: { "AccessKey": STORAGE_PASSWORD, "Content-Type": contentType },
      body: audioBuffer,
    }
  );

  if (!uploadRes.ok) {
    const msg = await uploadRes.text();
    return NextResponse.json({ error: `Bunny upload failed: ${msg}` }, { status: 502 });
  }

  const cdnBase      = CDN_URL || `https://${STORAGE_ZONE}.b-cdn.net`;
  const audioUrl     = `${cdnBase}/${remotePath}`;
  const displayTitle = title || file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").replace(/\b\w/g, c => c.toUpperCase());

  const indexPath = "meditations/index.json";
  let meditations: object[] = [];
  const indexRes = await fetch(`${STORAGE_ENDPOINT}/${STORAGE_ZONE}/${indexPath}`, {
    headers: { "AccessKey": STORAGE_PASSWORD },
  }).catch(() => null);
  if (indexRes?.ok) {
    meditations = await indexRes.json().catch(() => []);
  }

  meditations.push({
    id,
    title: displayTitle,
    description: "",
    category,
    audioUrl,
    createdAt: new Date().toISOString(),
  });

  await fetch(`${STORAGE_ENDPOINT}/${STORAGE_ZONE}/${indexPath}`, {
    method: "PUT",
    headers: { "AccessKey": STORAGE_PASSWORD, "Content-Type": "application/json" },
    body: JSON.stringify(meditations, null, 2),
  });

  return NextResponse.json({ id, title: displayTitle, audioUrl });
}
