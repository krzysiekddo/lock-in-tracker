import { useMemo, useState } from "react";
import { addDays, formatShort, weekDays, weekStart, WEEKDAYS_SHORT } from "../lib/dates";
import { dayStatus, exerciseStats, formatKg, formatSets, streak, volume } from "../lib/plan";
import { Icon, SettingsButton, useApp } from "./common";

const WEEKS = 8;

export function History() {
  const { plan, days, byDate, today, openDay } = useApp();
  const [showAllEx, setShowAllEx] = useState(false);

  const stats = useMemo(() => {
    const week = weekDays(today).filter((k) => k <= today);
    let wTotal = 0;
    let wDone = 0;
    for (const k of weekDays(today)) {
      const s = dayStatus(plan, byDate.get(k), k);
      wTotal += s.total;
      if (week.includes(k)) wDone += s.done;
    }
    const month = today.slice(0, 7);
    const inMonth = days.filter((d) => d.date.startsWith(month));
    return {
      streak: streak(plan, byDate, today),
      wDone,
      wTotal,
      runs: inMonth.filter((d) => d.run?.done).length,
      km: inMonth.reduce((a, d) => a + (d.run?.done ? (d.run.km ?? 0) : 0), 0),
      gyms: inMonth.filter((d) => d.gym?.done).length,
    };
  }, [plan, days, byDate, today]);

  const exStats = useMemo(() => exerciseStats(days), [days]);
  const recent = useMemo(
    () =>
      [...days]
        .filter((d) => d.run?.done || d.gym?.done || d.gym?.exercises.some((e) => e.sets.some((s) => s.done)))
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 20),
    [days],
  );

  const firstWeek = addDays(weekStart(today), -7 * (WEEKS - 1));
  const weeks = Array.from({ length: WEEKS }, (_, i) => weekDays(addDays(firstWeek, 7 * i))).reverse();

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Historia</p>
          <h1>Jak idzie</h1>
        </div>
        <SettingsButton />
      </header>

      <div className="stats">
        <div className="stat stat-hero">
          <span className="stat-label">
            <Icon name="flame" size={16} /> Passa
          </span>
          <span className="stat-value">{stats.streak}</span>
          <span className="muted small">treningów z rzędu</span>
        </div>
        <div className="stat">
          <span className="stat-label">Ten tydzień</span>
          <span className="stat-value">
            {stats.wDone}
            <small>/{stats.wTotal}</small>
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">Siłownie</span>
          <span className="stat-value">{stats.gyms}</span>
          <span className="muted small">w tym miesiącu</span>
        </div>
        <div className="stat">
          <span className="stat-label">Biegi</span>
          <span className="stat-value">
            {stats.runs}
            </span>
          <span className="muted small">{stats.km > 0 ? `${formatKg(Math.round(stats.km * 10) / 10)} km w mies.` : "w tym miesiącu"}</span>
        </div>
      </div>

      <section className="card grid-card">
        <div className="grid-row grid-head">
          <span />
          {WEEKDAYS_SHORT.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        {weeks.map((w) => (
          <div key={w[0]} className="grid-row">
            <span className="grid-label">{formatShort(w[0])}</span>
            {w.map((k) => {
              const s = dayStatus(plan, byDate.get(k), k);
              const future = k > today;
              const state = future
                ? "future"
                : s.total === 0
                  ? "off"
                  : s.done === s.total
                    ? "done"
                    : s.done > 0
                      ? "partial"
                      : s.beforeStart || k === today
                        ? "open"
                        : "missed";
              return (
                <button
                  key={k}
                  className={`cell ${state} ${k === today ? "today" : ""}`}
                  onClick={() => openDay(k)}
                  aria-label={`${formatShort(k)}: ${s.done}/${s.total}`}
                  title={`${formatShort(k)}: ${s.done}/${s.total}`}
                />
              );
            })}
          </div>
        ))}
        <div className="legend small muted">
          <span>
            <i className="cell done" /> wszystko
          </span>
          <span>
            <i className="cell partial" /> część
          </span>
          <span>
            <i className="cell missed" /> opuszczone
          </span>
          <span>
            <i className="cell off" /> wolne
          </span>
        </div>
      </section>

      <div className="section-head">
        <h2>Ćwiczenia</h2>
      </div>
      {exStats.length === 0 ? (
        <p className="muted small">Tu pojawią się Twoje ciężary, gdy zapiszesz pierwsze serie.</p>
      ) : (
        <section className="card list">
          {(showAllEx ? exStats : exStats.slice(0, 8)).map((e) => (
            <div key={e.name} className="list-row">
              <div>
                <p className="list-title">{e.name}</p>
                <p className="muted small">
                  {formatShort(e.lastDate)}: {formatSets(e.last)}
                </p>
              </div>
              {e.best && (
                <div className="pr">
                  <strong>{formatKg(e.best.weight)}</strong>
                  <span className="muted small">kg rekord</span>
                </div>
              )}
            </div>
          ))}
          {exStats.length > 8 && (
            <button className="link small" onClick={() => setShowAllEx((v) => !v)}>
              {showAllEx ? "Pokaż mniej" : `Pokaż wszystkie (${exStats.length})`}
            </button>
          )}
        </section>
      )}

      <div className="section-head">
        <h2>Ostatnie treningi</h2>
      </div>
      {recent.length === 0 ? (
        <p className="muted small">Jeszcze nic nie odhaczone. Pierwszy trening zaczyna passę.</p>
      ) : (
        <section className="card list">
          {recent.map((d) => {
            const vol = d.gym ? volume(d.gym) : 0;
            return (
              <button key={d.date} className="list-row" onClick={() => openDay(d.date)}>
                <div>
                  <p className="list-title">{formatShort(d.date)}</p>
                  <p className="muted small">
                    {[
                      d.gym && (d.gym.done ? d.gym.name : `${d.gym.name} (niedokończony)`),
                      d.gym && vol > 0 && `${vol.toLocaleString("pl-PL")} kg`,
                      d.run?.done && (d.run.km ? `bieg ${formatKg(d.run.km)} km` : "bieg"),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <Icon name="chevron" size={18} />
              </button>
            );
          })}
        </section>
      )}
    </div>
  );
}
