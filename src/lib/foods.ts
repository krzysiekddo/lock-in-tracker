// Foods and dishes for eyeballing a meal. Each item is counted in its natural unit
// (eggs, slices, grams, spoons, plates) and may come in variants (lean/semi/full-fat
// cottage cheese, white/rye bread…). Macros are per 100 g, rounded averages from
// Polish tables and typical labels: good enough for tracking.

export type Macros100 = { p: number; c: number; f: number; /** Override when macros miss energy (alcohol). */ kcal?: number };

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
  /** Names of items that usually go with this one, offered right after it is added. */
  pairs?: string[];
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
const v = (label: string, p: number, c: number, f: number, kcal?: number): Variant => ({ label, p, c, f, ...(kcal ? { kcal } : {}) });
const one = (p: number, c: number, f: number, kcal?: number) => [v("", p, c, f, kcal)];
const food = (name: string, unit: Unit, variants: Variant[], tags?: string, defVariant = 0): FoodItem => ({
  name,
  unit,
  variants,
  tags,
  defVariant,
});

const BASE: FoodItem[] = [
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
  food("Kasza", G([50, 100, 150, 200, 250], 150), [v("gryczana ugotowana", 4, 20, 1), v("bulgur ugotowany", 3, 19, 0.3), v("jaglana ugotowana", 3.5, 23, 1), v("kuskus ugotowany", 3.8, 23, 0.2), v("sucha (waga przed)", 12, 70, 2.5)], "kuskus"),
  food("Ziemniaki", G([100, 150, 200, 250, 300, 400], 250), [v("gotowane", 2, 17, 0.1), v("pieczone z olejem", 2.5, 20, 5), v("puree", 2, 14, 4)], ""),
  food("Frytki", G([100, 150, 200], 150), one(3.5, 35, 15), "fast food"),
  food("Tortilla / wrap", SZT(60, [1, 2], 1, 1), [v("pszenna", 8, 50, 7), v("pełnoziarnista", 9, 45, 7)], "placek"),
  food("Wafle ryżowe", SZT(9, [1, 2, 3, 4, 6], 3, 1), one(8, 81, 3), ""),

  // ---------- dishes ----------
  food("Pierogi", PCS(["szt.", "szt.", "szt."], 35, [4, 6, 8, 10, 12], 8, 1), [v("ruskie", 6, 28, 6), v("z mięsem", 9, 25, 8), v("z kapustą i grzybami", 5, 26, 5), v("z owocami", 5, 35, 3)], ""),
  food("Spaghetti bolognese", PLATE(400), one(7, 17, 5), "makaron"),
  food("Kurczak z ryżem i warzywami", PCS(["pudełko", "pudełka", "pudełek", "pudełka"], 400, [0.5, 1, 1.5, 2], 1, 0.5), one(11, 16, 3), "meal prep obiad"),
  food("Zupa", PLATE(350), [v("pomidorowa / ogórkowa", 1.5, 7, 2), v("rosół z makaronem", 3, 5, 2), v("żurek z jajkiem i kiełbasą", 4, 6, 6), v("krem z dyni / warzyw", 1.5, 7, 3), v("barszcz czerwony", 1, 5, 1), v("grochówka", 6, 11, 4), v("krupnik", 3, 8, 2), v("jarzynowa", 1.5, 6, 2), v("flaki", 7, 3, 4)], "barszcz grochówka krupnik flaki"),
  food("Bigos", PORTION(300), one(7, 6, 9), ""),
  food("Gulasz", PORTION(250), one(13, 4, 9), "mięso sos"),
  food("Pizza", SLICE_PIZZA, [v("margherita", 11, 30, 9), v("z salami / szynką", 12, 29, 11), v("pepperoni / wiejska", 12, 28, 13), v("4 sery", 13, 28, 14)], "fast food"),
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
  food("Czekolada", PCS(["kostka", "kostki", "kostek", "kostki"], 5, [2, 4, 6, 10, 20], 4, 1), [v("mleczna", 7, 57, 31), v("gorzka 70%", 9, 34, 42), v("biała", 6, 58, 32), v("z orzechami", 8, 50, 36)], "słodycze milka wedel"),
  food("Batonik", SZT(50, [1, 2], 1, 0.5), [v("Snickers", 9, 60, 23), v("Mars", 4, 70, 17), v("Twix", 4.5, 64, 24), v("Bounty", 4, 58, 26), v("KitKat", 7, 61, 26), v("Lion", 5, 67, 21)], "słodycze snickers mars twix bounty kitkat lion"),
  food("Chipsy", G([30, 50, 70, 140], 50), one(6, 52, 33), "przekąska"),
  food("Lody", PCS(["gałka", "gałki", "gałek", "gałki"], 60, [1, 2, 3], 2, 1), one(3.5, 24, 10), "słodycze deser"),
  food("Ciasto", PCS(["kawałek", "kawałki", "kawałków", "kawałka"], 120, [0.5, 1, 2], 1, 0.5), [v("sernik", 7, 26, 15), v("szarlotka", 3, 38, 12), v("czekoladowe", 5, 45, 20)], "deser"),

  // ---------- drinks ----------
  food("Sok", ML([200, 250, 330, 500], 250), [v("pomarańczowy / jabłkowy", 0.5, 10, 0), v("warzywny", 1, 5, 0)], "napój"),
  food("Napój słodzony", ML([250, 330, 500], 330), [v("cola / oranżada", 0, 10.6, 0), v("zero", 0, 0, 0)], "cola napój"),
  food("Piwo", ML([330, 500], 500), [v("jasne", 0.5, 3.5, 0, 43), v("bezalkoholowe", 0.4, 5, 0, 22), v("smakowe (radler)", 0.3, 7, 0, 40)], "alkohol"),
  food("Kawa z mlekiem", ML([150, 250, 350, 450], 250), [v("latte / cappuccino", 3, 4.5, 2), v("z odrobiną mleka", 0.6, 0.9, 0.5)], "latte cappuccino"),
];

const PIECE = (forms: Unit["forms"], grams: number, steps: number[], def: number) => PCS(forms, grams, steps, def, 1);
const CANDY = (grams: number, def = 3) => PIECE(["cukierek", "cukierki", "cukierków", "cukierka"], grams, [1, 2, 3, 5, 10], def);
const COOKIE = (grams: number, def = 3) => PIECE(["ciastko", "ciastka", "ciastek", "ciastka"], grams, [1, 2, 3, 5, 10], def);

const EXTRA: FoodItem[] = [
  // ---------- gyros, kebab & fast food ----------
  food("Gyros w picie", SZT(350, [1], 1, 0.5), [v("w picie", 9, 20, 9), v("w tortilli", 10, 18, 9)], "gyros pita fast food"),
  food("Gyros na talerzu", PORTION(500), [v("z frytkami i surówką", 8, 13, 10), v("z ryżem", 8, 15, 6), v("z sałatką", 10, 4, 9)], "gyros talerz fast food"),
  food("Gyros (samo mięso)", G([100, 150, 200, 250], 150), one(22, 2, 12), "gyros kurczak"),
  food("Falafel", PIECE(["kulka", "kulki", "kulek", "kulki"], 25, [3, 4, 5, 6, 8], 5), one(13, 32, 18), "wege"),
  food("Falafel w picie / wrap", SZT(300, [1], 1, 0.5), one(7, 25, 9), "wege"),
  food("Wrap z kurczakiem", SZT(250, [1, 2], 1, 0.5), [v("zwykły", 11, 22, 8), v("z sosem czosnkowym", 10, 21, 11), v("z kurczakiem panierowanym", 10, 25, 12)], "tortilla"),
  food("Burrito", SZT(300, [1], 1, 0.5), one(9, 22, 8), "meksykańskie"),
  food("Hot dog", SZT(150, [1, 2], 1, 1), one(10, 25, 14), "fast food parówka"),
  food("Big Mac", SZT(220, [1, 2], 1, 1), one(12, 20, 12), "mcdonalds fast food burger"),
  food("Cheeseburger", SZT(118, [1, 2, 3], 1, 1), one(13, 27, 11), "mcdonalds fast food burger"),
  food("Kanapka z kurczakiem (McChicken, Grander…)", SZT(170, [1, 2], 1, 1), one(10, 24, 12), "mcdonalds kfc fast food burger"),
  food("Nuggetsy / stripsy", PIECE(["szt.", "szt.", "szt."], 17, [4, 6, 9, 12, 20], 6), one(15, 16, 15), "mcdonalds kfc kurczak fast food"),
  food("Kubełek / skrzydełka", PIECE(["szt.", "szt.", "szt."], 40, [3, 5, 8, 12], 5), one(18, 8, 16), "kfc kurczak fast food"),

  // ---------- dinners ----------
  food("Kurczak pieczony (ćwiartka)", SZT(300, [0.5, 1], 1, 0.5), one(19, 0, 12), "obiad"),
  food("Kotlet de volaille", SZT(180, [1], 1, 0.5), one(17, 10, 15), "obiad kurczak"),
  food("Gołąbki", SZT(200, [1, 2, 3], 2, 1), one(6, 8, 6), "obiad"),
  food("Placki ziemniaczane", SZT(70, [2, 3, 4, 6], 3, 1), one(3, 22, 10), "obiad"),
  food("Kopytka / kluski śląskie", PORTION(250), [v("bez dodatków", 3, 32, 3), v("z masłem / skwarkami", 3, 30, 7)], "obiad"),
  food("Pierogi leniwe", PORTION(250), one(9, 27, 6), "kluski z serem"),
  food("Fasolka po bretońsku", PORTION(350), one(7, 12, 6), "obiad"),
  food("Leczo", PORTION(350), one(4, 7, 6), "obiad"),
  food("Lasagne", PORTION(350), one(8, 13, 8), "obiad makaron"),
  food("Spaghetti carbonara", PLATE(350), one(10, 25, 12), "makaron"),
  food("Makaron z sosem", PLATE(350), [v("pesto", 6, 27, 9), v("śmietanowym z kurczakiem", 9, 22, 9), v("pomidorowym", 5, 25, 3)], "obiad"),
  food("Risotto", PORTION(350), one(4, 20, 5), "ryż obiad"),
  food("Kurczak curry z ryżem", PORTION(450), one(9, 17, 5), "obiad"),
  food("Kurczak słodko-kwaśny z ryżem", PORTION(450), one(7, 22, 5), "chińskie obiad"),
  food("Chili con carne", PORTION(350), one(8, 9, 5), "obiad"),
  food("Pad thai", PORTION(400), one(7, 22, 7), "tajskie makaron"),
  food("Ramen", PLATE(600), one(4, 9, 3), "zupa japońskie"),
  food("Racuchy", SZT(50, [2, 3, 4, 6], 4, 1), one(6, 35, 12), "słodkie placki"),
  food("Gofry", SZT(80, [1, 2], 1, 1), [v("z cukrem pudrem", 6, 45, 13), v("z bitą śmietaną i owocami", 5, 38, 16)], "słodkie"),

  // ---------- bakery & breakfast ----------
  food("Croissant", SZT(60, [1, 2], 1, 1), [v("zwykły", 8, 45, 21), v("z czekoladą", 7, 47, 23)], "rogalik pieczywo"),
  food("Pączek", SZT(80, [1, 2], 1, 1), one(6, 48, 18), "słodkie"),
  food("Drożdżówka", SZT(100, [1, 2], 1, 0.5), one(7, 50, 13), "słodkie pieczywo"),
  food("Bajgiel", SZT(90, [1, 2], 1, 0.5), one(10, 50, 2), "pieczywo"),
  food("Bagietka", PIECE(["kawałek", "kawałki", "kawałków"], 60, [1, 2, 3, 4], 2), one(9, 55, 2), "pieczywo"),
  food("Płatki czekoladowe", G([30, 40, 50, 60], 40), one(8, 75, 8), "cini minis nesquik śniadanie"),
  food("Nutella / krem czekoladowy", TSP(10, 2), one(6, 57, 31), "dodatek słodkie"),
  food("Pasztet", G([30, 50, 100], 50), one(11, 5, 22), "kanapka"),
  food("Serek homogenizowany", G([100, 150, 200], 150), [v("waniliowy", 7, 13, 4), v("naturalny", 10, 4, 4)], "danio jogurt"),
  food("Pudding / budyń proteinowy", G([150, 200], 200), one(10, 8, 1.5), "białko deser"),
  food("Śmietana", SPOON(15), [v("12%", 2.5, 4, 12), v("18%", 2.5, 3.5, 18), v("30% (bita)", 2, 3, 30)], "dodatek"),
  food("Parmezan", G([10, 20, 30], 20), one(35, 0, 28), "ser"),
  food("Ser pleśniowy (camembert, brie)", G([30, 50, 100], 50), one(20, 0, 27), "ser"),
  food("Kabanosy", SZT(25, [1, 2, 4, 6], 2, 1), one(25, 2, 30), "wędlina przekąska"),

  // ---------- fish, legumes, veg ----------
  food("Krewetki", G([100, 150, 200], 100), one(20, 0, 1), "owoce morza"),
  food("Śledź", G([50, 100], 100), [v("w oleju", 14, 3, 25), v("w śmietanie", 9, 4, 17)], "ryba"),
  food("Makrela wędzona", G([50, 100, 150], 100), one(21, 0, 15), "ryba"),
  food("Tofu", G([100, 150, 200], 100), [v("naturalne", 13, 2, 8), v("wędzone", 16, 2, 10)], "wege"),
  food("Strączki (ugotowane)", G([50, 100, 150, 200], 100), [v("ciecierzyca", 9, 27, 2.6), v("fasola czerwona", 8.7, 22, 0.5), v("soczewica", 9, 20, 0.4)], "fasola ciecierzyca soczewica wege"),
  food("Kukurydza / groszek", G([50, 100, 150], 100), [v("kukurydza", 3, 18, 1.4), v("groszek", 5, 13, 0.4)], "konserwowa warzywa"),
  food("Gnocchi", G([100, 200, 300], 200), one(4, 33, 0.5), "kluski"),
  food("Marchewka", SZT(80, [1, 2], 1, 1), one(0.9, 10, 0.2), "warzywa"),
  food("Pieczarki", G([50, 100, 200], 100), one(3, 3, 0.3), "grzyby"),

  // ---------- fruit ----------
  food("Pomarańcza", SZT(200, [0.5, 1, 2], 1), one(0.9, 12, 0.1), "owoc"),
  food("Mandarynka", SZT(80, [1, 2, 3, 4], 2, 1), one(0.8, 13, 0.3), "owoc"),
  food("Gruszka", SZT(180, [0.5, 1, 2], 1), one(0.4, 15, 0.1), "owoc"),
  food("Kiwi", SZT(75, [1, 2, 3], 1, 1), one(1, 15, 0.5), "owoc"),
  food("Winogrona", G([100, 150, 250], 150), one(0.7, 18, 0.2), "owoc"),
  food("Arbuz", G([200, 300, 500], 300), one(0.6, 8, 0.2), "owoc"),
  food("Ananas", G([100, 150, 250], 150), one(0.5, 13, 0.1), "owoc"),
  food("Mango", SZT(300, [0.5, 1], 0.5), one(0.8, 15, 0.4), "owoc"),
  food("Śliwki", SZT(40, [2, 4, 6], 4, 1), one(0.7, 11, 0.3), "owoc"),
  food("Mus owocowy (tubka)", SZT(90, [1, 2], 1, 1), one(0.5, 14, 0.2), "owoc kubuś"),

  // ---------- sweets ----------
  food("Trufle Wawel", CANDY(9), one(4, 56, 30), "cukierki słodycze wawel trufla"),
  food("Kasztanki Wawel", CANDY(10), one(6, 56, 31), "cukierki słodycze wawel"),
  food("Michałki", CANDY(10), one(7, 52, 33), "cukierki słodycze wawel"),
  food("Mieszanka Wedlowska", CANDY(9), one(4, 60, 27), "cukierki słodycze wedel"),
  food("Krówki", CANDY(10), one(3, 75, 8), "cukierki słodycze"),
  food("Ptasie mleczko", PIECE(["szt.", "szt.", "szt."], 9, [1, 2, 3, 5, 10], 3), one(3, 62, 17), "słodycze wedel"),
  food("Raffaello", PIECE(["szt.", "szt.", "szt."], 10, [1, 2, 3, 5], 3), one(9, 35, 49), "słodycze praliny"),
  food("Ferrero Rocher", PIECE(["szt.", "szt.", "szt."], 12.5, [1, 2, 3, 5], 2), one(8, 44, 43), "słodycze praliny"),
  food("Cukierki twarde / lizak", CANDY(5), one(0, 97, 0), "landrynki słodycze"),
  food("Żelki", G([20, 50, 100, 175], 50), [v("zwykłe (Haribo)", 6.9, 77, 0.5), v("kwaśne", 4, 80, 0.3)], "słodycze haribo"),
  food("M&M's", G([45, 100], 45), [v("czekoladowe", 5, 69, 21), v("orzechowe", 9, 58, 26)], "słodycze draże"),
  food("Prince Polo", SZT(35, [1, 2], 1, 1), one(6, 58, 30), "wafelek słodycze"),
  food("Grześki", SZT(36, [1, 2], 1, 1), one(6, 63, 26), "wafelek słodycze"),
  food("Kinder Bueno", PIECE(["batonik", "batoniki", "batoników"], 21.5, [1, 2], 2), one(9, 50, 37), "słodycze"),
  food("Kinder czekoladka", PIECE(["batonik", "batoniki", "batoników"], 12.5, [1, 2, 4], 2), one(9, 53, 35), "słodycze"),
  food("Knoppers", SZT(25, [1, 2], 1, 1), one(9, 50, 32), "wafelek słodycze"),
  food("Baton musli", SZT(25, [1, 2], 1, 1), one(6, 65, 15), "przekąska"),
  food("Delicje", COOKIE(12.75), one(4, 67, 13), "ciastka słodycze"),
  food("Oreo", COOKIE(11), one(5, 69, 20), "ciastka słodycze"),
  food("Herbatniki / petitki", COOKIE(6, 5), one(8, 74, 12), "ciastka słodycze"),
  food("Pierniki w czekoladzie", COOKIE(13), one(5, 66, 15), "ciastka słodycze"),
  food("Chałwa", G([25, 50, 100], 50), one(12, 50, 30), "słodycze"),
  food("Magnum / lody na patyku", SZT(80, [1, 2], 1, 1), one(3.8, 28, 19), "lody słodycze"),

  // ---------- salty snacks ----------
  food("Popcorn", G([25, 50, 100], 50), [v("maślany", 8, 58, 22), v("bez tłuszczu", 12, 74, 4)], "przekąska kino"),
  food("Paluszki", G([25, 50, 100], 50), one(10, 74, 5), "przekąska"),
  food("Orzeszki ziemne solone", G([25, 50, 100], 50), one(26, 12, 50), "przekąska"),
  food("Krakersy", G([25, 50, 100], 30), one(9, 66, 18), "przekąska"),

  // ---------- drinks ----------
  food("Energetyk", ML([250, 500], 500), [v("zwykły", 0, 11, 0), v("zero / bez cukru", 0, 0, 0)], "red bull monster tiger napój"),
  food("Izotonik", ML([500, 750], 500), one(0, 6, 0), "napój sport"),
  food("Kakao / mleko czekoladowe", ML([200, 250, 330], 250), one(3.3, 10, 1.5), "napój"),
  food("Smoothie", ML([250, 330, 500], 250), one(0.7, 12, 0.3), "napój owoce"),
  food("Shake proteinowy (gotowy)", ML([250, 330, 500], 330), one(8, 3, 0.5), "białko napój"),
  food("Wino", ML([100, 150, 250, 750], 150), [v("wytrawne", 0.1, 2.6, 0, 70), v("półsłodkie / słodkie", 0.1, 8, 0, 95)], "alkohol"),
  food("Wódka / mocny alkohol", ML([25, 50, 100], 50), one(0, 0, 0, 220), "alkohol shot"),
  food("Drink z colą / sokiem", ML([250, 330], 250), one(0, 9, 0, 85), "alkohol"),
];

const PIZZA: FoodItem[] = [
  food("Pinsa (spód)", PCS(["spód", "spody", "spodów", "spodu"], 230, [0.5, 1, 2], 1, 0.5), one(8, 50, 4), "pinsa romana pizza ciasto"),
  food("Spód do pizzy", PCS(["spód", "spody", "spodów", "spodu"], 260, [0.5, 1], 1, 0.5), [v("cienki", 8, 48, 5), v("gruby / pan", 7, 45, 7)], "pizza ciasto"),
  food("Pinsa z pizzerii", SZT(380, [0.5, 1], 1, 0.5), [v("margherita", 10, 30, 8), v("z szynką", 11, 28, 9), v("z salami / pepperoni", 11, 27, 12), v("z prosciutto i rukolą", 12, 28, 9)], "pinsa pizza fast food"),
  food("Sos pomidorowy", PCS(["łyżka", "łyżki", "łyżek", "łyżki"], 20, [2, 3, 4, 6], 4, 1), [v("pasata", 1.3, 5, 0.2), v("sos do pizzy", 1.5, 8, 1.5)], "pomidory passata dodatek pizza pinsa"),
  food("Ser tarty", G([25, 50, 75, 100, 125], 50), [v("mozzarella", 22, 2, 20), v("gouda / edam", 25, 0, 28), v("mozzarella light", 24, 2, 11)], "ser do pizzy dodatek pinsa"),
  food("Wędlina na pizzę", G([20, 40, 60, 80, 100], 40), [v("szynka", 18, 2, 5), v("salami / pepperoni", 22, 1, 35), v("prosciutto / szynka parmeńska", 26, 0, 18), v("boczek", 14, 0, 40)], "szynka salami pizza pinsa dodatek"),
  food("Burrata", G([50, 100, 125], 125), one(11, 1, 24), "ser pizza pinsa dodatek"),
  food("Oliwki", G([10, 20, 30, 50], 20), one(1, 4, 15), "dodatek pizza pinsa"),
  food("Rukola", G([10, 20, 30], 20), one(2.6, 3.7, 0.7), "sałata dodatek pizza pinsa"),
  food("Pomidorki koktajlowe", PIECE(["szt.", "szt.", "szt."], 15, [3, 5, 8, 10], 5), one(0.9, 3.9, 0.2), "pomidor dodatek pizza pinsa"),
];

export const FOOD_DB: FoodItem[] = [...BASE, ...EXTRA, ...PIZZA];

// Typical add-ons, offered as soon as the main item is on the plate.
const PAIRS: Record<string, string[]> = {
  "Pinsa (spód)": ["Sos pomidorowy", "Ser tarty", "Mozzarella", "Wędlina na pizzę", "Burrata", "Pieczarki", "Oliwki", "Rukola", "Pomidorki koktajlowe", "Kukurydza / groszek", "Cebula", "Papryka", "Oliwa / olej"],
  "Spód do pizzy": ["Sos pomidorowy", "Ser tarty", "Mozzarella", "Wędlina na pizzę", "Pieczarki", "Oliwki", "Kukurydza / groszek", "Cebula", "Papryka", "Ananas"],
  Jogurt: ["Granola / musli", "Owoce jagodowe", "Banan", "Miód", "Nasiona", "Orzechy"],
  Skyr: ["Granola / musli", "Owoce jagodowe", "Banan", "Miód", "Masło orzechowe"],
  Owsianka: ["Banan", "Owoce jagodowe", "Masło orzechowe", "Odżywka białkowa", "Orzechy", "Miód"],
  "Płatki owsiane": ["Mleko", "Jogurt", "Banan", "Owoce jagodowe", "Masło orzechowe"],
  Jajecznica: ["Pomidor", "Ogórek", "Bułka", "Chleb", "Masło"],
  "Jajka sadzone": ["Chleb", "Bułka", "Pomidor", "Ogórek"],
  Omlet: ["Ser żółty", "Wędlina", "Pomidor", "Warzywa"],
  Twaróg: ["Pomidor", "Ogórek", "Chleb", "Bułka", "Miód"],
  Naleśniki: ["Owoce jagodowe", "Śmietana", "Nutella / krem czekoladowy"],
  "Pierś z kurczaka": ["Ryż", "Ziemniaki", "Makaron", "Warzywa", "Kasza"],
  "Kotlet schabowy": ["Ziemniaki", "Warzywa"],
  Pierogi: ["Śmietana", "Cebula"],
};
for (const it of FOOD_DB) if (PAIRS[it.name]) it.pairs = PAIRS[it.name].filter((n) => FOOD_DB.some((x) => x.name === n));

export function foodsByName(names: string[]): FoodItem[] {
  return names.map((n) => FOOD_DB.find((x) => x.name === n)).filter((x): x is FoodItem => !!x);
}

export type Amount = { p: number; c: number; f: number; kcal: number };

export function forGrams(m: Macros100, grams: number): Amount {
  const k = grams / 100;
  return {
    p: Math.round(m.p * k),
    c: Math.round(m.c * k),
    f: Math.round(m.f * k),
    kcal: Math.round((m.kcal ?? m.p * 4 + m.c * 4 + m.f * 9) * k),
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
  return `${item.name}${variant.label ? ` (${variant.label})` : ""} — ${formatQty(item.unit, qty)}`;
}

const fold = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ł/g, "l");

export function searchFoods(query: string): FoodItem[] {
  const words = fold(query).split(/\s+/).filter(Boolean);
  if (!words.length) return [...FOOD_DB].sort((a, b) => a.name.localeCompare(b.name, "pl"));
  const score = (it: FoodItem) => {
    const name = fold(it.name);
    if (name.startsWith(words[0])) return 0;
    if (name.includes(words[0])) return 1;
    return 2;
  };
  return FOOD_DB.filter((it) => {
    const hay = fold(`${it.name} ${it.tags ?? ""} ${it.variants.map((x) => x.label).join(" ")}`);
    return words.every((w) => hay.includes(w));
  }).sort((a, b) => score(a) - score(b) || a.name.localeCompare(b.name, "pl"));
}

/** Variant whose label the query names (e.g. "snickers" → Batonik / Snickers), if any. */
export function matchVariant(item: FoodItem, query: string): number | null {
  const words = fold(query).split(/\s+/).filter((w) => w.length > 1);
  if (!words.length || item.variants.length < 2) return null;
  const i = item.variants.findIndex((x) => words.some((w) => fold(x.label).includes(w)));
  return i >= 0 ? i : null;
}
