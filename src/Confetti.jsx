import { useEffect, useRef } from "react";

const COLORS = ["#26A9E0", "#8BC53F", "#929497", "#ffffff"];
const rand = (min, max) => Math.random() * (max - min) + min;

function makePiece(x, y, angle, speed) {
  return {
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    size: rand(8, 16),
    color: COLORS[(Math.random() * COLORS.length) | 0],
    rot: rand(0, Math.PI * 2),
    vr: rand(-0.3, 0.3),
    shape: Math.random() < 0.3 ? "circle" : "rect",
    flip: rand(0, Math.PI * 2),
  };
}

// Full-screen confetti: two cannons at the bottom corners, then a continuous rain.
export default function Confetti({ active }) {
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
    let pieces = [];

    const cannon = (fromLeft) => {
      for (let i = 0; i < 90; i++) {
        const base = fromLeft ? -Math.PI / 3 : (-2 * Math.PI) / 3;
        pieces.push(
          makePiece(fromLeft ? 0 : W(), H(), base + rand(-0.4, 0.4), rand(14, 34))
        );
      }
    };
    const rain = (n) => {
      for (let i = 0; i < n; i++) {
        const p = makePiece(rand(0, W()), -20, Math.PI / 2, rand(1, 4));
        p.vx = rand(-1.5, 1.5);
        pieces.push(p);
      }
    };

    cannon(true);
    cannon(false);
    const bursts = [400, 900, 1600].map((t) => setTimeout(() => { cannon(true); cannon(false); }, t));

    let raf;
    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min((now - last) / 16.67, 3);
      last = now;
      ctx.clearRect(0, 0, W(), H());
      if (Math.random() < 0.6) rain(2);

      pieces = pieces.filter((p) => p.y < H() + 40);
      for (const p of pieces) {
        p.vy += 0.35 * dt;
        p.vx *= 0.99;
        p.vy *= 0.99;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        p.flip += 0.15 * dt;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.scale(1, Math.cos(p.flip));
        ctx.fillStyle = p.color;
        if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        }
        ctx.restore();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      bursts.forEach(clearTimeout);
      window.removeEventListener("resize", resize);
    };
  }, [active]);

  return <canvas ref={canvasRef} className="confetti" />;
}
