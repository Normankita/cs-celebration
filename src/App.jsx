import { useEffect, useState } from "react";
import Counter from "./Counter.jsx";
import Editor from "./Editor.jsx";
import Home from "./Home.jsx";
import { normalize } from "./lib/config.js";
import { Link, navigate, parseRoute, useLocation } from "./lib/router.jsx";
import { decodeConfig, payloadFromHash } from "./lib/share.js";
import { getCounter, saveCounter, uniqueSlug } from "./lib/store.js";
import { useTheme } from "./lib/theme.js";

// A friendly full-page message (not found, damaged link ...).
function Message({ title, children }) {
  useTheme("auto", "ui-theme");
  return (
    <div className="page center-page">
      <div className="glass-card message">
        <h1>{title}</h1>
        {children}
        <p>
          <Link className="btn small" to="/">
            Go to my counters
          </Link>
        </p>
      </div>
    </div>
  );
}

// Runs a counter: from this browser's saved counters, or from the settings carried in a share link.
function RunPage({ slug, hash }) {
  const payload = payloadFromHash(hash);
  const [shared, setShared] = useState(payload ? undefined : null); // undefined = still decoding, false = bad link
  useEffect(() => {
    let live = true;
    if (!payload) {
      setShared(null);
      return;
    }
    setShared(undefined);
    decodeConfig(payload).then((c) => live && setShared(c || false));
    return () => {
      live = false;
    };
  }, [payload]);

  const local = getCounter(slug);
  if (shared === undefined) return <div className="page" />;

  const sameAsLocal = shared && local && JSON.stringify(shared) === JSON.stringify(local);
  const config = shared && !sameAsLocal ? shared : local;

  if (!config) {
    return (
      <Message title={shared === false ? "This link looks damaged" : `No counter called “${slug}” here`}>
        {shared === false ? (
          <p>The share link is incomplete — ask for it again and make sure the whole link is copied.</p>
        ) : (
          <p>
            Counters are saved in the browser that created them. If someone sent you a counter, open their full{" "}
            <b>share link</b> (the long one) instead of the short name.
          </p>
        )}
      </Message>
    );
  }

  const isShared = shared && !sameAsLocal;
  const extra = isShared ? (
    <>
      <button
        className="icon-btn wide"
        onClick={() => {
          const s = uniqueSlug(slug);
          saveCounter(s, shared);
          navigate(`/${s}`);
        }}
      >
        💾 Save a copy
      </button>
      <Link className="icon-btn wide" to="/">
        ✨ Make your own
      </Link>
    </>
  ) : (
    <>
      <Link className="icon-btn" to="/" aria-label="My counters" title="My counters">
        🏠
      </Link>
      <Link className="icon-btn" to={`/${slug}/edit`} aria-label="Edit this counter" title="Edit">
        ⚙️
      </Link>
    </>
  );
  return <Counter key={`${slug}:${payload || ""}`} config={config} extraControls={extra} />;
}

// The editor's live preview: it just renders whatever settings the editor sends it.
function PreviewPage() {
  const [config, setConfig] = useState(null);
  useEffect(() => {
    const on = (e) => {
      if (e.origin === location.origin && e.data?.type === "liftoff:config") setConfig(normalize(e.data.config));
    };
    window.addEventListener("message", on);
    window.parent.postMessage({ type: "liftoff:ready" }, location.origin);
    return () => window.removeEventListener("message", on);
  }, []);
  return config ? <Counter preview config={config} /> : <div className="page" />;
}

export default function App() {
  const { path, hash } = useLocation();
  const route = parseRoute(path);

  if (route.name === "home") return <Home />;
  if (route.name === "run") return <RunPage slug={route.slug} hash={hash} />;
  if (route.name === "edit") return <Editor key={route.slug} slug={route.slug} />;
  if (route.name === "preview") return <PreviewPage />;
  return <Message title="Page not found" />;
}
