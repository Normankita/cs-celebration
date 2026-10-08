// Brand-coloured rocket, pointing up. Used small on the progress track and large at liftoff.
export default function Rocket({ className = "" }) {
  return (
    <svg className={`rocket-svg ${className}`} viewBox="0 0 100 210" aria-hidden="true">
      <defs>
        <linearGradient id="rk-body" x1="0" x2="1">
          <stop offset="0" stopColor="#cfdde6" />
          <stop offset="0.45" stopColor="#ffffff" />
          <stop offset="1" stopColor="#c3d3dd" />
        </linearGradient>
        <linearGradient id="rk-flame" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff6d6" />
          <stop offset="0.35" stopColor="#ffd25e" />
          <stop offset="0.75" stopColor="#ff8a3d" />
          <stop offset="1" stopColor="#ff8a3d" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g className="rocket-flame">
        <path d="M36 158 Q50 168 64 158 Q60 190 50 208 Q40 190 36 158Z" fill="url(#rk-flame)" />
      </g>
      <path d="M32 112 L8 156 L8 176 L40 150Z" style={{ fill: "var(--green)" }} />
      <path d="M68 112 L92 156 L92 176 L60 150Z" style={{ fill: "var(--green)" }} />
      <path d="M50 4 C76 34 76 92 71 154 L29 154 C24 92 24 34 50 4Z" fill="url(#rk-body)" />
      <path d="M50 4 C62 17 69 32 71 50 L29 50 C31 32 38 17 50 4Z" style={{ fill: "var(--blue)" }} />
      <path d="M27 120 L73 120 L72.4 132 L27.6 132Z" style={{ fill: "var(--gray)" }} />
      <circle cx="50" cy="82" r="13" style={{ fill: "var(--blue)" }} stroke="#fff" strokeWidth="4" />
      <circle cx="45" cy="77" r="4" fill="#fff" opacity="0.7" />
      <rect x="37" y="153" width="26" height="8" rx="2" style={{ fill: "var(--gray)" }} />
    </svg>
  );
}
