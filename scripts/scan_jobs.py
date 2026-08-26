#!/usr/bin/env python3
"""Scrape job postings and score them against the curriculum.

Folded in from the bracketlens prototype (archived 2026-08). Two things changed
in the port:

  1. The skills list is no longer a hardcoded array. It is derived from
     `public/curriculum.json` — the same single source of truth the briefing,
     the plan, and the coverage matrix already read. Edit the curriculum and the
     job scoring follows automatically.
  2. Postings are scored, not just collected. A posting's rank combines how much
     of the tracked skill set it matches with how its comp band compares to the
     student's target, so the 6am briefing can surface a shortlist rather than a
     dump.

Emits JSON on stdout; `scripts/scan-jobs.sh` writes it to D1.

    python3 scripts/scan_jobs.py --limit 40 > postings.json
    python3 scripts/scan_jobs.py --dry-run          # no network, shows config
"""
from __future__ import annotations

import argparse
import hashlib
import json
import pathlib
import re
import sys
from datetime import datetime, timezone

ROOT = pathlib.Path(__file__).resolve().parents[1]
CURRICULUM = ROOT / "public" / "curriculum.json"

# Boards jobspy supports that are worth the request budget. bayt/bdjobs were in
# the prototype's list but return nothing useful for US MLE roles.
SITES = ["indeed", "linkedin", "glassdoor", "zip_recruiter", "google"]


def load_curriculum() -> dict:
    return json.loads(CURRICULUM.read_text(encoding="utf-8"))


# Tracks whose "skills" are job-search ACTIVITIES, not things an employer asks
# for. `search` holds "Canonical resume", "Negotiation on data", "GitHub
# legibility" — none can ever appear in a posting, so including them only
# inflates the denominator and pushes every skill_score toward zero.
NON_MATCHABLE_TRACKS = {"search"}


def tracked_skills(curr: dict) -> list[str]:
    """Skills across the active tracks that could plausibly appear in a posting.

    `archive` is deliberately excluded — it holds the parked v1 curriculum and
    would drag scoring back toward the plan v2 replaced."""
    out: list[str] = []
    for name, track in (curr.get("tracks") or {}).items():
        if name in NON_MATCHABLE_TRACKS:
            continue
        out.extend(track.get("skills") or [])
    # Interview/practice topics are legitimate signal too.
    for item in (curr.get("practice") or []):
        if isinstance(item, dict) and item.get("name"):
            out.append(item["name"])
    seen, uniq = set(), []
    for s in out:
        k = s.strip().lower()
        if k and k not in seen:
            seen.add(k)
            uniq.append(s.strip())
    return uniq


# Curriculum skills are written as interview-prep concepts, not posting
# vocabulary: a job ad says "dynamic programming", never "1D dynamic
# programming"; it says "sharding", not "Scale (sharding, replication, p99)".
# These strip the study-plan framing so the phrase underneath can match.
_LEADING_QUALIFIER = re.compile(r"^\d+d\s+")          # "1D dynamic programming"
_SPLIT = re.compile(r"[&/,()]|\band\b|\bvs\b")


def skill_terms(skill: str) -> list[str]:
    """Searchable terms for one curriculum skill, longest first.

    'Heap / priority queue' -> ['heap / priority queue', 'priority queue', 'heap']
    '1D dynamic programming' -> ['dynamic programming']
    'Scale (sharding, replication, p99)' -> the full phrase, plus 'sharding',
    'replication', 'p99' ('scale' alone is a stop term — too generic to be evidence)

    Matching any one term counts the skill once; the full phrase is tried first
    so a precise match wins before a loose fragment does."""
    s = _LEADING_QUALIFIER.sub("", skill.lower().strip())
    parts = [p.strip() for p in _SPLIT.split(s) if p.strip()]
    terms = [s] + sorted((p for p in parts if p != s and len(p) > 2), key=len, reverse=True)
    # Drop bare fragments too generic to be evidence of anything.
    return [t for t in terms if t not in _STOP_TERMS]


# Fragments that would match almost any posting and tell us nothing.
_STOP_TERMS = {"design", "eval", "scale", "stack", "graphs", "python stdlib fluency",
               "metric definition", "data", "mechanics", "variants", "failure modes"}


def match_skills(description: str, skills: list[str]) -> list[str]:
    if not description:
        return []
    d = description.lower()
    hits = []
    for skill in skills:
        for term in skill_terms(skill):
            # Word-boundary match so 'r' or 'go' don't match inside other words.
            if re.search(rf"(?<!\w){re.escape(term)}(?!\w)", d):
                hits.append(skill)
                break
    return hits


def comp_score(lo, hi, target_lo: int, target_hi: int) -> float:
    """1.0 when the posting's band reaches the target, scaled below, never >1.

    Uses the posting's UPPER bound: a range topping out at target is a real
    candidate even if it starts lower."""
    top = hi or lo
    if not top:
        return 0.0            # unknown comp is not a negative signal, just absent
    if top >= target_hi:
        return 1.0
    if top <= target_lo * 0.5:
        return 0.0
    return round(min(1.0, (top - target_lo * 0.5) / (target_hi - target_lo * 0.5)), 4)


def target_band(curr: dict) -> tuple[int, int]:
    student = curr.get("student") or {}
    raw = str(student.get("target_tc") or student.get("target") or "")
    nums = [int(n) for n in re.findall(r"(\d{2,3})\s*K", raw, flags=re.I)]
    if len(nums) >= 2:
        return nums[0] * 1000, nums[1] * 1000
    return 200_000, 300_000    # v2 plan default


def score_posting(row: dict, skills: list[str], band: tuple[int, int]) -> dict:
    matched = match_skills(row.get("description") or "", skills)
    sk = round(len(matched) / len(skills), 4) if skills else 0.0
    cs = comp_score(row.get("salary_min"), row.get("salary_max"), *band)
    # Skills weighted above comp: the point of the shortlist is "does this match
    # what I am actually building", not "what pays most".
    combined = round(0.7 * sk + 0.3 * cs, 4)
    return {"skills": matched, "skill_score": sk, "comp_score": cs, "score": combined}


def external_id(url: str) -> str:
    return hashlib.sha256((url or "").encode()).hexdigest()[:16]


def scrape(terms: list[str], location: str, limit: int, hours_old: int) -> list[dict]:
    try:
        from jobspy import scrape_jobs
    except ImportError:
        print("jobspy not installed — pip install python-jobspy", file=sys.stderr)
        return []

    rows: list[dict] = []
    for term in terms:
        try:
            df = scrape_jobs(site_name=SITES, search_term=term, location=location,
                             results_wanted=limit, hours_old=hours_old,
                             country_indeed="USA", enforce_annual_salary=True)
        except Exception as exc:                      # noqa: BLE001
            print(f"[scan-jobs] '{term}' failed: {str(exc)[:120]}", file=sys.stderr)
            continue
        if df is None or df.empty:
            continue
        for rec in df.to_dict("records"):
            url = rec.get("job_url") or ""
            if not url:
                continue
            rows.append({
                "external_id": external_id(url),
                "title": rec.get("title") or "",
                "company": rec.get("company"),
                "location": rec.get("location"),
                "job_url": url,
                "source": rec.get("site"),
                "salary_min": _int(rec.get("min_amount")),
                "salary_max": _int(rec.get("max_amount")),
                "date_posted": str(rec.get("date_posted") or "") or None,
                "description": rec.get("description") or "",
            })
    # Same job appears on several boards; keep one row per URL hash.
    dedup: dict[str, dict] = {}
    for r in rows:
        dedup.setdefault(r["external_id"], r)
    return list(dedup.values())


def _int(v):
    try:
        return int(float(v))
    except (TypeError, ValueError):
        return None


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=25, help="results per search term")
    ap.add_argument("--hours-old", type=int, default=72)
    ap.add_argument("--location", default="USA")
    ap.add_argument("--terms", default="machine learning engineer,ML engineer,applied scientist")
    ap.add_argument("--dry-run", action="store_true", help="no network; print config and exit")
    a = ap.parse_args()

    curr = load_curriculum()
    skills = tracked_skills(curr)
    band = target_band(curr)
    terms = [t.strip() for t in a.terms.split(",") if t.strip()]

    if a.dry_run:
        json.dump({"dry_run": True, "terms": terms, "sites": SITES,
                   "tracked_skills": len(skills), "sample_skills": skills[:8],
                   "target_band": band}, sys.stdout, indent=2)
        print()
        return 0

    rows = scrape(terms, a.location, a.limit, a.hours_old)
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    out = []
    for r in rows:
        r.update(score_posting(r, skills, band))
        r.pop("description", None)       # never stored; only used for matching
        r["first_seen"] = r["last_seen"] = now
        out.append(r)
    out.sort(key=lambda x: x["score"], reverse=True)

    json.dump({"scraped_at": now, "n": len(out),
               "tracked_skills": len(skills), "target_band": band,
               "postings": out}, sys.stdout, indent=2)
    print()
    print(f"[scan-jobs] {len(out)} unique postings, "
          f"{sum(1 for p in out if p['score'] >= 0.15)} above the shortlist bar",
          file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
