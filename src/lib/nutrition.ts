// Estimates daily calories and macros from the user's body data and what the day holds.
// BMR: Mifflin-St Jeor. Training adds energy on top of everyday activity, so the
// carbohydrate target moves with the day while protein stays steady.

export type Sex = "m" | "f";
export type Activity = "low" | "medium" | "high";
export type Goal = "cut" | "maintain" | "bulk";

export type NutritionProfile = {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  /** Everyday movement outside workouts (job, steps). */
  activity: Activity;
  goal: Goal;
  /** Typical run distance, used when a run has no kilometres logged. */
  runKm: number;
  /** Typical gym session length. */
  gymMin: number;
};

export type DayKind = "rest" | "gym" | "run" | "both";

export type Macros = { kcal: number; protein: number; carbs: number; fat: number };

export const ACTIVITY: Record<Activity, { label: string; hint: string; factor: number }> = {
  low: { label: "Mało ruchu", hint: "Praca przy biurku, < 6 tys. kroków", factor: 1.25 },
  medium: { label: "Średnio", hint: "Trochę chodzenia, 6–10 tys. kroków", factor: 1.4 },
  high: { label: "Dużo ruchu", hint: "Praca fizyczna albo > 10 tys. kroków", factor: 1.55 },
};

export const GOALS: Record<Goal, { label: string; hint: string; kcal: number }> = {
  cut: { label: "Redukcja", hint: "Spokojnie w dół, ok. 0,5 kg na tydzień", kcal: -400 },
  maintain: { label: "Utrzymanie", hint: "Ta sama waga, lepsza forma", kcal: 0 },
  bulk: { label: "Masa", hint: "Powoli w górę, bez zbędnego tłuszczu", kcal: 250 },
};

export const DAY_KINDS: Record<DayKind, string> = {
  rest: "Wolny",
  gym: "Siłownia",
  run: "Bieg",
  both: "Siłownia + bieg",
};

export function bmr(p: NutritionProfile): number {
  return 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + (p.sex === "m" ? 5 : -161);
}

/** Net extra energy of a gym session (~4 kcal per kg per hour of lifting). */
export function gymKcal(p: NutritionProfile): number {
  return Math.round(4 * p.weightKg * (p.gymMin / 60));
}

/** Net extra energy of a run (~0.9 kcal per kg per km). */
export function runKcal(p: NutritionProfile, km?: number | null): number {
  return Math.round(0.9 * p.weightKg * (km || p.runKm));
}

const round5 = (n: number) => Math.round(n / 5) * 5;

export function dayMacros(p: NutritionProfile, kind: DayKind, km?: number | null): Macros & { training: number } {
  const base = bmr(p) * ACTIVITY[p.activity].factor;
  const training = (kind === "gym" || kind === "both" ? gymKcal(p) : 0) + (kind === "run" || kind === "both" ? runKcal(p, km) : 0);
  // Never go far below what the body burns at rest, whatever the goal.
  const kcal = Math.max(Math.round(bmr(p) * 1.1), Math.round(base + training + GOALS[p.goal].kcal));

  const protein = Math.round(p.weightKg * (p.goal === "cut" ? 2.2 : 1.8));
  const fat = Math.round(Math.max(p.weightKg * 0.8, (kcal * 0.25) / 9));
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  return { kcal: round5(kcal), protein, carbs, fat, training };
}

export const DAY_TIPS: Record<DayKind, { title: string; tips: string[] }> = {
  rest: {
    title: "Dzień regeneracji",
    tips: [
      "Mniej węgli niż w dni treningowe, białko bez zmian — mięśnie rosną właśnie teraz.",
      "Więcej warzyw i owoców: błonnik i witaminy zamiast dużych porcji ryżu czy makaronu.",
      "Pij sporo wody, zwłaszcza po wczorajszym treningu.",
    ],
  },
  gym: {
    title: "Dzień siłowy",
    tips: [
      "1,5–2 h przed treningiem: posiłek z białkiem i węglami (np. ryż z kurczakiem, owsianka ze skyrem).",
      "Po treningu 30–40 g białka i porcja węgli, żeby szybciej się zregenerować.",
      "Białko rozłóż na 3–5 posiłków po 25–40 g zamiast jednej wielkiej porcji.",
    ],
  },
  run: {
    title: "Dzień biegowy",
    tips: [
      "Więcej węgli — to paliwo do biegu. Najwięcej zjedz w posiłku 2–3 h przed wyjściem.",
      "Tuż przed biegiem coś lekkiego: banan, kromka z dżemem. Unikaj tłustego i dużo błonnika.",
      "Po biegu uzupełnij węgle i dorzuć 20–30 g białka. Przy dłuższym biegu nie zapomnij o soli i wodzie.",
    ],
  },
  both: {
    title: "Siłownia i bieg tego samego dnia",
    tips: [
      "Najwyższe zapotrzebowanie w tygodniu — nie bój się porządnych porcji węgli.",
      "Między treningami zjedz posiłek z węglami i białkiem, żeby mieć siłę na drugi.",
      "Jeśli możesz, rozdziel je o kilka godzin; siłownię zwykle lepiej zrobić pierwszą.",
    ],
  },
};

export type Food = { name: string; portion: string; protein: number; carbs: number; fat: number; kcal: number };

const f = (name: string, portion: string, protein: number, carbs: number, fat: number): Food => ({
  name,
  portion,
  protein,
  carbs,
  fat,
  kcal: Math.round(protein * 4 + carbs * 4 + fat * 9),
});

export const FOODS: Record<"protein" | "carbs" | "fat", { title: string; items: Food[] }> = {
  protein: {
    title: "Białko",
    items: [
      f("Pierś z kurczaka", "150 g (surowa)", 34, 0, 2),
      f("Skyr naturalny", "1 kubek, 150 g", 17, 6, 0),
      f("Twaróg chudy", "½ kostki, 125 g", 22, 4, 1),
      f("Jajka", "3 szt.", 19, 1, 15),
      f("Tuńczyk w sosie własnym", "1 puszka, 120 g", 28, 0, 1),
      f("Odżywka białkowa", "1 miarka, 30 g", 23, 2, 2),
      f("Serek wiejski light", "1 opak., 200 g", 22, 4, 6),
      f("Łosoś", "125 g", 25, 0, 16),
    ],
  },
  carbs: {
    title: "Węglowodany",
    items: [
      f("Ryż biały", "100 g (suchy)", 7, 78, 1),
      f("Płatki owsiane", "60 g", 8, 36, 4),
      f("Makaron", "100 g (suchy)", 12, 71, 2),
      f("Ziemniaki", "300 g", 6, 51, 0),
      f("Banan", "1 duży", 1, 27, 0),
      f("Chleb żytni", "2 kromki", 5, 32, 1),
      f("Kasza gryczana", "80 g (sucha)", 10, 55, 2),
      f("Wafle ryżowe z dżemem", "3 wafle + łyżka", 2, 34, 1),
    ],
  },
  fat: {
    title: "Tłuszcze",
    items: [
      f("Oliwa", "1 łyżka", 0, 0, 10),
      f("Masło orzechowe", "1 łyżka, 20 g", 5, 3, 10),
      f("Orzechy włoskie", "garść, 30 g", 5, 3, 20),
      f("Awokado", "½ szt.", 1, 5, 12),
      f("Ser żółty", "3 plastry, 45 g", 12, 0, 13),
      f("Gorzka czekolada 70%", "3 kostki, 20 g", 2, 7, 8),
    ],
  },
};

export function validProfile(p: Partial<NutritionProfile>): p is NutritionProfile {
  return (
    (p.sex === "m" || p.sex === "f") &&
    !!p.age && p.age >= 14 && p.age <= 100 &&
    !!p.heightCm && p.heightCm >= 120 && p.heightCm <= 230 &&
    !!p.weightKg && p.weightKg >= 35 && p.weightKg <= 250 &&
    !!p.activity && !!p.goal &&
    !!p.runKm && p.runKm > 0 && p.runKm <= 50 &&
    !!p.gymMin && p.gymMin >= 15 && p.gymMin <= 240
  );
}
