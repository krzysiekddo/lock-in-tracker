import { useState } from "react";
import { WEEKDAYS } from "../lib/dates";
import { uid } from "../lib/plan";
import type { DayPlan, Exercise, Template } from "../lib/types";
import { Icon, SettingsButton, Sheet, useApp } from "./common";

export function PlanView() {
  const { plan, savePlan } = useApp();
  const [editing, setEditing] = useState<Template | null>(null);

  const setDay = (i: number, patch: Partial<DayPlan>) =>
    savePlan({ ...plan, week: plan.week.map((d, j) => (j === i ? { ...d, ...patch } : d)) });

  const runs = plan.week.filter((d) => d.run).length;
  const gyms = plan.week.filter((d) => d.gym).length;

  function saveTemplate(t: Template) {
    const exists = plan.templates.some((x) => x.id === t.id);
    savePlan(
      { ...plan, templates: exists ? plan.templates.map((x) => (x.id === t.id ? t : x)) : [...plan.templates, t] },
      exists ? "Zapisano trening" : "Dodano trening",
    );
    setEditing(null);
  }

  function deleteTemplate(id: string) {
    savePlan(
      {
        ...plan,
        templates: plan.templates.filter((t) => t.id !== id),
        week: plan.week.map((d) => (d.gym === id ? { ...d, gym: null } : d)),
      },
      "Usunięto trening",
    );
    setEditing(null);
  }

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Plan</p>
          <h1>Twój tydzień</h1>
        </div>
        <SettingsButton />
      </header>

      <p className="muted small">
        {gyms}× siłownia, {runs}× bieg w tygodniu. Zmiany od razu obowiązują w zakładce Dziś.
      </p>

      <section className="card week-plan">
        {plan.week.map((d, i) => (
          <div key={i} className="wp-row">
            <span className="wp-day">{WEEKDAYS[i]}</span>
            <select
              value={d.gym ?? ""}
              onChange={(e) => setDay(i, { gym: e.target.value || null })}
              aria-label={`${WEEKDAYS[i]}: siłownia`}
              className={d.gym ? "set" : ""}
            >
              <option value="">Bez siłowni</option>
              {plan.templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <button
              className={`run-toggle ${d.run ? "on" : ""}`}
              onClick={() => setDay(i, { run: !d.run })}
              aria-pressed={d.run}
              aria-label={`${WEEKDAYS[i]}: bieg`}
            >
              <Icon name="run" size={18} /> Bieg
            </button>
          </div>
        ))}
      </section>

      <div className="section-head">
        <h2>Treningi siłowe</h2>
        <button className="link" onClick={() => setEditing({ id: uid(), name: "", exercises: [] })}>
          + Nowy
        </button>
      </div>

      <div className="templates">
        {plan.templates.length === 0 && <p className="muted">Nie masz jeszcze żadnego treningu. Dodaj pierwszy.</p>}
        {plan.templates.map((t) => {
          const daysUsed = plan.week.map((d, i) => (d.gym === t.id ? WEEKDAYS[i].slice(0, 3) : null)).filter(Boolean);
          return (
            <button key={t.id} className="card template" onClick={() => setEditing(t)}>
              <div>
                <h3>{t.name}</h3>
                <p className="muted small">
                  {t.exercises.length} ćwiczeń{daysUsed.length ? ` · ${daysUsed.join(", ")}` : " · nie ma go w planie"}
                </p>
                <p className="small template-ex">{t.exercises.map((e) => e.name).join(" · ")}</p>
              </div>
              <Icon name="chevron" size={18} />
            </button>
          );
        })}
      </div>

      {editing && (
        <Sheet title={editing.name || "Nowy trening"} onClose={() => setEditing(null)}>
          <TemplateEditor
            initial={editing}
            isNew={!plan.templates.some((t) => t.id === editing.id)}
            onSave={saveTemplate}
            onDelete={() => deleteTemplate(editing.id)}
          />
        </Sheet>
      )}
    </div>
  );
}

function TemplateEditor({
  initial,
  isNew,
  onSave,
  onDelete,
}: {
  initial: Template;
  isNew: boolean;
  onSave: (t: Template) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(initial.name);
  const [exercises, setExercises] = useState<Exercise[]>(
    initial.exercises.length ? initial.exercises : [{ id: uid(), name: "", sets: 3, reps: "8–10" }],
  );
  const [confirmDelete, setConfirmDelete] = useState(false);

  const setEx = (i: number, patch: Partial<Exercise>) => setExercises((xs) => xs.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const move = (i: number, d: number) =>
    setExercises((xs) => {
      const next = [...xs];
      [next[i], next[i + d]] = [next[i + d], next[i]];
      return next;
    });

  const clean = exercises.filter((e) => e.name.trim()).map((e) => ({ ...e, name: e.name.trim(), reps: e.reps.trim() || "8–10" }));
  const valid = name.trim() && clean.length > 0;

  return (
    <div className="form">
      <label className="field">
        <span>Nazwa</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="np. Push, Góra A, FBW" autoFocus={isNew} />
      </label>

      <div className="ex-edit-list">
        <div className="ex-edit-head muted small">
          <span>Ćwiczenie</span>
          <span>Serie</span>
          <span>Powt.</span>
          <span />
        </div>
        {exercises.map((e, i) => (
          <div key={e.id} className="ex-edit">
            <input value={e.name} onChange={(ev) => setEx(i, { name: ev.target.value })} placeholder="Nazwa ćwiczenia" aria-label="Nazwa ćwiczenia" />
            <input
              inputMode="numeric"
              value={e.sets || ""}
              onChange={(ev) => setEx(i, { sets: Math.min(12, Number(ev.target.value.replace(/\D/g, "")) || 0) })}
              onBlur={() => !e.sets && setEx(i, { sets: 1 })}
              aria-label="Liczba serii"
            />
            <input value={e.reps} onChange={(ev) => setEx(i, { reps: ev.target.value })} aria-label="Powtórzenia" placeholder="8–10" />
            <div className="ex-edit-btns">
              <button className="icon-btn sm" disabled={i === 0} onClick={() => move(i, -1)} aria-label="W górę">
                <Icon name="up" size={16} />
              </button>
              <button className="icon-btn sm" disabled={i === exercises.length - 1} onClick={() => move(i, 1)} aria-label="W dół">
                <Icon name="down" size={16} />
              </button>
              <button className="icon-btn sm" onClick={() => setExercises((xs) => xs.filter((_, j) => j !== i))} aria-label="Usuń ćwiczenie">
                <Icon name="trash" size={16} />
              </button>
            </div>
          </div>
        ))}
        <button className="link" onClick={() => setExercises((xs) => [...xs, { id: uid(), name: "", sets: 3, reps: "8–10" }])}>
          + Dodaj ćwiczenie
        </button>
      </div>

      <button className="primary" disabled={!valid} onClick={() => onSave({ ...initial, name: name.trim(), exercises: clean })}>
        Zapisz
      </button>

      {!isNew &&
        (confirmDelete ? (
          <div className="confirm">
            <p className="small">Usunąć „{initial.name}”? Zniknie też z planu tygodnia. Zapisane treningi zostają w historii.</p>
            <div className="row">
              <button className="danger" onClick={onDelete}>
                Usuń
              </button>
              <button className="secondary" onClick={() => setConfirmDelete(false)}>
                Anuluj
              </button>
            </div>
          </div>
        ) : (
          <button className="link danger-link" onClick={() => setConfirmDelete(true)}>
            Usuń ten trening
          </button>
        ))}
    </div>
  );
}
