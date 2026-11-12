import { useEffect, useRef, useState } from "react";
import { addDays, dayNumber, formatLong, formatShort, relativeLabel, weekDays, weekdayIndex, WEEKDAYS_SHORT } from "../lib/dates";
import { dayStatus, findTemplate, formatKg, formatSets, lastSets, newExerciseLog, newGymLog, targetReps, volume, type DayStatus } from "../lib/plan";
import type { DayLog, ExerciseLog, GymLog, SetLog, Template } from "../lib/types";
import { Icon, numText, parseNum, SettingsButton, Tick, useApp } from "./common";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function Today() {
  const { plan, byDate, today, selected } = useApp();
  const log = byDate.get(selected);
  const status = dayStatus(plan, log, selected);

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">{relativeLabel(selected, today)}</p>
          <h1>{cap(formatLong(selected))}</h1>
        </div>
        <SettingsButton />
      </header>

      <WeekStrip />

      {status.total > 0 && (
        <p className="day-progress">
          <strong>
            {status.done}/{status.total}
          </strong>{" "}
          {status.done === status.total ? "Wszystko odhaczone 💪" : "odhaczone"}
        </p>
      )}

      {status.total === 0 && (
        <div className="card rest-card">
          <h2>Dzień wolny</h2>
          <p className="muted">Nic nie ma w planie. Regeneracja też się liczy.</p>
        </div>
      )}

      {status.showRun && <RunCard key={`run-${selected}`} log={log} status={status} />}
      {status.showGym && <GymCard key={`gym-${selected}`} log={log} status={status} />}

      <Extras log={log} status={status} />
    </div>
  );
}

function WeekStrip() {
  const { plan, byDate, today, selected, select } = useApp();
  const days = weekDays(selected);
  return (
    <div className="week">
      <button className="icon-btn" onClick={() => select(addDays(selected, -7))} aria-label="Poprzedni tydzień">
        <Icon name="back" size={18} />
      </button>
      <div className="week-days">
        {days.map((key, i) => {
          const s = dayStatus(plan, byDate.get(key), key);
          const state =
            s.total === 0 ? "rest" : s.done === s.total ? "done" : key < today && !s.beforeStart ? "missed" : "pending";
          return (
            <button
              key={key}
              className={`wd ${state} ${key === selected ? "selected" : ""} ${key === today ? "today" : ""}`}
              onClick={() => select(key)}
              aria-label={`${WEEKDAYS_SHORT[i]} ${formatShort(key)}`}
              aria-current={key === selected ? "date" : undefined}
            >
              <span className="wd-name">{WEEKDAYS_SHORT[i]}</span>
              <span className="wd-num">{dayNumber(key)}</span>
              <span className="wd-dots">
                {s.showRun && <i className={s.run?.done ? "on" : ""} />}
                {s.showGym && <i className={`sq ${s.gym?.done ? "on" : ""}`} />}
              </span>
            </button>
          );
        })}
      </div>
      <button className="icon-btn" onClick={() => select(addDays(selected, 7))} aria-label="Następny tydzień">
        <Icon name="chevron" size={18} />
      </button>
      {selected !== today && (
        <button className="link today-link" onClick={() => select(today)}>
          Wróć do dziś
        </button>
      )}
    </div>
  );
}

function RunCard({ log, status }: { log: DayLog | undefined; status: DayStatus }) {
  const { saveDay, selected, notify } = useApp();
  const run = status.run;
  const done = !!run?.done;
  const extra = !!run?.extra;
  const base: DayLog = log ?? { date: selected };
  const [km, setKm] = useState(numText(run?.km));

  function toggle() {
    saveDay({ ...base, skipRun: false, run: { done: !done, km: run?.km ?? null, extra: extra || undefined } });
    if (!done) notify("Bieg odhaczony 🏃");
  }

  function saveKm() {
    const n = parseNum(km);
    if (Number.isNaN(n)) return setKm(numText(run?.km));
    if (n !== (run?.km ?? null)) saveDay({ ...base, run: { done, km: n, extra: extra || undefined } });
  }

  function remove() {
    // An extra run disappears; a planned one is marked as dropped for this day.
    saveDay({ ...base, run: null, skipRun: extra ? undefined : true });
  }

  return (
    <section className={`card item ${done ? "is-done" : ""}`}>
      <div className="item-main">
        <Tick done={done} onClick={toggle} label={done ? "Cofnij odhaczenie biegu" : "Odhacz bieg"} size="lg" />
        <div className="item-text">
          <h2>
            <Icon name="run" size={20} /> Bieg
          </h2>
          <p className="muted small">{extra ? "Dodatkowy, spoza planu" : "W planie"}</p>
        </div>
        {!done && (
          <button className="link small" onClick={remove}>
            {extra ? "Usuń" : "Nie dziś"}
          </button>
        )}
      </div>
      {done && (
        <label className="km">
          <span className="muted small">Dystans (opcjonalnie)</span>
          <span className="num-field">
            <input inputMode="decimal" placeholder="—" value={km} onChange={(e) => setKm(e.target.value)} onBlur={saveKm} />
            <span>km</span>
          </span>
        </label>
      )}
    </section>
  );
}

function GymCard({ log, status }: { log: DayLog | undefined; status: DayStatus }) {
  const { plan, days, saveDay, selected, notify } = useApp();
  const base: DayLog = log ?? { date: selected };
  const [choosing, setChoosing] = useState(false);

  if (status.gym) return <GymSession log={base} initial={status.gym} />;

  const template = status.plannedTemplate!;

  function start(t: Template, done: boolean) {
    const gym = newGymLog(days, selected, t);
    saveDay({ ...base, skipGym: false, gym: done ? { ...gym, done: true, exercises: [] } : gym });
    if (done) notify(`${t.name} odhaczony 💪`);
  }

  return (
    <section className="card item">
      <div className="item-main">
        <Tick done={false} onClick={() => start(template, true)} label={`Odhacz trening ${template.name}`} size="lg" />
        <div className="item-text">
          <h2>
            <Icon name="gym" size={20} /> {template.name}
          </h2>
          <p className="muted small">Siłownia · {template.exercises.length} ćwiczeń</p>
        </div>
        <button className="link small" onClick={() => saveDay({ ...base, skipGym: true })}>
          Nie dziś
        </button>
      </div>

      <ul className="preview">
        {template.exercises.map((e) => {
          const last = lastSets(days, e.name, selected);
          return (
            <li key={e.id}>
              <span>{e.name}</span>
              <span className="muted">
                {e.sets}×{e.reps}
                {last && last.sets[0].weight !== null && ` · ${formatKg(last.sets[0].weight)} kg`}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="actions">
        <button className="primary" onClick={() => start(template, false)}>
          Zacznij i zapisuj serie
        </button>
        {plan.templates.length > 1 && (
          <button className="link small" onClick={() => setChoosing((c) => !c)}>
            Zmień trening
          </button>
        )}
      </div>
      {choosing && (
        <div className="chips">
          {plan.templates
            .filter((t) => t.id !== template.id)
            .map((t) => (
              <button key={t.id} className="chip" onClick={() => start(t, false)}>
                {t.name}
              </button>
            ))}
        </div>
      )}
    </section>
  );
}

/** A started (or ticked) gym session; edits are kept locally and saved shortly after. */
function GymSession({ log, initial }: { log: DayLog; initial: GymLog }) {
  const { plan, days, saveDay, selected, notify } = useApp();
  const [gym, setGym] = useState<GymLog>(initial);
  const [newName, setNewName] = useState("");

  // Save against the latest day log, so a run ticked meanwhile is not overwritten.
  const logRef = useRef(log);
  logRef.current = log;
  const pending = useRef<GymLog | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const flush = () => {
    clearTimeout(timer.current);
    if (pending.current) saveDay({ ...logRef.current, gym: pending.current });
    pending.current = null;
  };
  useEffect(() => flush, []); // eslint-disable-line react-hooks/exhaustive-deps

  function change(next: GymLog, now = false) {
    setGym(next);
    pending.current = next;
    clearTimeout(timer.current);
    if (now) flush();
    else timer.current = setTimeout(flush, 700);
  }

  const setEx = (i: number, e: ExerciseLog) => change({ ...gym, exercises: gym.exercises.map((x, j) => (j === i ? e : x)) });

  function toggleDone() {
    change({ ...gym, done: !gym.done }, true);
    if (!gym.done) notify(`${gym.name} odhaczony 💪`);
  }

  function fillFromTemplate() {
    const t = findTemplate(plan, gym.templateId);
    if (t) change({ ...newGymLog(days, selected, t), done: gym.done, extra: gym.extra }, true);
  }

  function clear() {
    clearTimeout(timer.current);
    pending.current = null;
    saveDay({ ...logRef.current, gym: null });
  }

  function addExercise() {
    const name = newName.trim();
    if (!name) return;
    change({ ...gym, exercises: [...gym.exercises, newExerciseLog(days, selected, name, 3)] }, true);
    setNewName("");
  }

  const allSetsDone = gym.exercises.length > 0 && gym.exercises.every((e) => e.sets.every((s) => s.done));
  const vol = volume(gym);

  return (
    <section className={`card item ${gym.done ? "is-done" : ""}`}>
      <div className="item-main">
        <Tick done={gym.done} onClick={toggleDone} label={gym.done ? "Cofnij odhaczenie treningu" : "Odhacz trening"} size="lg" />
        <div className="item-text">
          <h2>
            <Icon name="gym" size={20} /> {gym.name}
          </h2>
          <p className="muted small">
            {gym.extra ? "Dodatkowy trening" : "Siłownia"}
            {vol > 0 && ` · ${vol.toLocaleString("pl-PL")} kg objętości`}
          </p>
        </div>
      </div>

      {gym.exercises.length === 0 ? (
        <div className="actions">
          <p className="muted small">Odhaczone bez rozpisanych serii.</p>
          {gym.templateId && findTemplate(plan, gym.templateId) && (
            <button className="secondary" onClick={fillFromTemplate}>
              Rozpisz serie
            </button>
          )}
        </div>
      ) : (
        <div className="exercises">
          {gym.exercises.map((e, i) => (
            <ExerciseBlock
              key={e.id}
              ex={e}
              date={selected}
              onChange={(next) => setEx(i, next)}
              onTick={(next) => change({ ...gym, exercises: gym.exercises.map((x, j) => (j === i ? next : x)) }, true)}
              onRemove={() => change({ ...gym, exercises: gym.exercises.filter((_, j) => j !== i) }, true)}
            />
          ))}
        </div>
      )}

      <div className="add-ex">
        <input
          placeholder="Dodaj ćwiczenie do tego treningu"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addExercise()}
        />
        <button className="icon-btn" onClick={addExercise} disabled={!newName.trim()} aria-label="Dodaj ćwiczenie">
          <Icon name="plus" size={20} />
        </button>
      </div>

      <div className="actions">
        {!gym.done && gym.exercises.length > 0 && (
          <button className={allSetsDone ? "primary" : "secondary"} onClick={toggleDone}>
            Zakończ trening
          </button>
        )}
        <button className="link small danger-link" onClick={clear}>
          Wyczyść
        </button>
      </div>
    </section>
  );
}

function ExerciseBlock({
  ex,
  date,
  onChange,
  onTick,
  onRemove,
}: {
  ex: ExerciseLog;
  date: string;
  onChange: (e: ExerciseLog) => void;
  onTick: (e: ExerciseLog) => void;
  onRemove: () => void;
}) {
  const { days } = useApp();
  const last = lastSets(days, ex.name, date);
  const target = targetReps(ex.target);

  const setSet = (i: number, s: SetLog) => ex.sets.map((x, j) => (j === i ? s : x));

  function tick(i: number) {
    const s = ex.sets[i];
    const prev = last?.sets[i] ?? last?.sets[last.sets.length - 1];
    // Ticking an empty set accepts the suggested numbers.
    const filled: SetLog = s.done
      ? { ...s, done: false }
      : { weight: s.weight ?? prev?.weight ?? null, reps: s.reps ?? prev?.reps ?? target, done: true };
    onTick({ ...ex, sets: setSet(i, filled) });
  }

  const doneCount = ex.sets.filter((s) => s.done).length;

  return (
    <div className={`ex ${doneCount === ex.sets.length ? "ex-done" : ""}`}>
      <div className="ex-head">
        <h3>{ex.name}</h3>
        <span className="muted small">
          {doneCount}/{ex.sets.length}
          {ex.target && ` · cel ${ex.target}`}
        </span>
      </div>
      {last && (
        <p className="ex-last small muted">
          Ostatnio ({formatShort(last.date)}): {formatSets(last.sets)}
        </p>
      )}
      <div className="sets">
        {ex.sets.map((s, i) => {
          const prev = last?.sets[i] ?? last?.sets[last.sets.length - 1];
          return (
            <div key={i} className={`set ${s.done ? "done" : ""}`}>
              <span className="set-n">{i + 1}</span>
              <NumInput
                value={s.weight}
                onChange={(weight) => onChange({ ...ex, sets: setSet(i, { ...s, weight }) })}
                placeholder={prev?.weight ?? null}
                unit="kg"
                label={`${ex.name}, seria ${i + 1}: ciężar`}
                decimal
              />
              <span className="times">×</span>
              <NumInput
                value={s.reps}
                onChange={(reps) => onChange({ ...ex, sets: setSet(i, { ...s, reps }) })}
                placeholder={prev?.reps ?? target}
                unit="powt."
                label={`${ex.name}, seria ${i + 1}: powtórzenia`}
              />
              <Tick done={s.done} onClick={() => tick(i)} label={`Seria ${i + 1} ${s.done ? "zrobiona" : "do odhaczenia"}`} size="sm" />
            </div>
          );
        })}
      </div>
      <div className="ex-actions">
        <button
          className="link small"
          onClick={() => {
            const lastSet = ex.sets[ex.sets.length - 1];
            onChange({ ...ex, sets: [...ex.sets, { weight: lastSet?.weight ?? null, reps: null, done: false }] });
          }}
        >
          + seria
        </button>
        {ex.sets.length > 1 && (
          <button className="link small" onClick={() => onChange({ ...ex, sets: ex.sets.slice(0, -1) })}>
            − seria
          </button>
        )}
        <button className="link small danger-link" onClick={onRemove}>
          Usuń ćwiczenie
        </button>
      </div>
    </div>
  );
}

function NumInput({
  value,
  onChange,
  placeholder,
  unit,
  label,
  decimal = false,
}: {
  value: number | null;
  onChange: (n: number | null) => void;
  placeholder: number | null;
  unit: string;
  label: string;
  decimal?: boolean;
}) {
  const [text, setText] = useState(numText(value));

  // Follow outside changes (e.g. a tick filling in the suggestion) without fighting the cursor.
  useEffect(() => {
    if (parseNum(text) !== value) setText(numText(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <label className="num-field">
      <input
        inputMode={decimal ? "decimal" : "numeric"}
        value={text}
        placeholder={placeholder === null ? "—" : numText(placeholder)}
        aria-label={label}
        onFocus={(e) => e.target.select()}
        onChange={(e) => {
          setText(e.target.value);
          const n = parseNum(e.target.value);
          if (!Number.isNaN(n)) onChange(n);
        }}
        onBlur={() => setText(numText(value))}
      />
      <span>{unit}</span>
    </label>
  );
}

function Extras({ log, status }: { log: DayLog | undefined; status: DayStatus }) {
  const { plan, days, saveDay, selected } = useApp();
  const [choosing, setChoosing] = useState(false);
  const base: DayLog = log ?? { date: selected };
  if (status.showRun && status.showGym) return null;

  const plannedRun = plan.week[weekdayIndex(selected)]?.run;

  return (
    <div className="extras">
      <p className="muted small">Dodaj do tego dnia</p>
      <div className="chips">
        {!status.showRun && (
          <button className="chip" onClick={() => saveDay({ ...base, skipRun: false, run: { done: false, extra: plannedRun ? undefined : true } })}>
            <Icon name="plus" size={16} /> Bieg
          </button>
        )}
        {!status.showGym && (
          <button className="chip" onClick={() => setChoosing((c) => !c)} aria-expanded={choosing}>
            <Icon name="plus" size={16} /> Siłownia
          </button>
        )}
      </div>
      {choosing && !status.showGym && (
        <div className="chips">
          {plan.templates.map((t) => (
            <button
              key={t.id}
              className="chip chip-solid"
              onClick={() => {
                const planned = status.plannedTemplate?.id === t.id;
                saveDay({ ...base, skipGym: false, gym: newGymLog(days, selected, t, !planned) });
                setChoosing(false);
              }}
            >
              {t.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
