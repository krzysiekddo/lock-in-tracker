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
};
