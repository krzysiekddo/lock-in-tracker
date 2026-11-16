import { useMemo, useState } from "react";
import { forGrams, searchFoods, type FoodItem } from "../lib/foods";
import { uid } from "../lib/plan";
import type { Meal, MealItem } from "../lib/types";
import { Icon, numText, parseNum, useApp } from "./common";

const now = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

const PORTIONS = [0.5, 1, 1.5, 2];
const portionLabel = (k: number) => (k === 0.5 ? "½" : k === 1.5 ? "1½" : String(k));

const lowerFirst = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);

function autoName(items: MealItem[]): string {
  if (!items.length) return "Posiłek";
  return [items[0].name, ...items.slice(1).map((it) => lowerFirst(it.name))].join(" + ");
}

function total(items: MealItem[]) {
  return items.reduce((a, x) => ({ kcal: a.kcal + x.kcal, p: a.p + x.p, c: a.c + x.c, f: a.f + x.f }), { kcal: 0, p: 0, c: 0, f: 0 });
}

/**
 * Builds a meal from one or more parts (a dish plus add-ons). Each part comes from the
 * food list or from typed-in macros; "Zapisz" saves everything as one meal.
 */
export function MealForm({ onAdd }: { onAdd: (meal: Meal) => void }) {
  const [mode, setMode] = useState<"list" | "manual">("list");
  const [items, setItems] = useState<MealItem[]>([]);
  const [name, setName] = useState("");
  // Bumped after adding a part, so the picker starts fresh for the next add-on.
  const [round, setRound] = useState(0);

  function save(extra?: MealItem) {
    const all = extra ? [...items, extra] : items;
    if (!all.length) return;
    const t = total(all);
    onAdd({
      id: uid(),
      name: name.trim() || autoName(all),
      time: now(),
      ...t,
      grams: all.length === 1 ? all[0].grams : undefined,
      items: all.length > 1 ? all : undefined,
    });
  }

  function addPart(item: MealItem) {
    setItems((xs) => [...xs, item]);
    setRound((r) => r + 1);
  }

  const t = total(items);

  return (
    <div className="form">
      {items.length > 0 && (
        <section className="plate">
          <ul>
            {items.map((it, i) => (
              <li key={i}>
                <span>
                  <span className="list-title">{it.name}</span>
                  <span className="muted small">
                    {it.kcal} kcal · B {it.p} · W {it.c} · T {it.f}
                  </span>
                </span>
                <button className="icon-btn sm" onClick={() => setItems((xs) => xs.filter((_, j) => j !== i))} aria-label={`Usuń ${it.name}`}>
                  <Icon name="close" size={16} />
                </button>
              </li>
            ))}
          </ul>
          <div className="meal-preview">
            <strong>{t.kcal} kcal</strong>
            <span>B {t.p} g</span>
            <span>W {t.c} g</span>
            <span>T {t.f} g</span>
          </div>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={autoName(items)} aria-label="Nazwa posiłku" />
          <button className="primary" onClick={() => save()}>
            Zapisz posiłek
          </button>
          <p className="plate-more">Dodaj kolejny dodatek:</p>
        </section>
      )}

      <div className="segmented two" role="tablist">
        <button role="tab" aria-selected={mode === "list"} className={mode === "list" ? "selected" : ""} onClick={() => setMode("list")}>
          Na oko z listy
        </button>
        <button role="tab" aria-selected={mode === "manual"} className={mode === "manual" ? "selected" : ""} onClick={() => setMode("manual")}>
          Wpisz makro
        </button>
      </div>
      {mode === "list" ? (
        <FromList
          key={round}
          hasItems={items.length > 0}
          onSave={save}
          onAddPart={addPart}
          onRepeat={(m) => onAdd({ ...m, id: uid(), time: now() })}
        />
      ) : (
        <Manual key={round} hasItems={items.length > 0} onSave={save} onAddPart={addPart} />
      )}
    </div>
  );
}

type PartProps = { hasItems: boolean; onSave: (item: MealItem) => void; onAddPart: (item: MealItem) => void };

/** "Save" and "add another part" buttons shared by both pickers. */
function PartActions({ item, hasItems, onSave, onAddPart }: PartProps & { item: MealItem | null }) {
  return (
    <div className="part-actions">
      <button className="primary" disabled={!item} onClick={() => item && onSave(item)}>
        {hasItems ? "Dodaj i zapisz posiłek" : "Zapisz posiłek"}
      </button>
      <button className="secondary" disabled={!item} onClick={() => item && onAddPart(item)}>
        <Icon name="plus" size={18} /> Dodaj i wybierz dodatek
      </button>
    </div>
  );
}

/** Meals logged on other days, newest first, one per name — handy for repeat catering boxes. */
function useRecent(): Meal[] {
  const { days } = useApp();
  return useMemo(() => {
    const seen = new Set<string>();
    const out: Meal[] = [];
    for (const d of [...days].sort((a, b) => b.date.localeCompare(a.date))) {
      for (const m of [...(d.meals ?? [])].reverse()) {
        const key = m.name.trim().toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(m);
        if (out.length >= 6) return out;
      }
    }
    return out;
  }, [days]);
}

function FromList({ hasItems, onSave, onAddPart, onRepeat }: PartProps & { onRepeat: (meal: Meal) => void }) {
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<FoodItem | null>(null);
  const recent = useRecent();
  const results = useMemo(() => searchFoods(query), [query]);

  if (picked) return <Portion item={picked} onBack={() => setPicked(null)} hasItems={hasItems} onSave={onSave} onAddPart={onAddPart} />;

  return (
    <>
      <input
        type="search"
        placeholder={hasItems ? "Szukaj dodatku: pomidor, granola, bułka…" : "Szukaj: pierogi, kurczak, owsianka…"}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Szukaj produktu lub dania"
      />

      {!query && !hasItems && recent.length > 0 && (
        <div className="pick-group">
          <p className="muted small">Ostatnio jedzone — dodaj jednym kliknięciem</p>
          <ul className="pick-list">
            {recent.map((m) => (
              <li key={m.id}>
                <button onClick={() => onRepeat(m)}>
                  <span>
                    <span className="list-title">{m.name}</span>
                    <span className="muted small">
                      {m.kcal} kcal · B {m.p} · W {m.c} · T {m.f}
                    </span>
                  </span>
                  <Icon name="plus" size={18} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="pick-group">
        {!query && <p className="muted small">Produkty i dania</p>}
        {results.length === 0 ? (
          <p className="muted small">Nie ma tego na liście. Wybierz coś podobnego albo przejdź do „Wpisz makro”.</p>
        ) : (
          <ul className="pick-list">
            {results.map((it) => {
              const a = forGrams(it, it.grams);
              return (
                <li key={it.name}>
                  <button onClick={() => setPicked(it)}>
                    <span>
                      <span className="list-title">{it.name}</span>
                      <span className="muted small">
                        {it.portion} · {a.kcal} kcal · B {a.p} · W {a.c} · T {a.f}
                      </span>
                    </span>
                    <Icon name="chevron" size={18} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}

function Portion({ item, onBack, ...actions }: { item: FoodItem; onBack: () => void } & PartProps) {
  const [grams, setGrams] = useState(item.grams);
  const [gramsText, setGramsText] = useState(String(item.grams));
  const a = forGrams(item, grams);
  const factor = grams / item.grams;

  const pick = (k: number) => {
    const g = Math.round(item.grams * k);
    setGrams(g);
    setGramsText(String(g));
  };

  return (
    <>
      <button className="link back-link" onClick={onBack}>
        <Icon name="back" size={16} /> Wróć do listy
      </button>
      <div>
        <h3 className="pick-title">{item.name}</h3>
        <p className="muted small">1 porcja = {item.portion} (ok. {item.grams} g)</p>
      </div>

      <div className="field">
        <span>Ile porcji?</span>
        <div className="chips">
          {PORTIONS.map((k) => (
            <button key={k} className={`chip kind ${Math.abs(factor - k) < 0.01 ? "on" : ""}`} onClick={() => pick(k)}>
              {portionLabel(k)}
            </button>
          ))}
        </div>
      </div>

      <label className="field">
        <span>albo dokładnie</span>
        <span className="num-field">
          <input
            inputMode="numeric"
            value={gramsText}
            onChange={(e) => {
              setGramsText(e.target.value);
              const n = parseNum(e.target.value);
              if (n !== null && !Number.isNaN(n)) setGrams(n);
            }}
          />
          <span>g</span>
        </span>
      </label>

      <div className="meal-preview">
        <strong>{a.kcal} kcal</strong>
        <span>B {a.p} g</span>
        <span>W {a.c} g</span>
        <span>T {a.f} g</span>
      </div>

      <PartActions
        {...actions}
        item={
          grams
            ? { name: Math.abs(factor - 1) < 0.01 ? item.name : `${item.name} (${grams} g)`, grams, kcal: a.kcal, p: a.p, c: a.c, f: a.f }
            : null
        }
      />
    </>
  );
}

function Manual(actions: PartProps) {
  const [name, setName] = useState("");
  const [vals, setVals] = useState<Record<"kcal" | "p" | "c" | "f", string>>({ kcal: "", p: "", c: "", f: "" });
  const num = (k: keyof typeof vals) => {
    const n = parseNum(vals[k]);
    return n === null || Number.isNaN(n) ? 0 : n;
  };
  const p = num("p");
  const c = num("c");
  const f = num("f");
  const fromMacros = Math.round(p * 4 + c * 4 + f * 9);
  const kcal = num("kcal") || fromMacros;
  const ok = kcal > 0;

  const field = (k: keyof typeof vals, label: string, unit: string) => (
    <label className="field">
      <span>{label}</span>
      <span className="num-field">
        <input
          inputMode="decimal"
          value={vals[k]}
          placeholder={k === "kcal" && fromMacros ? numText(fromMacros) : ""}
          onChange={(e) => setVals((v) => ({ ...v, [k]: e.target.value }))}
        />
        <span>{unit}</span>
      </span>
    </label>
  );

  return (
    <>
      <label className="field">
        <span>Nazwa</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="np. Catering — obiad" />
      </label>
      <div className="form-grid two">
        {field("p", "Białko", "g")}
        {field("c", "Węglowodany", "g")}
        {field("f", "Tłuszcze", "g")}
        {field("kcal", "Kalorie", "kcal")}
      </div>
      <p className="muted small">Wystarczą same gramy makro — kalorie policzę sam. Albo wpisz tylko kalorie.</p>
      <PartActions
        {...actions}
        item={ok ? { name: name.trim() || "Posiłek", kcal: Math.round(kcal), p: Math.round(p), c: Math.round(c), f: Math.round(f) } : null}
      />
    </>
  );
}
