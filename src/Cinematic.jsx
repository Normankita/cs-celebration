import { SCENES } from "./scenes.js";

// Full-screen crossfading photo background with a slow Ken Burns zoom.
// Each image is drawn twice: blurred to fill the screen, and sharp (fully visible) on top,
// so wide banners are never cropped. index < 0 hides everything (e.g. on the start screen).
export default function Cinematic({ index, final }) {
  return (
    <div className={`cinematic ${index >= 0 ? "show" : ""} ${final ? "final" : ""}`} aria-hidden="true">
      {SCENES.map((s, i) => (
        <div key={i} className={`scene ${i === index ? "on" : ""} ${i <= index ? "zoom" : ""}`}>
          <img className="scene-fill" src={s.src} alt="" decoding="async" />
          <img className="scene-main" src={s.src} alt="" decoding="async" style={{ transformOrigin: s.origin }} />
        </div>
      ))}
      <div className="veil" />
    </div>
  );
}
