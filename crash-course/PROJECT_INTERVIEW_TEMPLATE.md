# PROJECT_INTERVIEW.md Template

Use one copy of this file in every portfolio project. Complete it in your own words as the system is built. The purpose is to convert implementation experience into interview-ready engineering depth.

---

# 1. 60-second project explanation

## Problem
What real problem does the system solve?

## User
Who uses it and what outcome do they need?

## System
Describe the architecture in plain English without listing tools.

## Result
What measurable improvement or capability did you demonstrate?

---

# 2. Architecture walkthrough

For every major component, complete this table.

| Component | What does it do? | How does it work internally? | Why this choice? | Alternatives considered | Failure mode | 10× scale change | Evidence |
|---|---|---|---|---|---|---|---|
| Example: Kafka | | | | SQS, Redis Streams | | | |

Do not mark a component interview-ready until you can explain every cell without reading it.

---

# 3. Data lifecycle

Explain the entire path from raw input to user-visible output.

1. Where does data originate?
2. How is it validated?
3. Where is the raw form retained?
4. How is it transformed?
5. How are schemas versioned?
6. How are duplicates handled?
7. How are failed records handled?
8. How is lineage captured?
9. How does data reach the model/retrieval/runtime layer?
10. How is the output stored and served?

Draw the path here:

```text
input
  ↓
...
  ↓
user-visible result
```

---

# 4. Model / AI lifecycle

Answer the subset relevant to the project.

- What is the baseline?
- What models/providers were considered?
- Why was the final model selected?
- What evaluation dataset did you use?
- What metrics matter and why?
- How do offline and online metrics differ?
- How do you version models/prompts/configuration?
- How do you detect regressions?
- How do you deploy safely?
- How do you roll back?
- What would trigger retraining/reindexing/prompt changes?

---

# 5. Reliability

Be ready to whiteboard what happens when each dependency fails.

| Failure | User impact | Detection | Automatic response | Manual recovery | Prevention |
|---|---|---|---|---|---|
| Database unavailable | | | | | |
| Cache unavailable | | | | | |
| Queue/broker unavailable | | | | | |
| Worker dies mid-job | | | | | |
| Third-party API 429/5xx | | | | | |
| Invalid input | | | | | |
| Bad deployment | | | | | |

Explain:

- retry policy
- exponential backoff/jitter
- idempotency
- timeouts
- circuit breakers
- DLQ/replay
- health/readiness probes
- rollback strategy

---

# 6. Performance and scale

Know actual numbers.

- current data size:
- current QPS/throughput:
- P50 latency:
- P95 latency:
- P99 latency:
- memory footprint:
- GPU utilization where relevant:
- cost/request or cost/job:
- largest bottleneck:

## 10× scale

What breaks first?

What changes at:

- 10× users?
- 10× records/documents?
- 10× requests/sec?
- 10× model traffic?

Which parts scale horizontally? Which do not?

---

# 7. Security

Explain:

- authentication
- authorization
- tenant/user isolation
- secrets management
- network boundaries
- PII handling
- audit logging
- rate limiting
- dependency/container scanning
- prompt injection/tool abuse where relevant
- SSRF/file-system/code-execution controls where relevant

Name the top three threats and the control for each.

---

# 8. Observability

What can you see when the system misbehaves?

- logs
- metrics
- traces
- dashboards
- alerts
- model/agent evaluation telemetry
- queue depth
- database health
- cost telemetry

Describe one incident from symptom → metric/trace → root cause → fix.

---

# 9. Architecture decisions

Choose at least five ADRs and rehearse them.

For each:

**Context**  
What constraint forced a decision?

**Options**  
What were the credible alternatives?

**Decision**  
What did you choose?

**Why**  
What evidence supported the choice?

**Tradeoff**  
What did you give up?

**Reversal condition**  
What new fact would make you change the decision?

---

# 10. Failure stories

Prepare three concrete stories from this project.

## Failure 1
- What broke?
- How did you notice?
- What was the root cause?
- What did you initially misunderstand?
- What did you change?
- What did you add so it does not recur?

## Failure 2

## Failure 3

---

# 11. Hard interviewer questions

Answer these aloud.

- Why is this not just a demo?
- Why does this require this architecture?
- What did you personally implement?
- Which part was hardest?
- Which decision do you regret?
- What is over-engineered?
- What would you remove for an MVP?
- What would you add for a regulated enterprise?
- Where is the bottleneck?
- How do you know the model/retrieval/agent is actually better?
- What is the most expensive component?
- What is the biggest security risk?
- What happens if a request is processed twice?
- What happens if the database commits but an event publish fails?
- What would change if you had 100 million users/records?
- What would a staff engineer challenge in this design?

---

# 12. Resume bullets

Write three variants only after the benchmarks are real.

## Technical
- Built ...

## Impact
- Improved ... from ... to ... by ...

## Scale/reliability
- Designed ... handling ... with ...

Never put a number here that cannot be reproduced from `BENCHMARKS.md`, logs, or a test.