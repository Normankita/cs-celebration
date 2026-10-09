// Smooth changes using the browser's View Transitions API, with a graceful fallback.
//   kind "page"  -> the old page softly blurs out, the new one rises in
//   kind "theme" -> the new theme is revealed as a circle growing from where you clicked
// Skipped entirely for people who prefer reduced motion; unsupported browsers just update instantly
// (and the theme gets a plain colour fade from transitions.css).
import { flushSync } from "react-dom";

const reduceMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
export const canTransition = () => typeof document.startViewTransition === "function" && !reduceMotion();

// `update` must change React state; it is flushed synchronously inside the transition.
export function withTransition(update, { kind = "page", origin } = {}) {
  const root = document.documentElement;
  if (!canTransition()) {
    if (kind === "theme" && !reduceMotion()) {
      root.classList.add("theme-fade");
      setTimeout(() => root.classList.remove("theme-fade"), 700);
    }
    update();
    return;
  }
  root.dataset.vt = kind;
  const x = origin?.x ?? window.innerWidth / 2;
  const y = origin?.y ?? window.innerHeight / 2;
  const t = document.startViewTransition(() => flushSync(update));
  if (kind === "theme") {
    t.ready
      .then(() => {
        const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
        root.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
          { duration: 700, easing: "cubic-bezier(.4, 0, .2, 1)", pseudoElement: "::view-transition-new(root)" }
        );
      })
      .catch(() => {});
  }
  t.finished.catch(() => {}).finally(() => {
    delete root.dataset.vt;
  });
}
