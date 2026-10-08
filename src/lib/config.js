// The settings object every counter is made of, plus validation.
// Configs also arrive from share links, so everything is treated as untrusted input:
// unknown keys are dropped, numbers are clamped, colours must be #rrggbb, enums are checked.

export const BACKGROUNDS = [
  { id: "warp", label: "Warp speed", hint: "Stars streak past, faster as the launch nears" },
  { id: "aurora", label: "Aurora", hint: "Soft drifting colour clouds" },
  { id: "grid", label: "Horizon grid", hint: "A glowing grid racing toward a sun" },
  { id: "rise", label: "Rising bubbles", hint: "Bubbles float up, quicker over time" },
  { id: "plain", label: "Plain", hint: "Just the colour glow" },
];

export const PALETTES = [
  { name: "Aurora", colors: ["#4f8cff", "#22d3a5", "#94a3b8"] },
  { name: "Sunset", colors: ["#ff6b6b", "#ffb347", "#a78bfa"] },
  { name: "Royal", colors: ["#7c3aed", "#f472b6", "#94a3b8"] },
  { name: "Forest", colors: ["#16a34a", "#facc15", "#94a3b8"] },
  { name: "Sky & Lime", colors: ["#26a9e0", "#8bc53f", "#929497"] },
  { name: "Midnight Gold", colors: ["#f5c542", "#3b82f6", "#9ca3af"] },
];

export const DEFAULTS = {
  v: 1,
  name: "My countdown", // shown in "my counters"; the link name is separate
  title: "Big Launch",
  eyebrow: "It's almost time",
  startLabel: "Start the countdown",
  launchLabel: "launches in",
  celebrationMessage: "We have liftoff!",
  subtitle: "Thank you for being part of it",
  statusCheck: "Systems check",
  statusFuel: "Fuelling up",
  statusIgnition: "Ignition sequence",
  logoUrl: "",
  mode: "duration", // duration: press Start | until: counts down to a date and time
  sequenceSeconds: 30, // length of the launch sequence (the whole run in duration mode)
  finalSeconds: 10, // the big-number finale at the end of the sequence
  untilMs: null, // target moment (ms since epoch) for mode "until"
  colors: { primary: "#4f8cff", secondary: "#22d3a5", accent: "#94a3b8" },
  theme: "auto", // auto | light | dark
  background: "warp",
  effects: { fireworks: true, confetti: true, rocket: true, shake: true, glow: true },
  sound: { enabled: true, volume: 80, beeps: true, rumble: true },
};

// Starting points offered when creating a counter.
export const TEMPLATES = [
  {
    id: "launch",
    label: "Product launch",
    blurb: "30-second launch sequence with a warp-speed backdrop",
    make: () => ({
      name: "Product launch",
      title: "Big Launch",
      celebrationMessage: "We have liftoff!",
      subtitle: "Thank you for being part of it",
      background: "warp",
    }),
  },
  {
    id: "newyear",
    label: "New Year's countdown",
    blurb: "Counts down to the next 1 January, midnight your time",
    make: () => {
      const now = new Date();
      return {
        name: "New Year",
        title: "Happy New Year",
        eyebrow: "Counting down to",
        launchLabel: "until midnight",
        celebrationMessage: "Happy New Year!",
        subtitle: "Here's to a brilliant year ahead",
        statusCheck: "Counting the last moments",
        statusFuel: "Almost there",
        statusIgnition: "Here it comes",
        mode: "until",
        untilMs: new Date(now.getFullYear() + 1, 0, 1, 0, 0, 0).getTime(),
        sequenceSeconds: 60,
        background: "grid",
        colors: { primary: "#f5c542", secondary: "#3b82f6", accent: "#9ca3af" },
        theme: "dark",
      };
    },
  },
  {
    id: "event",
    label: "Event kick-off",
    blurb: "Short 20-second run with rising bubbles",
    make: () => ({
      name: "Event kick-off",
      title: "Doors Open",
      eyebrow: "The show starts",
      celebrationMessage: "Welcome, everyone!",
      subtitle: "Let's make it a great one",
      sequenceSeconds: 20,
      finalSeconds: 10,
      background: "rise",
      colors: { primary: "#ff6b6b", secondary: "#ffb347", accent: "#a78bfa" },
    }),
  },
  {
    id: "blank",
    label: "Start from scratch",
    blurb: "Plain defaults, change everything yourself",
    make: () => ({ name: "My countdown" }),
  },
];

const str = (v, fallback, max) => (typeof v === "string" ? v.slice(0, max) : fallback);
const num = (v, fallback, min, max) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback;
};
const bool = (v, fallback) => (typeof v === "boolean" ? v : fallback);
const oneOf = (v, list, fallback) => (list.includes(v) ? v : fallback);
const hex = (v, fallback) => (typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v) ? v.toLowerCase() : fallback);

// Only plain https image links are allowed for the logo (no data:/javascript: URLs).
const url = (v) => {
  if (typeof v !== "string" || v.length > 500) return "";
  try {
    const u = new URL(v.trim());
    return u.protocol === "https:" ? u.href : "";
  } catch {
    return "";
  }
};

export function normalize(raw = {}) {
  const r = raw && typeof raw === "object" ? raw : {};
  const d = DEFAULTS;
  const c = r.colors && typeof r.colors === "object" ? r.colors : {};
  const e = r.effects && typeof r.effects === "object" ? r.effects : {};
  const s = r.sound && typeof r.sound === "object" ? r.sound : {};
  const sequenceSeconds = num(r.sequenceSeconds, d.sequenceSeconds, 3, 6 * 3600);
  return {
    v: 1,
    name: str(r.name, d.name, 60),
    title: str(r.title, d.title, 60),
    eyebrow: str(r.eyebrow, d.eyebrow, 60),
    startLabel: str(r.startLabel, d.startLabel, 40),
    launchLabel: str(r.launchLabel, d.launchLabel, 40),
    celebrationMessage: str(r.celebrationMessage, d.celebrationMessage, 80),
    subtitle: str(r.subtitle, d.subtitle, 120),
    statusCheck: str(r.statusCheck, d.statusCheck, 40),
    statusFuel: str(r.statusFuel, d.statusFuel, 40),
    statusIgnition: str(r.statusIgnition, d.statusIgnition, 40),
    logoUrl: url(r.logoUrl),
    mode: oneOf(r.mode, ["duration", "until"], d.mode),
    sequenceSeconds,
    finalSeconds: Math.min(num(r.finalSeconds, d.finalSeconds, 3, 30), sequenceSeconds),
    untilMs: Number.isFinite(r.untilMs) ? r.untilMs : null,
    colors: {
      primary: hex(c.primary, d.colors.primary),
      secondary: hex(c.secondary, d.colors.secondary),
      accent: hex(c.accent, d.colors.accent),
    },
    theme: oneOf(r.theme, ["auto", "light", "dark"], d.theme),
    background: oneOf(r.background, BACKGROUNDS.map((b) => b.id), d.background),
    effects: {
      fireworks: bool(e.fireworks, d.effects.fireworks),
      confetti: bool(e.confetti, d.effects.confetti),
      rocket: bool(e.rocket, d.effects.rocket),
      shake: bool(e.shake, d.effects.shake),
      glow: bool(e.glow, d.effects.glow),
    },
    sound: {
      enabled: bool(s.enabled, d.sound.enabled),
      volume: num(s.volume, d.sound.volume, 0, 100),
      beeps: bool(s.beeps, d.sound.beeps),
      rumble: bool(s.rumble, d.sound.rumble),
    },
  };
}

export function fromTemplate(id) {
  const t = TEMPLATES.find((x) => x.id === id) || TEMPLATES[TEMPLATES.length - 1];
  return normalize({ ...t.make() });
}

// ---- colour helpers (used by canvas effects) ----
export function hexToRgb(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function rgba(h, a) {
  const [r, g, b] = hexToRgb(h);
  return `rgba(${r},${g},${b},${a})`;
}
// Mix a colour toward white (t = 0..1) for glowing highlights.
export function tint(h, t) {
  const [r, g, b] = hexToRgb(h).map((v) => Math.round(v + (255 - v) * t));
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}
