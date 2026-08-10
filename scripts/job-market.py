#!/usr/bin/env python3
"""
Weekly job-market skill-demand scan.

Scrapes live postings for the target roles (same JobSpy engine as
bracketlens), measures how often concrete skills appear in descriptions,
and prints a Markdown report to stdout. job-market.sh stores the report
in D1 `job_market`, and lib.sh's build_context feeds it into every
Claude prompt — so the briefing/plan/advisory are grounded in what the
market is actually asking for, including skills the curriculum doesn't
cover yet.

Setup (once): pip install "python-jobspy>=1.1.82"
"""

import json
import re
import sys
from collections import Counter
from pathlib import Path

try:
    from jobspy import scrape_jobs
    import pandas as pd
except ImportError:
    sys.stderr.write("job-market: pip install 'python-jobspy>=1.1.82' first\n")
    sys.exit(1)

PROJECT = Path(__file__).resolve().parent.parent

SEARCH_TERMS = [
    "Machine Learning Engineer",
    "AI Engineer",
    "Applied AI Engineer",
    "Data Scientist",
    "Alternative Data Analyst",
    "Quantitative Researcher",
]

SITES = ["indeed", "linkedin", "glassdoor", "zip_recruiter", "google"]
RESULTS_PER_TERM = 25
HOURS_OLD = 24 * 7  # weekly cadence → last week's postings

# Concrete, greppable skills. Tuples are (canonical name, [aliases]).
SKILL_LEXICON = [
    ("Python", ["python"]), ("SQL", ["sql"]), ("C++", [r"c\+\+"]),
    ("Java", ["java"]), ("Scala", ["scala"]),
    # bare "r" is too noisy — require a disambiguating context
    ("R", ["r programming", "r language", "python, r", "r, python", "r/python", "python/r", "sql, r", "r studio", "rstudio"]),
    ("PyTorch", ["pytorch", "torch"]), ("TensorFlow", ["tensorflow"]),
    ("scikit-learn", ["scikit-learn", "sklearn"]),
    ("Pandas", ["pandas"]), ("NumPy", ["numpy"]), ("Spark", ["spark", "pyspark"]),
    ("Kafka", ["kafka"]), ("Airflow", ["airflow"]), ("dbt", ["dbt"]),
    ("Snowflake", ["snowflake"]), ("Databricks", ["databricks"]),
    ("AWS", ["aws", "amazon web services"]), ("GCP", ["gcp", "google cloud"]),
    ("Azure", ["azure"]), ("Docker", ["docker"]), ("Kubernetes", ["kubernetes", "k8s"]),
    ("Terraform", ["terraform"]), ("CI/CD", [r"ci/cd", "cicd"]),
    ("LLMs", ["llm", "llms", "large language model"]),
    ("RAG", ["rag", "retrieval-augmented", "retrieval augmented"]),
    ("Fine-tuning", ["fine-tuning", "fine tuning", "finetuning"]),
    ("Prompt engineering", ["prompt engineering"]),
    ("Agents / agentic", ["agentic", "ai agent", "ai agents", "multi-agent"]),
    ("LangChain", ["langchain"]), ("Vector DBs", ["vector database", "vector db", "pinecone", "weaviate", "pgvector", "faiss"]),
    ("Embeddings", ["embedding", "embeddings"]),
    ("Transformers", ["transformer", "transformers", "hugging face", "huggingface"]),
    ("MLOps", ["mlops", "ml ops"]), ("Model serving", ["model serving", "inference serving", "vllm", "triton"]),
    ("Evals / evaluation", ["llm eval", "model evaluation", "eval framework", "evals"]),
    ("A/B testing", ["a/b test", "ab test", "experimentation"]),
    ("Statistics", ["statistics", "statistical"]), ("Causal inference", ["causal inference"]),
    ("Time series", ["time series", "time-series"]), ("Forecasting", ["forecasting"]),
    ("NLP", ["nlp", "natural language processing"]),
    ("Computer vision", ["computer vision"]),
    ("Deep learning", ["deep learning"]),
    ("Recommendation systems", ["recommendation system", "recommender"]),
    ("Feature engineering", ["feature engineering"]),
    ("Data pipelines / ETL", ["etl", "data pipeline", "data pipelines"]),
    ("Distributed systems", ["distributed systems", "distributed computing"]),
    ("System design", ["system design"]),
    ("Alt data", ["alternative data", "alt data", "alt-data"]),
    ("Quant research", ["quantitative research", "quant research", "alpha", "backtesting", "backtest"]),
    ("Excel", ["excel"]), ("Tableau", ["tableau"]), ("Power BI", ["power bi"]),
    ("Git", ["git"]), ("Linux", ["linux"]),
    ("REST APIs", ["rest api", "restful"]), ("FastAPI", ["fastapi"]),
    ("Ray", ["ray"]), ("CUDA / GPUs", ["cuda", "gpu", "gpus"]),
    ("RLHF / RL", ["rlhf", "reinforcement learning"]),
]


def compile_lexicon():
    out = []
    for name, aliases in SKILL_LEXICON:
        pats = aliases or [re.escape(name.lower())]
        rx = re.compile(r"\b(?:" + "|".join(pats) + r")\b")
        out.append((name, rx))
    return out


def curriculum_skill_words():
    """Lowercased word-set of every skill phrase in the curriculum, used to
    flag in-demand skills the curriculum doesn't mention."""
    words = set()
    try:
        cur = json.loads((PROJECT / "public" / "curriculum.json").read_text(encoding="utf-8"))
        for t in (cur.get("tracks") or {}).values():
            for s in t.get("skills", []):
                words.update(re.findall(r"[a-z0-9+/#.-]+", s.lower()))
    except Exception as e:
        sys.stderr.write(f"job-market: could not read curriculum.json ({e})\n")
    return words


def scrape_all():
    frames = []
    for term in SEARCH_TERMS:
        try:
            df = scrape_jobs(
                site_name=SITES, search_term=term, location="USA",
                results_wanted=RESULTS_PER_TERM, hours_old=HOURS_OLD,
                country_indeed="USA", enforce_annual_salary=True,
            )
            if df is not None and not df.empty:
                df["search_term"] = term
                frames.append(df)
            sys.stderr.write(f"job-market: {term}: {0 if df is None else len(df)} postings\n")
        except Exception as e:
            sys.stderr.write(f"job-market: {term} failed: {e}\n")
    if not frames:
        return pd.DataFrame()
    all_df = pd.concat(frames, ignore_index=True)
    return all_df.drop_duplicates(subset=["job_url"])


def main():
    jobs = scrape_all()
    if jobs.empty:
        sys.stderr.write("job-market: no postings scraped, nothing to report\n")
        sys.exit(2)

    lexicon = compile_lexicon()
    cur_words = curriculum_skill_words()

    with_desc = jobs[jobs["description"].notna() & (jobs["description"].astype(str).str.len() > 100)]
    n = len(with_desc)
    counts = Counter()
    by_term = {}
    for _, row in with_desc.iterrows():
        text = str(row["description"]).lower()
        term = row.get("search_term", "?")
        hits = [name for name, rx in lexicon if rx.search(text)]
        counts.update(hits)
        by_term.setdefault(term, Counter()).update(hits)

    sal = pd.to_numeric(jobs.get("min_amount"), errors="coerce").dropna()
    sal = sal[(sal > 40_000) & (sal < 1_500_000)]

    top = counts.most_common(25)
    gaps = [
        (name, c) for name, c in counts.most_common()
        if c / n >= 0.10
        and not (set(re.findall(r"[a-z0-9+/#.-]+", name.lower())) & cur_words)
    ][:10]

    lines = []
    lines.append(f"Scanned {len(jobs)} unique postings ({n} with full descriptions) from the last 7 days across {', '.join(SITES)}.")
    lines.append(f"Search terms: {', '.join(SEARCH_TERMS)}.")
    if len(sal):
        lines.append(f"Salary floor (where listed, n={len(sal)}): median ${int(sal.median()):,}, p75 ${int(sal.quantile(0.75)):,}.")
    lines.append("")
    lines.append("**Skill demand (% of postings mentioning it):**")
    for name, c in top:
        lines.append(f"- {name}: {100 * c // n}% ({c})")
    lines.append("")
    lines.append("**Per-role top asks:**")
    for term, tc in by_term.items():
        tn = sum(1 for _, r in with_desc.iterrows() if r.get("search_term") == term) or 1
        tops = ", ".join(f"{k} ({100 * v // tn}%)" for k, v in tc.most_common(8))
        lines.append(f"- {term}: {tops}")
    lines.append("")
    if gaps:
        lines.append("**In demand but not named in the curriculum (≥10% of postings):**")
        for name, c in gaps:
            lines.append(f"- {name}: {100 * c // n}%")
    else:
        lines.append("**No high-demand skills missing from the curriculum this week.**")

    print("\n".join(lines))


if __name__ == "__main__":
    main()
