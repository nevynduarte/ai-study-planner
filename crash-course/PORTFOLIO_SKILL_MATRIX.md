# Portfolio Skill Coverage Matrix

Purpose: ensure the four portfolio systems collectively cover the recurring technical surface area for target roles: AI Engineer, Applied AI Engineer, GenAI/LLM Engineer, Machine Learning Engineer, AI/ML Platform Engineer, Forward-Deployed AI Engineer, and AI-focused SWE.

Legend:

- **P** = primary proof project; interviewer should be able to drill deeply here
- **S** = secondary/repeated use
- **—** = intentionally not a focus

| Skill / concept | Agent Platform | Data Platform | ML Platform | Autonomous SWE |
|---|:---:|:---:|:---:|:---:|
| Python | P | P | P | P |
| Go | P | — | S | S |
| TypeScript / Next.js | P | — | S | S |
| FastAPI | P | P | P | S |
| REST APIs | P | P | P | P |
| SSE / WebSockets | P | — | S | S |
| asyncio / concurrency | P | S | S | P |
| Pydantic / typed schemas | P | S | S | S |
| SQL | P | P | P | S |
| PostgreSQL | P | P | P | P |
| Redis | P | S | S | P |
| Docker | P | P | P | P |
| Kubernetes | S/P | S | P | S/P |
| AWS | P | P | P | S |
| Terraform | P | P | P | S |
| GitHub Actions | P | P | P | P |
| ArgoCD / GitOps | S | S | P | S |
| IAM / secrets | P | S | P | S |
| OIDC / OAuth | P | — | S | S |
| RBAC | P | S | S | S |
| multi-tenancy | P | S | — | — |
| Kafka / event streams | P | P | S | S |
| queues / async workers | P | P | S | P |
| retries / backoff | P | P | P | P |
| idempotency | P | P | P | P |
| DLQ / replay | P | P | S | P |
| circuit breakers | P | S | S | S |
| rate limiting | P | S | S | S |
| caching | P | S | S | S |
| OpenTelemetry | P | S | P | P |
| Prometheus / Grafana | P | S | P | S |
| load testing | P | P | P | P |
| SLOs / alerts | P | P | P | P |
| incident / postmortem practice | P | P | P | P |
| LLM APIs | P | — | S | P |
| structured outputs | P | — | S | P |
| tool calling | P | — | S | P |
| agents | P | — | S | P |
| LangGraph | P | — | — | S |
| custom agent orchestration | P | — | — | P |
| MCP | P | — | S | P |
| RAG | P | P | S | P/S |
| embeddings | P | P | S | P |
| BM25 | S | P | — | P |
| hybrid retrieval | P | P | — | P |
| reranking | P | P | — | S |
| memory / context management | P | — | S | P |
| prompt injection / tool abuse | P | — | — | P |
| LLM evaluation | P | — | S | P |
| model routing | P | — | S | P |
| semantic caching | P | — | — | S |
| PyTorch | S | S | P | S |
| scikit-learn | — | — | P | — |
| XGBoost | — | — | P | — |
| LightGBM | — | — | P | — |
| MLflow | — | — | P | — |
| experiment tracking | S | S | P | S |
| model registry | — | — | P | — |
| feature pipelines | — | S | P | — |
| training / serving skew | — | — | P | — |
| drift detection | — | S | P | — |
| retraining | — | — | P | — |
| model validation gates | S | — | P | S |
| batch inference | — | S | P | — |
| online inference | S | — | P | S |
| Spark / PySpark | — | P | S | — |
| Structured Streaming | — | P | S | — |
| Delta Lake | — | P | S | — |
| Databricks workflow concepts | — | P | S | — |
| dbt | — | P | S | — |
| Airflow / Dagster | — | P | S | — |
| Great Expectations / Pandera | — | P | S | — |
| medallion architecture | — | P | S | — |
| schema evolution | S | P | S | S |
| watermarks / late data | — | P | S | — |
| lineage | S | P | P | S |
| OpenSearch | S | P | — | S |
| pgvector | P | P | — | S |
| vLLM | S | — | P | S |
| Triton | — | — | P | — |
| ONNX Runtime | — | — | P | — |
| TensorRT | — | — | P | — |
| quantization | — | — | P | S |
| dynamic batching | — | — | P | S |
| GPU utilization / VRAM profiling | — | — | P | — |
| transformer internals | S | — | P | S |
| RoPE | — | — | P | — |
| RMSNorm | — | — | P | — |
| GQA | — | — | P | — |
| KV cache | S | — | P | S |
| LoRA / QLoRA | — | — | P | — |
| GitHub API / webhooks | — | — | S | P |
| tree-sitter / AST | — | — | — | P |
| LSP | — | — | — | P |
| code indexing | — | S | — | P |
| sandboxed execution | S | — | S | P |
| static analysis | — | — | — | P |
| vulnerability scanning | S | S | S | P |
| SWE-bench-style evaluation | — | — | — | P |
| human approval gates | P | — | S | P |
| ADRs / tradeoff analysis | P | P | P | P |
| cost modeling | P | P | P | P |
| security / threat modeling | P | P | P | P |

---

# Coverage requirements

A skill is not considered covered because it appears in an architecture diagram or dependency list.

To mark a **P** skill complete, the project must contain at least three of the following where applicable:

1. a working implementation
2. an automated test
3. a benchmark or measurement
4. an ADR comparing an alternative
5. a failure drill
6. an explanation in `INTERVIEW.md`
7. discussion in `BLOG.md`

For infrastructure/services, production evidence matters more than API familiarity.

For ML/AI techniques, evaluation evidence matters more than library usage.

---

# Gap review after every project

After each three-week project, review this matrix and answer:

- Which target-role skills still have no primary proof?
- Which skills were used superficially but cannot yet be explained?
- Which repeated skills are becoming fluent?
- What tool appeared in job postings but does not belong naturally in any project?
- Is that tool important enough to add, or would adding it be résumé keyword stuffing?

Do not add technology solely to maximize the number of logos in the README. Every dependency must earn its place through a real requirement, benchmark, operational need, or explicit comparison.