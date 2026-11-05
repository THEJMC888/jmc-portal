// Pages keep readable copies of a member's content in this browser, so those
// copies must never carry over to the next account signed in here. Otherwise
// one member's work would show under another, and sync would upload it there.

import { forgetLocalVaultCopies } from "./vaultSync";

const OWNER_KEY = "jmc_cache_owner";
const CONTENT_PREFIXES = [
  "jmc_journal_", "jmc_statements_", "jmc_attunement_", "jmc_blueprint_", "jmc_vision",
  "jmc_current_vision_id", "jmc_photo_library", "jmc_vault_synced_",
];

function removeContentKeys() {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && CONTENT_PREFIXES.some((p) => key.startsWith(p))) keys.push(key);
  }
  keys.forEach((key) => localStorage.removeItem(key));
}

/**
 * Mark this browser's copies as belonging to this member, clearing them first
 * if they belong to someone else. A browser with no owner yet keeps its
 * copies, since they may be work that has not been uploaded. Returns true when
 * it cleared anything, so the caller can reload.
 */
export async function claimDeviceCache(userId: string): Promise<boolean> {
  let owner: string | null;
  try { owner = localStorage.getItem(OWNER_KEY); } catch { return false; }
  if (owner === userId) return false;
  if (owner) {
    removeContentKeys();
    await forgetLocalVaultCopies();
  }
  localStorage.setItem(OWNER_KEY, userId);
  return !!owner;
}
