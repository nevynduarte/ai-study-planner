# Equi — Founding Engineer, Applied AI Lead
**Complete Interview Preparation Guide**  
_Nevyn Duarte · Prepared June 2026_

Equi is an early-stage investment management firm building both branded funds and white-label fund-of-funds infrastructure for multi-family offices and RIAs. This is a true founding-engineer role: full-stack ownership (TypeScript/Next.js/Python/Postgres on GCP) fused with AI engineering (RAG over investment data, automation of investment workflows). This guide covers the recruiter screen through live build, system design, and final founder conversation.

## Part 1 — Role & Company Intelligence
### 1.1 What Equi Does
Equi is an investment management firm operating two lines of business simultaneously: Equi-branded investment funds, and white-label fund-of-funds products built for top independent multi-family offices and financial advisory firms. They combine manager selection with portfolio construction to deliver alternative-investment access to clients who'd otherwise lack it. The company describes itself as at an inflection point — AUM scaling rapidly, an LOI signed for an additional fund-of-funds product, more LOIs expected.
This is meaningfully different from a typical fintech app: the actual product is investment expertise and access, delivered partly through white-label software for sophisticated B2B clients (multi-family offices, RIAs) rather than a pure consumer app. The engineering org doesn't exist yet in any real depth — you would be building it.
### 1.2 What the Job Actually Is
Strip the title down: you are simultaneously (1) a full-stack engineer building customer- and partner-facing applications on TypeScript/Next.js/Python/Postgres/GCP, (2) an AI engineer building RAG systems over investment data and automating investment-team workflows, and (3) a future engineering leader once the team grows beyond you. The JD is explicit that the role evolves from "hands-on building" to "growing and leading the engineering team" while staying technical.
Read between the lines: there is currently no other engineer (or a very small founding team) — this is the first or near-first technical hire. That changes what a strong answer sounds like at every round: they're not testing whether you can pass a narrow technical bar, they're testing whether they can hand you the keys.
### 1.3 The Trait Filters — Read These Closely
The JD spells out three named traits almost as explicitly as a rubric: Product-Minded, High Autonomy, Bias Toward Action. Treat these as the actual evaluation criteria layered on top of technical skill. Every story you tell, in any round, should map cleanly to at least one of these three.
Trait
What they're listening for
Product-Minded
You ask "why are we building this" before "how." You weigh engineering effort against product impact, using data.
High Autonomy
You take ambiguous goals and run, owning outcomes (not just tasks) without needing detailed specs.
Bias Toward Action
You ship with incomplete information, treat decisions as reversible, iterate fast rather than over-analyzing.

## Part 2 — Round 1 Recap: Recruiter/Hiring Screen
Core narrative: you already operate as a founding engineer today — Bridges AI co-founder/CTO, full-stack + AI systems in production. This isn't a stretch, it's continuity. Your finance background (M Science quant equity research, Jefferies, BNY Mellon, Citco) gives you the "passion for investing" the JD explicitly filters for, which most engineering candidates won't have authentically.
Have ready, cold, no notes:
Why investing genuinely interests you beyond "it's a good fintech market"
A 90-second walkthrough of a full-stack app you built solo, start to finish (Houston Mobile Mixology is ideal — recent, complete, deployed)
A clear answer to "where do you want to be in 2-3 years" that matches their stated leadership trajectory

## Part 3 — Round 2 (Expected): Live Coding / Pairing Session
### 3.1 What to Expect
Founding/early engineer roles emphasizing production full-stack work (rather than CS-fundamentals-heavy big tech roles) typically run live pairing sessions, not algorithmic LeetCode. Given the explicit stack — TypeScript, Next.js, Python, Postgres, GCP — expect one of:
Build a small feature live: e.g., an API endpoint plus a UI component that calls it, given a rough spec ("build a page that lists funds and lets a user filter by asset class").
Debug/extend an existing small codebase they hand you, testing how you navigate unfamiliar code under time pressure.
A take-home project instead of/alongside live coding — plausible given founding-engineer hires are often evaluated on a real chunk of shippable work rather than a timed puzzle.
### 3.2 What to Have Razor-Sharp
Next.js App Router fundamentals: Server Components vs. Client Components (when each runs, why it matters for data fetching and bundle size), file-based routing, layouts vs. pages, Server Actions for mutations without a separate API route.
TypeScript fluency at a glance: discriminated unions for API response states (loading/success/error), generics for reusable data-fetching hooks, Zod (or similar) for runtime schema validation at API boundaries — investment data from third parties will be messy, so validating at the boundary is a strong thing to mention unprompted.
Python backend patterns: FastAPI route design, Pydantic models for request/response validation, async/await for I/O-bound calls (LLM calls, external data fetches) — your Bridges AI FastAPI experience transfers directly here.
Postgres comfort: writing a clean schema for a domain you've just been handed (e.g., funds, managers, allocations, documents), foreign keys, and at least conversational fluency with indexing for query performance.
Narrate while you work: with a small/no team, communication while building is itself being evaluated — think out loud, name tradeoffs as you make them, don't go silent for five minutes.
### 3.3 Practice Build
A companion runnable project simulating exactly this kind of live-build scenario is included as a separate deliverable: a small Next.js + FastAPI + Postgres app for browsing and filtering investment fund data, plus a RAG endpoint over fund documents. Build it yourself first, then compare against the included reference implementation.

## Part 4 — Round 3 (Expected): System Design — RAG Over Investment Data
### 4.1 Likely Prompt Shape
Given "ingest multi-format investment data and parse it into both human- and computer-digestible formats" and "develop RAG-based intelligence systems," expect something like: "Design a system that lets an investment analyst ask natural-language questions about fund performance, manager letters, and due diligence documents, with accurate, traceable answers." This is the single highest-leverage thing to prepare deeply, since it's the actual core of the AI Engineering bullet in the JD.
### 4.2 Structure Your Answer — Full RAG Pipeline
Ingestion: investment documents arrive as PDFs (fund letters, PPMs, due diligence memos), spreadsheets (performance data), and possibly emails. Each format needs different parsing — PDF text extraction (with attention to tables, which are notoriously lossy), structured extraction from spreadsheets into a normalized schema.
Chunking strategy: this is where most RAG systems fail in finance specifically. Naive fixed-size chunking breaks tables and breaks the link between a number and its context (e.g., "Q3 net return: 4.2%" loses meaning if separated from which fund, which quarter, which share class). Recommend semantic/structure-aware chunking — split on document sections, keep tables intact as atomic chunks, attach metadata (fund name, document date, document type) to every chunk regardless of chunking strategy.
Embedding & retrieval: dense embeddings for semantic search, but pair with metadata filtering (e.g., filter to a specific fund or date range before semantic search runs) since financial queries are usually scoped, not open-ended. Consider hybrid retrieval (dense + keyword/BM25) since exact figures, fund names, and tickers benefit from exact-match retrieval that pure embeddings can miss.
Reranking: a lightweight reranking pass over top-k retrieved chunks before they hit the LLM context improves precision meaningfully, especially when multiple similar-sounding funds exist.
Grounded generation & traceability: the highest-stakes requirement in an investment context is that answers must be traceable to source documents — never let the model state a return figure without citing the exact document/page. Discuss citation-grounded generation (passing chunk provenance through to the response) as a near-mandatory feature here, not a nice-to-have.
Guardrails against hallucinated numbers: discuss a verification step — e.g., extracting the specific numeric claim from the cited chunk and cross-checking it against the generated answer before returning it. Financial RAG fails reputationally the moment it confidently states a wrong number.
Human-in-the-loop: frame the system as augmenting analyst judgment, not replacing it — the JD says "use AI to perform investment analysis and provide recommendations to the human investment team," not to make autonomous decisions.
### 4.3 Be Ready to Go Deeper If Pushed
Chunk size/overlap tradeoffs and why there's no universal right answer — depends on document structure and query patterns.
Vector DB choice considerations (e.g., pgvector if staying inside Postgres for operational simplicity vs. a dedicated vector store for scale) — pgvector is a strong answer here since it keeps the stack consolidated on Postgres, which fits their existing stack.
Evaluation: how would you know the RAG system is actually accurate? Discuss building a small golden-answer eval set from real analyst questions, and tracking faithfulness (does the answer match the source) separately from relevance (did it retrieve the right document).
Cost/latency tradeoffs of reranking and verification steps in a system meant to be used interactively by analysts.

## Part 5 — System Design: Full-Stack Application Architecture
A second plausible system design theme, separate from RAG: "design the white-label fund-of-funds product Equi is building for multi-family offices." This tests product thinking and multi-tenant architecture awareness more than AI depth.
### 5.1 Key Considerations to Surface
Multi-tenancy: white-label means multiple MFO/RIA clients need logically separated data and possibly distinct branding — discuss row-level security in Postgres or a tenant_id-scoped schema design, and why you'd choose one over fully separate databases per client at this stage (operational simplicity vs. isolation guarantees).
Permissions/roles: investment data is sensitive — discuss role-based access control between Equi's internal investment team, advisory firm admins, and end clients viewing their own portfolios.
API design for partners: if MFOs/RIAs need to integrate Equi's data into their own systems, discuss a clean REST or GraphQL API surface with versioning discipline from day one, since you're building this for external partners, not just internal use.
GCP-specific architecture: Cloud Run for stateless API services (good fit for a small team, scales to zero), Cloud SQL for managed Postgres, Cloud Storage for raw document ingestion, and where you'd reach for a managed AI service vs. self-hosted model serving.

## Part 6 — Behavioral & Founder Round
### 6.1 What This Round Is Really Testing
By final round, technical competence is mostly assumed. The founder conversation is testing: do they actually want to spend years building with you, do you genuinely love investing as a domain (not just as a paycheck), and can they hand you ambiguous, high-stakes ownership without hovering.
### 6.2 Story Bank Mapped to the Three Named Traits
Likely prompt
Your story
Tell me about a time you shipped something with incomplete information.
Any fast architecture decision at Bridges AI or your home-lab LiteLLM routing setup — frame as calculated, reversible, iterated quickly.
Describe a time you challenged a product or technical assumption.
A real instance from Bridges AI client work (Valorem or Houston Mobile Mixology) where you pushed back on scope or approach with data/reasoning.
Tell me about owning something end-to-end with no one else to defer to.
Bridges AI CTO role broadly, or the Houston Mobile Mixology two-part build (marketing site + staff portal) for a real client, solo.
Why investing? Why now?
M Science quant equity research → Jefferies → seeing alt data move from research curiosity to decision input; now wanting to build the engineering infrastructure that does this at a platform level, not just research it.
Where do you see this role/your career in 2-3 years?
Match their stated arc explicitly: hands-on building now, growing into leading a small flat engineering team as the platform scales, while staying technical.

### 6.3 Investing Domain Literacy — Minimum Viable Fluency
You don't need buy-side depth, but you do need to not sound like a generic engineer who landed at a fintech by accident. Be comfortable with:
Fund-of-funds structure: a fund that invests in other funds (managers) rather than directly in securities — Equi's core white-label product.
Multi-family office (MFO): a firm managing wealth for several high-net-worth families, often needing alternative-investment access they can't source alone — Equi's white-label client base.
LOI (Letter of Intent): a non-binding agreement signaling a deal is moving forward before final contracts — relevant since Equi's growth narrative is LOI-driven right now.
Manager selection / due diligence: the process of evaluating which fund managers to allocate capital to — this is the human expertise the JD's AI tooling is meant to augment.
Alternative investments broadly: private equity, hedge funds, private credit, real assets — anything outside public stocks/bonds. Given your M Science alt-data background, you can authentically connect "alternative data" (your past) to "alternative investments" (their domain) as a deliberate talking point.

## Part 7 — Questions to Ask Them
Early/screen: "How is the engineering function structured today — am I the first technical hire, or joining a very small existing team?"
Technical round: "What does the current investment data pipeline look like today — is most of this still manual analyst work that the AI tooling would augment first, or is there existing infrastructure I'd be extending?"
System design round: "For the white-label product — how much customization do individual MFO/RIA partners need, versus a single shared platform experience?"
Founder round: "With the new LOI and more expected, how do you think about the engineering org's shape over the next 12-18 months — when does 'small and flat' start needing structure?"

## Part 8 — Final Prep Checklist
- [ ] Rebuild the RAG architecture explanation out loud, twice, without notes
- [ ] Walk through the practice full-stack build (separate deliverable) end to end
- [ ] Rehearse the 5 behavioral stories mapped to Product-Minded / Autonomy / Bias Toward Action
- [ ] Know fund-of-funds, MFO, LOI, manager selection cold — no hesitation if these come up casually
- [ ] Have a genuine, specific answer for why investing — not a generic "fintech is interesting"
- [ ] Prepare 3-4 tailored questions per round from Part 7
