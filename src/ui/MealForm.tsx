import { useMemo, useState } from "react";
import { formatQty, forGrams, itemName, matchVariant, searchFoods, type FoodItem } from "../lib/foods";
import { uid } from "../lib/plan";
import type { Meal, MealItem } from "../lib/types";
import { Icon, numText, parseNum, useApp } from "./common";

const now = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};


const lowerFirst = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);

function autoName(items: MealItem[]): string {
  if (!items.length) return "Posiłek";
  if (items.length === 1) return items[0].name;
  // Drop the amounts ("— 3 jajka") so the name stays short; the parts list keeps them.
  const base = (n: string) => n.split(" — ")[0];
  return [base(items[0].name), ...items.slice(1).map((it) => lowerFirst(base(it.name)))].join(" + ");
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
              const dv = it.variants[it.defVariant ?? 0];
              const a = forGrams(dv, it.unit.grams * it.unit.def);
              return (
                <li key={it.name}>
                  <button onClick={() => setPicked({ ...it, defVariant: matchVariant(it, query) ?? it.defVariant })}>
                    <span>
                      <span className="list-title">{it.name}</span>
                      <span className="muted small">
                        {it.variants.length > 1
                          ? it.variants.map((x) => x.label).join(" · ")
                          : `${formatQty(it.unit, it.unit.def)} · ${a.kcal} kcal`}
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
  const { unit } = item;
  const [vi, setVi] = useState(item.defVariant ?? 0);
  const [qty, setQty] = useState(unit.def);
  const [qtyText, setQtyText] = useState(numText(unit.def));
  const variant = item.variants[vi];
  const grams = Math.round(qty * unit.grams);
  const a = forGrams(variant, grams);
  const isGrams = unit.grams === 1;

  const setBoth = (n: number) => {
    const clean = Math.max(0, Math.round(n * 100) / 100);
    setQty(clean);
    setQtyText(numText(clean));
  };

  return (
    <>
      <button className="link back-link" onClick={onBack}>
        <Icon name="back" size={16} /> Wróć do listy
      </button>
      <h3 className="pick-title">{item.name}</h3>

      {item.variants.length > 1 && (
        <div className="field">
          <span>Jaki?</span>
          <div className="chips">
            {item.variants.map((x, i) => (
              <button key={x.label} className={`chip kind ${i === vi ? "on" : ""}`} onClick={() => setVi(i)}>
                {x.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="field">
        <span>Ile?</span>
        <div className="chips">
          {unit.steps.map((k) => (
            <button key={k} className={`chip kind ${qty === k ? "on" : ""}`} onClick={() => setBoth(k)}>
              {formatQty(unit, k)}
            </button>
          ))}
        </div>
        <div className="stepper">
          <button className="icon-btn" onClick={() => setBoth(Math.max(unit.inc, qty - unit.inc))} aria-label="Mniej" disabled={qty <= unit.inc}>
            <Icon name="minus" size={18} />
          </button>
          <span className="num-field">
            <input
              inputMode="decimal"
              value={qtyText}
              aria-label="Ilość"
              onFocus={(e) => e.target.select()}
              onChange={(e) => {
                setQtyText(e.target.value);
                const n = parseNum(e.target.value);
                if (n !== null && !Number.isNaN(n)) setQty(n);
              }}
              onBlur={() => setQtyText(numText(qty))}
            />
            <span>{isGrams ? unit.forms[0] : unit.forms[2]}</span>
          </span>
          <button className="icon-btn" onClick={() => setBoth(qty + unit.inc)} aria-label="Więcej">
            <Icon name="plus" size={18} />
          </button>
        </div>
        {!isGrams && <span className="muted small">ok. {grams} g</span>}
      </div>

      <div className="meal-preview">
        <strong>{a.kcal} kcal</strong>
        <span>B {a.p} g</span>
        <span>W {a.c} g</span>
        <span>T {a.f} g</span>
      </div>

      <PartActions {...actions} item={qty > 0 ? { name: itemName(item, variant, qty), grams, kcal: a.kcal, p: a.p, c: a.c, f: a.f } : null} />
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
