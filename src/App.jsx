import { useCallback, useEffect, useRef, useState } from "react";
import Confetti from "./Confetti.jsx";
import * as sound from "./sound.js";

// ---- Easy settings ---------------------------------------------------------
const COUNTDOWN_SECONDS = 10;
const TITLE = "Customer Care Week";
const CELEBRATION_MESSAGE = "Let the celebration begin!";
const SUBTITLE = "Thank you for putting our customers first";
// -----------------------------------------------------------------------------

const RADIUS = 200;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function App() {
  const [phase, setPhase] = useState("idle"); // idle | counting | celebrate
  const [count, setCount] = useState(COUNTDOWN_SECONDS);
  const [muted, setMuted] = useState(false);
  const timer = useRef(null);

  const start = useCallback(() => {
    sound.unlock();
    clearInterval(timer.current);
    setCount(COUNTDOWN_SECONDS);
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
    setCount(COUNTDOWN_SECONDS);
  }, []);

  const toggleMute = useCallback(() => {
    sound.unlock();
    setMuted((m) => {
      sound.setMuted(!m);
      return !m;
    });
  }, []);

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
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, start, reset, toggleFullscreen, toggleMute]);

  useEffect(() => () => clearInterval(timer.current), []);

  useEffect(() => {
    if (phase === "counting") sound.tick(count);
    else if (phase === "celebrate") sound.celebrate();
  }, [phase, count]);

  const progress = phase === "counting" ? (COUNTDOWN_SECONDS - count) / COUNTDOWN_SECONDS : 0;

  return (
    <main className={`stage phase-${phase}`}>
      <button className="mute" onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"}>
        {muted ? "🔇" : "🔊"}
      </button>
      <div className="bg-blob blob-a" />
      <div className="bg-blob blob-b" />
      <div className="bg-blob blob-c" />

      {phase === "idle" && (
        <section className="center intro" key="idle">
          <p className="eyebrow">It's almost time</p>
          <h1 className="title">{TITLE}</h1>
          <button className="btn" onClick={start}>
            Start the countdown
          </button>
          <p className="hint">Space / Enter to start · F fullscreen · M mute · R reset</p>
        </section>
      )}

      {phase === "counting" && (
        <section className="center counting" key="counting">
          <p className="eyebrow">{TITLE} begins in</p>
          <div className="ring-wrap">
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
                strokeDashoffset={CIRCUMFERENCE * progress}
                transform="rotate(-90 220 220)"
              />
            </svg>
            <div className="pulse" key={`p${count}`} />
            <span className="number" key={count}>
              {count}
            </span>
          </div>
        </section>
      )}

      {phase === "celebrate" && (
        <section className="center celebrate" key="celebrate">
          <Confetti active />
          <div className="burst" />
          <p className="eyebrow">{CELEBRATION_MESSAGE}</p>
          <h1 className="title big">
            {TITLE.split(" ").map((w, i) => (
              <span key={i} className="word" style={{ animationDelay: `${0.15 + i * 0.18}s` }}>
                {w}
              </span>
            ))}
          </h1>
          <p className="subtitle">{SUBTITLE}</p>
          <button className="btn ghost" onClick={reset}>
            Reset
          </button>
        </section>
      )}
    </main>
  );
}
