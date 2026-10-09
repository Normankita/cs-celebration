import { useCallback, useLayoutEffect, useState } from "react";
import { getPref, setPref } from "./store.js";
import { withTransition } from "./transition.js";

const system = () => (window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light");

// Resolves the light/dark theme and applies it to <html>.
//  - A counter's own `theme` setting ("light" | "dark") wins; "auto" follows the device.
//  - The viewer can flip it with the toggle. For counters that choice lasts until reload,
//    so the creator's look is what people see first. Pass persistKey to remember it (home/editor).
export function useTheme(configTheme = "auto", persistKey = null) {
  const [override, setOverride] = useState(() => {
    const v = persistKey ? getPref(persistKey) : null;
    return v === "light" || v === "dark" ? v : null;
  });
  const base = configTheme === "light" || configTheme === "dark" ? configTheme : system();
  const theme = override ?? base;

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // Pass the click event so the reveal grows from the button; with no event (keyboard) it grows from the centre.
  const toggle = useCallback(
    (e) => {
      const next = theme === "dark" ? "light" : "dark";
      const origin = e && typeof e.clientX === "number" && (e.clientX || e.clientY) ? { x: e.clientX, y: e.clientY } : undefined;
      withTransition(
        () => {
          setOverride(next);
          if (persistKey) setPref(persistKey, next);
        },
        { kind: "theme", origin }
      );
    },
    [theme, persistKey]
  );

  return [theme, toggle];
}
