// Account master key lifecycle: sign in, create, unlock, re-wrap, recover.
//
// The server (user_keys table) only stores the master key wrapped by the
// password KEK and by the recovery phrase KEK. This device caches the
// unwrapped key in IndexedDB for the session as non-extractable CryptoKeys:
// the content key used for encryption, plus a device key that seals a copy
// of the master so this device can re-wrap it after a password reset.
// Sign out deletes the cache.

import { generateMnemonic, mnemonicToEntropy, validateMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english.js";
import { supabase } from "./supabase";
import {
  KDF_ID, type PasswordSecrets, contentKeyFor, derivePasswordSecrets, fromB64, keyIdFor, openBytes,
  passwordKek, randomBytes, recoveryKek, sealBytes, toB64,
} from "./e2ee";

export type { PasswordSecrets } from "./e2ee";

interface KeyRow {
  user_id: string;
  key_id: string;
  kdf_salt: string;
  wrapped_by_password: string;
  wrapped_by_recovery: string | null;
  recovery_confirmed_at: string | null;
  needs_rewrap: boolean;
}

// ─── Device cache (IndexedDB) ─────────────────────────────────────────────────
const DB_NAME = "jmc-account-keys";
const STORE = "keys";

interface CachedKeys {
  keyId: string;
  contentKey: CryptoKey;  // non-extractable AES-GCM
  deviceKey: CryptoKey;   // non-extractable AES-GCM, seals the master below
  sealedMaster: string;
}

function openCache(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function cacheOp<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  const db = await openCache();
  return new Promise((resolve, reject) => {
    const req = run(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => { resolve(req.result as T); db.close(); };
    req.onerror = () => { reject(req.error); db.close(); };
  });
}

async function cacheMaster(userId: string, master: Uint8Array): Promise<CachedKeys> {
  const deviceKey = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  const entry: CachedKeys = {
    keyId: await keyIdFor(master),
    contentKey: await contentKeyFor(master),
    deviceKey,
    sealedMaster: toB64(await sealBytes(deviceKey, master, `device:${userId}`)),
  };
  try { await cacheOp("readwrite", (s) => s.put(entry, userId)); } catch { /* private mode: key lives for this page only */ }
  memory.set(userId, entry);
  return entry;
}

// Fallback for browsers without IndexedDB, and a fast path within one page load
const memory = new Map<string, CachedKeys>();

async function readCache(userId: string): Promise<CachedKeys | null> {
  const hit = memory.get(userId);
  if (hit) return hit;
  try {
    const entry = await cacheOp<CachedKeys | undefined>("readonly", (s) => s.get(userId));
    if (entry) memory.set(userId, entry);
    return entry ?? null;
  } catch {
    return null;
  }
}

async function cachedMaster(userId: string): Promise<{ keyId: string; master: Uint8Array } | null> {
  const entry = await readCache(userId);
  if (!entry) return null;
  const master = await openBytes(entry.deviceKey, fromB64(entry.sealedMaster), `device:${userId}`);
  return master ? { keyId: entry.keyId, master } : null;
}

/** The content key for this member if this device holds it for the session. */
export async function getContentKey(userId: string): Promise<{ keyId: string; contentKey: CryptoKey } | null> {
  const entry = await readCache(userId);
  return entry ? { keyId: entry.keyId, contentKey: entry.contentKey } : null;
}

/** Delete every cached key on this device. Called on sign out. */
export async function forgetDeviceKeys(): Promise<void> {
  memory.clear();
  try { await cacheOp("readwrite", (s) => s.clear()); } catch { /* nothing cached */ }
}

/** Sign out and remove every key from this device. */
export async function signOutAndForgetKeys(): Promise<void> {
  await forgetDeviceKeys();
  await supabase.auth.signOut();
}

// ─── Sign in ──────────────────────────────────────────────────────────────────

/**
 * Sign in with the auth secret derived from the password. Members created
 * before encryption still have their raw password at Supabase: if the
 * derived secret is refused, try the raw password and report legacy, so
 * the caller can switch them over with completeLegacyMigration once any
 * second factor is verified.
 */
export async function signInWithDerivedPassword(email: string, password: string):
  Promise<{ error: string | null; secrets: PasswordSecrets | null; legacy: boolean }> {
  let secrets: PasswordSecrets;
  try {
    secrets = await derivePasswordSecrets(email, password);
  } catch {
    return { error: "This browser could not prepare your encryption keys. Please update it and try again.", secrets: null, legacy: false };
  }
  const first = await supabase.auth.signInWithPassword({ email, password: secrets.authSecret });
  if (!first.error) return { error: null, secrets, legacy: false };
  if (first.error.code && first.error.code !== "invalid_credentials") {
    return { error: first.error.message, secrets: null, legacy: false };
  }
  const legacy = await supabase.auth.signInWithPassword({ email, password });
  if (legacy.error) return { error: legacy.error.message, secrets: null, legacy: false };
  return { error: null, secrets, legacy: true };
}

/** Replace the raw password at Supabase with the derived auth secret. */
export async function completeLegacyMigration(secrets: PasswordSecrets): Promise<void> {
  // A failure here is harmless: the next sign in falls back and retries.
  await supabase.auth.updateUser({ password: secrets.authSecret }).catch(() => {});
}

// ─── Unlock ───────────────────────────────────────────────────────────────────

export type UnlockResult =
  /** Ready. When phrase is set, show it once and call confirmRecoveryPhrase. */
  | { status: "ready"; phrase?: string }
  /** Password is right but the key was wrapped under an earlier password. */
  | { status: "needs-recovery" }
  | { status: "error"; message: string };

async function fetchKeyRow(userId: string): Promise<KeyRow | null> {
  const { data, error } = await supabase.from("user_keys").select("*").eq("user_id", userId).maybeSingle();
  if (error) throw new Error(error.message);
  return data as KeyRow | null;
}

const newPhrase = () => generateMnemonic(wordlist, 256);

async function wrapWithPhrase(phrase: string, master: Uint8Array): Promise<string> {
  const kek = await recoveryKek(mnemonicToEntropy(phrase, wordlist));
  return toB64(await sealBytes(kek, master, "recovery"));
}

async function wrapWithPassword(root: Uint8Array, master: Uint8Array): Promise<{ kdf_salt: string; wrapped_by_password: string }> {
  const salt = randomBytes(16);
  const kek = await passwordKek(root, salt);
  return { kdf_salt: toB64(salt), wrapped_by_password: toB64(await sealBytes(kek, master, `password:${KDF_ID}`)) };
}

async function openWithPassword(row: KeyRow, root: Uint8Array): Promise<Uint8Array | null> {
  const kek = await passwordKek(root, fromB64(row.kdf_salt));
  return openBytes(kek, fromB64(row.wrapped_by_password), `password:${KDF_ID}`);
}

/** Make a brand new master key, replacing any earlier one. */
async function createMasterKey(userId: string, secrets: PasswordSecrets, replace: boolean): Promise<UnlockResult> {
  const master = randomBytes(32);
  const phrase = newPhrase();
  const row = {
    user_id: userId,
    key_id: await keyIdFor(master),
    ...(await wrapWithPassword(secrets.root, master)),
    wrapped_by_recovery: await wrapWithPhrase(phrase, master),
    recovery_confirmed_at: null,
    needs_rewrap: false,
    updated_at: new Date().toISOString(),
  };
  const { error } = replace
    ? await supabase.from("user_keys").upsert(row)
    : await supabase.from("user_keys").insert(row);
  if (error) {
    // Another device created the key a moment ago: use that one instead
    if (!replace && error.code === "23505") return unlockWithPassword(userId, secrets);
    return { status: "error", message: error.message };
  }
  await cacheMaster(userId, master);
  return { status: "ready", phrase };
}

/**
 * After a successful sign in: open the master key with the password, or
 * create it for a member who has none yet. When the password wrap is stale
 * (reset elsewhere) but this device still holds the key, re-wrap silently.
 */
export async function unlockWithPassword(userId: string, secrets: PasswordSecrets): Promise<UnlockResult> {
  try {
    const row = await fetchKeyRow(userId);
    if (!row) return createMasterKey(userId, secrets, false);

    let master = await openWithPassword(row, secrets.root);
    if (!master) {
      const held = await cachedMaster(userId);
      if (held && held.keyId === row.key_id) {
        master = held.master;
        const { error } = await supabase.from("user_keys")
          .update({ ...(await wrapWithPassword(secrets.root, master)), needs_rewrap: false, updated_at: new Date().toISOString() })
          .eq("user_id", userId);
        if (error) return { status: "error", message: error.message };
      }
    } else if (row.needs_rewrap) {
      await supabase.from("user_keys").update({ needs_rewrap: false }).eq("user_id", userId);
    }
    if (!master) return { status: "needs-recovery" };

    await cacheMaster(userId, master);
    // The phrase was never confirmed as saved: issue a fresh one to show now
    if (!row.recovery_confirmed_at) return { status: "ready", phrase: await rotateRecoveryPhrase(userId, master) };
    return { status: "ready" };
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "Could not unlock your private content." };
  }
}

async function rotateRecoveryPhrase(userId: string, master: Uint8Array): Promise<string | undefined> {
  const phrase = newPhrase();
  const { error } = await supabase.from("user_keys")
    .update({ wrapped_by_recovery: await wrapWithPhrase(phrase, master), recovery_confirmed_at: null })
    .eq("user_id", userId);
  return error ? undefined : phrase;
}

/** The member ticked "I have saved it". */
export async function confirmRecoveryPhrase(userId: string): Promise<void> {
  await supabase.from("user_keys").update({ recovery_confirmed_at: new Date().toISOString() }).eq("user_id", userId);
}

// ─── Password set or reset ────────────────────────────────────────────────────

export function isValidPhrase(phrase: string): boolean {
  return validateMnemonic(normalisePhrase(phrase), wordlist);
}

const normalisePhrase = (phrase: string) => phrase.trim().toLowerCase().split(/\s+/).join(" ");

/** Open the master key with the recovery phrase and wrap it with the current password. */
export async function recoverWithPhrase(userId: string, phrase: string, secrets: PasswordSecrets): Promise<UnlockResult> {
  const clean = normalisePhrase(phrase);
  if (!validateMnemonic(clean, wordlist)) return { status: "error", message: "That phrase is not valid. Check each of the 24 words." };
  const row = await fetchKeyRow(userId).catch(() => null);
  if (!row?.wrapped_by_recovery) return { status: "error", message: "No recovery phrase is on file for this account." };
  const kek = await recoveryKek(mnemonicToEntropy(clean, wordlist));
  const master = await openBytes(kek, fromB64(row.wrapped_by_recovery), "recovery");
  if (!master) return { status: "error", message: "That phrase does not match this account." };
  const { error } = await supabase.from("user_keys")
    .update({
      ...(await wrapWithPassword(secrets.root, master)),
      needs_rewrap: false,
      recovery_confirmed_at: row.recovery_confirmed_at ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
  if (error) return { status: "error", message: error.message };
  await cacheMaster(userId, master);
  return { status: "ready" };
}

/**
 * The member has another device that is still signed in. Leave the key as
 * it is and flag it: that device re-wraps once they enter the new password.
 */
export async function requestRewrapFromSignedInDevice(userId: string): Promise<void> {
  await supabase.from("user_keys").update({ needs_rewrap: true }).eq("user_id", userId);
}

/** No device and no phrase: begin again with a new key. Older content stays sealed. */
export async function startFresh(userId: string, secrets: PasswordSecrets): Promise<UnlockResult> {
  return createMasterKey(userId, secrets, true);
}

/**
 * On page load: is the key cached here still the account's key, and has a
 * password reset elsewhere asked this device to re-wrap it? Offline, the
 * cached key is trusted as is.
 */
export async function checkDeviceKey(userId: string):
  Promise<{ state: "ready" | "locked"; contentKey?: CryptoKey; needsRewrap: boolean }> {
  const cached = await getContentKey(userId);
  if (!cached) {
    const row = await fetchKeyRow(userId).catch(() => null);
    return { state: "locked", needsRewrap: !!row?.needs_rewrap };
  }
  let row: KeyRow | null;
  try { row = await fetchKeyRow(userId); } catch { return { state: "ready", contentKey: cached.contentKey, needsRewrap: false }; }
  if (!row || row.key_id !== cached.keyId) {
    await forgetDeviceKeys();
    return { state: "locked", needsRewrap: false };
  }
  return { state: "ready", contentKey: cached.contentKey, needsRewrap: row.needs_rewrap };
}
