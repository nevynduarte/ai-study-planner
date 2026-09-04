# autonomous-swe — understand it before you build it

## What it is, in plain words

You label a GitHub issue `agent`. A few minutes later a pull request appears that fixes it, with tests passing, a review comment explaining the change, and a line saying what it cost. That is the whole product.

Underneath, it is Week 1's agent loop pointed at code instead of documents, with three hard additions: the agent has to **understand a codebase** it has never seen (indexing and search over code), it has to **run the code safely** (a throwaway sandbox per task, no network), and it has to **iterate on failure** (read the failing test, change the plan, try again, within a budget). Then you **measure it** on a public benchmark so you can talk about agent design with numbers instead of opinions.

## Why employers care

Coding agents are the most visible AI product category right now. Roles at TTEC, Fluidstack, and LangChain ask directly for "multi-agent applications," "code-first agent tooling," and "eval methodologies." Your SWE-bench table (resolved %, cost per task, single agent vs planner/executor) is a conversation starter no course project gives you.

## The picture

```
 GitHub                                  YOUR CLUSTER (from Week 3)
 issue labeled `agent` ──webhook──►  webhook/ (FastAPI)  ── writes TaskRequested to Kafka
                                              │
                                              ▼
                                     index/  clone repo at HEAD
                                             tree-sitter → symbols (functions, classes, imports)
                                             embeddings per symbol/file → pgvector
                                             incremental: only re-index changed files by commit SHA
                                              │
                                              ▼
                                     planner/  issue text + search results → plan.json
                                               { files_to_touch, tests_to_run, acceptance }
                                              │
                                              ▼
                                     sandbox/  Kubernetes Job from the repo's image
                                               checkout mounted, network OFF, 30-min limit
                                              │
                                     ┌────────┴──────────────────────────────┐
                                     │  coder/ loop (max 8 iterations)        │
                                     │  1. propose diff (Claude, or local 7B  │
                                     │     via Week 3 for cheap steps)        │
                                     │  2. apply → run tests → lint → types   │
                                     │  3. read failures → revise             │
                                     └────────┬──────────────────────────────┘
                                              ▼
                                     reviewer/  reads final diff vs acceptance, flags risk
                                              │
                                     approval gate (reuses Week 1's ApprovalRequested event)
                                              │
                                              ▼
                                     GitHub PR + review comment + cost line
 Every step: tokens, $, iterations → Postgres → Grafana panel.
 Also exposed as an MCP server so Week 1's planner can call `implement_change`.
```

## Follow one issue through the system

1. **Someone labels issue #42 "agent".** GitHub sends a webhook. `webhook/` verifies the signature, records a task, and publishes `TaskRequested` to Kafka.
2. **A worker indexes the repo** if the commit SHA is new: clones it, runs tree-sitter to extract every function, class, and import into a symbol table, embeds each symbol's code, and stores both in Postgres. On a 50k-line repo this takes a few minutes the first time and seconds after.
3. **The planner** reads the issue and searches the index three ways: by symbol name mentioned in the issue, by meaning (embedding), and by import neighbors of whatever it found. It writes `plan.json`: which files to change, which tests should pass, and what "done" means in one sentence.
4. **A sandbox starts.** A Kubernetes Job launches from an image with the repo's dependencies, mounts the checkout, and has no network. Nothing the agent does can touch the outside world.
5. **The coder loop.** The coder agent proposes a diff. The sandbox applies it, runs the named tests, the linter, and the type checker. If anything fails, the failure output goes back to the agent, which revises. Up to 8 times, within a token and dollar budget. Every iteration is recorded.
6. **The reviewer** reads the final diff against the acceptance sentence and posts a review: does it do what was asked, what could break, does it need a human.
7. **Approval.** For repos you mark as protected, the run pauses on Week 1's approval event until you click Approve.
8. **The PR opens** with the diff, the reviewer's comment, and a footer: `3 iterations · 41k tokens · $0.87 · 6m12s`.

## The tools, and why each one is here

| Tool | What it is | Why it is in this project | What you could use instead |
|------|------------|---------------------------|----------------------------|
| **GitHub App + webhooks** | Registered integration with its own identity and permissions | Receives events, opens PRs as "the bot" with scoped tokens instead of your personal token | Personal access token + polling |
| **tree-sitter** | Fast parser with grammars for every language | Turns code into a symbol table without running it; language-agnostic | Python `ast` (Python only), regex (fragile) |
| **LSP (pyright)** | Language Server Protocol | Type checking and go-to-definition the way an IDE does it | mypy only |
| **pgvector** | Vector search | Semantic search over code symbols, same store as Week 1 | Dedicated code search (Sourcegraph) |
| **Kafka** | Queue / event log | Same durability story as Week 1: tasks survive worker crashes | SQS, Redis |
| **Kubernetes Jobs** | Run-to-completion pods | One isolated sandbox per task, resource-limited, deleted after | Docker on a VM, Firecracker/gVisor (add if available) |
| **Anthropic SDK + Week 3 router** | Model calls | Frontier model for planning and hard edits; your hosted 7B for cheap steps; you measure the difference | Single model everywhere |
| **ruff / pyright / bandit** | Linter / type checker / security scanner | The agent's changes must pass the same bar a human's would | Skip (and ship bugs) |
| **SWE-bench Lite** | Public benchmark of real GitHub issues with hidden tests | The only credible way to report "resolved %" | Your own issue set (add some too) |
| **MCP server** | Exposes `implement_change` as a tool | Week 1's planner can delegate coding work; the five projects become one system | REST endpoint |
| **Postgres + Grafana** | Task records and dashboard | Cost, iterations, and success rate per task and per model | Spreadsheet |

## What the week produces

A GitHub App that turns labeled issues into reviewed, tested PRs on your repos; a SWE-bench Lite table over 100 tasks (resolved %, tests passed, iterations, tokens, dollars, wall time); an ablation table comparing single agent vs planner/executor, full-file context vs retrieval, frontier vs local model, with vs without reviewer; and a demo where Week 1's agent asks Week 4 to add an endpoint to itself and a PR appears.

## Words you will hear this week

- **Webhook**: GitHub calling your URL when something happens.
- **AST / symbol table**: the tree structure of code / the list of named things in it and where they live.
- **Code index / semantic code search**: precomputed structure and embeddings so the agent can find relevant code fast.
- **Sandbox**: an isolated environment where running untrusted code cannot hurt anything.
- **Planner/executor**: one agent decides what to do, another does it; compared against one agent doing both.
- **Ablation**: remove or swap one component and measure the change.
- **Resolved rate**: fraction of benchmark tasks where the hidden tests pass after the agent's change.
- **Context strategy**: what code you show the model: whole files, retrieved snippets, or a summary.
- **Budget**: hard limits on tokens, dollars, iterations, and time per task.
- **Review agent**: a second model instance that critiques instead of writes.

## The day-by-day in one line each

22. Webhook receives events; repo indexed with tree-sitter and embeddings; search finds the right file.
23. Planner, sandbox Jobs, coder loop with tests/lint/types; first real green PR.
24. Reviewer agent, approval gate, per-task cost recording, dashboard panel.
25. SWE-bench Lite, 100 tasks in parallel Jobs, results table.
26. Ablations: topology, context strategy, model, reviewer; ADRs with numbers.
27. MCP server so Week 1 can delegate; failure drills; postmortems.
28. README, security doc for the sandbox, video, case study, three applications.
