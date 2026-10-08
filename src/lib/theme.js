import { useCallback, useLayoutEffect, useState } from "react";
import { getPref, setPref } from "./store.js";

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

  const toggle = useCallback(() => {
    const next = theme === "dark" ? "light" : "dark";
    setOverride(next);
    if (persistKey) setPref(persistKey, next);
  }, [theme, persistKey]);

  return [theme, toggle];
}
