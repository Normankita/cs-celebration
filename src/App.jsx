import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Confetti from "./Confetti.jsx";
import Fireworks from "./Fireworks.jsx";
import Cinematic from "./Cinematic.jsx";
import Rocket from "./Rocket.jsx";
import { SCENES } from "./scenes.js";
import * as sound from "./sound.js";

// ---- Easy settings ---------------------------------------------------------
const TOTAL_SECONDS = 30; // whole launch sequence: photo montage + final countdown
const FINAL_SECONDS = 10; // the big-number countdown at the end (the montage runs before it)
const LIFT_MS = 800; // how long the rocket flies before the fireworks start
const TITLE = "Door to Door Campaign";
const CELEBRATION_MESSAGE = "Let the Campaign begin!";
const SUBTITLE = "Thank you for putting our customers first";
const STATUS = {
  check: "Systems check",
  fuel: "Fuelled by great service",
  ignition: "Ignition sequence",
};
// -----------------------------------------------------------------------------

const RADIUS = 200;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SCENE_SECONDS = TOTAL_SECONDS / SCENES.length;

const clock = (n) => `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;

// Remembered choice wins; otherwise follow the operating system's preference.
function initialTheme() {
  try {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") return saved;
  } catch {}
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function App() {
  const [phase, setPhase] = useState("idle"); // idle | counting | celebrate
  const [count, setCount] = useState(TOTAL_SECONDS);
  const [muted, setMuted] = useState(false);
  const [theme, setTheme] = useState(initialTheme);
  const [lifted, setLifted] = useState(false); // rocket has cleared the top: fireworks may start
  const timer = useRef(null);

  const start = useCallback(() => {
    sound.unlock();
    clearInterval(timer.current);
    setCount(TOTAL_SECONDS);
    setPhase("counting");
    timer.current = setInterval(() => {
      setCount((c) => {
        if (c <= 1) {
          clearInterval(timer.current);
          setPhase("celebrate");
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }, []);

  const reset = useCallback(() => {
    clearInterval(timer.current);
    setPhase("idle");
    setCount(TOTAL_SECONDS);
  }, []);

  const toggleMute = useCallback(() => {
    sound.unlock();
    setMuted((m) => {
      sound.setMuted(!m);
      return !m;
    });
  }, []);

  const toggleTheme = useCallback(() => setTheme((t) => (t === "dark" ? "light" : "dark")), []);

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("theme", theme);
    } catch {}
  }, [theme]);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.();
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (phase === "idle") start();
        else if (phase === "celebrate") start();
      } else if (e.key.toLowerCase() === "r" || e.key === "Escape") reset();
      else if (e.key.toLowerCase() === "f") toggleFullscreen();
      else if (e.key.toLowerCase() === "m") toggleMute();
      else if (e.key.toLowerCase() === "t") toggleTheme();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, start, reset, toggleFullscreen, toggleMute, toggleTheme]);

  useEffect(() => () => clearInterval(timer.current), []);

  const final = phase === "counting" && count <= FINAL_SECONDS;
  // the dial leaves its dock one second early so it arrives in the middle just as "10" lands
  const centered = phase === "counting" && count <= FINAL_SECONDS + 1;

  // Soft beeps that build through the montage, then the BBC-style pips and engine rumble.
  useEffect(() => {
    if (phase !== "counting") return;
    if (final) sound.tick();
    else sound.beep((TOTAL_SECONDS - count) / (TOTAL_SECONDS - FINAL_SECONDS - 1));
    if (count === FINAL_SECONDS) sound.startRumble(FINAL_SECONDS);
  }, [phase, count, final]);

  useEffect(() => {
    if (phase === "celebrate") sound.celebrate();
    else sound.stopRumble();
  }, [phase]);

  // Fireworks begin once the rocket has left the screen.
  useEffect(() => {
    setLifted(false);
    if (phase !== "celebrate") return;
    const t = setTimeout(() => setLifted(true), LIFT_MS);
    return () => clearTimeout(t);
  }, [phase]);

  const elapsed = TOTAL_SECONDS - count;
  const sceneIndex = phase === "counting" ? Math.min(Math.floor(elapsed / SCENE_SECONDS), SCENES.length - 1) : -1;
  const trackProgress = phase === "counting" ? elapsed / TOTAL_SECONDS : 0;
  const ringProgress = trackProgress; // the dial fills across the whole run
  const status = final ? STATUS.ignition : elapsed < (TOTAL_SECONDS - FINAL_SECONDS) / 2 ? STATUS.check : STATUS.fuel;

  return (
    <main
      className={`stage phase-${phase} ${final ? "final" : ""}`}
      style={{ "--amp": final ? (FINAL_SECONDS - count + 1) * 0.45 : 0 }}
    >
      <Cinematic index={sceneIndex} final={final} />
      <div className="controls">
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
      </div>
      <div className="bg-blob blob-a" />
      <div className="bg-blob blob-b" />
      <div className="bg-blob blob-c" />

      {phase === "idle" && (
        <section className="center intro glass-card" key="idle">
          <p className="eyebrow">It's almost time</p>
          <h1 className="title">{TITLE}</h1>
          <button className="btn" onClick={start}>
            Start the countdown
          </button>
          <p className="hint">Space / Enter start · F fullscreen · T theme · M mute · R reset</p>
        </section>
      )}

      {phase === "counting" && (
        <>
          {final && <div className="edge-glow" key={`g${count}`} />}
          <p className="eyebrow pill top-pill">{final ? `${TITLE} launches in` : TITLE}</p>

          <div className={`dial ${centered ? "center-dial" : "docked"}`}>
            <div className="ring-glass" />
            <svg className="ring" viewBox="0 0 440 440">
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#26A9E0" />
                  <stop offset="100%" stopColor="#8BC53F" />
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
                strokeDashoffset={CIRCUMFERENCE * ringProgress}
                transform="rotate(-90 220 220)"
              />
            </svg>
            <div className="pulse" key={`p${count}`} />
            <span className="number" key={count}>
              {count}
            </span>
          </div>

          <div className="hud glass-card" key="hud">
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
              <div className="track-fill" style={{ width: `${trackProgress * 100}%` }} />
              <div className="track-rocket" style={{ left: `${trackProgress * 100}%` }}>
                <Rocket />
              </div>
            </div>
          </div>
        </>
      )}

      {phase === "celebrate" && (
        <section className="center celebrate" key="celebrate" style={{ "--lift": `${LIFT_MS / 1000}s` }}>
          <div className="liftoff" aria-hidden="true">
            <div className="smoke" />
            <div className="puff puff-l" />
            <div className="puff puff-r" />
            <Rocket className="rocket-big" />
          </div>
          {lifted && <Fireworks active />}
          {lifted && <Confetti active />}
          <div className="burst" />
          <div className="glass-card celebrate-card">
            <p className="eyebrow">{CELEBRATION_MESSAGE}</p>
            <h1 className="title big">
              {TITLE.split(" ").map((w, i) => (
                <span key={i} className="word" style={{ animationDelay: `calc(var(--lift) + ${0.15 + i * 0.18}s)` }}>
                  {w}
                </span>
              ))}
            </h1>
            {/* <p className="subtitle">{SUBTITLE}</p> */}
          </div>
          <button className="btn ghost" onClick={reset}>
            Reset
          </button>
        </section>
      )}
    </main>
  );
}
