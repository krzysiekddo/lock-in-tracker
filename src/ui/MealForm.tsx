import { useMemo, useState } from "react";
import { forGrams, searchFoods, type FoodItem } from "../lib/foods";
import { uid } from "../lib/plan";
import type { Meal } from "../lib/types";
import { Icon, numText, parseNum, useApp } from "./common";

const now = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

const PORTIONS = [0.5, 1, 1.5, 2];
const portionLabel = (k: number) => (k === 0.5 ? "½" : k === 1.5 ? "1½" : String(k));

export function MealForm({ onAdd }: { onAdd: (meal: Meal) => void }) {
  const [mode, setMode] = useState<"list" | "manual">("list");
  return (
    <div className="form">
      <div className="segmented two" role="tablist">
        <button role="tab" aria-selected={mode === "list"} className={mode === "list" ? "selected" : ""} onClick={() => setMode("list")}>
          Na oko z listy
        </button>
        <button role="tab" aria-selected={mode === "manual"} className={mode === "manual" ? "selected" : ""} onClick={() => setMode("manual")}>
          Wpisz makro
        </button>
      </div>
      {mode === "list" ? <FromList onAdd={onAdd} /> : <Manual onAdd={onAdd} />}
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

function FromList({ onAdd }: { onAdd: (meal: Meal) => void }) {
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<FoodItem | null>(null);
  const recent = useRecent();
  const results = useMemo(() => searchFoods(query), [query]);

  if (picked) return <Portion item={picked} onBack={() => setPicked(null)} onAdd={onAdd} />;

  return (
    <>
      <input
        type="search"
        placeholder="Szukaj: pierogi, kurczak, owsianka…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Szukaj produktu lub dania"
      />

      {!query && recent.length > 0 && (
        <div className="pick-group">
          <p className="muted small">Ostatnio jedzone — dodaj jednym kliknięciem</p>
          <ul className="pick-list">
            {recent.map((m) => (
              <li key={m.id}>
                <button onClick={() => onAdd({ ...m, id: uid(), time: now() })}>
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

function Portion({ item, onBack, onAdd }: { item: FoodItem; onBack: () => void; onAdd: (meal: Meal) => void }) {
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

      <button
        className="primary"
        disabled={!grams}
        onClick={() =>
          onAdd({
            id: uid(),
            name: Math.abs(factor - 1) < 0.01 ? item.name : `${item.name} (${grams} g)`,
            time: now(),
            grams,
            kcal: a.kcal,
            p: a.p,
            c: a.c,
            f: a.f,
          })
        }
      >
        Dodaj
      </button>
    </>
  );
}

function Manual({ onAdd }: { onAdd: (meal: Meal) => void }) {
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
      <button
        className="primary"
        disabled={!ok}
        onClick={() =>
          onAdd({
            id: uid(),
            name: name.trim() || "Posiłek",
            time: now(),
            kcal: Math.round(kcal),
            p: Math.round(p),
            c: Math.round(c),
            f: Math.round(f),
          })
        }
      >
        Dodaj
      </button>
    </>
  );
}
