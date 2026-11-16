import type { NutritionProfile } from "./nutrition";

/** One exercise in a gym template: target sets and reps (reps as text, e.g. "8–10"). */
export type Exercise = { id: string; name: string; sets: number; reps: string };

/** A named gym session, e.g. Push / Pull / Legs. */
export type Template = { id: string; name: string; exercises: Exercise[] };

/** What is planned on one weekday. */
export type DayPlan = { gym: string | null; run: boolean };

export type Plan = {
  templates: Template[];
  /** Seven days, Monday first. */
  week: DayPlan[];
  /** First day of tracking (YYYY-MM-DD); earlier days are not counted as missed. */
  since: string;
  /** Body data for the macro calculator; absent until filled in. */
  nutrition?: NutritionProfile;
};

export type SetLog = { weight: number | null; reps: number | null; done: boolean };

export type ExerciseLog = { id: string; name: string; target?: string; sets: SetLog[] };

export type GymLog = {
  templateId: string | null;
  name: string;
  done: boolean;
  /** Empty when the session was just ticked off without details. */
  exercises: ExerciseLog[];
  /** Added on a day without gym in the plan. */
  extra?: boolean;
};

export type RunLog = { done: boolean; km?: number | null; extra?: boolean };

/** Everything recorded on one calendar day; the document id is the date (YYYY-MM-DD). */
export type DayLog = {
  date: string;
  run?: RunLog | null;
  gym?: GymLog | null;
  /** The plan said gym/run, but it was dropped for this day. */
  skipGym?: boolean;
  skipRun?: boolean;
  /** What was eaten that day. */
  meals?: Meal[];
};

/** One logged meal or snack; macros in grams. */
export type Meal = {
  id: string;
  name: string;
  /** "HH:MM", when it was added. */
  time: string;
  kcal: number;
  p: number;
  c: number;
  f: number;
  /** For items from the food list: grams eaten. */
  grams?: number;
  /** Parts of a composed meal (e.g. yoghurt + granola); totals above are their sum. */
  items?: MealItem[];
};

export type MealItem = { name: string; grams?: number; kcal: number; p: number; c: number; f: number };
