import { useState } from "react";
import { TEMPLATES, fromTemplate, normalize } from "./lib/config.js";
import { Link, navigate } from "./lib/router.jsx";
import { shareUrl } from "./lib/share.js";
import { deleteCounter, getCounter, listCounters, saveCounter, uniqueSlug } from "./lib/store.js";
import { useTheme } from "./lib/theme.js";
import { copyText, fmtDuration } from "./lib/util.js";

function summary(c) {
  if (c.mode === "until" && c.untilMs) {
    return `Until ${new Date(c.untilMs).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}`;
  }
  return `${fmtDuration(c.sequenceSeconds)} launch sequence`;
}

export default function Home() {
  const [theme, toggleTheme] = useTheme("auto", "ui-theme");
  const [counters, setCounters] = useState(listCounters);
  const [name, setName] = useState("");
  const [tpl, setTpl] = useState("launch");
  const [note, setNote] = useState("");
  const refresh = () => setCounters(listCounters());

  const create = (e) => {
    e.preventDefault();
    const cfg = fromTemplate(tpl);
    const given = name.trim();
    if (given) {
      cfg.name = given.slice(0, 60);
      if (tpl === "blank") cfg.title = cfg.name;
    }
    const slug = uniqueSlug(cfg.name);
    saveCounter(slug, cfg);
    navigate(`/${slug}/edit`);
  };

  const duplicate = (slug) => {
    const cfg = getCounter(slug);
    if (!cfg) return;
    const copy = normalize({ ...cfg, name: `${cfg.name} copy`.slice(0, 60) });
    saveCounter(uniqueSlug(copy.name), copy);
    refresh();
  };

  const remove = (slug, nm) => {
    if (!window.confirm(`Delete “${nm}”? This can't be undone (a share link you sent earlier will still work).`)) return;
    deleteCounter(slug);
    refresh();
  };

  const share = async (slug, cfg) => {
    const ok = await copyText(await shareUrl(slug, cfg));
    setNote(ok ? `Share link for “${cfg.name}” copied — it works on any device.` : "Couldn't copy automatically.");
    setTimeout(() => setNote(""), 4000);
  };

  return (
    <div className="page">
      <div className="bg-blob blob-a" />
      <div className="bg-blob blob-b" />
      <header className="topbar">
        <span className="brand">
          <i>🚀</i> Liftoff
        </span>
        <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
      </header>

      <main className="wrap">
        <section className="hero">
          <h1>
            Countdowns that feel like a <span className="grad">launch</span>
          </h1>
          <p>
            Build a full-screen countdown with sound, a rocket liftoff and fireworks. Pick your colours, count down for
            a set time or to a date, and share it with a link. Everything stays in your browser — no account, no server.
          </p>
        </section>

        <form className="glass-card create" onSubmit={create}>
          <h2>Create a counter</h2>
          <div className="tpls">
            {TEMPLATES.map((t) => (
              <label key={t.id} className={`tpl ${tpl === t.id ? "on" : ""}`}>
                <input type="radio" name="tpl" checked={tpl === t.id} onChange={() => setTpl(t.id)} />
                <b>{t.label}</b>
                <span>{t.blurb}</span>
              </label>
            ))}
          </div>
          <div className="row">
            <input
              className="input grow"
              placeholder="Name it, e.g. Q4 kickoff"
              value={name}
              maxLength={60}
              onChange={(e) => setName(e.target.value)}
              aria-label="Counter name"
            />
            <button className="btn small" type="submit">
              Create &amp; customise →
            </button>
          </div>
        </form>

        <section>
          <h2>My counters</h2>
          {counters.length === 0 ? (
            <p className="muted">Nothing here yet — create your first counter above.</p>
          ) : (
            <>
              <p className="muted">
                Saved in this browser only. To open one on another device, use <b>Share link</b>.
              </p>
              <div className="cards">
                {counters.map(({ slug, config: c }) => (
                  <article className="glass-card card" key={slug}>
                    <div
                      className="swatch"
                      style={{ background: `linear-gradient(120deg, ${c.colors.primary}, ${c.colors.secondary})` }}
                    />
                    <h3>{c.name}</h3>
                    <p className="muted">
                      /{slug}
                      <br />
                      {summary(c)}
                    </p>
                    <div className="actions">
                      <Link className="btn small" to={`/${slug}`}>
                        ▶ Open
                      </Link>
                      <Link className="btn small ghost2" to={`/${slug}/edit`}>
                        Edit
                      </Link>
                      <button className="btn small ghost2" onClick={() => share(slug, c)}>
                        Share link
                      </button>
                      <button className="btn small ghost2" onClick={() => duplicate(slug)}>
                        Duplicate
                      </button>
                      <button className="btn small ghost2 danger" onClick={() => remove(slug, c.name)}>
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
        {note && <div className="toast">{note}</div>}
      </main>
    </div>
  );
}
