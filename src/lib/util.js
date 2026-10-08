export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // clipboard API needs https / permission; fall back to a temporary textarea
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {}
    ta.remove();
    return ok;
  }
}

// 90 -> "1 min 30 s", 3600 -> "1 h"
export function fmtDuration(total) {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h && `${h} h`, m && `${m} min`, (s || (!h && !m)) && `${s} s`].filter(Boolean).join(" ");
}

const pad = (n) => String(n).padStart(2, "0");

// <input type="datetime-local"> works in local time without a zone: "2026-12-31T23:59"
export function toLocalInput(ms) {
  if (!Number.isFinite(ms)) return "";
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromLocalInput(text) {
  const ms = new Date(text).getTime();
  return Number.isFinite(ms) ? ms : null;
}

export const timeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || "your local time";
