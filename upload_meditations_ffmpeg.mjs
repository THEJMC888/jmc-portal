#!/usr/bin/env node
// upload_meditations_ffmpeg.mjs
// Uploads all meditation MP3s through the portal API (FFmpeg-enhanced pipeline)
//
// Usage:
//   SUPABASE_TOKEN="<your access_token>" node upload_meditations_ffmpeg.mjs
//
// How to get your token:
//   1. Log in at https://jmc-portal.vercel.app
//   2. Open DevTools (Cmd+Option+I) → Application → Local Storage → jmc-portal.vercel.app
//   3. Find the key starting with "sb-fulziqtikpgvjaawvutf-auth-token"
//   4. Copy the value of "access_token" from the parsed JSON
//   5. Run: SUPABASE_TOKEN='eyJ...' node upload_meditations_ffmpeg.mjs

import { readFile, stat } from "fs/promises";
import { FormData, fetch } from "undici";

const TOKEN   = process.env.SUPABASE_TOKEN;
const API_URL = process.env.UPLOAD_API_URL ?? "https://jmc-portal.vercel.app/api/meditations/upload";
const MED_DIR = "/Users/robertgrover/Desktop/app_meds";

const FILES = [
  { file: "1_Multidimensional_Psychedelic_Journey.mp3", title: "Multidimensional Psychedelic Journey", category: "Journey"   },
  { file: "2_Galactic_Platinum_Energy_Cleanse.mp3",     title: "Galactic Platinum Energy Cleanse",    category: "Cleanse"   },
  { file: "3_Liberation_From_Grief.mp3",                title: "Liberation From Grief",               category: "Healing"   },
  { file: "Answering_The_Call.mp3",                     title: "Answering The Call",                  category: "Journey"   },
  { file: "Collective_Support.mp3",                     title: "Collective Support",                  category: "Community" },
  { file: "Deeper_Connection.mp3",                      title: "Deeper Connection",                   category: "Healing"   },
  { file: "Magnetic_Field_Cleanse_Meditation.mp3",      title: "Magnetic Field Cleanse",              category: "Cleanse"   },
  { file: "Star_Frequencies.mp3",                       title: "Star Frequencies",                    category: "Journey"   },
];

if (!TOKEN) {
  console.error("\n❌  SUPABASE_TOKEN env var is required.\n");
  console.error("    Steps:");
  console.error("    1. Log in at https://jmc-portal.vercel.app");
  console.error("    2. Open DevTools (Cmd+Option+I)");
  console.error("    3. Application → Local Storage → https://jmc-portal.vercel.app");
  console.error("    4. Find key: sb-fulziqtikpgvjaawvutf-auth-token");
  console.error("    5. Copy the access_token value from the JSON");
  console.error("\n    Then run:");
  console.error("    SUPABASE_TOKEN='eyJ...' node upload_meditations_ffmpeg.mjs\n");
  process.exit(1);
}

async function uploadFile({ file, title, category }, index, total) {
  const filePath = `${MED_DIR}/${file}`;
  const { size }  = await stat(filePath);
  const sizeMB    = (size / 1024 / 1024).toFixed(1);
  const pad       = `[${index + 1}/${total}]`;

  console.log(`\n${pad} ${title}`);
  console.log(`      File: ${file} (${sizeMB} MB)`);
  console.log(`      Uploading + running FFmpeg pipeline…`);
  console.log(`      (highpass → lowpass → EQ → compressor → loudnorm -16 LUFS)`);

  const fileBytes   = await readFile(filePath);
  const blob        = new Blob([fileBytes], { type: "audio/mpeg" });
  const form        = new FormData();
  form.set("file", blob, file);
  form.set("title", title);
  form.set("category", category);

  const start  = Date.now();
  const ticker = setInterval(() => {
    process.stdout.write(`\r      Elapsed: ${((Date.now() - start) / 1000).toFixed(0)}s…  `);
  }, 1000);

  let res, json;
  try {
    res  = await fetch(API_URL, {
      method:  "POST",
      headers: { "x-supabase-token": TOKEN },
      body:    form,
      signal:  AbortSignal.timeout(4 * 60 * 1000),
    });
    json = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
  } catch (err) {
    clearInterval(ticker);
    console.error(`\n   ✗ Network error: ${err.message}`);
    return { ok: false, title, error: err.message };
  }

  clearInterval(ticker);
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  if (res.ok) {
    console.log(`\n   ✓ Done in ${elapsed}s`);
    console.log(`     CDN URL: ${json.audioUrl}`);
    return { ok: true, title, url: json.audioUrl };
  } else {
    console.error(`\n   ✗ Failed (${res.status}): ${JSON.stringify(json)}`);
    return { ok: false, title, error: json.error ?? `HTTP ${res.status}` };
  }
}

async function main() {
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  JMC Meditation Upload — FFmpeg Enhanced Pipeline");
  console.log(`  ${FILES.length} files → ${API_URL}`);
  console.log("═══════════════════════════════════════════════════════════");

  const results = [];
  for (let i = 0; i < FILES.length; i++) {
    const result = await uploadFile(FILES[i], i, FILES.length);
    results.push(result);
  }

  const ok     = results.filter(r => r.ok);
  const failed = results.filter(r => !r.ok);

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log(`  Summary: ${ok.length}/${FILES.length} uploaded successfully`);
  if (failed.length) {
    console.log("  Failed:");
    failed.forEach(f => console.log(`    • ${f.title}: ${f.error}`));
  }
  console.log("  View: https://jmc-portal.vercel.app/meditations");
  console.log("═══════════════════════════════════════════════════════════\n");

  process.exit(failed.length ? 1 : 0);
}

main().catch(err => { console.error(err); process.exit(1); });
