import { useEffect, useState } from "react";

// GitHub Pages lets browsers keep index.html for up to 10 minutes, and home-screen apps
// often hold it longer. Each build has a new hashed bundle name, so we compare the bundle
// this page runs with the one in a fresh index.html and offer a reload when they differ.

const BUNDLE = /assets\/index-[\w-]+\.js/;

function currentBundle(): string | null {
  for (const s of Array.from(document.querySelectorAll<HTMLScriptElement>("script[src]"))) {
    const m = s.src.match(BUNDLE);
    if (m) return m[0];
  }
  return null;
}

async function latestBundle(): Promise<string | null> {
  const res = await fetch(`${import.meta.env.BASE_URL}index.html?t=${Date.now()}`, { cache: "no-store" });
  if (!res.ok) return null;
  return (await res.text()).match(BUNDLE)?.[0] ?? null;
}

export function useUpdateAvailable(): boolean {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    const mine = currentBundle();
    if (!mine) return; // dev server: nothing to compare
    let alive = true;
    const check = () => {
      if (document.visibilityState !== "visible") return;
      latestBundle().then(
        (latest) => alive && latest && latest !== mine && setAvailable(true),
        () => {}, // offline: try again later
      );
    };
    check();
    const id = setInterval(check, 5 * 60_000);
    document.addEventListener("visibilitychange", check);
    return () => {
      alive = false;
      clearInterval(id);
      document.removeEventListener("visibilitychange", check);
    };
  }, []);

  return available;
}

export function reloadToLatest() {
  // A changed query string makes the browser fetch index.html again.
  const url = new URL(window.location.href);
  url.searchParams.set("v", String(Date.now()));
  window.location.replace(url.toString());
}
