import {
  collection,
  deleteDoc,
  doc,
  getDocFromServer,
  getDocs,
  onSnapshot,
  setDoc,
  writeBatch,
  type Firestore,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import type { DayLog, Plan } from "./types";

// Separate root from Runs (users/{uid}), so both apps can share one Firebase project.
const ROOT = "lockin";

export type UserData = {
  loading: boolean;
  error: string | null;
  plan: Plan | null;
  days: DayLog[];
  /** Local changes the server has not confirmed yet. */
  pendingWrites: boolean;
};

function describe(e: unknown): string {
  const code = (e as { code?: string })?.code ?? "";
  const message = (e as { message?: string })?.message ?? "";
  if (code === "permission-denied")
    return "Serwer odrzucił dostęp. Wklej reguły z pliku firestore.rules w Firebase: Firestore Database > Rules > Publish.";
  if (code === "not-found" || /does not exist/i.test(message))
    return "Baza Firestore nie istnieje. Utwórz ją w Firebase: Firestore Database > Create database.";
  if (code === "unavailable" || code === "deadline-exceeded" || code === "timeout")
    return "Brak połączenia z bazą Firestore. Jeśli internet działa, sprawdź w Firebase, czy baza Firestore jest utworzona.";
  return `Błąd bazy danych${code ? ` (${code})` : ""}.`;
}

export function useUserData(db: Firestore, uid: string): UserData {
  const [state, setState] = useState<UserData>({ loading: true, error: null, plan: null, days: [], pendingWrites: false });

  useEffect(() => {
    let planPending = false;
    let daysPending = false;
    const fail = (e: unknown) => {
      console.error(e);
      setState((s) => ({ ...s, loading: false, error: describe(e) }));
    };
    const unsubPlan = onSnapshot(
      doc(db, ROOT, uid),
      { includeMetadataChanges: true },
      (snap) => {
        planPending = snap.metadata.hasPendingWrites;
        const data = snap.data() as { plan?: Plan } | undefined;
        setState((s) => ({ ...s, loading: false, plan: data?.plan ?? null, pendingWrites: planPending || daysPending }));
      },
      fail,
    );
    const unsubDays = onSnapshot(
      collection(db, ROOT, uid, "days"),
      { includeMetadataChanges: true },
      (snap) => {
        daysPending = snap.metadata.hasPendingWrites;
        const days = snap.docs.map((d) => ({ ...(d.data() as DayLog), date: d.id }));
        setState((s) => ({ ...s, days, pendingWrites: planPending || daysPending }));
      },
      fail,
    );
    return () => {
      unsubPlan();
      unsubDays();
    };
  }, [db, uid]);

  return state;
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(Object.assign(new Error("timeout"), { code: "timeout" })), ms)),
  ]);
}

/** Asks the server directly, so a missing database or wrong rules show up as a clear message. */
export function useServerStatus(db: Firestore, uid: string, recheck: unknown): string | null {
  const [problem, setProblem] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    withTimeout(getDocFromServer(doc(db, ROOT, uid)), 12_000).then(
      () => alive && setProblem(null),
      (e) => {
        console.error(e);
        if (alive) setProblem(describe(e));
      },
    );
    return () => {
      alive = false;
    };
  }, [db, uid, recheck]);
  return problem;
}

// Writes land in the local cache at once and the UI updates from it;
// the server write finishes in the background and errors come back through the promise.
export function savePlan(db: Firestore, uid: string, plan: Plan) {
  return setDoc(doc(db, ROOT, uid), { plan });
}

export function saveDay(db: Firestore, uid: string, day: DayLog) {
  return setDoc(doc(db, ROOT, uid, "days", day.date), day);
}

export function deleteDay(db: Firestore, uid: string, date: string) {
  return deleteDoc(doc(db, ROOT, uid, "days", date));
}

/** Removes the plan and every logged day of this user. */
export async function deleteAllData(db: Firestore, uid: string) {
  const days = await getDocs(collection(db, ROOT, uid, "days"));
  const batch = writeBatch(db);
  days.forEach((d) => batch.delete(d.ref));
  batch.delete(doc(db, ROOT, uid));
  return batch.commit();
}
