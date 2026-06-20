/**
 * Equi Practice Build — Frontend
 * ================================
 * A single-page demo of the fund browser + RAG question interface, written
 * as a Next.js App Router page. This is intentionally a SINGLE FILE for the
 * practice build's portability, but the comments below mark exactly how
 * you'd split it across Server/Client Components in a real Next.js app —
 * being able to articulate that split out loud is the actual interview skill
 * (see study guide Part 3.2).
 *
 * ── SERVER vs CLIENT COMPONENT SPLIT (say this out loud in a live round) ──
 * - The fund list (`/api/funds`) rarely changes and has no interactivity:
 *   in a real app, fetch it in a Server Component (page.tsx with no
 *   "use client") so it's rendered on the server with zero client JS cost.
 * - The question box and citation display NEED client-side state (typing,
 *   loading spinners, selected fund) — that part requires "use client" and
 *   becomes its own component, e.g. <AskPanel initialFunds={funds} />,
 *   receiving server-fetched data as props rather than re-fetching client-side.
 * - This file merges both into one client component for simplicity since
 *   it's a take-home-style demo, not production code. In a real PR you'd
 *   split it as: page.tsx (Server Component, fetches funds) renders
 *   <AskPanel /> (Client Component, owns interaction state).
 *
 * To actually run this as a real Next.js app, you'd scaffold with
 * `npx create-next-app@latest` and drop this logic into app/page.tsx +
 * a separate app/components/AskPanel.tsx — kept as one file here for
 * portability of the practice exercise.
 */

"use client";

import { useState, useEffect } from "react";

const API_BASE = "http://localhost:8000";

// ── Discriminated union for request state — exactly the TypeScript pattern
// flagged as worth knowing cold in the study guide (Part 3.2). Using a
// union instead of separate `loading`/`error`/`data` booleans prevents
// impossible states (e.g. loading=true AND error="..." at the same time).
type AskState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: AskResponse }
  | { status: "error"; message: string };

interface Citation {
  chunk_id: string;
  doc_id: string;
  fund_name: string;
  doc_type: string;
  doc_date: string;
  excerpt: string;
  relevance_score: number;
}

interface AskResponse {
  question: string;
  answer: string;
  citations: Citation[];
  note: string;
}

export default function FundResearchPage() {
  const [funds, setFunds] = useState<string[]>([]);
  const [selectedFund, setSelectedFund] = useState<string>("");
  const [question, setQuestion] = useState("");
  const [askState, setAskState] = useState<AskState>({ status: "idle" });

  // In a real app this fetch lives in a Server Component — see docstring.
  useEffect(() => {
    fetch(`${API_BASE}/api/funds`)
      .then((res) => res.json())
      .then(setFunds)
      .catch(() => setFunds([]));
  }, []);

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;

    setAskState({ status: "loading" });
    try {
      const res = await fetch(`${API_BASE}/api/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          fund_name: selectedFund || null,
          top_k: 3,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail ?? "Request failed");
      }
      const data: AskResponse = await res.json();
      setAskState({ status: "success", data });
    } catch (err) {
      setAskState({
        status: "error",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "2rem", fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>Fund Research Assistant</h1>
      <p style={{ color: "#666", marginBottom: "1.5rem" }}>
        Ask a question about fund performance or strategy. Answers are grounded
        in source documents — every claim is cited below the answer.
      </p>

      <form onSubmit={handleAsk} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <select
          value={selectedFund}
          onChange={(e) => setSelectedFund(e.target.value)}
          style={{ padding: "0.5rem" }}
        >
          <option value="">All funds</option>
          {funds.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>

        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. What was the Q1 2026 net return?"
          rows={3}
          style={{ padding: "0.5rem" }}
        />

        <button
          type="submit"
          disabled={askState.status === "loading"}
          style={{ padding: "0.6rem", background: "#1f4e79", color: "white", border: "none", borderRadius: 4 }}
        >
          {askState.status === "loading" ? "Searching…" : "Ask"}
        </button>
      </form>

      {askState.status === "error" && (
        <p style={{ color: "#b00020", marginTop: "1rem" }}>Error: {askState.message}</p>
      )}

      {askState.status === "success" && (
        <div style={{ marginTop: "1.5rem" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600 }}>Answer</h2>
          <p style={{ whiteSpace: "pre-wrap" }}>{askState.data.answer}</p>

          <h3 style={{ fontSize: "0.95rem", fontWeight: 600, marginTop: "1rem" }}>
            Sources ({askState.data.citations.length})
          </h3>
          <ul style={{ paddingLeft: "1.2rem" }}>
            {askState.data.citations.map((c) => (
              <li key={c.chunk_id} style={{ marginBottom: "0.5rem", fontSize: "0.9rem" }}>
                <strong>{c.fund_name}</strong> — {c.doc_type} ({c.doc_date}) ·{" "}
                relevance {c.relevance_score.toFixed(2)}
                <br />
                <span style={{ color: "#555" }}>{c.excerpt}</span>
              </li>
            ))}
          </ul>

          <p style={{ fontSize: "0.8rem", color: "#888", marginTop: "1rem" }}>
            {askState.data.note}
          </p>
        </div>
      )}
    </main>
  );
}
