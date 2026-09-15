# Application Engine

A truth-first job-application workflow for fast, high-quality applications. The system is designed to sit between the Austin AI/ML Job Tracker, ChatGPT/Claude, Simplify Copilot, and the final application form.

## Goals

1. Reduce repetitive application work without reducing application quality.
2. Tailor each response to the actual job requirements.
3. Never invent or inflate experience, years, metrics, ownership, technologies, or production scope.
4. Preserve Nevyn's natural technical voice rather than optimizing for an AI-detector score.
5. Keep a human review before submission.

## Workflow

```text
Google Sheet job tracker
        ↓
job description + company context
        ↓
requirement extraction
        ↓
FACTS.md + STORIES.md evidence matching
        ↓
mode-specific prompt
        ↓
Claude / ChatGPT draft
        ↓
VOICE.md edit pass
        ↓
style audit
  ├─ Vale custom rules
  ├─ write-good / proselint via Vale packages
  ├─ optional humanizer editor
  └─ optional humanizer critics
        ↓
fact-preservation audit
        ↓
final response
        ↓
Simplify autofill / Chrome application
        ↓
60-second human review
        ↓
submit + update tracker
```

## Three modes

### Fast
For routine applications and short form questions. Target 50–150 words. Minimal research; answer immediately and use one concrete example.

### High priority
For strong-fit $130k+ roles. Use company/product research, requirement decomposition, evidence matching, and a full voice/fact audit.

### Cover letter
Target 250–350 words unless the employer asks for another length. One page, 3–4 short paragraphs, 1–2 evidence-backed examples.

## Open-source style stack

Use the tools as complementary checks, not five sequential rewriting passes.

1. **Vale** — primary deterministic prose linter and custom style rules.
2. **Vale write-good package** — passive/wordiness-style checks.
3. **Vale proselint package** — additional prose-quality checks.
4. **hannsxpeter/humanizer** — optional voice-preserving editor using `VOICE.md`.
5. **Aaron-Bushnell/humanizer or Aboudjem/humanizer-skill** — optional critic/audit pass, especially fact-preservation/style diagnostics.

Do not optimize against AI-detector percentages. Optimize for specificity, truth, clarity, company relevance, and voice consistency.

## Canonical files

- `FACTS.md` — verified facts only. If a fact is absent, the generator cannot invent it.
- `STORIES.md` — approved experience/project stories with scope and evidence.
- `VOICE.md` — voice profile derived from real Nevyn-authored writing.
- `prompts/core.md` — shared truth/content/voice constraints.
- `prompts/fast.md` — short-answer mode.
- `prompts/high-priority.md` — deep-tailoring mode.
- `prompts/cover-letter.md` — cover-letter mode.
- `.vale.ini` + `styles/JobApplications/` — deterministic style checks.
- `FINAL_REVIEW.md` — pre-submit checklist.

## Human review is mandatory

Before submission verify: correct company/role, resume version, work authorization, location/relocation, compensation, dates, years-of-experience answers, links, attachments, and every custom response. Never let an LLM infer a numeric years-of-experience answer from a broad skills list.
