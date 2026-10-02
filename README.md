# Door to Door Campaign – Countdown

A full-screen "launch sequence": a 30-second cinematic photo montage with a mission clock, a 10 → 1 final countdown, then a rocket lifts off into fireworks.
Brand colors: `#26A9E0` · `#8BC53F` · `#929497`.

## Run

```
npm install
npm run dev      # development
npm run build && npm run preview   # production build
```

## Controls

- **Space / Enter** – start (or replay after the celebration)
- **R / Esc** – reset
- **F** – fullscreen
- **T** – switch light / dark theme (remembered; defaults to the device setting)
- **M** – mute / unmute

## Customize

Edit the constants at the top of `src/App.jsx` (`COUNTDOWN_SECONDS`, `TITLE`, `CELEBRATION_MESSAGE`, `SUBTITLE`).

## Launch sequence
- `TOTAL_SECONDS` (30) is the whole run; the last `FINAL_SECONDS` (10) show the big number, pips and engine rumble. Everything before that is the photo montage.
- Montage images live in `src/assets/scenes/` and are listed in `src/scenes.js`. To change them, drop new originals in `src/images/`, edit `scripts/make-scenes.py` (crop boxes), run `python scripts/make-scenes.py`, then update `src/scenes.js`.
