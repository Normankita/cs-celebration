import { useEffect, useState } from "react";

// Keeps something mounted for `ms` after `on` turns false, so it can play an exit animation.
//   const { mounted, leaving } = usePresence(show);
//   mounted && <div className={leaving ? "leave" : ""} />
export function usePresence(on, ms = 450) {
  const [mounted, setMounted] = useState(on);
  useEffect(() => {
    if (on) {
      setMounted(true);
      return;
    }
    const t = setTimeout(() => setMounted(false), ms);
    return () => clearTimeout(t);
  }, [on, ms]);
  return { mounted: on || mounted, leaving: !on && mounted };
}
