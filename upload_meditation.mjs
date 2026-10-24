// upload_meditation.mjs — upload one meditation file to Vercel Blob + update index
// Usage: node upload_meditation.mjs <filepath> "<title>" "<category>"
// Reads BLOB_READ_WRITE_TOKEN from /Users/robertgrover/Illuminate App/.env.local

import { readFileSync, statSync } from "fs";
import { basename } from "path";
import { put, list, del } from "@vercel/blob";

// ── Load token from .env.local ──────────────────────────────────────────────
const envPath = "/Users/robertgrover/Illuminate App/.env.local".replace(/\/\.claude\/worktrees\/[^/]+/, "") || "/Users/robertgrover/Illuminate App/.env.local";
const envLines = readFileSync(envPath, "utf8").split("\n");
const tokenLine = envLines.find(l => l.startsWith("BLOB_READ_WRITE_TOKEN="));
if (!tokenLine) { console.error("BLOB_READ_WRITE_TOKEN not found in .env.local"); process.exit(1); }
const token = tokenLine.split("=").slice(1).join("=").trim().replace(/^["']|["']$/g, "");

// ── Args ────────────────────────────────────────────────────────────────────
const [,, filePath, title = "", category = "General"] = process.argv;
if (!filePath) {
  console.error("Usage: node upload_meditation.mjs <filepath> [\"title\"] [\"category\"]");
  process.exit(1);
}

const fileSize = statSync(filePath).size;
const fileName = basename(filePath);
const ext = fileName.split(".").pop().toLowerCase();
const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const pathname = `jmc-meditations/audio/${id}.${ext}`;
const displayTitle = title || fileName.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").replace(/\b\w/g, c => c.toUpperCase());

console.log(`\nUploading: ${fileName}`);
console.log(`  Size:     ${(fileSize / 1024 / 1024).toFixed(1)} MB`);
console.log(`  Title:    ${displayTitle}`);
console.log(`  Category: ${category}`);
console.log(`  Path:     ${pathname}`);
console.log("\nSending to Vercel Blob...");

const start = Date.now();
const progressInterval = setInterval(() => {
  process.stdout.write(`\r  Elapsed: ${((Date.now() - start) / 1000).toFixed(0)}s`);
}, 500);

try {
  const fileData = readFileSync(filePath);
  const contentType = ext === "mp3" ? "audio/mpeg" : ext === "m4a" ? "audio/mp4" : `audio/${ext}`;

  const audioBlob = await put(pathname, fileData, {
    access: "public",
    token,
    addRandomSuffix: false,
    contentType,
  });

  clearInterval(progressInterval);
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n\n✓ Upload complete in ${elapsed}s`);
  console.log(`  URL: ${audioBlob.url}`);

  // ── Update meditations index directly via Vercel Blob ──────────────────
  console.log("\nUpdating meditations index...");
  const INDEX_PREFIX = "jmc-meditations/index";

  const { blobs: indexBlobs } = await list({ prefix: INDEX_PREFIX, token });
  let meditations = [];
  if (indexBlobs.length) {
    const res = await fetch(indexBlobs[0].url, { cache: "no-store" });
    meditations = await res.json();
  }

  const newEntry = {
    id,
    title: displayTitle,
    description: "",
    category,
    audioUrl: audioBlob.url,
    createdAt: new Date().toISOString(),
  };
  meditations.push(newEntry);

  // Delete old index blobs before writing new one
  if (indexBlobs.length) {
    await del(indexBlobs.map(b => b.url), { token });
  }

  await put(`${INDEX_PREFIX}.json`, JSON.stringify(meditations), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    token,
  });

  console.log(`✓ Index updated — ${meditations.length} meditation(s) total`);
  console.log(`\n🎉 Live at: https://jmc-portal.vercel.app/meditations`);
  console.log(`   Entry ID: ${id}`);

} catch (err) {
  clearInterval(progressInterval);
  console.error(`\n✗ Error: ${err.message}`);
  process.exit(1);
}
