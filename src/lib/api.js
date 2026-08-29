// ─── Data layer — reads/writes the Cloudflare Worker (D1) + static curriculum ──
export async function getJSON(path) {
  const r = await fetch(path);
  const d = await r.json();
  if (!r.ok || d.error) throw new Error(d.error || "Failed to load");
  return d;
}
export async function postJSON(path, body) {
  const r = await fetch(path, { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify(body) });
  const d = await r.json();
  if (!r.ok || d.error) throw new Error(d.error || "Request failed");
  return d;
}
export async function patchJSON(path, body) {
  const r = await fetch(path, { method:"PATCH", headers:{ "Content-Type":"application/json" }, body:JSON.stringify(body) });
  const d = await r.json();
  if (!r.ok || d.error) throw new Error(d.error || "Request failed");
  return d;
}
