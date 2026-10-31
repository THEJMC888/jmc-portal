// Client-side AES-256-GCM encryption for journal entries.
// The key lives only in the browser's IndexedDB — never transmitted to any server.
// Encrypted text is prefixed with "enc:" so plain-text entries (pre-E2EE) are
// still readable after a key is generated for the first time.

const DB_NAME = "jmc-journal-e2ee";
const STORE_NAME = "keys";
const ENC_PREFIX = "enc:";

// ─── IndexedDB helpers ────────────────────────────────────────────────────────
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbGet(db: IDBDatabase, key: string): Promise<CryptoKey | undefined> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve(req.result as CryptoKey | undefined);
    req.onerror = () => reject(req.error);
  });
}

async function dbPut(db: IDBDatabase, key: string, value: CryptoKey): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const req = tx.objectStore(STORE_NAME).put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ─── Key lifecycle ────────────────────────────────────────────────────────────

/**
 * Returns the AES-256-GCM key for this user, creating and persisting one in
 * IndexedDB if it doesn't exist yet. Returns null when IndexedDB is unavailable
 * (e.g. strict private-browsing mode) — callers should degrade gracefully.
 */
export async function getOrCreateKey(userId: string): Promise<CryptoKey | null> {
  try {
    const db = await openDB();
    const existing = await dbGet(db, userId);
    if (existing) return existing;

    const key = await crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,       // extractable — needed for the backup/export feature
      ["encrypt", "decrypt"]
    );

    await dbPut(db, userId, key);
    return key;
  } catch {
    return null;
  }
}

/**
 * Export the raw key as a base64 string for user backup.
 */
export async function exportKeyAsBase64(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey("raw", key);
  return btoa(String.fromCharCode(...new Uint8Array(raw)));
}

/**
 * Import a base64 key string and persist it for this user, replacing any existing key.
 * Returns null if the input is invalid.
 */
export async function importKeyFromBase64(
  base64: string,
  userId: string
): Promise<CryptoKey | null> {
  try {
    const raw = Uint8Array.from(atob(base64.trim()), c => c.charCodeAt(0));
    if (raw.byteLength !== 32) throw new Error("Key must be 32 bytes (AES-256)");

    const key = await crypto.subtle.importKey(
      "raw",
      raw,
      { name: "AES-GCM" },
      true,
      ["encrypt", "decrypt"]
    );

    const db = await openDB();
    await dbPut(db, userId, key);
    return key;
  } catch {
    return null;
  }
}

// ─── Encrypt / Decrypt ────────────────────────────────────────────────────────

/**
 * Encrypt a plaintext string. Returns "enc:<base64(iv+ciphertext)>".
 */
export async function encryptText(key: CryptoKey, plaintext: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);

  const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.byteLength);

  return ENC_PREFIX + btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt a value previously returned by encryptText.
 * If the value doesn't start with "enc:" (i.e. a legacy plain-text entry),
 * it is returned as-is — so old entries remain readable after the key is created.
 * Returns null when this key cannot open the value. Callers must never store
 * or upload anything in its place, or the real ciphertext would be lost.
 */
export async function decryptText(key: CryptoKey, value: string): Promise<string | null> {
  if (!value.startsWith(ENC_PREFIX)) return value; // plain-text fallback

  try {
    const combined = Uint8Array.from(atob(value.slice(ENC_PREFIX.length)), c => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);
    const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
    return new TextDecoder().decode(plaintext);
  } catch {
    return null;
  }
}

/**
 * Placeholder text that older builds cached locally when decryption failed.
 * A local entry carrying it is a stale copy, never the member's real writing.
 */
export const LEGACY_DECRYPT_PLACEHOLDER = "[Unable to decrypt";

/**
 * Returns true if a stored value is encrypted (has the "enc:" prefix).
 */
export function isEncrypted(value: string): boolean {
  return value.startsWith(ENC_PREFIX);
}
