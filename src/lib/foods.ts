// Common foods and dishes for eyeballing a meal: macros per 100 g plus a typical portion.
// Values are rounded averages (Polish tables / product labels), good enough for tracking.

export type FoodItem = {
  name: string;
  /** Extra words that should find this item in search. */
  tags?: string;
  portion: string;
  grams: number;
  /** Per 100 g. */
  p: number;
  c: number;
  f: number;
};

const x = (name: string, portion: string, grams: number, p: number, c: number, f: number, tags?: string): FoodItem => ({
  name,
  portion,
  grams,
  p,
  c,
  f,
  tags,
});

export const FOOD_DB: FoodItem[] = [
  // Breakfast & dairy
  x("Owsianka na mleku", "1 miska", 300, 5, 15, 3, "płatki owsiane śniadanie"),
  x("Płatki owsiane", "60 g", 60, 13, 60, 7, "owsianka"),
  x("Jajecznica z 3 jaj", "1 porcja", 170, 12, 1, 13, "jajka śniadanie"),
  x("Jajko gotowane", "1 szt.", 55, 13, 1, 10, "jajka"),
  x("Kanapka z wędliną", "1 szt.", 90, 11, 30, 7, "chleb szynka"),
  x("Kanapka z serem", "1 szt.", 85, 11, 28, 12, "chleb ser żółty"),
  x("Chleb pszenny", "1 kromka", 35, 8, 50, 2, "pieczywo"),
  x("Chleb żytni", "1 kromka", 40, 6, 45, 1.5, "pieczywo razowy"),
  x("Bułka kajzerka", "1 szt.", 50, 9, 56, 3, "pieczywo"),
  x("Skyr naturalny", "1 kubek", 150, 11, 4, 0, "jogurt"),
  x("Jogurt naturalny", "1 kubek", 150, 4, 6, 3, ""),
  x("Twaróg chudy", "½ kostki", 125, 18, 3.5, 0.5, "biały ser"),
  x("Serek wiejski", "1 opak.", 200, 11, 2, 5, "cottage"),
  x("Ser żółty", "1 plaster", 15, 26, 0, 28, "gouda"),
  x("Mleko 2%", "1 szklanka", 250, 3.2, 4.8, 2, ""),
  x("Odżywka białkowa (WPC)", "1 miarka", 30, 75, 8, 6, "białko shake protein"),
  x("Musli / granola", "50 g", 50, 9, 62, 15, "płatki"),

  // Meat & fish
  x("Pierś z kurczaka (pieczona)", "1 porcja", 150, 30, 0, 3.5, "kurczak filet"),
  x("Udko z kurczaka", "1 szt.", 120, 20, 0, 12, "kurczak"),
  x("Kotlet schabowy", "1 szt.", 150, 20, 10, 18, "panierowany schab"),
  x("Mielone (kotlet)", "1 szt.", 120, 15, 10, 20, "mielony"),
  x("Wołowina (stek)", "1 porcja", 180, 26, 0, 10, "stek"),
  x("Indyk (pierś)", "1 porcja", 150, 29, 0, 2, ""),
  x("Szynka / wędlina", "3 plastry", 45, 18, 2, 5, "wędlina"),
  x("Kiełbasa", "1 porcja", 100, 13, 2, 27, ""),
  x("Parówki", "2 szt.", 100, 12, 2, 22, ""),
  x("Łosoś", "1 porcja", 125, 20, 0, 13, "ryba"),
  x("Dorsz / mintaj", "1 porcja", 150, 18, 0, 1, "ryba biała"),
  x("Tuńczyk w sosie własnym", "1 puszka", 120, 24, 0, 1, "ryba"),

  // Carbs
  x("Ryż biały (ugotowany)", "1 porcja", 200, 2.7, 28, 0.3, "ryż"),
  x("Makaron (ugotowany)", "1 porcja", 220, 5.5, 30, 1, "spaghetti"),
  x("Ziemniaki gotowane", "1 porcja", 250, 2, 17, 0.1, ""),
  x("Frytki", "1 porcja", 150, 3.5, 35, 15, "fast food"),
  x("Kasza gryczana (ugotowana)", "1 porcja", 180, 4, 20, 1, "kasza"),
  x("Kasza bulgur (ugotowana)", "1 porcja", 180, 3, 19, 0.3, "kasza"),
  x("Tortilla pszenna", "1 szt.", 60, 8, 50, 7, "wrap placek"),

  // Dishes
  x("Pierogi ruskie", "8 szt.", 280, 6, 28, 6, "pierogi"),
  x("Pierogi z mięsem", "8 szt.", 280, 9, 25, 8, "pierogi"),
  x("Spaghetti bolognese", "1 talerz", 400, 7, 17, 5, "makaron"),
  x("Kurczak z ryżem i warzywami", "1 pudełko", 400, 11, 16, 3, "meal prep obiad"),
  x("Zupa (pomidorowa, ogórkowa)", "1 talerz", 350, 1.5, 7, 2, "zupa"),
  x("Rosół z makaronem", "1 talerz", 350, 3, 5, 2, "zupa"),
  x("Żurek z jajkiem i kiełbasą", "1 talerz", 400, 4, 6, 6, "zupa"),
  x("Bigos", "1 porcja", 300, 7, 6, 9, ""),
  x("Gulasz z kaszą", "1 porcja", 400, 8, 12, 5, "obiad"),
  x("Naleśniki z serem", "2 szt.", 220, 9, 25, 7, "słodkie"),
  x("Pizza", "2 kawałki", 220, 11, 30, 10, "fast food"),
  x("Kebab w bułce", "1 szt.", 400, 11, 20, 11, "fast food"),
  x("Burger", "1 szt.", 250, 13, 25, 13, "fast food hamburger"),
  x("Sushi (maki/nigiri)", "8 szt.", 240, 6, 30, 3, ""),
  x("Sałatka z kurczakiem", "1 miska", 300, 9, 5, 7, "sałata"),
  x("Wrap z kurczakiem", "1 szt.", 250, 11, 22, 8, "tortilla"),
  x("Zapiekanka", "1 szt.", 300, 9, 30, 10, "fast food"),

  // Fruit & veg
  x("Banan", "1 szt.", 120, 1.1, 23, 0.3, "owoc"),
  x("Jabłko", "1 szt.", 180, 0.3, 12, 0.2, "owoc"),
  x("Truskawki / borówki", "1 miseczka", 150, 0.8, 10, 0.4, "owoce"),
  x("Warzywa (mix)", "1 porcja", 200, 2, 5, 0.3, "surówka sałatka brokuł"),

  // Fats & snacks
  x("Masło orzechowe", "1 łyżka", 20, 25, 13, 50, ""),
  x("Orzechy (mix)", "garść", 30, 18, 14, 55, "migdały"),
  x("Awokado", "½ szt.", 75, 2, 9, 15, ""),
  x("Oliwa / olej", "1 łyżka", 10, 0, 0, 100, "tłuszcz"),
  x("Masło", "na 2 kromki", 10, 0.7, 0.7, 82, "tłuszcz"),
  x("Baton proteinowy", "1 szt.", 60, 33, 35, 13, "białko"),
  x("Czekolada", "½ tabliczki", 50, 7, 55, 32, "słodycze"),
  x("Batonik (Snickers itp.)", "1 szt.", 50, 9, 60, 23, "słodycze"),
  x("Chipsy", "½ paczki", 70, 6, 52, 33, "przekąska"),
  x("Lody", "2 gałki", 120, 3.5, 24, 10, "słodycze deser"),
  x("Ciasto (sernik, szarlotka)", "1 kawałek", 120, 6, 35, 15, "deser"),

  // Drinks
  x("Sok owocowy", "1 szklanka", 250, 0.5, 10, 0, "napój"),
  x("Cola / napój słodzony", "puszka", 330, 0, 10.6, 0, "napój"),
  x("Piwo", "0,5 l", 500, 0.5, 3.5, 0, "alkohol"),
  x("Kawa z mlekiem", "1 kubek", 250, 1.5, 2, 1, "latte cappuccino"),
];

export type Amount = { p: number; c: number; f: number; kcal: number };

export function forGrams(item: { p: number; c: number; f: number }, grams: number): Amount {
  const k = grams / 100;
  const p = Math.round(item.p * k);
  const c = Math.round(item.c * k);
  const f = Math.round(item.f * k);
  return { p, c, f, kcal: Math.round((item.p * 4 + item.c * 4 + item.f * 9) * k) };
}

const fold = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ł/g, "l");

export function searchFoods(query: string): FoodItem[] {
  const words = fold(query).split(/\s+/).filter(Boolean);
  if (!words.length) return FOOD_DB;
  return FOOD_DB.filter((it) => {
    const hay = fold(`${it.name} ${it.tags ?? ""}`);
    return words.every((w) => hay.includes(w));
  });
}
