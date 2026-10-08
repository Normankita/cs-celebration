# Liftoff – countdowns that feel like a launch

Build a full-screen countdown with sound, a rocket liftoff and fireworks. Customise the words, colours,
background and timing, count down for a set time or to a date, and share it with a link.
No account and no server: everything is saved in the browser.

## How it works

- **Create** a counter from the home page (pick a template, give it a name). It opens in the editor with a live preview.
- **Run** it at `/<link-name>` (full screen, press **F**). Space/Enter starts it.
- **Share** it with the *share link* in the editor. The settings are compressed into the part of the URL after `#`, so the
  link opens the same counter on any device. Nothing is uploaded; the part after `#` is never sent to a server.
  The short link (`/<link-name>`) only works in the browser that created the counter (that is where it is stored).

### Timing modes
- **Set time** – press Start; counts a fixed length (3 seconds up to 6 hours).
- **Until a date & time** – starts by itself and stays in step for everyone (it follows the real clock). A days/hours/minutes
  clock shows until the last *N* seconds, then the launch sequence begins. If the page is opened after the moment has passed it
  offers a replay.

The last *final seconds* (default 10) are the big-number finale: BBC-style pips, engine rumble, screen shake, the dial moves to
the middle. Before that, beeps build in pitch, volume and rate over the last 20 seconds.

### Customisable
Title and all wording · optional logo (https link) · three colours + palettes · light/dark/auto · background
(warp speed, aurora, horizon grid, rising bubbles, plain) · rocket, fireworks, confetti, shake, glow · sound, beeps, rumble, volume.

## Develop

```
npm install
npm run dev          # http://localhost:5173
npm run build        # static site in dist/
npm run preview
```

## Deploy (any static host)

Every counter has its own path (`/<link-name>`), so the host must serve `index.html` for unknown paths:

- **Vercel** – `vercel.json` is included.
- **Netlify / Cloudflare Pages** – `public/_redirects` is included.
- **Other hosts** – add a "single-page app" fallback to `index.html`.

## Layout

```
src/
  App.jsx            routes: / (home), /<name> (run), /<name>/edit, /preview
  Home.jsx           my counters + create
  Editor.jsx         settings form + live preview (iframe at /preview)
  Counter.jsx        the countdown itself (driven entirely by a settings object)
  Backdrop.jsx       coded backgrounds (canvas / CSS)
  Fireworks.jsx, Confetti.jsx, Rocket.jsx, sound.js   effects and synthesized audio
  lib/config.js      settings model, defaults, templates, validation
  lib/store.js       localStorage persistence
  lib/share.js       share-link encode/decode
  lib/router.jsx     tiny History-API router
```

## Roadmap
- Photo scenes (stored in IndexedDB) and a logo upload.
- Export/import a counter as a file (including photos).
- Device-to-device transfer over WebRTC (QR / short code), and using a phone as a remote.
