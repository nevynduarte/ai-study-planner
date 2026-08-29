import { useState, useEffect } from "react";

// localStorage-backed useState. Reads and writes are wrapped because a private
// window or blocked site data makes the accessor itself throw.
export function usePersisted(key, initial) {
  const [val, setVal] = useState(() => {
    try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : initial; } catch { return initial; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }, [key, val]);
  return [val, setVal];
}
