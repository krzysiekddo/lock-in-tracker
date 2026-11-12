import type { User } from "firebase/auth";
import type { Firestore } from "firebase/firestore";
import { createContext, useContext, useEffect, type ReactNode } from "react";
import type { DayLog, Plan } from "../lib/types";

export type AppState = {
  db: Firestore;
  user: User;
  plan: Plan;
  days: DayLog[];
  byDate: Map<string, DayLog>;
  today: string;
  /** Day shown on the Today tab. */
  selected: string;
  select: (date: string) => void;
  /** Switches to the Today tab on this day. */
  openDay: (date: string) => void;
  saveDay: (day: DayLog) => void;
  savePlan: (plan: Plan, message?: string) => void;
  openSettings: () => void;
  notify: (message: string) => void;
};

export const AppCtx = createContext<AppState | null>(null);

export function useApp(): AppState {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("AppCtx missing");
  return ctx;
}

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <section className="sheet" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <header className="sheet-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Zamknij">
            <Icon name="close" />
          </button>
        </header>
        <div className="sheet-body">{children}</div>
      </section>
    </div>
  );
}

const PATHS: Record<string, string> = {
  today: "M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6l1.4 1.4m10 10 1.4 1.4m0-12.8L17 7M7 17l-1.4 1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z",
  plan: "M4 6h16M4 12h16M4 18h10",
  history: "M4 19h16M7 16v-5m5 5V7m5 9v-8",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  close: "M6 6l12 12M18 6 6 18",
  check: "M5 12.5 10 17l9-10",
  chevron: "M9 6l6 6-6 6",
  back: "M15 6l-6 6 6 6",
  up: "M6 15l6-6 6 6",
  down: "M6 9l6 6 6-6",
  trash: "M5 7h14M10 7V5h4v2m-7 0 1 12h8l1-12",
  run: "M13 4.5a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0M7 21l3-6 3 2v5m-6-9 2-4 4-1 2 3 3 1m-7 2-1 3",
  gym: "M3 10v4m3-6v8m0-4h12m0-4v8m3-6v4",
  flame: "M12 3c1 3 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-6 1-9Z",
  gear: "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm7.4 3a7.4 7.4 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7.5 7.5 0 0 0-2-1.2L14.5 3h-5l-.4 2.6a7.5 7.5 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7.5 7.5 0 0 0 2 1.2l.4 2.6h5l.4-2.6a7.5 7.5 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2Z",
};

export function Icon({ name, size = 22 }: { name: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}

/** Round tick button used for runs, sessions and single sets. */
export function Tick({ done, onClick, label, size = "md" }: { done: boolean; onClick: () => void; label: string; size?: "md" | "lg" | "sm" }) {
  return (
    <button className={`tick tick-${size} ${done ? "done" : ""}`} onClick={onClick} aria-pressed={done} aria-label={label}>
      <Icon name="check" size={size === "lg" ? 26 : size === "sm" ? 16 : 20} />
    </button>
  );
}

export function SettingsButton() {
  const { openSettings } = useApp();
  return (
    <button className="icon-btn" onClick={openSettings} aria-label="Ustawienia">
      <Icon name="gear" size={20} />
    </button>
  );
}

/** Parses "62,5" or "62.5"; empty → null, garbage → NaN. */
export function parseNum(text: string): number | null {
  const t = text.trim().replace(",", ".");
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? n : NaN;
}

export function numText(n: number | null | undefined): string {
  return n === null || n === undefined ? "" : String(n).replace(".", ",");
}
