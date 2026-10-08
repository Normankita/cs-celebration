// Share a counter with no server: the settings are compressed and placed in the part of the
// link after "#". That part is never sent to any server, so it works from any static host and
// the link works on any device.
import { normalize } from "./config.js";

const b64 = {
  enc(bytes) {
    let s = "";
    for (const b of bytes) s += String.fromCharCode(b);
    return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  },
  dec(text) {
    const s = atob(text.replace(/-/g, "+").replace(/_/g, "/"));
    return Uint8Array.from(s, (c) => c.charCodeAt(0));
  },
};

async function pipe(bytes, stream) {
  const out = new Blob([bytes]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

// Payload format: "1." + deflate-raw + base64url, or "0." + plain base64url when
// CompressionStream is unavailable.
export async function encodeConfig(config) {
  const bytes = new TextEncoder().encode(JSON.stringify(normalize(config)));
  if (typeof CompressionStream === "function") {
    return "1." + b64.enc(await pipe(bytes, new CompressionStream("deflate-raw")));
  }
  return "0." + b64.enc(bytes);
}

// Returns a validated config, or null if the payload is not a counter.
export async function decodeConfig(payload) {
  try {
    const dot = payload.indexOf(".");
    const kind = payload.slice(0, dot);
    const raw = b64.dec(payload.slice(dot + 1));
    if (raw.length > 64 * 1024) return null;
    let bytes = raw;
    if (kind === "1") {
      if (typeof DecompressionStream !== "function") return null;
      bytes = await pipe(raw, new DecompressionStream("deflate-raw"));
      if (bytes.length > 256 * 1024) return null;
    } else if (kind !== "0") return null;
    return normalize(JSON.parse(new TextDecoder().decode(bytes)));
  } catch {
    return null;
  }
}

export async function shareUrl(slug, config) {
  return `${location.origin}/${slug}#d=${await encodeConfig(config)}`;
}

export function payloadFromHash(hash = location.hash) {
  const m = /^#d=([A-Za-z0-9._-]+)$/.exec(hash);
  return m ? m[1] : null;
}
