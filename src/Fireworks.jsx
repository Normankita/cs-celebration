import { useEffect, useRef } from "react";
import * as sound from "./sound.js";

// Brand colours, lightened so they glow against the night-sky background, plus one warm accent.
const PALETTES = [
  ["#5fd0ff", "#26A9E0", "#ffffff"],
  ["#b6e36a", "#8BC53F", "#ffffff"],
  ["#26A9E0", "#8BC53F", "#ffffff"],
  ["#ffffff", "#d5d7d9", "#5fd0ff"],
  ["#ffe08a", "#fff3c4", "#8BC53F"],
];
const rand = (min, max) => Math.random() * (max - min) + min;
const pick = (arr) => arr[(Math.random() * arr.length) | 0];

// Full-screen fireworks. Every rocket schedules its own whistle + boom in sound.js,
// timed to land exactly when the visual burst happens.
export default function Fireworks({ active }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const W = () => window.innerWidth;
    const H = () => window.innerHeight;
    let rockets = [];
    let sparks = [];
    let flashes = [];
    const timers = [];

    const launch = (flightMs = rand(750, 1150)) => {
      const x = rand(W() * 0.12, W() * 0.88);
      rockets.push({
        x0: x + rand(-60, 60),
        x,
        ty: rand(H() * 0.12, H() * 0.48),
        born: performance.now(),
        flight: flightMs,
        palette: pick(PALETTES),
        size: rand(0.8, 1.25),
        x1: 0,
        y1: 0,
      });
      sound.launch(flightMs / 1000);
    };

    const explode = (r) => {
      const n = Math.floor(rand(90, 150) * r.size);
      const ring = Math.random() < 0.3;
      const speed = rand(6, 9.5) * r.size * Math.max(0.7, H() / 900);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + rand(-0.05, 0.05);
        const s = ring ? speed : speed * Math.sqrt(Math.random());
        sparks.push({
          x: r.x,
          y: r.ty,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s,
          life: 0,
          ttl: rand(1300, 2200),
          color: pick(r.palette),
          hist: [],
          w: rand(1.5, 3.2),
        });
      }
      flashes.push({ x: r.x, y: r.ty, born: performance.now(), size: 260 * r.size });
    };

    // Opening salvo (first rocket is quick so the boom follows the long pip closely),
    // then a heavy finale, then a gentler loop so the screen stays alive.
    launch(550);
    [250, 500, 800, 1100, 1450].forEach((t) => timers.push(setTimeout(() => launch(), t)));
    const started = performance.now();
    const loop = () => {
      launch();
      if (Math.random() < 0.4) timers.push(setTimeout(() => launch(), rand(80, 250)));
      const heavy = performance.now() - started < 9000;
      timers.push(setTimeout(loop, heavy ? rand(350, 700) : rand(1200, 2400)));
    };
    timers.push(setTimeout(loop, 1900));

    let raf;
    let last = performance.now();
    const frame = (now) => {
      const dt = Math.min((now - last) / 16.67, 3);
      last = now;
      ctx.clearRect(0, 0, W(), H());
      ctx.globalCompositeOperation = "lighter";
      ctx.lineCap = "round";

      // flashes
      flashes = flashes.filter((f) => now - f.born < 450);
      for (const f of flashes) {
        const k = (now - f.born) / 450;
        const rad = f.size * (0.4 + k);
        const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, rad);
        grad.addColorStop(0, `rgba(255,255,255,${0.55 * (1 - k)})`);
        grad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(f.x, f.y, rad, 0, Math.PI * 2);
        ctx.fill();
      }

      // rockets
      const alive = [];
      for (const r of rockets) {
        const t = (now - r.born) / r.flight;
        if (t >= 1) {
          explode(r);
          continue;
        }
        const e = 1 - (1 - t) * (1 - t);
        const x = r.x0 + (r.x - r.x0) * e;
        const y = H() + (r.ty - H()) * e;
        ctx.strokeStyle = "rgba(255,240,200,0.9)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(r.x1 || x, r.y1 || y + 18);
        ctx.lineTo(x, y);
        ctx.stroke();
        // little exhaust spark
        sparks.push({ x, y, vx: rand(-0.4, 0.4), vy: rand(0.5, 1.5), life: 0, ttl: 350, color: "#ffd9a0", hist: [], w: 1.5 });
        r.x1 = x;
        r.y1 = y + 14;
        alive.push(r);
      }
      rockets = alive;

      // sparks
      sparks = sparks.filter((s) => s.life < s.ttl);
      for (const s of sparks) {
        s.life += 16.67 * dt;
        s.hist.push(s.x, s.y);
        if (s.hist.length > 14) s.hist.splice(0, 2);
        s.vx *= Math.pow(0.97, dt);
        s.vy = s.vy * Math.pow(0.97, dt) + 0.055 * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        const a = Math.max(0, 1 - s.life / s.ttl);
        ctx.strokeStyle = s.color;
        ctx.globalAlpha = a * a;
        ctx.lineWidth = s.w * (0.4 + a * 0.6);
        ctx.beginPath();
        const h = s.hist;
        ctx.moveTo(h[0], h[1]);
        for (let i = 2; i < h.length; i += 2) ctx.lineTo(h[i], h[i + 1]);
        ctx.lineTo(s.x, s.y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      window.removeEventListener("resize", resize);
    };
  }, [active]);

  return <canvas ref={canvasRef} className="fireworks" />;
}
