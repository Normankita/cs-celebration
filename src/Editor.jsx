import { useEffect, useRef, useState } from "react";
import { BACKGROUNDS, PALETTES, normalize } from "./lib/config.js";
import { Link, navigate } from "./lib/router.jsx";
import { shareUrl } from "./lib/share.js";
import { deleteCounter, getCounter, isValidSlug, renameCounter, saveCounter } from "./lib/store.js";
import { useTheme } from "./lib/theme.js";
import { copyText, fmtDuration, fromLocalInput, timeZone, toLocalInput } from "./lib/util.js";

// ---- small form pieces ----------------------------------------------------------------------
function Panel({ title, hint, children }) {
  return (
    <section className="panel glass-card">
      <h3>{title}</h3>
      {hint && <p className="muted">{hint}</p>}
      {children}
    </section>
  );
}

function Field({ label, hint, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}

function Text({ label, hint, value, onChange, max = 60, placeholder }) {
  return (
    <Field label={label} hint={hint}>
      <input
        className="input"
        value={value}
        maxLength={max}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <i />
      <span>{label}</span>
    </label>
  );
}

// A number box that lets you type freely and only commits valid values.
function NumInput({ value, min, max, onCommit, unit }) {
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);
  return (
    <span className="numwrap">
      <input
        className="input num"
        inputMode="numeric"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          const n = Number(e.target.value);
          if (e.target.value.trim() !== "" && Number.isFinite(n) && n >= min && n <= max) onCommit(Math.round(n));
        }}
        onBlur={() => setText(String(value))}
      />
      {unit && <em>{unit}</em>}
    </span>
  );
}

function LogoField({ value, onCommit }) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  return (
    <Field label="Logo image link (optional)" hint="A public https:// link to a PNG/SVG/JPG. Shown on the start and celebration cards.">
      <input
        className="input"
        value={text}
        placeholder="https://example.com/logo.png"
        onChange={(e) => setText(e.target.value)}
        onBlur={() => onCommit(text.trim())}
        onKeyDown={(e) => e.key === "Enter" && onCommit(text.trim())}
      />
    </Field>
  );
}

// ---- the editor -----------------------------------------------------------------------------
export default function Editor({ slug }) {
  const initial = getCounter(slug);
  if (!initial) {
    return (
      <div className="page center-page">
        <div className="glass-card message">
          <h1>No counter called “{slug}” here</h1>
          <p className="muted">Counters live in the browser that created them.</p>
          <Link className="btn small" to="/">
            Go to my counters
          </Link>
        </div>
      </div>
    );
  }
  return <EditorInner slug={slug} initial={initial} />;
}

function EditorInner({ slug, initial }) {
  const [theme, toggleTheme] = useTheme("auto", "ui-theme");
  const [cfg, setCfg] = useState(initial);
  const [slugText, setSlugText] = useState(slug);
  const [slugError, setSlugError] = useState("");
  const [saved, setSaved] = useState(true);
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState("");
  const frame = useRef(null);
  const [ready, setReady] = useState(false);
  const dirty = useRef(false);
  const latest = useRef(cfg);
  latest.current = cfg;

  const set = (patch) => {
    dirty.current = true;
    setSaved(false);
    setCfg((c) => normalize({ ...c, ...patch }));
  };
  const setIn = (key, patch) => set({ [key]: { ...cfg[key], ...patch } });

  // autosave (debounced) and flush when leaving the page
  useEffect(() => {
    if (!dirty.current) return;
    const t = setTimeout(() => {
      saveCounter(slug, cfg);
      dirty.current = false;
      setSaved(true);
    }, 350);
    return () => clearTimeout(t);
  }, [cfg, slug]);
  useEffect(
    () => () => {
      if (dirty.current) saveCounter(slug, latest.current);
    },
    [slug]
  );

  // live preview frame
  useEffect(() => {
    const on = (e) => {
      if (e.origin === location.origin && e.data?.type === "liftoff:ready") setReady(true);
    };
    window.addEventListener("message", on);
    return () => window.removeEventListener("message", on);
  }, []);
  useEffect(() => {
    if (ready) frame.current?.contentWindow?.postMessage({ type: "liftoff:config", config: cfg }, location.origin);
  }, [cfg, ready]);
  const cmd = (c) => frame.current?.contentWindow?.postMessage({ type: "liftoff:cmd", cmd: c }, location.origin);

  // share link
  useEffect(() => {
    let live = true;
    const t = setTimeout(() => shareUrl(slug, cfg).then((u) => live && setLink(u)), 250);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [cfg, slug]);

  const copy = async (what, text) => {
    if (await copyText(text)) {
      setCopied(what);
      setTimeout(() => setCopied(""), 2000);
    }
  };

  const applySlug = () => {
    const next = slugText.trim().toLowerCase();
    if (next === slug) return setSlugError("");
    if (!isValidSlug(next)) {
      return setSlugError("Use 1–40 letters, numbers or dashes (not a reserved word like “edit”).");
    }
    if (dirty.current) saveCounter(slug, latest.current);
    dirty.current = false;
    if (!renameCounter(slug, next)) return setSlugError("That link name is already used by another of your counters.");
    navigate(`/${next}/edit`, { replace: true });
  };

  const remove = () => {
    if (!window.confirm(`Delete “${cfg.name}”? This can't be undone.`)) return;
    dirty.current = false;
    deleteCounter(slug);
    navigate("/");
  };

  const untilLocal = toLocalInput(cfg.untilMs);
  const inFuture = cfg.untilMs && cfg.untilMs > Date.now();
  const quick = (ms) => set({ mode: "until", untilMs: Math.ceil((Date.now() + ms) / 60000) * 60000 });

  return (
    <div className="page editor">
      <header className="topbar">
        <Link className="brand" to="/">
          <i>🚀</i> Liftoff
        </Link>
        <span className={`saved ${saved ? "ok" : ""}`}>{saved ? "✓ Saved in this browser" : "Saving…"}</span>
        <span className="grow" />
        <Link className="btn small" to={`/${slug}`}>
          ▶ Open full screen
        </Link>
        <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
      </header>

      <div className="split">
        <div className="forms">
          <Panel title="Name &amp; link">
            <Text label="Counter name" hint="Only for your list" value={cfg.name} onChange={(v) => set({ name: v })} />
            <Field label="Link name" hint="Short link, works in this browser only. Use the share link below for other devices.">
              <span className="slugrow">
                <span className="prefix">{location.host}/</span>
                <input
                  className="input"
                  value={slugText}
                  onChange={(e) => setSlugText(e.target.value)}
                  onBlur={applySlug}
                  onKeyDown={(e) => e.key === "Enter" && applySlug()}
                  maxLength={40}
                />
              </span>
              {slugError && <small className="error">{slugError}</small>}
            </Field>
          </Panel>

          <Panel title="Words">
            <Text label="Title" value={cfg.title} onChange={(v) => set({ title: v })} />
            <Text label="Small line above the title" value={cfg.eyebrow} onChange={(v) => set({ eyebrow: v })} />
            <Text label="Start button" value={cfg.startLabel} onChange={(v) => set({ startLabel: v })} max={40} />
            <Text
              label="Final-countdown wording"
              hint={`Reads: “${cfg.title} ${cfg.launchLabel}”`}
              value={cfg.launchLabel}
              onChange={(v) => set({ launchLabel: v })}
              max={40}
            />
            <Text label="Celebration message" value={cfg.celebrationMessage} onChange={(v) => set({ celebrationMessage: v })} max={80} />
            <Text label="Celebration sub-line" value={cfg.subtitle} onChange={(v) => set({ subtitle: v })} max={120} />
            <LogoField value={cfg.logoUrl} onCommit={(v) => set({ logoUrl: v })} />
            <details>
              <summary>Status labels on the launch bar</summary>
              <Text label="Early" value={cfg.statusCheck} onChange={(v) => set({ statusCheck: v })} max={40} />
              <Text label="Middle" value={cfg.statusFuel} onChange={(v) => set({ statusFuel: v })} max={40} />
              <Text label="Final countdown" value={cfg.statusIgnition} onChange={(v) => set({ statusIgnition: v })} max={40} />
            </details>
          </Panel>

          <Panel title="Timing">
            <div className="seg">
              <button className={cfg.mode === "duration" ? "on" : ""} onClick={() => set({ mode: "duration" })}>
                Set time
                <small>Press Start, counts a fixed length</small>
              </button>
              <button
                className={cfg.mode === "until" ? "on" : ""}
                onClick={() => set({ mode: "until", untilMs: cfg.untilMs ?? Math.ceil((Date.now() + 3600e3) / 60000) * 60000 })}
              >
                Until a date &amp; time
                <small>Starts itself, in step for everyone</small>
              </button>
            </div>

            {cfg.mode === "duration" ? (
              <Field label="Countdown length" hint={fmtDuration(cfg.sequenceSeconds)}>
                <NumInput value={cfg.sequenceSeconds} min={3} max={21600} unit="seconds" onCommit={(v) => set({ sequenceSeconds: v })} />
                <span className="chips">
                  {[10, 30, 60, 300, 600].map((s) => (
                    <button key={s} className={`chip ${cfg.sequenceSeconds === s ? "on" : ""}`} onClick={() => set({ sequenceSeconds: s })}>
                      {fmtDuration(s)}
                    </button>
                  ))}
                </span>
              </Field>
            ) : (
              <>
                <Field label="Counts down until" hint={`Your time zone: ${timeZone()}. Viewers elsewhere see the same moment.`}>
                  <input
                    className="input"
                    type="datetime-local"
                    value={untilLocal}
                    onChange={(e) => set({ untilMs: fromLocalInput(e.target.value) })}
                  />
                  {!inFuture && <small className="error">That moment has passed — pick a future time.</small>}
                  <span className="chips">
                    <button className="chip" onClick={() => quick(60e3)}>in 1 min</button>
                    <button className="chip" onClick={() => quick(10 * 60e3)}>in 10 min</button>
                    <button className="chip" onClick={() => quick(3600e3)}>in 1 hour</button>
                  </span>
                </Field>
                <Field
                  label="Launch sequence starts"
                  hint={`${fmtDuration(cfg.sequenceSeconds)} before the end the background, beeps and big dial begin. Until then a clock shows days, hours, minutes.`}
                >
                  <NumInput value={cfg.sequenceSeconds} min={3} max={21600} unit="seconds before" onCommit={(v) => set({ sequenceSeconds: v })} />
                </Field>
              </>
            )}

            <Field label="Final big-number countdown" hint="The last stretch with pips, rumble and the dial in the middle">
              <input
                type="range"
                min={3}
                max={Math.min(30, cfg.sequenceSeconds)}
                value={cfg.finalSeconds}
                onChange={(e) => set({ finalSeconds: Number(e.target.value) })}
              />
              <small>{cfg.finalSeconds} seconds</small>
            </Field>
          </Panel>

          <Panel title="Look">
            <Field label="Colour palette">
              <span className="palettes">
                {PALETTES.map((p) => (
                  <button
                    key={p.name}
                    className="pal"
                    title={p.name}
                    onClick={() => set({ colors: { primary: p.colors[0], secondary: p.colors[1], accent: p.colors[2] } })}
                  >
                    {p.colors.map((c) => (
                      <i key={c} style={{ background: c }} />
                    ))}
                    <span>{p.name}</span>
                  </button>
                ))}
              </span>
            </Field>
            <div className="colors">
              {[
                ["primary", "Main"],
                ["secondary", "Second"],
                ["accent", "Soft accent"],
              ].map(([k, label]) => (
                <label key={k} className="color">
                  <input type="color" value={cfg.colors[k]} onChange={(e) => setIn("colors", { [k]: e.target.value })} />
                  <span>{label}</span>
                  <code>{cfg.colors[k]}</code>
                </label>
              ))}
            </div>

            <Field label="Theme">
              <select className="input" value={cfg.theme} onChange={(e) => set({ theme: e.target.value })}>
                <option value="auto">Match the viewer's device</option>
                <option value="light">Always light</option>
                <option value="dark">Always dark</option>
              </select>
            </Field>

            <Field label="Background">
              <span className="bgs">
                {BACKGROUNDS.map((b) => (
                  <button key={b.id} className={`bgopt ${cfg.background === b.id ? "on" : ""}`} onClick={() => set({ background: b.id })}>
                    <b>{b.label}</b>
                    <small>{b.hint}</small>
                  </button>
                ))}
              </span>
            </Field>
          </Panel>

          <Panel title="Effects &amp; sound">
            <div className="toggles">
              <Toggle label="Rocket liftoff" checked={cfg.effects.rocket} onChange={(v) => setIn("effects", { rocket: v })} />
              <Toggle label="Fireworks" checked={cfg.effects.fireworks} onChange={(v) => setIn("effects", { fireworks: v })} />
              <Toggle label="Confetti" checked={cfg.effects.confetti} onChange={(v) => setIn("effects", { confetti: v })} />
              <Toggle label="Screen shake in the finale" checked={cfg.effects.shake} onChange={(v) => setIn("effects", { shake: v })} />
              <Toggle label="Pulsing edge glow" checked={cfg.effects.glow} onChange={(v) => setIn("effects", { glow: v })} />
            </div>
            <hr />
            <div className="toggles">
              <Toggle label="Sound on" checked={cfg.sound.enabled} onChange={(v) => setIn("sound", { enabled: v })} />
              <Toggle label="Countdown beeps &amp; pips" checked={cfg.sound.beeps} onChange={(v) => setIn("sound", { beeps: v })} />
              <Toggle label="Engine rumble" checked={cfg.sound.rumble} onChange={(v) => setIn("sound", { rumble: v })} />
            </div>
            <Field label="Volume" hint={`${cfg.sound.volume}%`}>
              <input type="range" min={0} max={100} value={cfg.sound.volume} onChange={(e) => setIn("sound", { volume: Number(e.target.value) })} />
            </Field>
          </Panel>

          <Panel
            title="Share"
            hint="This link carries all your settings inside it, so it opens the same counter on any device — nothing is uploaded anywhere."
          >
            <div className="copyrow">
              <input className="input" readOnly value={link} onFocus={(e) => e.target.select()} aria-label="Share link" />
              <button className="btn small" onClick={() => copy("share", link)}>
                {copied === "share" ? "Copied ✓" : "Copy share link"}
              </button>
            </div>
            <p className="muted">
              The short link <code>{location.host}/{slug}</code> only works in this browser. Use the share link above for everyone else. If you change
              settings later, share the new link.
            </p>
            <button className="btn small ghost2 danger" onClick={remove}>
              Delete this counter
            </button>
          </Panel>
        </div>

        <aside className="previewcol">
          <div className="previewbox">
            <iframe ref={frame} src="/preview" title="Live preview" />
          </div>
          <div className="previewbar">
            <button className="btn small" onClick={() => cmd("start")}>
              ▶ Test launch
            </button>
            <button className="btn small ghost2" onClick={() => cmd("reset")}>
              ↺ Reset
            </button>
          </div>
          <p className="muted">
            The preview updates as you type. {cfg.mode === "until" ? "“Test launch” runs the sequence right now, regardless of the date." : ""}
          </p>
        </aside>
      </div>
    </div>
  );
}
