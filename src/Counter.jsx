import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Backdrop from "./Backdrop.jsx";
import Confetti from "./Confetti.jsx";
import Fireworks from "./Fireworks.jsx";
import Rocket from "./Rocket.jsx";
import * as sound from "./sound.js";
import { usePresence } from "./lib/presence.js";
import { useTheme } from "./lib/theme.js";

const RADIUS = 200;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const BEEP_RAMP = 20; // the beeps build over the last 20 seconds before the final countdown
const LIFT_MS = 800; // how long the rocket flies before the fireworks start

const pad = (n) => String(n).padStart(2, "0");
// 90 -> "01:30", 3725 -> "1:02:05"
const clock = (n) => {
  const h = Math.floor(n / 3600);
  const m = Math.floor((n % 3600) / 60);
  return h > 0 ? `${h}:${pad(m)}:${pad(n % 60)}` : `${pad(m)}:${pad(n % 60)}`;
};

// Where a counter starts when it loads (or is reset).
function initialState(config) {
  if (config.mode === "until" && config.untilMs) {
    const secs = Math.ceil((config.untilMs - Date.now()) / 1000);
    if (secs > 0) {
      return { phase: secs > config.sequenceSeconds ? "waiting" : "counting", secs, target: config.untilMs, ended: false };
    }
    return { phase: "idle", secs: config.sequenceSeconds, target: null, ended: true };
  }
  return { phase: "idle", secs: config.sequenceSeconds, target: null, ended: false };
}

export default function Counter({ config, preview = false, extraControls = null }) {
  const seq = config.sequenceSeconds;
  const fin = Math.min(config.finalSeconds, seq);
  const fx = config.effects;
  const lift = fx.rocket ? LIFT_MS : 0;

  const [theme, toggleTheme] = useTheme(config.theme);
  const [state, setState] = useState(() => initialState(config));
  const { phase, secs, ended } = state;
  const target = useRef(state.target);
  const [muted, setMuted] = useState(!config.sound.enabled);
  const [soundReady, setSoundReady] = useState(sound.isReady());
  const [lifted, setLifted] = useState(false); // rocket has cleared the top: fireworks may start

  // Restart from the right place whenever the timing settings change (e.g. while editing).
  const timingKey = `${config.mode}|${config.untilMs}|${seq}`;
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const s = initialState(config);
    target.current = s.target;
    setState(s);
  }, [timingKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const unlock = useCallback(() => {
    sound.unlock();
    setSoundReady(true);
  }, []);

  // Browsers only allow sound after a click/key press; the first one anywhere unlocks it.
  useEffect(() => {
    if (soundReady) return;
    const on = () => unlock();
    window.addEventListener("pointerdown", on, { once: true });
    window.addEventListener("keydown", on, { once: true });
    return () => {
      window.removeEventListener("pointerdown", on);
      window.removeEventListener("keydown", on);
    };
  }, [soundReady, unlock]);

  useEffect(() => {
    setMuted(!config.sound.enabled);
  }, [config.sound.enabled]);
  useEffect(() => {
    sound.setVolume(config.sound.volume / 100);
  }, [config.sound.volume]);
  useEffect(() => {
    sound.setMuted(muted);
  }, [muted, soundReady]);

  const start = useCallback(() => {
    unlock();
    target.current = Date.now() + seq * 1000;
    setState({ phase: "counting", secs: seq, target: target.current, ended: false });
  }, [seq, unlock]);

  const reset = useCallback(() => {
    const s = initialState(config);
    target.current = s.target;
    setState(s);
  }, [config]);

  // The clock: always derived from the real time, so every viewer of an "until" counter is in sync
  // and a throttled background tab catches up instead of drifting.
  useEffect(() => {
    if (phase !== "waiting" && phase !== "counting") return;
    const tick = () => {
      const s = Math.ceil((target.current - Date.now()) / 1000);
      setState((p) => {
        if (s <= 0) return p.phase === "celebrate" ? p : { ...p, phase: "celebrate", secs: 0 };
        const next = p.phase === "waiting" && s <= seq ? "counting" : p.phase;
        return p.secs === s && next === p.phase ? p : { ...p, secs: s, phase: next };
      });
    };
    tick();
    const id = setInterval(tick, 100);
    return () => clearInterval(id);
  }, [phase, seq]);

  const toggleMute = useCallback(() => {
    unlock();
    setMuted((m) => !m);
  }, [unlock]);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.();
  }, []);

  // Keyboard shortcuts.
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest?.("input, textarea, select")) return;
      const k = e.key.toLowerCase();
      if (k === " " || k === "enter") {
        if (phase === "idle" || phase === "celebrate") {
          e.preventDefault();
          start();
        }
      } else if (k === "r" || e.key === "Escape") reset();
      else if (k === "f") toggleFullscreen();
      else if (k === "m") toggleMute();
      else if (k === "t") toggleTheme();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, start, reset, toggleFullscreen, toggleMute, toggleTheme]);

  // Commands from the editor's preview frame.
  useEffect(() => {
    if (!preview) return;
    const onMsg = (e) => {
      if (e.origin !== location.origin || e.data?.type !== "liftoff:cmd") return;
      if (e.data.cmd === "start") start();
      else if (e.data.cmd === "reset") reset();
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [preview, start, reset]);

  useEffect(() => {
    if (preview) return;
    const prev = document.title;
    document.title = config.title || "Countdown";
    return () => {
      document.title = prev;
    };
  }, [config.title, preview]);

  // Each screen stays mounted briefly after it ends so it can fade out instead of vanishing.
  const idleP = usePresence(phase === "idle");
  const waitP = usePresence(phase === "waiting");
  const countP = usePresence(phase === "counting");
  const celP = usePresence(phase === "celebrate", 600);
  const inCount = phase === "counting" || countP.leaving;
  const lv = (p) => (p.leaving ? " leave" : "");

  const count = secs;
  const final = inCount && count <= fin;
  // the dial leaves its dock one second early so it arrives in the middle just as the finale starts
  const centered = inCount && count <= fin + 1;
  const elapsed = seq - count;

  // Sounds: soft beeps that build, then the BBC-style pips and engine rumble.
  useEffect(() => {
    if (phase !== "counting" || !config.sound.beeps) return;
    if (final) sound.tick();
    else if (count <= fin + BEEP_RAMP) sound.beep((fin + BEEP_RAMP - count) / (BEEP_RAMP - 1));
  }, [phase, count]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (final && config.sound.rumble) sound.startRumble(Math.max(1, count));
    if (!final) sound.stopRumble();
  }, [final]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (phase === "celebrate") sound.celebrate({ rocket: fx.rocket });
    else if (phase !== "counting") sound.stopRumble();
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fireworks begin once the rocket has left the screen.
  useEffect(() => {
    if (phase === "celebrate") setLifted(false);
    const t = setTimeout(() => setLifted(phase === "celebrate"), phase === "celebrate" ? lift : 650);
    return () => clearTimeout(t);
  }, [phase, lift]);

  const progress = inCount ? Math.min(1, elapsed / Math.max(1, seq - 1)) : 0;
  const status = final ? config.statusIgnition : elapsed < (seq - fin) / 2 ? config.statusCheck : config.statusFuel;
  const longNumber = count > 99;

  // waiting screen: days / hours / minutes / seconds
  const parts = useMemo(() => {
    const d = Math.floor(secs / 86400);
    const h = Math.floor((secs % 86400) / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return [
      ...(d > 0 ? [[d, d === 1 ? "day" : "days"]] : []),
      [pad(h), "hours"],
      [pad(m), "min"],
      [pad(secs % 60), "sec"],
    ];
  }, [secs]);

  const colors = config.colors;
  const showBackdrop = phase === "waiting" || phase === "counting";
  const hasBackdrop = config.background !== "plain";

  const logo = config.logoUrl ? <img className="logo" src={config.logoUrl} alt="" referrerPolicy="no-referrer" /> : null;
  const soundChip =
    config.sound.enabled && !soundReady ? (
      <button className="chip" onClick={unlock}>
        🔈 Click to enable sound
      </button>
    ) : null;

  return (
    <main
      className={`stage phase-${phase} ${final ? "final" : ""} ${final && fx.shake ? "shake" : ""} ${hasBackdrop ? "has-backdrop" : ""}`}
      style={{
        "--blue": colors.primary,
        "--green": colors.secondary,
        "--gray": colors.accent,
        "--amp": final ? (fin - count + 1) * 0.45 : 0,
      }}
    >
      <Backdrop
        style={config.background}
        progress={progress}
        final={final}
        show={showBackdrop}
        colors={colors}
        dark={theme === "dark"}
      />
      <div className="sky" />
      <div className="controls">
        {extraControls}
        <button
          className="icon-btn"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
        <button className="icon-btn" onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"}>
          {muted ? "🔇" : "🔊"}
        </button>
        <button className="icon-btn" onClick={toggleFullscreen} aria-label="Toggle fullscreen">
          ⛶
        </button>
      </div>
      <div className="bg-blob blob-a" />
      <div className="bg-blob blob-b" />
      <div className="bg-blob blob-c" />

      {idleP.mounted && (
        <section className={`center intro glass-card${lv(idleP)}`} key="idle">
          {logo}
          <p className="eyebrow">{ended ? "This countdown has ended" : config.eyebrow}</p>
          <h1 className="title">{config.title}</h1>
          <button className="btn" onClick={start}>
            {ended ? "Replay the launch" : config.startLabel}
          </button>
          <p className="hint">Space start · F fullscreen · T theme · M mute · R reset</p>
          {soundChip}
        </section>
      )}

      {waitP.mounted && (
        <section className={`center waiting glass-card${lv(waitP)}`} key="waiting">
          {logo}
          <p className="eyebrow">{config.eyebrow}</p>
          <h1 className="title">{config.title}</h1>
          <div className="tiles">
            {parts.map(([v, label]) => (
              <div className="tile" key={label}>
                <b>{v}</b>
                <span>{label}</span>
              </div>
            ))}
          </div>
          <p className="hint">{new Date(config.untilMs).toLocaleString([], { dateStyle: "full", timeStyle: "short" })}</p>
          {soundChip}
        </section>
      )}

      {countP.mounted && (
        <>
          {final && fx.glow && <div className={`edge-glow${lv(countP)}`} key={`g${count}`} />}
          <p className={`eyebrow pill top-pill${lv(countP)}`}>{final ? `${config.title} ${config.launchLabel}` : config.title}</p>

          <div className={`dial ${centered ? "center-dial" : "docked"}${lv(countP)}`}>
            <div className="ring-glass" />
            <svg className="ring" viewBox="0 0 440 440">
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" style={{ stopColor: "var(--blue)" }} />
                  <stop offset="100%" style={{ stopColor: "var(--green)" }} />
                </linearGradient>
              </defs>
              <circle cx="220" cy="220" r={RADIUS} className="ring-bg" />
              <circle
                cx="220"
                cy="220"
                r={RADIUS}
                className="ring-fg"
                stroke="url(#grad)"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={CIRCUMFERENCE * progress}
                transform="rotate(-90 220 220)"
              />
            </svg>
            <div className="pulse" key={`p${count}`} />
            <span className={`number ${longNumber ? "long" : ""}`} key={count}>
              {longNumber ? clock(count) : count}
            </span>
          </div>

          <div className={`hud glass-card${lv(countP)}`} key="hud">
            <div className="hud-row">
              <span className="hud-status">
                <i className="hud-dot" />
                {status}
              </span>
              <span className="hud-clock">
                <small>T-minus</small> {clock(count)}
              </span>
            </div>
            <div className="track">
              <div className="track-fill" style={{ width: `${progress * 100}%` }} />
              <div className="track-rocket" style={{ left: `${progress * 100}%` }}>
                <Rocket />
              </div>
            </div>
          </div>
        </>
      )}

      {celP.mounted && (
        <section className={`center celebrate${lv(celP)}`} key="celebrate" style={{ "--lift": `${lift / 1000}s` }}>
          {fx.rocket && (
            <div className="liftoff" aria-hidden="true">
              <div className="smoke" />
              <div className="puff puff-l" />
              <div className="puff puff-r" />
              <Rocket className="rocket-big" />
            </div>
          )}
          {lifted && fx.fireworks && <Fireworks active colors={colors} />}
          {lifted && fx.confetti && <Confetti active colors={colors} />}
          <div className="burst" />
          <div className="glass-card celebrate-card">
            {logo}
            <p className="eyebrow">{config.celebrationMessage}</p>
            <h1 className="title big">
              {config.title.split(" ").map((w, i) => (
                <span key={i} className="word" style={{ animationDelay: `calc(var(--lift) + ${0.15 + i * 0.18}s)` }}>
                  {w}
                </span>
              ))}
            </h1>
            {config.subtitle && <p className="subtitle">{config.subtitle}</p>}
          </div>
          <button className="btn ghost" onClick={reset}>
            Reset
          </button>
        </section>
      )}
    </main>
  );
}
