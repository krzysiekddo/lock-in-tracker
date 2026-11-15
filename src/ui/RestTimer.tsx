import { useEffect, useState } from "react";

export const REST_SECONDS = 120;

let audio: AudioContext | null = null;

/** Call from a click handler: browsers only allow sound after a user gesture. */
export function primeSound() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!audio && Ctx) audio = new Ctx();
    if (audio?.state === "suspended") void audio.resume();
  } catch {
    audio = null;
  }
}

function beep() {
  if (!audio) return;
  try {
    // Three short beeps.
    for (let i = 0; i < 3; i++) {
      const t = audio.currentTime + i * 0.25;
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.3, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      osc.connect(gain).connect(audio.destination);
      osc.start(t);
      osc.stop(t + 0.2);
    }
  } catch {
    // Sound is a bonus; the toast still shows.
  }
}

const fmt = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;

/**
 * Countdown pinned above the tab bar. Counts against a wall-clock end time,
 * so it stays right when the phone locks or the tab sleeps.
 */
export function RestTimer({
  endsAt,
  total,
  onAdd,
  onDone,
  onSkip,
}: {
  endsAt: number;
  total: number;
  onAdd: (sec: number) => void;
  onDone: () => void;
  onSkip: () => void;
}) {
  const [now, setNow] = useState(Date.now());
  const left = Math.max(0, Math.ceil((endsAt - now) / 1000));

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    const onVisible = () => setNow(Date.now());
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  useEffect(() => {
    if (left > 0) return;
    beep();
    try {
      navigator.vibrate?.([200, 100, 200]);
    } catch {
      // Not supported (e.g. iOS).
    }
    onDone();
  }, [left, onDone]);

  const progress = Math.min(1, Math.max(0, 1 - (endsAt - now) / (total * 1000)));

  return (
    <div className="rest-timer" role="timer" aria-live="off" aria-label={`Przerwa: zostało ${fmt(left)}`}>
      <div className="rest-bar" style={{ transform: `scaleX(${progress})` }} />
      <div className="rest-body">
        <div className="rest-text">
          <span className="rest-label">Przerwa</span>
          <span className="rest-time">{fmt(left)}</span>
        </div>
        <button className="rest-btn" onClick={() => onAdd(30)}>
          +30 s
        </button>
        <button className="rest-btn rest-skip" onClick={onSkip}>
          Pomiń
        </button>
      </div>
    </div>
  );
}
