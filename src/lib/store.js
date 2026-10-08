// "My counters" live in this browser's localStorage. If storage is blocked (private mode,
// strict settings) an in-memory fallback keeps the app working for the current visit.
import { normalize } from "./config.js";

const INDEX_KEY = "liftoff:index";
const ITEM = (slug) => `liftoff:c:${slug}`;

// Names that are routes, not counters.
export const RESERVED = ["new", "edit", "preview", "api", "assets", "about", "help", "admin", "index"];

const memory = new Map();
const read = (k) => {
  try {
    const v = localStorage.getItem(k);
    if (v !== null) return v;
  } catch {}
  return memory.get(k) ?? null;
};
const write = (k, v) => {
  memory.set(k, v);
  try {
    localStorage.setItem(k, v);
  } catch {}
};
const remove = (k) => {
  memory.delete(k);
  try {
    localStorage.removeItem(k);
  } catch {}
};

export function slugify(text) {
  return (
    String(text || "")
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "counter"
  );
}

export const isValidSlug = (s) => /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/.test(s) && !RESERVED.includes(s);

function readIndex() {
  try {
    const arr = JSON.parse(read(INDEX_KEY) || "[]");
    return Array.isArray(arr) ? arr.filter((x) => x && typeof x.slug === "string") : [];
  } catch {
    return [];
  }
}

export function listCounters() {
  return readIndex()
    .map((x) => {
      const cfg = getCounter(x.slug);
      return cfg ? { slug: x.slug, updatedAt: x.updatedAt || 0, config: cfg } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getCounter(slug) {
  const raw = read(ITEM(slug));
  if (!raw) return null;
  try {
    return normalize(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveCounter(slug, config) {
  write(ITEM(slug), JSON.stringify(normalize(config)));
  const idx = readIndex().filter((x) => x.slug !== slug);
  idx.push({ slug, updatedAt: Date.now() });
  write(INDEX_KEY, JSON.stringify(idx));
}

export function deleteCounter(slug) {
  remove(ITEM(slug));
  write(INDEX_KEY, JSON.stringify(readIndex().filter((x) => x.slug !== slug)));
}

export function exists(slug) {
  return readIndex().some((x) => x.slug === slug) && read(ITEM(slug)) !== null;
}

// Next free slug: "party", "party-2", "party-3" ...
export function uniqueSlug(base) {
  let s = slugify(base);
  if (RESERVED.includes(s)) s = `${s}-1`;
  if (!exists(s)) return s;
  for (let i = 2; i < 1000; i++) {
    const t = `${s.slice(0, 36)}-${i}`;
    if (!exists(t)) return t;
  }
  return `${s}-${Date.now()}`;
}

export function renameCounter(oldSlug, newSlug) {
  if (oldSlug === newSlug) return true;
  if (!isValidSlug(newSlug) || exists(newSlug)) return false;
  const cfg = getCounter(oldSlug);
  if (!cfg) return false;
  saveCounter(newSlug, cfg);
  deleteCounter(oldSlug);
  return true;
}

// ---- small viewer preferences ----
export function getPref(key) {
  return read(`liftoff:pref:${key}`);
}
export function setPref(key, value) {
  if (value === null) remove(`liftoff:pref:${key}`);
  else write(`liftoff:pref:${key}`, String(value));
}
