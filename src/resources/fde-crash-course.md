# FDE Coding Interview Crash Course
### Avallon · Clarion · CollectWise — one prep track, three interviews

FDE coding interviews are **not** Neetcode-style algorithm grinds. All three companies will test whether you can *wire real systems together under time pressure*: call APIs, transform messy data, handle failures, and ship something working in 1–2 hours. Your Bridges AI work is almost exactly this — the goal here is to make it fast and fluent under observation.

**Language call:** Do everything in **TypeScript/Node**. CollectWise and Clarion are explicitly JS/TS shops; Avallon accepts Python or TS. One language, one muscle memory. (Keep Python in your back pocket for Avallon's document-parsing questions if you're faster there with pandas.)

---

## 1. The interview shapes to expect

| Company | Likely format | What they're probing |
|---|---|---|
| CollectWise | 2-hr take-home + Zoom technical | Can you build a small integration end-to-end, alone, quickly? |
| Clarion | Live coding + implementation scenario | Production code quality, Node/Postgres fluency, workflow logic (scheduling rules) |
| Avallon | Practical build / pairing | Parsing messy documents/data, API wiring, "try it instead of theorizing" speed |

Common denominators: **REST API integration, async JS, data transformation, webhooks, error handling, a little SQL, a little LLM plumbing.** Prep those seven things and you're covered for all three.

---

## 2. Node/TypeScript fundamentals you must be automatic on

### Async patterns (the #1 filter in JS interviews)

```ts
// Sequential vs parallel — know when each is right
const a = await fetchUser(id);          // sequential: b depends on a
const b = await fetchOrders(a.id);

const [users, orders] = await Promise.all([   // parallel: independent calls
  fetchUsers(),
  fetchOrders(),
]);

// Promise.allSettled when partial failure is acceptable
const results = await Promise.allSettled(ids.map(fetchRecord));
const ok = results.filter(r => r.status === "fulfilled").map(r => r.value);
const failed = results.filter(r => r.status === "rejected");
```

Interview trap: `array.forEach(async ...)` does **not** await. Use `for...of` for sequential, `Promise.all(arr.map(...))` for parallel.

### Concurrency limiting (comes up constantly in integration work)

```ts
async function mapWithConcurrency<T, R>(
  items: T[], limit: number, fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: limit }, worker));
  return results;
}
```

Be able to write this from scratch. It's the single most "FDE-shaped" snippet there is: "sync 10,000 records to a client API that rate-limits at 5 concurrent requests."

### Retry with exponential backoff

```ts
async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 4): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const retryable = err instanceof HttpError && (err.status === 429 || err.status >= 500);
      if (!retryable || attempt === maxAttempts) throw err;
      const delay = Math.min(1000 * 2 ** (attempt - 1), 10_000) + Math.random() * 250; // jitter
      await new Promise(res => setTimeout(res, delay));
    }
  }
}
```

Say the words **"retry on 429/5xx only, exponential backoff with jitter, respect Retry-After if present."** That sentence alone signals production experience.

### TypeScript essentials (Clarion especially)

```ts
// Discriminated unions — model API results honestly
type Result<T> = { ok: true; data: T } | { ok: false; error: string };

// Narrowing unknown input at the boundary
function parsePatient(raw: unknown): Patient {
  if (typeof raw !== "object" || raw === null) throw new Error("invalid payload");
  const r = raw as Record<string, unknown>;
  if (typeof r.name !== "string") throw new Error("missing name");
  // ...
}

// Utility types you should use casually: Partial<T>, Pick<T,K>, Omit<T,K>, Record<K,V>
```

If you have 30 spare minutes, learn basic **zod** — `z.object({...}).parse(payload)` at API boundaries is the idiomatic answer to "how do you validate client data" and all three companies will recognize it.

---

## 3. API integration playbook (the core of every FDE interview)

### The canonical exercise
"Here's a third-party API (docs provided). Pull all records, transform them, push them into our system." Expect **pagination**, expect **rate limits**, expect **inconsistent data**.

```ts
// Cursor pagination — the pattern to have memorized
async function fetchAll<T>(baseUrl: string, token: string): Promise<T[]> {
  const out: T[] = [];
  let cursor: string | null = null;
  do {
    const url = new URL(baseUrl);
    if (cursor) url.searchParams.set("cursor", cursor);
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new HttpError(res.status, await res.text());
    const body = await res.json();
    out.push(...body.data);
    cursor = body.next_cursor ?? null;
  } while (cursor);
  return out;
}
```

Narrate the variants: offset/limit vs cursor, `Link` headers, and why cursor pagination survives inserts mid-scan.

### Webhooks (voice AI companies live on these)
- **Verify signatures** (HMAC of raw body with shared secret; compare with `crypto.timingSafeEqual`).
- **Respond 200 fast, process async** — queue the work, don't do it in the handler.
- **Idempotency**: providers redeliver. Dedupe on event ID (unique constraint in Postgres or a processed-events set).
- Know that Twilio/Vapi-style voice platforms deliver call events (call started, transcript chunk, call ended) as webhooks — Avallon and CollectWise both run on this pattern.

```ts
app.post("/webhooks/calls", express.raw({ type: "*/*" }), (req, res) => {
  if (!verifySignature(req.body, req.header("X-Signature"))) return res.sendStatus(401);
  const event = JSON.parse(req.body.toString());
  void enqueue(event);        // process out-of-band
  res.sendStatus(200);        // ack immediately
});
```

### Express/Fastify minimal service
Be able to stand up a REST API with 3–4 endpoints, input validation, central error handler, and async route handlers in ~15 minutes without looking anything up. Practice this cold twice before the interviews.

---

## 4. Data transformation drills (Avallon's bread and butter)

The exercise: "Here's an ugly export (CSV/JSON/parsed PDF text). Normalize it."

Drill these until they're reflexes:

```ts
// Group by key
const byStatus = Object.groupBy(claims, c => c.status);   // Node 21+; else reduce()

// Dedupe on a field, keeping the latest
const latest = new Map<string, Claim>();
for (const c of claims) {
  const prev = latest.get(c.claimId);
  if (!prev || c.updatedAt > prev.updatedAt) latest.set(c.claimId, c);
}

// Join two datasets on a key — build a Map first, never nested .find() (O(n²))
const userById = new Map(users.map(u => [u.id, u]));
const enriched = orders.map(o => ({ ...o, user: userById.get(o.userId) ?? null }));

// Normalize inconsistent fields
const normPhone = (s: string) => s.replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
const normDate = (s: string) => new Date(s).toISOString().slice(0, 10); // then handle NaN!
```

Habits that read as senior: check for missing/null fields explicitly, collect bad rows into an `errors[]` array instead of throwing on the first one, and report counts at the end ("42,310 processed, 117 rejected — here's why").

For Avallon specifically: skim how PDF → text extraction fails (columns interleave, tables flatten, headers repeat per page). If asked to parse extracted text, reach for line-by-line state machines and regex anchored on stable labels, not "split on whitespace."

---

## 5. SQL/Postgres — enough to not get filtered

Clarion lists PostgreSQL in the stack; the others will assume basics.

```sql
-- Top N per group (the classic screen question)
SELECT * FROM (
  SELECT c.*, ROW_NUMBER() OVER (PARTITION BY client_id ORDER BY created_at DESC) rn
  FROM calls c
) t WHERE rn <= 3;

-- Aggregation with a join and a filter on the aggregate
SELECT client_id, COUNT(*) AS n_calls, AVG(duration_s) AS avg_dur
FROM calls
WHERE created_at >= now() - interval '30 days'
GROUP BY client_id
HAVING COUNT(*) > 100
ORDER BY n_calls DESC;

-- Upsert — the integration engineer's best friend
INSERT INTO patients (external_id, name, phone)
VALUES ($1, $2, $3)
ON CONFLICT (external_id) DO UPDATE SET name = EXCLUDED.name, phone = EXCLUDED.phone;
```

Also be ready to say: parameterized queries (never string-interpolate), an index on any column you filter/join on, unique constraints as your idempotency backstop, and transactions around multi-step writes.

---

## 6. LLM / agent plumbing (differentiator round)

All three build AI agents; expect at least one question here, and this is where you should *shine* — answer from Bridges AI experience, not from theory.

Have crisp, 60-second answers ready for:
- **"How do you get reliable structured output from an LLM?"** → JSON schema / tool-calling with enforced schema, validate with zod, retry-with-error-feedback on parse failure, temperature 0 for extraction tasks.
- **"How do you handle an agent doing the wrong thing in production?"** → logging every prompt/response pair, evals on a golden set of transcripts, guardrails on tool calls (allowlist of actions, human confirmation for irreversible ones), versioned prompts so you can diff regressions.
- **"How would you build the scheduling agent / collection agent / claims intake agent?"** → intent classification → slot filling (who/when/what) → tool calls against the client's system (check availability, book, confirm) → fallback to human handoff on low confidence. Draw the loop: *transcribe → reason → act → observe*.
- **Voice specifics** (CollectWise, Avallon): latency budget matters (streaming STT → LLM → TTS), barge-in handling, and webhook-driven call lifecycle. Name-dropping Twilio/Vapi/LiveKit accurately is worth real points at Avallon — they listed them.
- **RAG in one breath:** chunk → embed → retrieve top-k → rerank → stuff into context with citations; failure modes are bad chunking and retrieval misses, measured with retrieval evals. You've built these — say so with a concrete client anecdote.

---

## 7. Light DSA — the floor, not the ceiling

You won't get hard LeetCode, but a warm-up question is common. Cover the greatest hits in JS (you've done these in Python; the point is JS fluency):

- Two-sum / frequency counting with `Map`
- String manipulation: parse a log line, reverse words, validate brackets with a stack
- Merge intervals (this one is *disguised scheduling logic* — very Clarion)
- Flatten nested objects/arrays, deep clone talking points (`structuredClone` exists)
- Debounce/throttle — classic JS question, 5 lines each, memorize both

Time-box: one Neetcode-easy per day in TypeScript this week. Nothing harder — your marginal hour is better spent on sections 3–4.

---

## 8. The take-home playbook (CollectWise's 2-hour assignment)

FDE take-homes are graded on **shipping something that works + communicating clearly**, not architecture astronautics.

1. **First 10 min:** read everything, write a 5-line plan in the README, choose the smallest scope that satisfies the prompt.
2. **Build the happy path end-to-end first.** A working demo with rough edges beats a beautiful half.
3. **Then add:** input validation, error handling on external calls, 2–3 tests on the trickiest transform (not 100% coverage).
4. **README is 25% of the grade:** how to run it, what you built, what you'd do with more time, any assumptions. Bullet points, honest trade-offs.
5. Commit history that shows progression. No giant single commit.
6. If it involves an LLM call: mock it or make the key configurable, include one recorded sample response so it runs without their key.

---

## 9. Five-day prep plan

| Day | Focus (2–3 hrs) |
|---|---|
| 1 | Async drills: write concurrency limiter, retry-with-backoff, and paginated fetcher from scratch, no references. Redo until each takes <10 min. |
| 2 | Stand up an Express + TS service cold: 3 endpoints, zod validation, webhook receiver with signature check + dedupe. Twice. |
| 3 | Data transformation reps: take a messy CSV (export something from your own projects), normalize/dedupe/join/report errors in TS. One Neetcode-easy in TS. |
| 4 | SQL hour (window functions, upserts, top-N-per-group) + rehearse the five LLM/agent answers out loud, each under 90 seconds, with a Bridges AI anecdote attached. |
| 5 | Mock take-home: pick any public API (e.g., a fake CRM), build "sync + transform + expose one endpoint" in a strict 2-hour window with a README. This is your dress rehearsal for CollectWise. |

---

## 10. Talking-while-coding script

FDEs are hired for communication as much as code. In every live round:

- Restate the problem and confirm scope *before* typing.
- Narrate trade-offs as one-liners: "I'll use a Map for O(1) lookup," "I'd add a retry here in production — stubbing it for time."
- When you hit a bug, debug out loud — they're evaluating exactly this moment.
- Finish every exercise with: "With more time I'd add ___" (tests, observability, idempotency, backpressure). It converts unfinished work into demonstrated judgment.

You already do this job. The prep above is about doing it in TypeScript, on a timer, with someone watching.
