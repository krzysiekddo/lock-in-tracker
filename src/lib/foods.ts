// Foods and dishes for eyeballing a meal. Each item is counted in its natural unit
// (eggs, slices, grams, spoons, plates) and may come in variants (lean/semi/full-fat
// cottage cheese, white/rye bread…). Macros are per 100 g, rounded averages from
// Polish tables and typical labels: good enough for tracking.

export type Macros100 = { p: number; c: number; f: number };

export type Variant = Macros100 & { label: string };

export type Unit = {
  /** Polish forms: 1, 2–4, 5+, and optionally a fraction (e.g. "talerza"). */
  forms: [string, string, string, string?];
  /** Grams in one unit (1 for g/ml). */
  grams: number;
  /** Quick picks. */
  steps: number[];
  /** Starting amount. */
  def: number;
  /** +/- increment. */
  inc: number;
};

export type FoodItem = {
  name: string;
  tags?: string;
  unit: Unit;
  variants: Variant[];
  /** Index of the default variant. */
  defVariant?: number;
};

// ---- units ----
const G = (steps = [50, 100, 150, 200, 250], def = 100, inc = 10): Unit => ({ forms: ["g", "g", "g"], grams: 1, steps, def, inc });
const ML = (steps = [100, 200, 250, 330, 500], def = 250): Unit => ({ forms: ["ml", "ml", "ml"], grams: 1, steps, def, inc: 50 });
const PCS = (forms: Unit["forms"], grams: number, steps = [1, 2, 3, 4], def = 1, inc = 1): Unit => ({ forms, grams, steps, def, inc });
const SZT = (grams: number, steps = [1, 2, 3], def = 1, inc = 0.5) => PCS(["szt.", "szt.", "szt."], grams, steps, def, inc);
const SPOON = (grams: number, def = 1) => PCS(["łyżka", "łyżki", "łyżek", "łyżki"], grams, [1, 2, 3], def, 0.5);
const TSP = (grams: number, def = 1) => PCS(["łyżeczka", "łyżeczki", "łyżeczek", "łyżeczki"], grams, [1, 2, 3], def, 0.5);
const PLATE = (grams: number) => PCS(["talerz", "talerze", "talerzy", "talerza"], grams, [0.5, 1, 1.5, 2], 1, 0.5);
const PORTION = (grams: number) => PCS(["porcja", "porcje", "porcji", "porcji"], grams, [0.5, 1, 1.5, 2], 1, 0.5);
const SLICE = (grams: number, def = 2) => PCS(["kromka", "kromki", "kromek", "kromki"], grams, [1, 2, 3, 4], def, 1);
const PLASTER = (grams: number, def = 2) => PCS(["plaster", "plastry", "plastrów", "plastra"], grams, [1, 2, 3, 4], def, 1);
const EGG = (grams: number, def = 2) => PCS(["jajko", "jajka", "jajek", "jajka"], grams, [1, 2, 3, 4, 5], def, 1);
const SLICE_PIZZA = PCS(["kawałek", "kawałki", "kawałków", "kawałka"], 110, [1, 2, 3, 4], 2, 1);

// ---- helpers ----
const v = (label: string, p: number, c: number, f: number): Variant => ({ label, p, c, f });
const one = (p: number, c: number, f: number) => [v("", p, c, f)];
const food = (name: string, unit: Unit, variants: Variant[], tags?: string, defVariant = 0): FoodItem => ({
  name,
  unit,
  variants,
  tags,
  defVariant,
});

export const FOOD_DB: FoodItem[] = [
  // ---------- eggs & breakfast ----------
  food("Jajecznica", EGG(60, 3), [v("na maśle", 11.5, 1, 14), v("na oleju", 11.5, 1, 14), v("bez tłuszczu", 12.5, 0.8, 10)], "jajka śniadanie"),
  food("Jajka sadzone", EGG(60, 2), [v("na maśle", 12, 0.8, 15), v("bez tłuszczu", 12.5, 0.8, 10)], "jajko śniadanie"),
  food("Jajko gotowane", EGG(55, 2), one(12.5, 0.8, 10), "jajka na twardo miękko"),
  food("Omlet", EGG(70, 3), [v("zwykły", 10, 2, 12), v("z serem", 13, 2, 16), v("na słodko (z mąką)", 9, 15, 10)], "jajka śniadanie"),
  food("Owsianka", PORTION(300), [v("na mleku", 5, 15, 3), v("na wodzie", 2.5, 12, 1.5), v("na mleku z odżywką", 9, 14, 3)], "płatki owsiane śniadanie"),
  food("Płatki owsiane", G([30, 40, 50, 60, 80, 100], 50), one(13, 60, 7), "owsianka suche"),
  food("Granola / musli", G([20, 30, 40, 50, 60], 40), [v("granola", 9, 62, 15), v("musli bez cukru", 10, 60, 7)], "płatki dodatek"),
  food("Płatki kukurydziane", G([30, 40, 50, 60], 40), one(7, 84, 1), "corn flakes"),
  food("Naleśniki", SZT(80, [1, 2, 3, 4], 2, 1), [v("z serem", 9, 25, 7), v("z dżemem", 6, 38, 6), v("z nutellą", 6, 40, 12)], "słodkie"),
  food("Tosty z serem", SZT(90, [1, 2, 3, 4], 2, 1), [v("z serem", 13, 30, 12), v("z serem i szynką", 15, 28, 11)], "kanapka"),
  food("Kanapka", SZT(90, [1, 2, 3, 4], 2, 1), [v("z wędliną", 11, 30, 7), v("z serem", 11, 28, 12), v("z jajkiem", 9, 28, 9), v("z twarożkiem", 10, 30, 5)], "chleb"),

  // ---------- dairy ----------
  food("Twaróg", G([50, 100, 125, 150, 200, 250], 125), [v("chudy", 18, 3.5, 0.5), v("półtłusty", 18, 3.7, 4.7), v("tłusty", 16, 3.5, 10)], "biały ser"),
  food("Jogurt", G([100, 150, 200, 250, 400], 150), [v("naturalny 2%", 4.3, 6, 2), v("grecki 10%", 4, 4, 10), v("typu greckiego 0%", 8, 4, 0), v("owocowy", 3.5, 14, 2.5)], "kubek"),
  food("Skyr", G([100, 150, 200, 300, 450], 150), [v("naturalny", 11, 4, 0), v("smakowy", 9, 10, 0.3)], "jogurt"),
  food("Serek wiejski", G([100, 150, 200], 200), [v("zwykły", 11, 2, 5), v("light", 12, 2, 2.5)], "cottage"),
  food("Ser żółty", PLASTER(15), [v("zwykły", 26, 0, 28), v("light", 30, 0, 16)], "gouda edam"),
  food("Mozzarella", G([30, 60, 125], 60), [v("zwykła", 18, 2, 18), v("light", 20, 2, 9)], "ser"),
  food("Feta / sałatkowy", G([30, 50, 100], 50), one(15, 2, 21), "ser"),
  food("Serek do smarowania", TSP(15, 2), [v("śmietankowy", 6, 4, 24), v("light", 9, 6, 9)], "almette philadelphia"),
  food("Mleko", ML([100, 200, 250, 300, 500], 250), [v("0,5%", 3.4, 5, 0.5), v("2%", 3.2, 4.8, 2), v("3,2%", 3.1, 4.7, 3.2), v("roślinne (owsiane)", 1, 7, 1.5)], ""),
  food("Kefir / maślanka", ML([200, 250, 400, 500], 400), [v("kefir", 3.4, 4.5, 2), v("maślanka", 3, 4.5, 1.5)], ""),
  food("Odżywka białkowa", PCS(["miarka", "miarki", "miarek", "miarki"], 30, [0.5, 1, 1.5, 2], 1, 0.5), [v("WPC", 75, 8, 6), v("izolat (WPI)", 88, 2, 1), v("roślinna", 70, 8, 7)], "białko shake protein"),

  // ---------- meat & fish ----------
  food("Pierś z kurczaka", G([100, 150, 200, 250, 300], 150), [v("pieczona / grillowana", 30, 0, 3.5), v("smażona", 28, 1, 8), v("panierowana", 22, 10, 10), v("surowa (waga)", 22, 0, 1.5)], "kurczak filet"),
  food("Udko z kurczaka", SZT(120, [1, 2, 3], 1, 1), [v("pieczone ze skórą", 20, 0, 12), v("bez skóry", 22, 0, 6)], "kurczak"),
  food("Indyk", G([100, 150, 200, 250], 150), one(29, 0, 2), "pierś"),
  food("Kotlet schabowy", SZT(150, [1, 2], 1, 0.5), one(20, 10, 18), "panierowany schab"),
  food("Kotlet mielony", SZT(120, [1, 2, 3], 1, 1), one(15, 10, 20), "mielony"),
  food("Wołowina", G([100, 150, 200, 250], 150), [v("stek", 26, 0, 10), v("mielona chuda", 21, 0, 8), v("mielona zwykła", 19, 0, 17)], "stek"),
  food("Wieprzowina", G([100, 150, 200], 150), [v("schab pieczony", 28, 0, 8), v("karkówka", 22, 0, 18), v("boczek", 14, 0, 40)], ""),
  food("Wędlina", PLASTER(15, 3), [v("szynka drobiowa", 19, 2, 3), v("szynka wieprzowa", 18, 2, 5), v("salami", 22, 1, 35)], "szynka"),
  food("Kiełbasa", G([50, 100, 150], 100), [v("zwykła", 13, 2, 27), v("drobiowa", 15, 2, 15)], ""),
  food("Parówki", SZT(50, [1, 2, 3, 4], 2, 1), [v("zwykłe", 12, 2, 22), v("z szynki (90% mięsa)", 15, 1, 17)], ""),
  food("Łosoś", G([100, 125, 150, 200], 125), [v("pieczony / świeży", 20, 0, 13), v("wędzony", 21, 0, 10)], "ryba"),
  food("Ryba biała", G([100, 150, 200], 150), [v("dorsz / mintaj", 18, 0, 1), v("panierowana", 13, 12, 8)], "dorsz mintaj"),
  food("Tuńczyk z puszki", G([60, 120, 170], 120), [v("w sosie własnym", 24, 0, 1), v("w oleju", 25, 0, 9)], "ryba"),

  // ---------- carbs ----------
  food("Chleb", SLICE(35), [v("pszenny", 8, 50, 2), v("żytni / razowy", 6, 45, 1.5), v("tostowy", 8, 48, 4), v("graham", 8, 46, 2)], "pieczywo"),
  food("Bułka", SZT(55, [1, 2, 3], 1, 0.5), [v("kajzerka", 9, 56, 3), v("grahamka", 9, 48, 3), v("maślana / słodka", 8, 52, 8)], "pieczywo"),
  food("Ryż", G([50, 100, 150, 200, 250, 300], 150), [v("ugotowany", 2.7, 28, 0.3), v("suchy (waga przed)", 7, 78, 1), v("brązowy ugotowany", 2.6, 23, 0.9)], "basmati jaśminowy"),
  food("Makaron", G([50, 100, 150, 200, 250, 300], 200), [v("ugotowany", 5.5, 30, 1), v("suchy (waga przed)", 12, 71, 2), v("pełnoziarnisty ugotowany", 5.5, 26, 1)], "spaghetti penne"),
  food("Kasza", G([50, 100, 150, 200, 250], 150), [v("gryczana ugotowana", 4, 20, 1), v("bulgur ugotowany", 3, 19, 0.3), v("jaglana ugotowana", 3.5, 23, 1), v("sucha (waga przed)", 12, 70, 2.5)], "kuskus"),
  food("Ziemniaki", G([100, 150, 200, 250, 300, 400], 250), [v("gotowane", 2, 17, 0.1), v("pieczone z olejem", 2.5, 20, 5), v("puree", 2, 14, 4)], ""),
  food("Frytki", G([100, 150, 200], 150), one(3.5, 35, 15), "fast food"),
  food("Tortilla / wrap", SZT(60, [1, 2], 1, 1), [v("pszenna", 8, 50, 7), v("pełnoziarnista", 9, 45, 7)], "placek"),
  food("Wafle ryżowe", SZT(9, [1, 2, 3, 4, 6], 3, 1), one(8, 81, 3), ""),

  // ---------- dishes ----------
  food("Pierogi", PCS(["szt.", "szt.", "szt."], 35, [4, 6, 8, 10, 12], 8, 1), [v("ruskie", 6, 28, 6), v("z mięsem", 9, 25, 8), v("z kapustą i grzybami", 5, 26, 5), v("z owocami", 5, 35, 3)], ""),
  food("Spaghetti bolognese", PLATE(400), one(7, 17, 5), "makaron"),
  food("Kurczak z ryżem i warzywami", PCS(["pudełko", "pudełka", "pudełek", "pudełka"], 400, [0.5, 1, 1.5, 2], 1, 0.5), one(11, 16, 3), "meal prep obiad"),
  food("Zupa", PLATE(350), [v("pomidorowa / ogórkowa", 1.5, 7, 2), v("rosół z makaronem", 3, 5, 2), v("żurek z jajkiem i kiełbasą", 4, 6, 6), v("krem z dyni / warzyw", 1.5, 7, 3)], ""),
  food("Bigos", PORTION(300), one(7, 6, 9), ""),
  food("Gulasz", PORTION(250), one(13, 4, 9), "mięso sos"),
  food("Pizza", SLICE_PIZZA, [v("margherita", 11, 30, 9), v("z salami / szynką", 12, 29, 11)], "fast food"),
  food("Kebab", SZT(400, [1], 1, 0.5), [v("w bułce", 11, 20, 11), v("w tortilli", 11, 18, 10), v("box z frytkami", 10, 20, 12)], "fast food"),
  food("Burger", SZT(250, [1, 2], 1, 1), [v("klasyczny", 13, 25, 13), v("z serem i bekonem", 14, 22, 17)], "fast food hamburger"),
  food("Sushi", PCS(["kawałek", "kawałki", "kawałków"], 30, [4, 6, 8, 12, 16], 8, 1), [v("maki / nigiri", 6, 30, 3), v("futomaki / tempura", 6, 30, 7)], ""),
  food("Sałatka", PCS(["miska", "miski", "misek", "miski"], 300, [0.5, 1, 1.5], 1, 0.5), [v("z kurczakiem", 9, 5, 7), v("grecka", 4, 5, 10), v("z tuńczykiem", 9, 5, 6)], "sałata"),
  food("Zapiekanka", SZT(300, [0.5, 1], 1, 0.5), one(9, 30, 10), "fast food"),

  // ---------- veg & fruit ----------
  food("Pomidor", SZT(120, [0.5, 1, 2], 1), one(0.9, 3.6, 0.2), "warzywa dodatek"),
  food("Ogórek", SZT(150, [0.5, 1, 2], 1), one(0.7, 3, 0.1), "warzywa dodatek"),
  food("Papryka", SZT(160, [0.5, 1], 0.5), one(1, 5, 0.3), "warzywa dodatek"),
  food("Cebula", SZT(100, [0.5, 1], 0.5), one(1.4, 9, 0.1), "warzywa dodatek"),
  food("Warzywa", G([100, 150, 200, 300], 200), [v("mix / surówka", 2, 5, 0.3), v("brokuł / kalafior", 3, 4, 0.4), v("na patelnię z olejem", 2, 6, 4)], "surówka sałatka"),
  food("Banan", SZT(120, [0.5, 1, 2], 1), one(1.1, 23, 0.3), "owoc"),
  food("Jabłko", SZT(180, [0.5, 1, 2], 1), one(0.3, 12, 0.2), "owoc"),
  food("Owoce jagodowe", G([50, 100, 150, 200], 100), [v("borówki", 0.7, 14, 0.3), v("truskawki / maliny", 0.8, 8, 0.4)], "truskawki maliny"),
  food("Suszone owoce", SPOON(15), one(2.5, 76, 0.5), "rodzynki żurawina daktyle"),

  // ---------- add-ons, fats & sweets ----------
  food("Miód", TSP(10), one(0.3, 80, 0), "dodatek słodkie"),
  food("Dżem", TSP(12), [v("zwykły", 0.4, 50, 0.1), v("niskosłodzony", 0.4, 35, 0.1)], "dodatek słodkie"),
  food("Masło", TSP(5, 2), one(0.7, 0.7, 82), "tłuszcz"),
  food("Oliwa / olej", SPOON(10), one(0, 0, 100), "tłuszcz"),
  food("Masło orzechowe", TSP(10, 2), one(25, 13, 50), ""),
  food("Orzechy", G([10, 20, 30, 50], 30), [v("mix", 18, 14, 55), v("migdały", 21, 10, 50), v("włoskie", 15, 7, 65)], "migdały"),
  food("Nasiona", SPOON(10), [v("chia", 17, 42, 31), v("siemię lniane", 18, 29, 42), v("słonecznik / pestki dyni", 22, 15, 50)], "dodatek"),
  food("Awokado", SZT(150, [0.5, 1], 0.5), one(2, 9, 15), ""),
  food("Hummus", SPOON(20, 2), one(7, 14, 17), "pasta dodatek"),
  food("Sos", SPOON(15, 2), [v("ketchup", 1.5, 24, 0.2), v("majonez", 1, 2, 75), v("majonez light", 1, 6, 30), v("czosnkowy", 2, 6, 20), v("musztarda", 5, 6, 4)], "dodatek"),
  food("Baton proteinowy", SZT(60, [1, 2], 1, 0.5), one(33, 35, 13), "białko"),
  food("Czekolada", PCS(["kostka", "kostki", "kostek", "kostki"], 5, [2, 4, 6, 10, 20], 4, 1), [v("mleczna", 7, 57, 31), v("gorzka 70%", 9, 34, 42)], "słodycze"),
  food("Batonik", SZT(50, [1, 2], 1, 0.5), one(9, 60, 23), "słodycze snickers mars"),
  food("Chipsy", G([30, 50, 70, 140], 50), one(6, 52, 33), "przekąska"),
  food("Lody", PCS(["gałka", "gałki", "gałek", "gałki"], 60, [1, 2, 3], 2, 1), one(3.5, 24, 10), "słodycze deser"),
  food("Ciasto", PCS(["kawałek", "kawałki", "kawałków", "kawałka"], 120, [0.5, 1, 2], 1, 0.5), [v("sernik", 7, 26, 15), v("szarlotka", 3, 38, 12), v("czekoladowe", 5, 45, 20)], "deser"),

  // ---------- drinks ----------
  food("Sok", ML([200, 250, 330, 500], 250), [v("pomarańczowy / jabłkowy", 0.5, 10, 0), v("warzywny", 1, 5, 0)], "napój"),
  food("Napój słodzony", ML([250, 330, 500], 330), [v("cola / oranżada", 0, 10.6, 0), v("zero", 0, 0, 0)], "cola napój"),
  food("Piwo", ML([330, 500], 500), [v("jasne", 0.5, 3.5, 0), v("bezalkoholowe", 0.4, 5, 0)], "alkohol"),
  food("Kawa z mlekiem", ML([150, 250, 350, 450], 250), [v("latte / cappuccino", 3, 4.5, 2), v("z odrobiną mleka", 0.6, 0.9, 0.5)], "latte cappuccino"),
];

export type Amount = { p: number; c: number; f: number; kcal: number };

export function forGrams(m: Macros100, grams: number): Amount {
  const k = grams / 100;
  return {
    p: Math.round(m.p * k),
    c: Math.round(m.c * k),
    f: Math.round(m.f * k),
    kcal: Math.round((m.p * 4 + m.c * 4 + m.f * 9) * k),
  };
}

/** "3 jajka", "1,5 talerza", "150 g". */
export function formatQty(unit: Unit, qty: number): string {
  const num = String(qty).replace(".", ",");
  let form: string;
  if (!Number.isInteger(qty)) form = unit.forms[3] ?? unit.forms[1];
  else if (qty === 1) form = unit.forms[0];
  else if (qty % 10 >= 2 && qty % 10 <= 4 && (qty % 100 < 12 || qty % 100 > 14)) form = unit.forms[1];
  else form = unit.forms[2];
  if (qty === 0.5 && unit.grams !== 1) return `½ ${unit.forms[3] ?? unit.forms[1]}`;
  return `${num} ${form}`;
}

export function itemName(item: FoodItem, variant: Variant, qty: number): string {
  return `${item.name}${variant.label ? ` ${variant.label}` : ""} — ${formatQty(item.unit, qty)}`;
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
    const hay = fold(`${it.name} ${it.tags ?? ""} ${it.variants.map((x) => x.label).join(" ")}`);
    return words.every((w) => hay.includes(w));
  });
}
