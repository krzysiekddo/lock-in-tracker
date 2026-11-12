import { signOut } from "firebase/auth";
import { useState } from "react";
import { auth } from "../firebase";
import { ACCENTS, type Settings, type ThemeChoice } from "../lib/settings";
import { deleteAllData } from "../lib/store";
import { Icon, useApp } from "./common";

const THEMES: { id: ThemeChoice; label: string }[] = [
  { id: "system", label: "Systemowy" },
  { id: "light", label: "Jasny" },
  { id: "dark", label: "Ciemny" },
];

export function SettingsPanel({
  settings,
  update,
  onClose,
}: {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  onClose: () => void;
}) {
  const { db, user, days, notify } = useApp();
  const [confirmReset, setConfirmReset] = useState(false);
  const dark =
    document.documentElement.dataset.theme === "dark" ||
    (!document.documentElement.dataset.theme && matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <div className="form">
      <div className="field" role="group" aria-label="Motyw">
        <span>Motyw</span>
        <div className="segmented" role="radiogroup">
          {THEMES.map((t) => (
            <button
              key={t.id}
              role="radio"
              aria-checked={settings.theme === t.id}
              className={settings.theme === t.id ? "selected" : ""}
              onClick={() => update({ theme: t.id })}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="field" role="group" aria-label="Kolor akcentu">
        <span>Kolor akcentu</span>
        <div className="swatches" role="radiogroup">
          {ACCENTS.map((a) => {
            const on = settings.accent === a.id;
            return (
              <button key={a.id} role="radio" aria-checked={on} className={`swatch ${on ? "selected" : ""}`} onClick={() => update({ accent: a.id })}>
                <span className="swatch-dot" style={{ background: dark ? a.dark : a.light }}>
                  {on && <Icon name="check" size={16} />}
                </span>
                <span className="small">{a.name}</span>
              </button>
            );
          })}
        </div>
        <span className="muted small">Wygląd zapisuje się na tym urządzeniu.</span>
      </div>

      {confirmReset ? (
        <div className="confirm">
          <p className="small">Usunąć plan i całą historię ({days.length} dni)? Tego nie da się cofnąć.</p>
          <div className="row">
            <button
              className="danger"
              onClick={() => {
                deleteAllData(db, user.uid).catch((e) => {
                  console.error(e);
                  notify("Nie udało się usunąć danych z serwera.");
                });
                onClose();
              }}
            >
              Usuń wszystko
            </button>
            <button className="secondary" onClick={() => setConfirmReset(false)}>
              Anuluj
            </button>
          </div>
        </div>
      ) : (
        <button className="link danger-link" onClick={() => setConfirmReset(true)}>
          Usuń moje dane i zacznij od nowa
        </button>
      )}

      <p className="muted small">
        Zalogowano jako {user.displayName ?? user.email}.{" "}
        <button className="link small" onClick={() => auth && signOut(auth)}>
          Wyloguj
        </button>
      </p>
    </div>
  );
}
