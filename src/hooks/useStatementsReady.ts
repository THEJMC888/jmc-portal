"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { VAULT_EVENT } from "@/lib/vaultSync";

function readStatementsReady() {
  try {
    const raw = localStorage.getItem("jmc_statements_v1");
    if (!raw) return false;
    const data = JSON.parse(raw) as Record<string, { being: string; doing: string; skipped?: boolean }>;
    return Object.values(data).some((c) => c.being?.trim() || c.doing?.trim() || c.skipped);
  } catch {
    return false;
  }
}

/** The Vision Video Editor opens once a member has worked through My Statements. */
export function useStatementsReady() {
  const pathname = usePathname();
  const [ready, setReady] = useState(readStatementsReady);

  useEffect(() => {
    const refresh = () => setReady(readStatementsReady());
    refresh();
    window.addEventListener(VAULT_EVENT, refresh);
    return () => window.removeEventListener(VAULT_EVENT, refresh);
  }, [pathname]);

  return ready;
}
