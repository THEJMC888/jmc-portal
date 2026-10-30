"use client";

import { useState, useEffect } from "react";

// Uses a media query rather than window.innerWidth: on phones innerWidth grows
// when the browser zooms out to fit wide content, so a page that first renders
// its desktop layout would measure itself as "desktop" and stay stuck there.
export function useMobile(breakpoint = 768) {
  const query = `(max-width: ${breakpoint - 1}px)`;
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches
  );

  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [query]);

  return isMobile;
}
