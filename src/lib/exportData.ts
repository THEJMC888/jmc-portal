// "Download my data": everything the member has in the portal, opened on
// this device and packed into one zip. Nothing is decrypted on the server.

import JSZip from "jszip";
import { supabase } from "./supabase";
import { isSealed, openText } from "./e2ee";
import { getBlob, readVaultItems } from "./vaultSync";

interface StoredMedia { id: string; type: string; name: string; blobId: string; createdAt: string }

function extFor(dataUrl: string): string {
  const mime = /^data:([^;,]+)/.exec(dataUrl)?.[1] ?? "";
  return mime.split("/")[1]?.split("+")[0]?.replace("mpeg", "mp3") || "bin";
}

function addDataUrl(zip: JSZip, path: string, dataUrl: string) {
  const comma = dataUrl.indexOf(",");
  zip.file(`${path}.${extFor(dataUrl)}`, dataUrl.slice(comma + 1), { base64: true });
}

export async function buildDataExport(userId: string, email: string, contentKey: CryptoKey): Promise<Blob> {
  const zip = new JSZip();
  const notes: string[] = [];

  // Journal, with photos and recordings
  const { data: rows } = await supabase.from("journal_entries").select("*").order("date", { ascending: true });
  const journal = [];
  for (const row of rows ?? []) {
    const open = async (field: string, value: string | null) =>
      value && isSealed(value) ? await openText(contentKey, value, `journal:${row.id}:${field}`) : value;
    const title = await open("title", row.title);
    const text = await open("text", row.text);
    const mediaRaw = await open("media", row.media ?? null);
    let media: StoredMedia[] = [];
    try { media = mediaRaw ? JSON.parse(mediaRaw) : []; } catch { media = []; }
    if (title === null || text === null) notes.push(`Journal entry from ${row.date} is sealed with an older key and could not be opened.`);
    const files: string[] = [];
    for (const m of media) {
      const url = await getBlob(userId, contentKey, m.blobId);
      if (!url) { notes.push(`A ${m.type} file in the entry from ${row.date} could not be downloaded.`); continue; }
      const path = `journal-media/${row.date}-${m.id}`;
      addDataUrl(zip, path, url);
      files.push(`${path}.${extFor(url)}`);
    }
    journal.push({ date: row.date, title, text, files, createdAt: row.created_at, updatedAt: row.updated_at });
  }
  zip.file("journal.json", JSON.stringify(journal, null, 2));

  // Statements, Vision Videos, Attunements, Blueprint, photos and music
  const items = await readVaultItems(userId, contentKey);
  const byKind: Record<string, Record<string, unknown>> = {};
  for (const it of items) {
    if (it.kind === "music") {
      const t = it.value as { name?: string; dataUrl?: string };
      if (t.dataUrl) addDataUrl(zip, `music/${(t.name ?? it.itemId).replace(/[^\w .-]/g, "_")}`, t.dataUrl);
      continue;
    }
    (byKind[it.kind] ??= {})[it.itemId] = it.value;
  }
  for (const [kind, value] of Object.entries(byKind)) zip.file(`${kind}.json`, JSON.stringify(value, null, 2));

  // Journey: coaching notes
  const { data: sessions } = await supabase.from("coaching_sessions").select("*").order("date", { ascending: true });
  zip.file("journey.json", JSON.stringify(sessions ?? [], null, 2));

  zip.file("README.txt", [
    `The Journeymen Collective member portal: your data`,
    `Account: ${email}`,
    `Exported: ${new Date().toISOString()}`,
    ``,
    `Everything here was decrypted on your own device. Images inside vision.json, photo.json and attunement.json are embedded as data URLs.`,
    ...(notes.length ? ["", "Notes:", ...notes] : []),
  ].join("\n"));

  return zip.generateAsync({ type: "blob" });
}
