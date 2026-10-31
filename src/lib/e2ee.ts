// Low level primitives for end-to-end encryption.
// Everything here runs in the browser. Keys and plaintext never leave it.
//
// Key hierarchy (see accountKeys.ts for the lifecycle):
//   password ──Argon2id(email salt)──▶ root ──HKDF "jmc auth v1"──▶ auth secret (sent to Supabase as the password)
//                                          └─HKDF "jmc enc v1" + random per user salt──▶ password KEK
//   recovery phrase (256 bits) ──HKDF "jmc recovery v1"──▶ recovery KEK
//   master key (random 256 bits, wrapped by both KEKs) ──HKDF "jmc content v1"──▶ content key (AES-256-GCM)

import { argon2id } from "hash-wasm";

// 64 MiB, 3 passes: about half a second on a recent phone. Changing these
// changes every member's auth secret, so they are fixed for version 1.
export const KDF_ID = "argon2id-m65536-t3-p1";
const ARGON2 = { iterations: 3, memorySize: 65536, parallelism: 1, hashLength: 32 } as const;

/** Bytes backed by a plain ArrayBuffer, as WebCrypto requires. */
export type Bytes = Uint8Array<ArrayBuffer>;
const bytes = (u: Uint8Array): Bytes => new Uint8Array(u);

const utf8 = new TextEncoder();
const ZERO_SALT = new Uint8Array(32);

// ─── Encoding ─────────────────────────────────────────────────────────────────
export function toB64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
export function fromB64(b64: string): Bytes {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}
const toB64Url = (bytes: Uint8Array) => toB64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

export const randomBytes = (n: number): Bytes => crypto.getRandomValues(new Uint8Array(n));

// ─── Derivation ───────────────────────────────────────────────────────────────
async function hkdfBits(ikm: Uint8Array, info: string, salt: Uint8Array = ZERO_SALT, len = 32): Promise<Bytes> {
  const base = await crypto.subtle.importKey("raw", bytes(ikm), "HKDF", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt: bytes(salt), info: utf8.encode(info) }, base, len * 8);
  return new Uint8Array(bits);
}

/** AES-256-GCM key derived from ikm. Never extractable. */
export async function hkdfAesKey(ikm: Uint8Array, info: string, salt: Uint8Array = ZERO_SALT): Promise<CryptoKey> {
  const raw = await hkdfBits(ikm, info, salt);
  return crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

export interface PasswordSecrets {
  /** Sent to Supabase in place of the password. Useless for decryption. */
  authSecret: string;
  /** Stays on the device. Source of the password KEK. */
  root: Bytes;
}

/**
 * Stretch the login password once with Argon2id, then split it into two
 * unrelated secrets. The salt is derived from the email so it is known
 * before sign in; the encryption side adds a random per user salt on top.
 */
export async function derivePasswordSecrets(email: string, password: string): Promise<PasswordSecrets> {
  const saltSource = utf8.encode(`jmc-portal/argon2id/v1/${email.trim().toLowerCase()}`);
  const salt = new Uint8Array(await crypto.subtle.digest("SHA-256", saltSource)).slice(0, 16);
  const root = bytes(await argon2id({ password: password.normalize("NFKC"), salt, ...ARGON2, outputType: "binary" }));
  const auth = await hkdfBits(root, "jmc auth v1");
  // Fixed prefix covers any Supabase password rule (upper, lower, digit, symbol)
  return { authSecret: `Jm1!${toB64Url(auth)}`, root };
}

export const passwordKek = (root: Uint8Array, kdfSalt: Uint8Array) => hkdfAesKey(root, "jmc enc v1", kdfSalt);
export const recoveryKek = (entropy: Uint8Array) => hkdfAesKey(entropy, "jmc recovery v1");
export const contentKeyFor = (master: Uint8Array) => hkdfAesKey(master, "jmc content v1");
export async function keyIdFor(master: Uint8Array): Promise<string> {
  return toB64Url(await hkdfBits(master, "jmc key id v1", ZERO_SALT, 12));
}

// ─── Authenticated encryption ─────────────────────────────────────────────────
// Layout: 12 byte IV followed by ciphertext and tag. The optional aad binds a
// ciphertext to where it lives (for example "journal:<id>:text"), so the
// server cannot swap encrypted fields between rows without detection.

export async function sealBytes(key: CryptoKey, plainIn: Uint8Array, aad?: string): Promise<Bytes> {
  const iv = randomBytes(12);
  const plain = bytes(plainIn);
  const params: AesGcmParams = aad ? { name: "AES-GCM", iv, additionalData: utf8.encode(aad) } : { name: "AES-GCM", iv };
  const ct = new Uint8Array(await crypto.subtle.encrypt(params, key, plain));
  const out = new Uint8Array(12 + ct.length);
  out.set(iv, 0);
  out.set(ct, 12);
  return out;
}

/** Returns null when the key or aad is wrong, or the data was altered. */
export async function openBytes(key: CryptoKey, sealedIn: Uint8Array, aad?: string): Promise<Bytes | null> {
  if (sealedIn.length < 28) return null;
  const sealed = bytes(sealedIn);
  const iv = sealed.slice(0, 12);
  const params: AesGcmParams = aad ? { name: "AES-GCM", iv, additionalData: utf8.encode(aad) } : { name: "AES-GCM", iv };
  try {
    return new Uint8Array(await crypto.subtle.decrypt(params, key, sealed.subarray(12)));
  } catch {
    return null;
  }
}

/** Prefix on every string sealed by the account content key. */
export const SEALED_PREFIX = "e2:";

export const isSealed = (value: string | null | undefined) => !!value && value.startsWith(SEALED_PREFIX);

export async function sealText(key: CryptoKey, plaintext: string, aad?: string): Promise<string> {
  return SEALED_PREFIX + toB64(await sealBytes(key, utf8.encode(plaintext), aad));
}

/** Returns null when the value is not sealed text, or this key cannot open it. */
export async function openText(key: CryptoKey, value: string, aad?: string): Promise<string | null> {
  if (!isSealed(value)) return null;
  let sealed: Bytes;
  try { sealed = fromB64(value.slice(SEALED_PREFIX.length)); } catch { return null; }
  const plain = await openBytes(key, sealed, aad);
  return plain ? new TextDecoder().decode(plain) : null;
}

export async function sealJson(key: CryptoKey, value: unknown, aad?: string): Promise<string> {
  return sealText(key, JSON.stringify(value), aad);
}

export async function openJson<T>(key: CryptoKey, value: string, aad?: string): Promise<T | null> {
  const text = await openText(key, value, aad);
  if (text === null) return null;
  try { return JSON.parse(text) as T; } catch { return null; }
}
