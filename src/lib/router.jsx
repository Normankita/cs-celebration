// A tiny History-API router (no dependency).
//   /                 home: my counters
//   /<name>           run a counter
//   /<name>/edit      edit a counter
//   /preview          live preview frame used by the editor
import { useEffect, useState } from "react";

export function navigate(to, { replace = false } = {}) {
  history[replace ? "replaceState" : "pushState"](null, "", to);
  window.dispatchEvent(new Event("liftoff:nav"));
}

export function useLocation() {
  const read = () => ({ path: location.pathname, hash: location.hash });
  const [loc, setLoc] = useState(read);
  useEffect(() => {
    const on = () => setLoc(read());
    window.addEventListener("popstate", on);
    window.addEventListener("hashchange", on);
    window.addEventListener("liftoff:nav", on);
    return () => {
      window.removeEventListener("popstate", on);
      window.removeEventListener("hashchange", on);
      window.removeEventListener("liftoff:nav", on);
    };
  }, []);
  return loc;
}

export function parseRoute(path) {
  const parts = path
    .split("/")
    .filter(Boolean)
    .map((p) => {
      try {
        return decodeURIComponent(p).toLowerCase();
      } catch {
        return p.toLowerCase();
      }
    });
  if (parts.length === 0) return { name: "home" };
  if (parts[0] === "preview") return { name: "preview" };
  if (parts.length === 1) return { name: "run", slug: parts[0] };
  if (parts.length === 2 && parts[1] === "edit") return { name: "edit", slug: parts[0] };
  return { name: "notfound" };
}

// Normal <a> that navigates without a page reload (new-tab clicks still work).
export function Link({ to, children, ...rest }) {
  const onClick = (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (rest.target === "_blank") return;
    e.preventDefault();
    navigate(to);
  };
  return (
    <a href={to} onClick={onClick} {...rest}>
      {children}
    </a>
  );
}
