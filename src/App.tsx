import { FirebaseError } from "firebase/app";
import { onAuthStateChanged, signInWithPopup, type Auth, type User } from "firebase/auth";
import type { Firestore } from "firebase/firestore";
import { useCallback, useEffect, useMemo, useState } from "react";
import { auth, db, googleProvider } from "./firebase";
import { todayKey } from "./lib/dates";
import { defaultPlan } from "./lib/plan";
import { useSettings } from "./lib/settings";
import { deleteDay, saveDay, savePlan, useServerStatus, useUserData } from "./lib/store";
import type { DayLog, Plan } from "./lib/types";
import { AppCtx, Icon, Sheet } from "./ui/common";
import { History } from "./ui/History";
import { Nutrition } from "./ui/Nutrition";
import { PlanView } from "./ui/PlanView";
import { SettingsPanel } from "./ui/Settings";
import { RestTimer } from "./ui/RestTimer";
import { Today } from "./ui/Today";

const BRAND = "Lock In";

const IGNORED_ERRORS = ["auth/popup-closed-by-user", "auth/cancelled-popup-request"];

const ERROR_MESSAGES: Record<string, string> = {
  "auth/popup-blocked": "Przeglądarka zablokowała okno logowania. Zezwól na wyskakujące okna i spróbuj ponownie.",
  "auth/unauthorized-domain": "Ta domena nie jest dodana w Firebase: Authentication > Settings > Authorized domains.",
  "auth/operation-not-allowed": "Logowanie Google nie jest włączone w Firebase: Authentication > Sign-in method.",
  "auth/configuration-not-found": "Authentication nie jest jeszcze włączone w tym projekcie Firebase.",
  "auth/network-request-failed": "Brak połączenia. Sprawdź internet i spróbuj ponownie.",
};

export function App() {
  if (!auth || !db) {
    return (
      <main className="center-screen">
        <p className="brand">{BRAND}</p>
        <p className="muted">
          Brakuje konfiguracji Firebase. Skopiuj <code>.env.example</code> do <code>.env</code>, uzupełnij wartości i uruchom
          aplikację ponownie.
        </p>
      </main>
    );
  }
  return <AuthGate auth={auth} db={db} />;
}

function AuthGate({ auth, db }: { auth: Auth; db: Firestore }) {
  // undefined = Firebase has not restored the session yet
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => onAuthStateChanged(auth, setUser), [auth]);

  async function signIn() {
    setBusy(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      const code = e instanceof FirebaseError ? e.code : "";
      if (!IGNORED_ERRORS.includes(code)) {
        console.error(e);
        setError(ERROR_MESSAGES[code] ?? "Logowanie się nie udało. Spróbuj ponownie.");
      }
    } finally {
      setBusy(false);
    }
  }

  if (user === undefined) return <Loading />;
  if (user) return <Home db={db} user={user} />;

  return (
    <main className="center-screen login">
      <p className="brand">{BRAND}</p>
      <h1>Siłownia i bieganie. Odhaczasz, co zrobione.</h1>
      <p className="muted">Ustawiasz plan tygodnia, a potem codziennie widzisz, co masz do zrobienia.</p>
      <button className="primary" disabled={busy} onClick={signIn}>
        Zaloguj się przez Google
      </button>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </main>
  );
}

function Loading() {
  return (
    <main className="center-screen">
      <p className="brand pulse">{BRAND}</p>
    </main>
  );
}

type Tab = "today" | "plan" | "food" | "history";

const TABS: { id: Tab; label: string }[] = [
  { id: "today", label: "Dziś" },
  { id: "plan", label: "Plan" },
  { id: "food", label: "Jedzenie" },
  { id: "history", label: "Historia" },
];

function isEmpty(day: DayLog) {
  return !day.run && !day.gym && !day.skipGym && !day.skipRun && !day.meals?.length;
}

function Home({ db, user }: { db: Firestore; user: User }) {
  const data = useUserData(db, user.uid);
  const [tab, setTab] = useState<Tab>("today");
  const [today, setToday] = useState(todayKey);
  const [selected, setSelected] = useState(today);
  const [toast, setToast] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, updateSettings] = useSettings();
  const [rest, setRest] = useState<{ endsAt: number; total: number } | null>(null);
  const endRest = useCallback(() => setRest(null), []);
  const restDone = useCallback(() => {
    setRest(null);
    setToast("Koniec przerwy — następna seria 💪");
  }, []);

  // Roll over to the new day when the app is reopened after midnight.
  useEffect(() => {
    const check = () => {
      const now = todayKey();
      setToday((prev) => {
        if (prev !== now) setSelected((s) => (s === prev ? now : s));
        return now;
      });
    };
    const id = setInterval(check, 60_000);
    document.addEventListener("visibilitychange", check);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", check);
    };
  }, []);

  const serverProblem = useServerStatus(db, user.uid, data.pendingWrites);
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    if (!data.pendingWrites) return setStuck(false);
    const t = setTimeout(() => setStuck(true), 10_000);
    return () => clearTimeout(t);
  }, [data.pendingWrites]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const byDate = useMemo(() => new Map(data.days.map((d) => [d.date, d])), [data.days]);

  const storePlan = useCallback(
    (plan: Plan, message?: string) => {
      savePlan(db, user.uid, plan).catch((e) => {
        console.error(e);
        setToast("Serwer nie przyjął zmian w planie.");
      });
      if (message) setToast(message);
    },
    [db, user.uid],
  );

  const storeDay = useCallback(
    (day: DayLog) => {
      const write = isEmpty(day) ? deleteDay(db, user.uid, day.date) : saveDay(db, user.uid, day);
      write.catch((e) => {
        console.error(e);
        setToast("Serwer nie przyjął zmian.");
      });
    },
    [db, user.uid],
  );

  const banner =
    serverProblem ??
    (stuck ? "Zmiany są zapisane na tym urządzeniu, ale jeszcze nie dotarły na serwer. Sprawdź połączenie z internetem." : null);

  if (data.error) {
    return (
      <main className="center-screen">
        <p className="brand">{BRAND}</p>
        <p className="error">{data.error}</p>
      </main>
    );
  }
  if (data.loading) return <Loading />;

  if (!data.plan) {
    return (
      <main className="center-screen welcome">
        {banner && <SyncBanner text={banner} />}
        <p className="brand">{BRAND}</p>
        <h1>Ustawmy Twój tydzień</h1>
        <p className="muted">
          Na start: Push / Pull / Nogi w poniedziałek, środę i piątek oraz bieg we wtorek, czwartek i niedzielę. Wszystko
          zmienisz w zakładce Plan.
        </p>
        <button
          className="primary"
          onClick={() => {
            storePlan(defaultPlan());
            setTab("plan");
          }}
        >
          Zacznij od przykładowego planu
        </button>
        <button
          className="secondary"
          onClick={() => {
            storePlan({ templates: [], week: Array.from({ length: 7 }, () => ({ gym: null, run: false })), since: todayKey() });
            setTab("plan");
          }}
        >
          Ułożę od zera
        </button>
      </main>
    );
  }

  return (
    <AppCtx.Provider
      value={{
        db,
        user,
        plan: data.plan,
        days: data.days,
        byDate,
        today,
        selected,
        select: setSelected,
        openDay: (date) => {
          setSelected(date);
          setTab("today");
          window.scrollTo(0, 0);
        },
        saveDay: storeDay,
        savePlan: storePlan,
        openSettings: () => setSettingsOpen(true),
        notify: setToast,
        startRest: (sec) => setRest({ endsAt: Date.now() + sec * 1000, total: sec }),
        stopRest: endRest,
      }}
    >
      <div className="app">
        {banner && <SyncBanner text={banner} />}
        <main className="content">
          {tab === "today" && <Today />}
          {tab === "plan" && <PlanView />}
          {tab === "food" && <Nutrition />}
          {tab === "history" && <History />}
        </main>

        <nav className="tabbar" aria-label="Nawigacja">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`tab ${tab === t.id ? "active" : ""}`}
              onClick={() => {
                setTab(t.id);
                if (t.id === "today" && tab === "today") setSelected(today);
              }}
              aria-current={tab === t.id ? "page" : undefined}
            >
              <Icon name={t.id} />
              <span>{t.label}</span>
            </button>
          ))}
        </nav>

        {rest && (
          <RestTimer
            endsAt={rest.endsAt}
            total={rest.total}
            onAdd={(sec) => setRest((r) => r && { endsAt: r.endsAt + sec * 1000, total: r.total + sec })}
            onDone={restDone}
            onSkip={endRest}
          />
        )}
        {settingsOpen && (
          <Sheet title="Ustawienia" onClose={() => setSettingsOpen(false)}>
            <SettingsPanel settings={settings} update={updateSettings} onClose={() => setSettingsOpen(false)} />
          </Sheet>
        )}
        {toast && (
          <div className="toast" role="status">
            {toast}
          </div>
        )}
      </div>
    </AppCtx.Provider>
  );
}

function SyncBanner({ text }: { text: string }) {
  return (
    <div className="sync-banner" role="alert">
      {text}
    </div>
  );
}
