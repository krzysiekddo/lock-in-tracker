import { addDays, todayKey, weekdayIndex } from "./dates";
import type { DayLog, Exercise, ExerciseLog, GymLog, Plan, RunLog, SetLog, Template } from "./types";

export function uid(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10);
}

const ex = (name: string, sets: number, reps: string): Exercise => ({ id: uid(), name, sets, reps });

/** A starting point the user edits in the Plan tab: push / pull / legs and runs on Tue, Thu, Sun. */
export function defaultPlan(): Plan {
  const push: Template = {
    id: uid(),
    name: "Push",
    exercises: [
      ex("Wyciskanie sztangi na ławce", 4, "6–8"),
      ex("Wyciskanie hantli na skosie", 3, "8–10"),
      ex("Wyciskanie żołnierskie", 3, "8–10"),
      ex("Wznosy bokiem", 3, "12–15"),
      ex("Prostowanie ramion na wyciągu", 3, "10–12"),
    ],
  };
  const pull: Template = {
    id: uid(),
    name: "Pull",
    exercises: [
      ex("Martwy ciąg", 3, "5"),
      ex("Podciąganie", 4, "6–10"),
      ex("Wiosłowanie sztangą", 3, "8–10"),
      ex("Face pull", 3, "12–15"),
      ex("Uginanie ramion ze sztangą", 3, "10–12"),
    ],
  };
  const legs: Template = {
    id: uid(),
    name: "Nogi",
    exercises: [
      ex("Przysiad ze sztangą", 4, "6–8"),
      ex("Rumuński martwy ciąg", 3, "8–10"),
      ex("Wykroki", 3, "10"),
      ex("Prostowanie nóg na maszynie", 3, "12"),
      ex("Wspięcia na palce", 4, "12–15"),
    ],
  };
  return {
    templates: [push, pull, legs],
    week: [
      { gym: push.id, run: false },
      { gym: null, run: true },
      { gym: pull.id, run: false },
      { gym: null, run: true },
      { gym: legs.id, run: false },
      { gym: null, run: false },
      { gym: null, run: true },
    ],
    since: todayKey(),
  };
}

export function findTemplate(plan: Plan, id: string | null | undefined): Template | null {
  return (id && plan.templates.find((t) => t.id === id)) || null;
}

export type DayStatus = {
  /** Gym from the weekly plan (may be replaced by a different session in the log). */
  plannedTemplate: Template | null;
  showGym: boolean;
  showRun: boolean;
  gym: GymLog | null;
  run: RunLog | null;
  total: number;
  done: number;
  /** Before the plan existed: not counted as missed. */
  beforeStart: boolean;
};

export function dayStatus(plan: Plan, log: DayLog | undefined, key: string): DayStatus {
  const wd = plan.week[weekdayIndex(key)] ?? { gym: null, run: false };
  const plannedTemplate = findTemplate(plan, wd.gym);
  const gym = log?.gym ?? null;
  const run = log?.run ?? null;
  const showGym = !!gym || (!!plannedTemplate && !log?.skipGym);
  const showRun = !!run || (wd.run && !log?.skipRun);
  const total = Number(showGym) + Number(showRun);
  const done = Number(showGym && !!gym?.done) + Number(showRun && !!run?.done);
  return { plannedTemplate, showGym, showRun, gym, run, total, done, beforeStart: key < (plan.since ?? key) };
}

const norm = (name: string) => name.trim().toLowerCase();

/** Sets from the most recent earlier session of this exercise that has any numbers in it. */
export function lastSets(days: DayLog[], name: string, before: string): { date: string; sets: SetLog[] } | null {
  const target = norm(name);
  let best: { date: string; sets: SetLog[] } | null = null;
  for (const d of days) {
    if (d.date >= before || !d.gym) continue;
    if (best && d.date <= best.date) continue;
    const e = d.gym.exercises.find((x) => norm(x.name) === target);
    const sets = e?.sets.filter((s) => s.weight !== null || s.reps !== null) ?? [];
    if (sets.length) best = { date: d.date, sets };
  }
  return best;
}

export function newExerciseLog(days: DayLog[], date: string, name: string, sets: number, target?: string): ExerciseLog {
  const last = lastSets(days, name, date);
  return {
    id: uid(),
    name,
    target,
    sets: Array.from({ length: Math.max(1, sets) }, (_, i) => ({
      // Start from last time's weights; reps are typed (or confirmed with the tick).
      weight: last ? (last.sets[i] ?? last.sets[last.sets.length - 1]).weight : null,
      reps: null,
      done: false,
    })),
  };
}

export function newGymLog(days: DayLog[], date: string, template: Template, extra = false): GymLog {
  return {
    templateId: template.id,
    name: template.name,
    done: false,
    extra: extra || undefined,
    exercises: template.exercises.map((e) => newExerciseLog(days, date, e.name, e.sets, e.reps)),
  };
}

/** First number in a reps target: "8–10" → 8. */
export function targetReps(target: string | undefined): number | null {
  const m = target?.match(/\d+/);
  return m ? Number(m[0]) : null;
}

export function formatSets(sets: SetLog[]): string {
  return sets
    .map((s) => {
      const w = s.weight !== null ? `${formatKg(s.weight)}` : "–";
      return s.reps !== null ? `${w}×${s.reps}` : w;
    })
    .join(", ");
}

export function formatKg(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace(".", ",");
}

/** Planned sessions done in a row, counting back from today (today only once it is done). */
export function streak(plan: Plan, byDate: Map<string, DayLog>, today: string): number {
  let count = 0;
  let key = today;
  for (let i = 0; i < 3660; i++) {
    const s = dayStatus(plan, byDate.get(key), key);
    if (s.beforeStart && !byDate.has(key)) break;
    if (key === today) {
      count += s.done;
    } else {
      if (s.done < s.total) break;
      count += s.done;
    }
    key = addDays(key, -1);
  }
  return count;
}

export type ExerciseStat = { name: string; lastDate: string; last: SetLog[]; best: { weight: number; reps: number | null; date: string } | null; sessions: number };

export function exerciseStats(days: DayLog[]): ExerciseStat[] {
  const map = new Map<string, ExerciseStat>();
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  for (const d of sorted) {
    for (const e of d.gym?.exercises ?? []) {
      const sets = e.sets.filter((s) => s.done || s.weight !== null);
      const filled = sets.filter((s) => s.weight !== null || s.reps !== null);
      if (!filled.length) continue;
      const key = norm(e.name);
      const stat = map.get(key) ?? { name: e.name, lastDate: d.date, last: filled, best: null, sessions: 0 };
      stat.name = e.name;
      stat.lastDate = d.date;
      stat.last = filled;
      stat.sessions += 1;
      for (const s of filled) {
        if (s.weight === null) continue;
        if (!stat.best || s.weight > stat.best.weight || (s.weight === stat.best.weight && (s.reps ?? 0) > (stat.best.reps ?? 0))) {
          stat.best = { weight: s.weight, reps: s.reps, date: d.date };
        }
      }
      map.set(key, stat);
    }
  }
  return [...map.values()].sort((a, b) => b.lastDate.localeCompare(a.lastDate));
}

/** Total kilograms moved (weight × reps of ticked sets). */
export function volume(gym: GymLog): number {
  let v = 0;
  for (const e of gym.exercises) for (const s of e.sets) if (s.done && s.weight && s.reps) v += s.weight * s.reps;
  return Math.round(v);
}
