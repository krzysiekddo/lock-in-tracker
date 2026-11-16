import { useState } from "react";
import { addDays, formatShort, relativeLabel, weekDays, WEEKDAYS_SHORT } from "../lib/dates";
import {
  ACTIVITY,
  DAY_KINDS,
  DAY_TIPS,
  dayMacros,
  FOODS,
  GOALS,
  validProfile,
  type Activity,
  type DayKind,
  type Goal,
  type NutritionProfile,
} from "../lib/nutrition";
import { dayStatus } from "../lib/plan";
import type { Meal } from "../lib/types";
import { MealForm } from "./MealForm";
import { Icon, numText, parseNum, SettingsButton, Sheet, useApp } from "./common";

function useDayKind() {
  const { plan, byDate } = useApp();
  return (key: string): { kind: DayKind; km: number | null } => {
    const s = dayStatus(plan, byDate.get(key), key);
    const kind: DayKind = s.showGym && s.showRun ? "both" : s.showGym ? "gym" : s.showRun ? "run" : "rest";
    return { kind, km: s.run?.km ?? null };
  };
}

export function Nutrition() {
  const { plan, savePlan, selected } = useApp();
  const [editing, setEditing] = useState(false);
  const profile = plan.nutrition;

  function save(p: NutritionProfile) {
    savePlan({ ...plan, nutrition: p }, "Zapisano dane");
    setEditing(false);
  }

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Jedzenie</p>
          <h1>{profile ? "Twoje makro" : "Policzmy makro"}</h1>
        </div>
        <SettingsButton />
      </header>

      {profile ? (
        <Targets key={selected} profile={profile} onEdit={() => setEditing(true)} />
      ) : (
        <>
          <p className="muted">
            Podaj kilka danych, a policzę kalorie i makro osobno na dzień siłowy, biegowy i wolny — pod Twój plan tygodnia.
          </p>
          <section className="card">
            <ProfileForm onSave={save} />
          </section>
        </>
      )}

      {editing && profile && (
        <Sheet title="Twoje dane" onClose={() => setEditing(false)}>
          <ProfileForm initial={profile} onSave={save} />
        </Sheet>
      )}
    </div>
  );
}

function Targets({ profile, onEdit }: { profile: NutritionProfile; onEdit: () => void }) {
  const { today, selected, select, byDate, saveDay } = useApp();
  const kindOf = useDayKind();
  const dayInfo = kindOf(selected);
  const [kind, setKind] = useState<DayKind>(dayInfo.kind);
  const [adding, setAdding] = useState(false);
  const m = dayMacros(profile, kind, kind === dayInfo.kind ? dayInfo.km : null);
  const tips = DAY_TIPS[kind];
  const perMeal = Math.round(m.protein / 4 / 5) * 5;

  const log = byDate.get(selected);
  const meals = log?.meals ?? [];
  const eaten = meals.reduce((a, x) => ({ kcal: a.kcal + x.kcal, p: a.p + x.p, c: a.c + x.c, f: a.f + x.f }), { kcal: 0, p: 0, c: 0, f: 0 });
  const left = m.kcal - eaten.kcal;

  const setMeals = (next: Meal[]) => saveDay({ ...(log ?? { date: selected }), meals: next });

  return (
    <>
      <div className="day-nav">
        <button className="icon-btn" onClick={() => select(addDays(selected, -1))} aria-label="Poprzedni dzień">
          <Icon name="back" size={18} />
        </button>
        <div className="day-nav-label">
          <strong>{relativeLabel(selected, today)}</strong>
          <span className="muted small">{formatShort(selected)}</span>
        </div>
        <button className="icon-btn" onClick={() => select(addDays(selected, 1))} aria-label="Następny dzień">
          <Icon name="chevron" size={18} />
        </button>
      </div>

      <div className="chips kind-chips" role="radiogroup" aria-label="Rodzaj dnia">
        {(Object.keys(DAY_KINDS) as DayKind[]).map((k) => (
          <button key={k} role="radio" aria-checked={kind === k} className={`chip kind ${kind === k ? "on" : ""}`} onClick={() => setKind(k)}>
            {DAY_KINDS[k]}
            {k === dayInfo.kind && <span className="kind-today">{selected === today ? "dziś" : "w planie"}</span>}
          </button>
        ))}
      </div>

      <section className="card macro-card">
        <div className="kcal">
          {meals.length > 0 && <span className="kcal-value eaten">{eaten.kcal.toLocaleString("pl-PL")}</span>}
          {meals.length > 0 && <span className="kcal-sep">/</span>}
          <span className="kcal-value">{m.kcal.toLocaleString("pl-PL")}</span>
          <span className="muted">kcal</span>
        </div>
        <p className="muted small">
          {meals.length > 0
            ? left >= 0
              ? `Zostało ${left.toLocaleString("pl-PL")} kcal`
              : `${(-left).toLocaleString("pl-PL")} kcal ponad cel`
            : kind === "rest"
              ? "Bez treningu"
              : `W tym ok. ${m.training} kcal na trening`}{" "}
          · cel: {GOALS[profile.goal].label.toLowerCase()}
        </p>
        <div className="macros">
          <Macro label="Białko" target={m.protein} eaten={eaten.p} show={meals.length > 0} cls="p" />
          <Macro label="Węglowodany" target={m.carbs} eaten={eaten.c} show={meals.length > 0} cls="c" />
          <Macro label="Tłuszcze" target={m.fat} eaten={eaten.f} show={meals.length > 0} cls="f" />
        </div>
        {meals.length === 0 && (
          <p className="small">
            Białko najłatwiej dobić w 4 posiłkach po ok. <strong>{perMeal}&nbsp;g</strong>.
          </p>
        )}
      </section>

      <div className="section-head">
        <h2>Posiłki</h2>
        <button className="link" onClick={() => setAdding(true)}>
          + Dodaj
        </button>
      </div>
      {meals.length === 0 ? (
        <button className="card add-meal-empty" onClick={() => setAdding(true)}>
          <Icon name="plus" size={20} />
          <span>Dodaj pierwszy posiłek {selected === today ? "dziś" : "tego dnia"}</span>
        </button>
      ) : (
        <section className="card list meals">
          {meals.map((meal) => (
            <div key={meal.id} className="list-row meal-row">
              <div>
                <p className="list-title">{meal.name}</p>
                {meal.items && meal.items.length > 1 && (
                  <p className="small meal-items">{meal.items.map((it) => it.name).join(" · ")}</p>
                )}
                <p className="muted small">
                  {meal.time} · {meal.kcal} kcal · B {meal.p} · W {meal.c} · T {meal.f}
                </p>
              </div>
              <button className="icon-btn sm" onClick={() => setMeals(meals.filter((x) => x.id !== meal.id))} aria-label={`Usuń ${meal.name}`}>
                <Icon name="close" size={16} />
              </button>
            </div>
          ))}
        </section>
      )}

      {adding && (
        <Sheet title="Dodaj posiłek" onClose={() => setAdding(false)}>
          <MealForm
            onAdd={(meal) => {
              setMeals([...meals, meal]);
              setAdding(false);
            }}
          />
        </Sheet>
      )}

      <section className="card tips">
        <h2>{tips.title}</h2>
        <ul>
          {tips.tips.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </section>

      <div className="section-head">
        <h2>Ten tydzień</h2>
      </div>
      <section className="card week-macros">
        {weekDays(selected).map((key, i) => {
          const info = kindOf(key);
          const dm = dayMacros(profile, info.kind, info.km);
          return (
            <button key={key} className={`wm-row ${key === today ? "today" : ""} ${key === selected ? "sel" : ""}`} onClick={() => select(key)}>
              <span className="wm-day">
                {WEEKDAYS_SHORT[i]} <span className="muted small">{formatShort(key)}</span>
              </span>
              <span className={`wm-kind k-${info.kind}`}>{DAY_KINDS[info.kind]}</span>
              <span className="wm-num">{dm.kcal.toLocaleString("pl-PL")} kcal</span>
              <span className="wm-num muted">W {dm.carbs} g</span>
            </button>
          );
        })}
      </section>

      <div className="section-head">
        <h2>Czym dobić makro</h2>
      </div>
      {(Object.keys(FOODS) as (keyof typeof FOODS)[]).map((k) => (
        <FoodList key={k} group={k} />
      ))}

      <p className="muted small disclaimer">
        To szacunek z wzoru Mifflina-St Jeora i typowego spalania na treningu. Patrz na wagę przez 2–3 tygodnie: jeśli idzie w
        złą stronę, zmień cel albo poziom aktywności. Przy chorobach albo specjalnej diecie skonsultuj się z dietetykiem.
      </p>

      <button className="secondary" onClick={onEdit}>
        Zmień dane ({profile.weightKg.toString().replace(".", ",")} kg, {ACTIVITY[profile.activity].label.toLowerCase()})
      </button>
    </>
  );
}

function Macro({ label, target, eaten, show, cls }: { label: string; target: number; eaten: number; show: boolean; cls: string }) {
  const pct = target > 0 ? Math.round((eaten / target) * 100) : 0;
  const rest = target - eaten;
  return (
    <div className="macro">
      <div className="macro-head">
        <span className="small">{label}</span>
        <span className="macro-g">
          {show ? <span className="macro-eaten">{eaten}</span> : target}
          <small>{show ? ` / ${target} g` : " g"}</small>
        </span>
      </div>
      <div className="macro-track">
        <div className={`macro-fill ${cls} ${pct > 110 ? "over" : ""}`} style={{ width: `${show ? Math.min(100, pct) : 100}%`, opacity: show ? 1 : 0.35 }} />
      </div>
      <span className="muted small">{show ? (rest >= 0 ? `zostało ${rest} g` : `+${-rest} g`) : "cel na dzień"}</span>
    </div>
  );
}

function FoodList({ group }: { group: keyof typeof FOODS }) {
  const [open, setOpen] = useState(group === "protein");
  const g = FOODS[group];
  const key = group === "protein" ? "protein" : group === "carbs" ? "carbs" : "fat";
  return (
    <section className="card food">
      <button className="food-head" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <h3>{g.title}</h3>
        <Icon name={open ? "up" : "down"} size={18} />
      </button>
      {open && (
        <ul>
          {g.items.map((it) => (
            <li key={it.name}>
              <div>
                <p className="list-title">{it.name}</p>
                <p className="muted small">
                  {it.portion} · B {it.protein} · W {it.carbs} · T {it.fat} · {it.kcal} kcal
                </p>
              </div>
              <span className={`food-main ${group === "protein" ? "p" : group === "carbs" ? "c" : "f"}`}>{it[key]} g</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function NumField({
  label,
  unit,
  value,
  onChange,
  decimal = false,
}: {
  label: string;
  unit: string;
  value: number | undefined;
  onChange: (n: number | undefined) => void;
  decimal?: boolean;
}) {
  const [text, setText] = useState(numText(value));
  return (
    <label className="field">
      <span>{label}</span>
      <span className="num-field">
        <input
          inputMode={decimal ? "decimal" : "numeric"}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            const n = parseNum(e.target.value);
            onChange(n === null || Number.isNaN(n) ? undefined : n);
          }}
        />
        <span>{unit}</span>
      </span>
    </label>
  );
}

function ProfileForm({ initial, onSave }: { initial?: NutritionProfile; onSave: (p: NutritionProfile) => void }) {
  const [p, setP] = useState<Partial<NutritionProfile>>(initial ?? { activity: "medium", goal: "maintain", runKm: 5, gymMin: 60 });
  const set = (patch: Partial<NutritionProfile>) => setP((x) => ({ ...x, ...patch }));
  const ok = validProfile(p);

  return (
    <div className="form">
      <div className="field" role="group" aria-label="Płeć">
        <span>Płeć</span>
        <div className="segmented two" role="radiogroup">
          {(
            [
              ["m", "Mężczyzna"],
              ["f", "Kobieta"],
            ] as const
          ).map(([v, l]) => (
            <button key={v} role="radio" aria-checked={p.sex === v} className={p.sex === v ? "selected" : ""} onClick={() => set({ sex: v })}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="form-grid">
        <NumField label="Waga" unit="kg" value={p.weightKg} onChange={(weightKg) => set({ weightKg })} decimal />
        <NumField label="Wzrost" unit="cm" value={p.heightCm} onChange={(heightCm) => set({ heightCm })} />
        <NumField label="Wiek" unit="lat" value={p.age} onChange={(age) => set({ age })} />
      </div>

      <div className="field" role="group" aria-label="Ruch poza treningami">
        <span>Ruch poza treningami</span>
        <div className="options">
          {(Object.keys(ACTIVITY) as Activity[]).map((a) => (
            <button key={a} role="radio" aria-checked={p.activity === a} className={`option ${p.activity === a ? "selected" : ""}`} onClick={() => set({ activity: a })}>
              <strong>{ACTIVITY[a].label}</strong>
              <span className="muted small">{ACTIVITY[a].hint}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="field" role="group" aria-label="Cel">
        <span>Cel</span>
        <div className="options">
          {(Object.keys(GOALS) as Goal[]).map((g) => (
            <button key={g} role="radio" aria-checked={p.goal === g} className={`option ${p.goal === g ? "selected" : ""}`} onClick={() => set({ goal: g })}>
              <strong>{GOALS[g].label}</strong>
              <span className="muted small">{GOALS[g].hint}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="form-grid two">
        <NumField label="Typowy bieg" unit="km" value={p.runKm} onChange={(runKm) => set({ runKm })} decimal />
        <NumField label="Trening siłowy" unit="min" value={p.gymMin} onChange={(gymMin) => set({ gymMin })} />
      </div>
      <p className="muted small">Jeśli przy biegu wpiszesz kilometry, policzę dzień według nich.</p>

      <button className="primary" disabled={!ok} onClick={() => ok && onSave(p)}>
        {initial ? "Zapisz" : "Policz moje makro"}
      </button>
    </div>
  );
}
