// Keeps member content the same on every device, end to end encrypted.
//
// The pages keep working on their local copies (localStorage, and IndexedDB
// for music), which also serve as the offline fallback. This engine mirrors
// those copies to the user_vault table: every item is sealed with the account
// content key, and large data: URLs (photos, music) move to the private
// "vault" Storage bucket as sealed files under random ids.
//
// Each item gets a three way merge against the last synced copy (the base,
// kept in IndexedDB): only the side that changed is applied, and when both
// changed, collections are merged item by item so nothing a member made on
// either device is lost.

import { supabase } from "./supabase";
import { type Bytes, fromB64, openBytes, openText, sealBytes, sealText, toB64 } from "./e2ee";

export const VAULT_EVENT = "jmc-vault-sync";

// ─── Sources: where each kind of content lives on the device ─────────────────
interface Source {
  kind: string;
  /** Sources may share a kind; each handles only the item ids it owns. */
  owns(itemId: string): boolean;
  /**
   * Current local copies: item id → raw string. Must throw when the store
   * cannot be read, so a failed read is never mistaken for a deletion.
   */
  list(): Promise<Map<string, string>>;
  /** Apply a remote copy locally; null deletes it. */
  write(itemId: string, raw: string | null): Promise<void>;
  /** Merge when both sides changed since the base. Defaults to the local copy. */
  merge?(base: string | null, local: string, remote: string): string;
}

const ls = {
  get(key: string): string | null { return localStorage.getItem(key); },
  set(key: string, raw: string | null) {
    if (raw === null) localStorage.removeItem(key);
    else localStorage.setItem(key, raw);
  },
};

/** One localStorage key holding one item. */
function singleKey(kind: string, itemId: string, key: string, merge?: Source["merge"]): Source {
  return {
    kind,
    owns: (id) => id === itemId,
    async list() {
      const raw = ls.get(key);
      return new Map(raw === null ? [] : [[itemId, raw]]);
    },
    async write(id, raw) { if (id === itemId) ls.set(key, raw); },
    merge,
  };
}

const parse = <T>(raw: string | null, fallback: T): T => {
  if (raw === null) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
};
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Three way merge of an object map (for example statements by category).
 * Keys added on either side are kept; a key changed on one side takes that
 * side; a key deleted on one side and untouched on the other is deleted.
 */
export function mergeMaps(baseRaw: string | null, localRaw: string, remoteRaw: string): string {
  const base = parse<Record<string, unknown>>(baseRaw, {});
  const local = parse<Record<string, unknown>>(localRaw, {});
  const remote = parse<Record<string, unknown>>(remoteRaw, {});
  const out: Record<string, unknown> = {};
  for (const k of new Set([...Object.keys(local), ...Object.keys(remote)])) {
    const inL = k in local, inR = k in remote, inB = k in base;
    if (inL && inR) {
      if (!inB && !same(local[k], remote[k])) {
        // First sync of two devices that both had this entry: keep the fuller one
        out[k] = JSON.stringify(remote[k]).length > JSON.stringify(local[k]).length ? remote[k] : local[k];
      } else out[k] = same(local[k], base[k]) ? remote[k] : local[k];
    }
    else if (inL) { if (!inB || !same(local[k], base[k])) out[k] = local[k]; }
    else if (inR) { if (!inB || !same(remote[k], base[k])) out[k] = remote[k]; }
  }
  return JSON.stringify(out);
}

/**
 * Three way merge of an array of records with an id. When both sides changed
 * a record, the one with the later updatedAt wins (local when equal).
 * New records from either side come first in the order the newer side had.
 */
export function mergeArrays(baseRaw: string | null, localRaw: string, remoteRaw: string): string {
  type Rec = { id: string; updatedAt?: string | number };
  const base = new Map(parse<Rec[]>(baseRaw, []).map((r) => [r.id, r]));
  const local = parse<Rec[]>(localRaw, []);
  const remote = parse<Rec[]>(remoteRaw, []);
  const lMap = new Map(local.map((r) => [r.id, r]));
  const rMap = new Map(remote.map((r) => [r.id, r]));
  const out: Rec[] = [];
  const seen = new Set<string>();
  const time = (r?: Rec) => (r?.updatedAt === undefined ? 0 : typeof r.updatedAt === "number" ? r.updatedAt : Date.parse(r.updatedAt) || 0);
  for (const r of [...local, ...remote]) {
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    const l = lMap.get(r.id), rm = rMap.get(r.id), b = base.get(r.id);
    if (l && rm) {
      if (same(l, b)) out.push(rm);
      else if (same(rm, b)) out.push(l);
      else out.push(time(rm) > time(l) ? rm : l);
    } else if (l) {
      if (!b || !same(l, b)) out.push(l);       // new here, or edited here after a remote delete
    } else if (rm) {
      if (!b || !same(rm, b)) out.push(rm);
    }
  }
  return JSON.stringify(out);
}

/** Latest updatedAt wins for whole documents; local wins a tie. */
function newerDoc(_base: string | null, localRaw: string, remoteRaw: string): string {
  const t = (raw: string) => {
    const v = parse<{ updatedAt?: string | number }>(raw, {}).updatedAt;
    return v === undefined ? 0 : typeof v === "number" ? v : Date.parse(v) || 0;
  };
  return t(remoteRaw) > t(localRaw) ? remoteRaw : localRaw;
}

const VISION_PREFIX = "jmc_vision_";
// Keys under the vision prefix that are not vision documents
const VISION_SKIP = new Set(["v2"]);

const visionDocs: Source = {
  kind: "vision",
  owns: (id) => id !== "list" && !VISION_SKIP.has(id),
  async list() {
    const out = new Map<string, string>();
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(VISION_PREFIX)) continue;
      const id = key.slice(VISION_PREFIX.length);
      if (VISION_SKIP.has(id)) continue;
      const raw = localStorage.getItem(key);
      if (raw !== null) out.set(id, raw);
    }
    return out;
  },
  async write(id, raw) { ls.set(VISION_PREFIX + id, raw); },
  merge: newerDoc,
};

// Music tracks live in IndexedDB (see vision/page.tsx)
const MUSIC_DB = "jmc_music_db";
const MUSIC_STORE = "tracks";
function musicDb(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const req = indexedDB.open(MUSIC_DB, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(MUSIC_STORE)) req.result.createObjectStore(MUSIC_STORE, { keyPath: "id" });
    };
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}
const musicTracks: Source = {
  kind: "music",
  owns: () => true,
  async list() {
    const db = await musicDb();
    const all = await new Promise<{ id: string }[]>((res, rej) => {
      const req = db.transaction(MUSIC_STORE, "readonly").objectStore(MUSIC_STORE).getAll();
      req.onsuccess = () => res(req.result);
      req.onerror = () => rej(req.error);
    }).finally(() => db.close());
    return new Map(all.map((t) => [t.id, JSON.stringify(t)]));
  },
  async write(id, raw) {
    const db = await musicDb();
    await new Promise<void>((res, rej) => {
      const tx = db.transaction(MUSIC_STORE, "readwrite");
      if (raw === null) tx.objectStore(MUSIC_STORE).delete(id);
      else tx.objectStore(MUSIC_STORE).put(JSON.parse(raw));
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    });
    db.close();
  },
};

const SOURCES: Source[] = [
  singleKey("statement", "all", "jmc_statements_v1", mergeMaps),
  singleKey("attunement", "cards", "jmc_attunement_cards", mergeArrays),
  singleKey("attunement", "active", "jmc_attunement_active_id"),
  singleKey("blueprint", "profile", "jmc_blueprint_v1", newerDoc),
  singleKey("vision", "list", "jmc_visions_list", mergeArrays),
  visionDocs,
  singleKey("photo", "library", "jmc_photo_library", mergeArrays),
  musicTracks,
];

// ─── Device state: last synced copies and blob index (IndexedDB) ────────────
const STATE_DB = "jmc-vault-state";
interface Base { raw: string | null; remoteUpdatedAt: string | null }

let stateConn: Promise<IDBDatabase> | null = null;
function stateDb(): Promise<IDBDatabase> {
  if (!stateConn) {
    stateConn = openStateDb();
    stateConn.then((db) => { db.onclose = () => { stateConn = null; }; }, () => { stateConn = null; });
  }
  return stateConn;
}
function openStateDb(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const req = indexedDB.open(STATE_DB, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore("base");
      req.result.createObjectStore("blobs"); // sha256 of a data URL → blob id
    };
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}
async function stateGet<T>(store: string, key: string): Promise<T | undefined> {
  const db = await stateDb();
  return new Promise((res) => {
    const req = db.transaction(store, "readonly").objectStore(store).get(key);
    req.onsuccess = () => res(req.result as T | undefined);
    req.onerror = () => res(undefined);
  });
}
async function statePut(store: string, key: string, value: unknown): Promise<void> {
  const db = await stateDb();
  return new Promise((res) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).put(value, key);
    tx.oncomplete = () => res();
    tx.onerror = () => res();
  });
}
async function baseKeys(prefix: string): Promise<string[]> {
  const db = await stateDb();
  return new Promise((res) => {
    const req = db.transaction("base", "readonly").objectStore("base").getAllKeys(IDBKeyRange.bound(prefix, prefix + "￿"));
    req.onsuccess = () => res((req.result as string[]).map((k) => k.slice(prefix.length)));
    req.onerror = () => res([]);
  });
}

/** Forget sync state on sign out. Local content itself is left in place. */
export async function forgetVaultState(): Promise<void> {
  try {
    (await stateConn)?.close();
    stateConn = null;
    indexedDB.deleteDatabase(STATE_DB);
  } catch { /* none */ }
}

// ─── Sealed files in Storage ──────────────────────────────────────────────────
const BUCKET = "vault";
const BLOB_REF = "vault:blob:";
// Data URLs shorter than this stay inline in the sealed JSON
const BLOB_MIN = 8 * 1024;

async function sha256Hex(text: string): Promise<string> {
  const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)));
  return Array.from(hash, (b) => b.toString(16).padStart(2, "0")).join("");
}

function dataUrlToBytes(dataUrl: string): { mime: string; bytes: Bytes } | null {
  const m = /^data:([^;,]*)(;base64)?,/.exec(dataUrl);
  if (!m) return null;
  const body = dataUrl.slice(m[0].length);
  try {
    return { mime: m[1] || "application/octet-stream", bytes: m[2] ? fromB64(body) : new TextEncoder().encode(decodeURIComponent(body)) as Bytes };
  } catch {
    return null;
  }
}

/** Seal a data URL into Storage once and return its random id. */
export async function putBlob(userId: string, contentKey: CryptoKey, dataUrl: string): Promise<string> {
  const digest = await sha256Hex(dataUrl);
  const known = await stateGet<string>("blobs", `${userId}|${digest}`);
  if (known) return known;
  const parsed = dataUrlToBytes(dataUrl);
  if (!parsed) throw new Error("Unreadable data URL");
  const id = crypto.randomUUID();
  // The mime type travels inside the ciphertext, so Storage learns nothing
  const header = new TextEncoder().encode(parsed.mime + "\n");
  const plain = new Uint8Array(header.length + parsed.bytes.length);
  plain.set(header, 0);
  plain.set(parsed.bytes, header.length);
  const sealed = await sealBytes(contentKey, plain, `blob:${id}`);
  const { error } = await supabase.storage.from(BUCKET).upload(`${userId}/${id}`, new Blob([sealed]), {
    contentType: "application/octet-stream", upsert: false,
  });
  if (error) throw new Error(error.message);
  await statePut("blobs", `${userId}|${digest}`, id);
  return id;
}

const blobMemo = new Map<string, Promise<string | null>>();

/** Download and open a sealed file; returns a data URL, or null. */
export function getBlob(userId: string, contentKey: CryptoKey, id: string): Promise<string | null> {
  const memoKey = `${userId}|${id}`;
  let p = blobMemo.get(memoKey);
  if (!p) {
    p = (async () => {
      const { data, error } = await supabase.storage.from(BUCKET).download(`${userId}/${id}`);
      if (error || !data) return null;
      const plain = await openBytes(contentKey, new Uint8Array(await data.arrayBuffer()), `blob:${id}`);
      if (!plain) return null;
      const nl = plain.indexOf(10);
      const mime = new TextDecoder().decode(plain.subarray(0, nl));
      const dataUrl = `data:${mime};base64,${toB64(plain.subarray(nl + 1))}`;
      await statePut("blobs", `${userId}|${await sha256Hex(dataUrl)}`, id);
      return dataUrl;
    })();
    blobMemo.set(memoKey, p);
    p.then((v) => { if (v === null) blobMemo.delete(memoKey); });
  }
  return p;
}

/** Replace every large data URL in a JSON value with a sealed file reference. */
async function blobify(userId: string, key: CryptoKey, value: unknown): Promise<unknown> {
  if (typeof value === "string") {
    return value.startsWith("data:") && value.length >= BLOB_MIN ? BLOB_REF + (await putBlob(userId, key, value)) : value;
  }
  if (Array.isArray(value)) return Promise.all(value.map((v) => blobify(userId, key, v)));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = await blobify(userId, key, v);
    return out;
  }
  return value;
}

/** Inverse of blobify. Throws when a file cannot be opened, so nothing half restored is saved. */
async function unblobify(userId: string, key: CryptoKey, value: unknown): Promise<unknown> {
  if (typeof value === "string") {
    if (!value.startsWith(BLOB_REF)) return value;
    const dataUrl = await getBlob(userId, key, value.slice(BLOB_REF.length));
    if (dataUrl === null) throw new Error("A sealed file could not be opened");
    return dataUrl;
  }
  if (Array.isArray(value)) return Promise.all(value.map((v) => unblobify(userId, key, v)));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = await unblobify(userId, key, v);
    return out;
  }
  return value;
}

// ─── Sync ─────────────────────────────────────────────────────────────────────
interface Row { kind: string; item_id: string; data: string | null; deleted: boolean; updated_at: string }

const aadFor = (kind: string, itemId: string) => `vault:${kind}:${itemId}`;

/** Open a remote row. undefined means it cannot be opened here: leave it alone. */
async function openRow(userId: string, key: CryptoKey, row: Row): Promise<string | null | undefined> {
  if (row.deleted || row.data === null) return null;
  const text = await openText(key, row.data, aadFor(row.kind, row.item_id));
  if (text === null) return undefined;
  const json = tryParse(text);
  if (json === undefined) return text; // a plain string value, stored as is
  try {
    // Re-serialise so the stored base matches what the page would write
    return JSON.stringify(await unblobify(userId, key, json));
  } catch {
    return undefined;
  }
}

function tryParse(raw: string): unknown {
  try { return JSON.parse(raw); } catch { return undefined; }
}

async function push(userId: string, key: CryptoKey, kind: string, itemId: string, raw: string | null): Promise<string> {
  let data: string | null = null;
  if (raw !== null) {
    const json = tryParse(raw);
    const payload = json === undefined ? raw : JSON.stringify(await blobify(userId, key, json));
    data = await sealText(key, payload, aadFor(kind, itemId));
  }
  const { data: saved, error } = await supabase.from("user_vault")
    .upsert({ user_id: userId, kind, item_id: itemId, data, deleted: raw === null, updated_at: new Date().toISOString() })
    .select("updated_at")
    .single();
  if (error || !saved) throw new Error(error?.message ?? "Upload failed");
  return saved.updated_at as string;
}

let running: Promise<void> | null = null;
const backoff = new Map<string, number>();
let again = false;

/**
 * Run one full sync. Calls made while one is running coalesce into a single
 * follow up run. Dispatches VAULT_EVENT with the kinds changed locally.
 */
export function syncVault(userId: string, contentKey: CryptoKey): Promise<void> {
  if (running) { again = true; return running; }
  running = (async () => {
    try {
      do {
        again = false;
        const changed = await syncOnce(userId, contentKey);
        if (changed.size) window.dispatchEvent(new CustomEvent(VAULT_EVENT, { detail: { kinds: [...changed] } }));
      } while (again);
    } finally {
      running = null;
    }
  })();
  return running;
}

async function syncOnce(userId: string, key: CryptoKey): Promise<Set<string>> {
  const changedKinds = new Set<string>();
  const { data, error } = await supabase.from("user_vault").select("kind,item_id,data,deleted,updated_at");
  if (error) throw new Error(error.message);
  const remote = new Map((data as Row[]).map((r) => [`${r.kind}|${r.item_id}`, r]));

  for (const source of SOURCES) {
    let local: Map<string, string>;
    try { local = await source.list(); } catch { continue; } // unreadable here: skip, never delete
    const basePrefix = `${userId}|${source.kind}|`;
    const ids = new Set<string>([...local.keys(), ...(await baseKeys(basePrefix))]);
    for (const r of remote.values()) if (r.kind === source.kind) ids.add(r.item_id);

    for (const id of ids) {
      if (!source.owns(id)) continue;
      const itemKey = `${userId}|${source.kind}|${id}`;
      if ((backoff.get(itemKey) ?? 0) > Date.now()) continue;
      try {
        if (await syncItem(userId, key, source, id, local.get(id) ?? null, remote.get(`${source.kind}|${id}`))) changedKinds.add(source.kind);
        backoff.delete(itemKey);
      } catch {
        // One item failing (offline, quota, a file too large) never blocks the rest; retry later
        backoff.set(itemKey, Date.now() + 5 * 60_000);
      }
    }
  }
  return changedKinds;
}

/** Returns true when the local copy was changed. */
async function syncItem(userId: string, key: CryptoKey, source: Source, id: string, local: string | null, row: Row | undefined): Promise<boolean> {
  const baseKey = `${userId}|${source.kind}|${id}`;
  const base = (await stateGet<Base>("base", baseKey)) ?? { raw: null, remoteUpdatedAt: null };
  const localChanged = local !== base.raw;
  const remoteChanged = !!row && row.updated_at !== base.remoteUpdatedAt;
  if (!localChanged && !remoteChanged) return false;

  if (!remoteChanged) {
    // Only this device changed it (or the server has never seen it)
    if (local === null && !row) { await statePut("base", baseKey, { raw: null, remoteUpdatedAt: null }); return false; }
    const at = await push(userId, key, source.kind, id, local);
    await statePut("base", baseKey, { raw: local, remoteUpdatedAt: at });
    return false;
  }

  const remoteRaw = await openRow(userId, key, row!);
  if (remoteRaw === undefined) return false; // sealed with another key: never overwrite it

  if (!localChanged) {
    await source.write(id, remoteRaw);
    await statePut("base", baseKey, { raw: remoteRaw, remoteUpdatedAt: row!.updated_at });
    return true;
  }

  // Both sides changed since the last sync
  let merged: string | null;
  if (local === null) merged = remoteRaw;                 // deleted here, edited there: keep the edit
  else if (remoteRaw === null) merged = local;            // deleted there, edited here: keep the edit
  else merged = source.merge ? source.merge(base.raw, local, remoteRaw) : local;

  let wroteLocal = false;
  if (merged !== local) { await source.write(id, merged); wroteLocal = true; }
  let at = row!.updated_at;
  if (merged !== remoteRaw) at = await push(userId, key, source.kind, id, merged);
  await statePut("base", baseKey, { raw: merged, remoteUpdatedAt: at });
  return wroteLocal;
}

/** Every vault item this member owns, opened on this device (for "Download my data"). */
export async function readVaultItems(userId: string, contentKey: CryptoKey): Promise<{ kind: string; itemId: string; value: unknown }[]> {
  const { data, error } = await supabase.from("user_vault").select("kind,item_id,data,deleted,updated_at");
  if (error) throw new Error(error.message);
  const out: { kind: string; itemId: string; value: unknown }[] = [];
  for (const row of data as Row[]) {
    const raw = await openRow(userId, contentKey, row);
    if (raw === null || raw === undefined) continue;
    out.push({ kind: row.kind, itemId: row.item_id, value: tryParse(raw) ?? raw });
  }
  return out;
}

/** Remove this device's sync state and the music library copy. Used after deleting the account. */
export async function forgetLocalVaultCopies(): Promise<void> {
  await forgetVaultState();
  try { indexedDB.deleteDatabase(MUSIC_DB); } catch { /* none */ }
}
