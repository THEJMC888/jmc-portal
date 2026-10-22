// upload_to_bunny.mjs — upload meditation files to Bunny.net Storage + update index
// Usage: node upload_to_bunny.mjs <filepath> "<title>" "<category>"
// Set env vars: BUNNY_STORAGE_ZONE, BUNNY_STORAGE_PASSWORD, BUNNY_CDN_URL
// Or add them to /Users/robertgrover/Illuminate App/.env.local

import { readFileSync, statSync } from "fs";
import { basename } from "path";
import { createReadStream } from "fs";

// ── Load env from .env.local ──────────────────────────────────────────────────
const envPath = "/Users/robertgrover/Illuminate App/.env.local";
try {
  const envLines = readFileSync(envPath, "utf8").split("\n");
  for (const line of envLines) {
    const [key, ...rest] = line.split("=");
    if (key && rest.length && !process.env[key.trim()]) {
      process.env[key.trim()] = rest.join("=").trim().replace(/^["']|["']$/g, "");
    }
  }
} catch {}

const STORAGE_ZONE     = process.env.BUNNY_STORAGE_ZONE;
const STORAGE_PASSWORD = process.env.BUNNY_STORAGE_PASSWORD;
const CDN_URL          = (process.env.BUNNY_CDN_URL || "").replace(/\/$/, "");

if (!STORAGE_ZONE || !STORAGE_PASSWORD) {
  console.error("Missing BUNNY_STORAGE_ZONE or BUNNY_STORAGE_PASSWORD in .env.local");
  process.exit(1);
}

// ── Args ─────────────────────────────────────────────────────────────────────
const [,, filePath, title = "", category = "General"] = process.argv;
if (!filePath) {
  console.error("Usage: node upload_to_bunny.mjs <filepath> [\"title\"] [\"category\"]");
  process.exit(1);
}

const fileSize = statSync(filePath).size;
const fileName = basename(filePath);
const ext = fileName.split(".").pop().toLowerCase();
const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const remotePath = `meditations/audio/${id}.${ext}`;
const displayTitle = title || fileName.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").replace(/\b\w/g, c => c.toUpperCase());
const contentType = ext === "mp3" ? "audio/mpeg" : ext === "m4a" ? "audio/mp4" : `audio/${ext}`;

console.log(`\nUploading: ${fileName}`);
console.log(`  Size:     ${(fileSize / 1024 / 1024).toFixed(1)} MB`);
console.log(`  Title:    ${displayTitle}`);
console.log(`  Category: ${category}`);
console.log(`  Remote:   ${remotePath}`);
console.log("\nSending to Bunny.net...");

const start = Date.now();
const tick = setInterval(() => process.stdout.write(`\r  Elapsed: ${((Date.now()-start)/1000).toFixed(0)}s`), 500);

// ── Upload audio file ─────────────────────────────────────────────────────────
const uploadUrl = `https://storage.bunnycdn.com/${STORAGE_ZONE}/${remotePath}`;
const fileBuffer = readFileSync(filePath);

const uploadRes = await fetch(uploadUrl, {
  method: "PUT",
  headers: {
    "AccessKey": STORAGE_PASSWORD,
    "Content-Type": contentType,
    "Content-Length": String(fileSize),
  },
  body: fileBuffer,
});

clearInterval(tick);

if (!uploadRes.ok) {
  const body = await uploadRes.text();
  console.error(`\n✗ Upload failed: HTTP ${uploadRes.status} — ${body}`);
  process.exit(1);
}

const elapsed = ((Date.now() - start) / 1000).toFixed(1);
const cdnBase = CDN_URL || `https://${STORAGE_ZONE}.b-cdn.net`;
const audioUrl = `${cdnBase}/${remotePath}`;

console.log(`\n\n✓ Upload complete in ${elapsed}s`);
console.log(`  URL: ${audioUrl}`);

// ── Update meditations index in Bunny.net ─────────────────────────────────────
const INDEX_PATH = "meditations/index.json";
const indexUrl   = `https://storage.bunnycdn.com/${STORAGE_ZONE}/${INDEX_PATH}`;
const indexCdn   = `${cdnBase}/${INDEX_PATH}`;

console.log("\nUpdating meditations index...");

let meditations = [];
const indexRes = await fetch(indexCdn, { cache: "no-store" }).catch(() => null);
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

const indexUpload = await fetch(indexUrl, {
  method: "PUT",
  headers: {
    "AccessKey": STORAGE_PASSWORD,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(meditations, null, 2),
});

if (!indexUpload.ok) {
  const body = await indexUpload.text();
  console.error(`\n✗ Index update failed: HTTP ${indexUpload.status} — ${body}`);
  process.exit(1);
}

console.log(`✓ Index updated — ${meditations.length} meditation(s) total`);
console.log(`\n  Live at: https://jmc-portal.vercel.app/meditations`);
console.log(`  Entry ID: ${id}`);
