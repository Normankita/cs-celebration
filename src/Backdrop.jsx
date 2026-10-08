import { useEffect, useRef } from "react";
import { rgba, tint } from "./lib/config.js";

const rand = (a, b) => Math.random() * (b - a) + a;

// ---- the animated backgrounds ---------------------------------------------------------------
// Each factory gets a canvas context + size getter + the live values (progress 0..1, colours,
// dark flag) and returns draw(dt, speed). `speed` is smoothed and rises with progress, so every
// background accelerates toward the launch.

function warp(ctx, size, live) {
  const stars = Array.from({ length: 280 }, () => ({
    x: rand(-1, 1),
    y: rand(-1, 1),
    z: rand(0.05, 1),
    c: (Math.random() * 4) | 0,
  }));
  return (dt, speed) => {
    const { w, h } = size();
    const { colors, dark } = live.current;
    const pal = [colors.primary, colors.secondary, colors.accent, tint(colors.primary, 0.7)];
    const f = Math.max(w, h) * 0.38;
    const cx = w / 2;
    const cy = h / 2;
    const dz = (0.03 + speed * speed * 1.1) * dt;
    const streak = 0.012 + speed * 0.09;
    for (const s of stars) {
      s.z -= dz;
      if (s.z <= 0.02) {
        s.x = rand(-1, 1);
        s.y = rand(-1, 1);
        s.z = 1;
      }
      const px = cx + (s.x / s.z) * f * 0.5;
      const py = cy + (s.y / s.z) * f * 0.5;
      const qx = cx + (s.x / (s.z + streak)) * f * 0.5;
      const qy = cy + (s.y / (s.z + streak)) * f * 0.5;
      if (px < -50 || px > w + 50 || py < -50 || py > h + 50) {
        s.z = 1;
        continue;
      }
      const a = Math.min(1, (1 - s.z) * 1.1 + 0.12);
      ctx.strokeStyle = rgba(pal[s.c], dark ? a : Math.min(1, a * 0.8 + 0.1));
      ctx.lineWidth = (1 - s.z) * 2.6 + 0.5;
      ctx.beginPath();
      ctx.moveTo(qx, qy);
      ctx.lineTo(px, py);
      ctx.stroke();
    }
  };
}

function grid(ctx, size, live) {
  let off = 0;
  return (dt, speed) => {
    const { w, h } = size();
    const { colors, dark } = live.current;
    const hor = h * 0.52;
    const cx = w / 2;
    off = (off + dt * (0.25 + speed * 3.2)) % 1;

    // sun
    const r = h * 0.3;
    const g = ctx.createRadialGradient(cx, hor, 0, cx, hor, r);
    g.addColorStop(0, rgba(colors.secondary, dark ? 0.85 : 0.6));
    g.addColorStop(0.5, rgba(colors.primary, dark ? 0.35 : 0.25));
    g.addColorStop(1, rgba(colors.primary, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, hor, r, Math.PI, 0);
    ctx.fill();

    // floor
    const line = dark ? tint(colors.primary, 0.25) : colors.primary;
    ctx.lineWidth = 1.5;
    const N = 16;
    for (let i = 0; i < N; i++) {
      const t = (i + off) / N;
      const y = hor + (h - hor) * Math.pow(t, 2.3);
      ctx.strokeStyle = rgba(line, 0.15 + t * 0.6);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    for (let j = -16; j <= 16; j++) {
      ctx.strokeStyle = rgba(line, 0.35);
      ctx.beginPath();
      ctx.moveTo(cx + j * w * 0.012, hor);
      ctx.lineTo(cx + j * w * 0.17, h);
      ctx.stroke();
    }
    ctx.strokeStyle = rgba(colors.secondary, 0.9);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, hor);
    ctx.lineTo(w, hor);
    ctx.stroke();
  };
}

function rise(ctx, size, live) {
  const make = (anywhere) => ({
    x: Math.random(),
    y: anywhere ? Math.random() : 1.1,
    r: rand(0.006, 0.03),
    v: rand(0.4, 1.2),
    p: rand(0, 6.28),
    c: (Math.random() * 3) | 0,
  });
  const bubbles = Array.from({ length: 70 }, () => make(true));
  let t = 0;
  return (dt, speed) => {
    const { w, h } = size();
    const { colors, dark } = live.current;
    const pal = [colors.primary, colors.secondary, colors.accent];
    t += dt;
    for (let i = 0; i < bubbles.length; i++) {
      const b = bubbles[i];
      b.y -= b.v * (0.025 + speed * 0.28) * dt;
      if (b.y < -0.1) bubbles[i] = make(false);
      const x = (b.x + Math.sin(t * 0.8 + b.p) * 0.015) * w;
      const y = b.y * h;
      const r = b.r * Math.min(w, h) * 1.4;
      ctx.strokeStyle = rgba(pal[b.c], dark ? 0.7 : 0.55);
      ctx.fillStyle = rgba(pal[b.c], dark ? 0.12 : 0.1);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  };
}

const CANVAS_STYLES = { warp, grid, rise };

export default function Backdrop({ style, progress, final, show, colors, dark }) {
  const canvasRef = useRef(null);
  const live = useRef({ progress, final, colors, dark });
  live.current = { progress, final, colors, dark };

  useEffect(() => {
    const make = CANVAS_STYLES[style];
    if (!show || !make) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let w = 0;
    let h = 0;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = make(ctx, () => ({ w, h }), live);
    let speed = 0;
    let last = performance.now();
    let raf;
    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const target = 0.12 + live.current.progress * 0.8 + (live.current.final ? 0.5 : 0);
      speed += (target - speed) * Math.min(1, dt * 2);
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = live.current.dark ? "lighter" : "source-over";
      ctx.lineCap = "round";
      draw(dt, speed);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [style, show]);

  return (
    <div className={`cinematic bd-${style} ${show ? "show" : ""} ${final ? "final" : ""}`} aria-hidden="true">
      {style === "aurora" && (
        <div className="aurora">
          <i />
          <i />
          <i />
        </div>
      )}
      {CANVAS_STYLES[style] && <canvas ref={canvasRef} className="bd-canvas" />}
      <div className="veil" />
    </div>
  );
}
