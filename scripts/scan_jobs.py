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
import html
import json
import pathlib
import random
import re
import sqlite3
import sys
import time
import urllib.request
from datetime import datetime, timedelta, timezone

ROOT = pathlib.Path(__file__).resolve().parents[1]
CURRICULUM = ROOT / "public" / "curriculum.json"
ATS_BOARDS = ROOT / "config" / "ats-boards.txt"
JOBS_DB = ROOT / "data" / "jobs.db"

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


# ─── ATS boards — free public JSON, no scraping, no blocking ─────────────────
# Greenhouse/Lever/Ashby all publish every customer's job board as an open API.
# This is where volume comes from: the five jobspy boards above get throttled at
# scale, while these endpoints are designed to be polled.

# Postings worth storing. Broad on purpose — scoring ranks them; this only
# keeps obviously irrelevant roles (sales, recruiting, legal) out of D1.
AI_TITLE = re.compile(
    r"machine learning|\bml\b|\bai\b|artificial intelligence|applied scientist"
    r"|research (engineer|scientist)|data scientist|\bllm\b|deep learning|\bnlp\b"
    r"|computer vision|inference|model serving|software engineer|data engineer"
    r"|infrastructure|platform engineer|quantitative", re.I)

_COMP = re.compile(r"\$\s*(\d{2,3})(?:[.,](\d{3}))?\s*([kK])?")


def parse_comp(text: str) -> tuple[int | None, int | None]:
    """Pull a salary band out of freeform text ('$165K – $330K', '$150,000')."""
    amounts = []
    for m in _COMP.finditer(text or ""):
        n = int(m.group(1)) * (1000 if (m.group(3) or m.group(2)) else 1)
        if m.group(2) and not m.group(3):
            n = int(m.group(1) + m.group(2))
        if 50_000 <= n <= 1_500_000:
            amounts.append(n)
    if not amounts:
        return None, None
    return min(amounts), max(amounts)


def _get_json(url: str, timeout: int = 20):
    req = urllib.request.Request(url, headers={"User-Agent": "ai-study-planner/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode("utf-8"))


def load_ats_boards(path: pathlib.Path) -> list[tuple[str, str]]:
    boards = []
    if not path.exists():
        return boards
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.split("#", 1)[0].strip()
        if not line:
            continue
        parts = line.split()
        if len(parts) == 2 and parts[0] in ("greenhouse", "lever", "ashby"):
            boards.append((parts[0], parts[1]))
    return boards


def fetch_ats(boards: list[tuple[str, str]], days: int, per_company: int) -> list[dict]:
    """One row per relevant recent posting across all configured boards."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    rows: list[dict] = []
    for ats, slug in boards:
        try:
            if ats == "greenhouse":
                rows.extend(_gh_board(slug, cutoff, per_company))
            elif ats == "lever":
                rows.extend(_lever_board(slug, cutoff, per_company))
            elif ats == "ashby":
                rows.extend(_ashby_board(slug, cutoff, per_company))
        except Exception as exc:                     # noqa: BLE001
            print(f"[scan-jobs] ats {ats}:{slug} failed: {str(exc)[:120]}", file=sys.stderr)
        time.sleep(random.uniform(0.5, 1.5))        # polite even to open APIs
    return rows


def _row(title, company, location, url, source, posted, description, relevant=True):
    lo, hi = parse_comp(description[:6000])
    return {"external_id": external_id(url), "title": title, "company": company,
            "location": location, "job_url": url, "source": source,
            "salary_min": lo, "salary_max": hi,
            "date_posted": posted, "description": description, "relevant": relevant}


def _fresh(posted_iso: str | None, cutoff) -> bool:
    try:
        return datetime.fromisoformat((posted_iso or "")[:10]).replace(tzinfo=timezone.utc) >= cutoff
    except ValueError:
        return True                                  # unknown date is not a reason to skip


def _gh_board(slug: str, cutoff, per_company: int) -> list[dict]:
    # Every listed job is archived (title/metadata only for non-relevant ones —
    # the list endpoint carries no descriptions). Relevant jobs — AI-titled,
    # recent, within the per-company cap — additionally get a detail fetch for
    # the full description so they can be scored for the D1 shortlist.
    data = _get_json(f"https://boards-api.greenhouse.io/v1/boards/{slug}/jobs")
    out, picked = [], 0
    for j in data.get("jobs", []):
        ts = (j.get("first_published") or j.get("updated_at") or "")[:10]
        rel = bool(AI_TITLE.search(j.get("title") or "")) and _fresh(ts, cutoff) and picked < per_company
        desc = ""
        if rel:
            picked += 1
            try:
                detail = _get_json(f"https://boards-api.greenhouse.io/v1/boards/{slug}/jobs/{j['id']}")
                # content arrives HTML-escaped (&lt;p&gt;…) — unescape before stripping tags
                desc = re.sub(r"<[^>]+>", " ", html.unescape(detail.get("content") or ""))
            except Exception:                        # noqa: BLE001
                pass
        out.append(_row(j.get("title") or "", data.get("name") or slug,
                        (j.get("location") or {}).get("name"), j.get("absolute_url") or "",
                        f"ats:{slug}", ts or None, desc, rel))
    return out


def _lever_board(slug: str, cutoff, per_company: int) -> list[dict]:
    # Descriptions come inline, so archiving every listed job costs nothing.
    data = _get_json(f"https://api.lever.co/v0/postings/{slug}?mode=json")
    out, picked = [], 0
    for j in data:
        posted = None
        try:
            posted = datetime.fromtimestamp(int(j.get("createdAt") or 0) / 1000, tz=timezone.utc).strftime("%Y-%m-%d")
        except (ValueError, OSError):
            pass
        rel = bool(AI_TITLE.search(j.get("title") or j.get("text") or "")) and _fresh(posted, cutoff) and picked < per_company
        if rel:
            picked += 1
        cat = j.get("categories") or {}
        out.append(_row(j.get("text") or "", slug, cat.get("location"),
                        j.get("hostedUrl") or "", f"ats:{slug}", posted,
                        j.get("descriptionPlain") or "", rel))
    return out


def _ashby_board(slug: str, cutoff, per_company: int) -> list[dict]:
    data = _get_json(f"https://api.ashbyhq.com/posting-api/job-board/{slug}?includeCompensation=true")
    out, picked = [], 0
    for j in data.get("jobs", []):
        if not j.get("isListed", True):
            continue
        posted = None
        try:
            posted = datetime.fromisoformat(j.get("publishedAt") or "").strftime("%Y-%m-%d")
        except ValueError:
            pass
        rel = bool(AI_TITLE.search(j.get("title") or "")) and _fresh(posted, cutoff) and picked < per_company
        if rel:
            picked += 1
        comp = ((j.get("compensation") or {}).get("compensationTierSummary")) or ""
        out.append(_row(j.get("title") or "", slug, j.get("location"),
                        j.get("jobUrl") or "", f"ats:{slug}", posted,
                        f"{comp}\n{j.get('descriptionPlain') or ''}", rel))
    return out


# ─── Local archive — every scraped posting, full info, one SQLite file ───────
# D1 holds the scored shortlist the app reads; this holds EVERYTHING the scan
# has ever seen (descriptions included) for offline analysis. Query it with:
#   sqlite3 data/jobs.db "SELECT company,title,salary_max FROM postings
#                         WHERE relevant=1 ORDER BY score DESC LIMIT 20"
#   sqlite3 data/jobs.db "SELECT source, SUM(fetched), SUM(new) FROM runs
#                         GROUP BY source ORDER BY 2 DESC"

def archive_rows(rows: list[dict], db_path: pathlib.Path, now: str) -> tuple[int, int]:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(db_path)
    con.execute("PRAGMA journal_mode=WAL")
    con.execute("""CREATE TABLE IF NOT EXISTS postings (
        external_id TEXT PRIMARY KEY, title TEXT, company TEXT, location TEXT,
        job_url TEXT, source TEXT, salary_min INTEGER, salary_max INTEGER,
        date_posted TEXT, description TEXT, relevant INTEGER,
        skills TEXT, skill_score REAL, comp_score REAL, score REAL,
        first_seen TEXT, last_seen TEXT, times_seen INTEGER DEFAULT 1)""")
    con.execute("""CREATE TABLE IF NOT EXISTS runs (
        ts TEXT, source TEXT, fetched INTEGER, relevant INTEGER, new INTEGER)""")
    new = 0
    per_source: dict[str, list[int]] = {}
    for r in rows:
        s = per_source.setdefault(r.get("source") or "?", [0, 0, 0])
        s[0] += 1
        s[1] += 1 if r.get("relevant") else 0
        exists = con.execute("SELECT 1 FROM postings WHERE external_id=?", (r["external_id"],)).fetchone()
        if not exists:
            s[2] += 1
        con.execute(
            """INSERT INTO postings (external_id,title,company,location,job_url,source,
                 salary_min,salary_max,date_posted,description,relevant,
                 skills,skill_score,comp_score,score,first_seen,last_seen)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
               ON CONFLICT(external_id) DO UPDATE SET
                 last_seen=excluded.last_seen, times_seen=times_seen+1,
                 relevant=MAX(relevant, excluded.relevant),
                 salary_min=COALESCE(excluded.salary_min, salary_min),
                 salary_max=COALESCE(excluded.salary_max, salary_max),
                 description=CASE WHEN excluded.description != '' THEN excluded.description ELSE description END,
                 skills=CASE WHEN excluded.skills IS NOT NULL THEN excluded.skills ELSE skills END,
                 skill_score=COALESCE(excluded.skill_score, skill_score),
                 comp_score=COALESCE(excluded.comp_score, comp_score),
                 score=COALESCE(excluded.score, score)""",
            (r["external_id"], r.get("title"), r.get("company"), r.get("location"),
             r.get("job_url"), r.get("source"), r.get("salary_min"), r.get("salary_max"),
             r.get("date_posted"), r.get("description") or "", 1 if r.get("relevant") else 0,
             json.dumps(r["skills"]) if r.get("skills") is not None else None,
             r.get("skill_score"), r.get("comp_score"), r.get("score"), now, now))
    for src, (f, rel, nw) in per_source.items():
        con.execute("INSERT INTO runs (ts,source,fetched,relevant,new) VALUES (?,?,?,?,?)", (now, src, f, rel, nw))
        new += nw
    con.commit()
    con.close()
    return new, len(rows)


def scrape(terms: list[str], location: str, limit: int, hours_old: int) -> list[dict]:
    try:
        from jobspy import scrape_jobs
    except ImportError:
        print("jobspy not installed — pip install python-jobspy", file=sys.stderr)
        return []

    rows: list[dict] = []
    for i, term in enumerate(terms):
        if i:
            time.sleep(random.uniform(15, 45))   # jitter between term sweeps; boards notice bursts
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
    ap.add_argument("--limit", type=int, default=50, help="results per search term")
    ap.add_argument("--hours-old", type=int, default=72)
    ap.add_argument("--location", default="USA")
    ap.add_argument("--terms", default="machine learning engineer,ML engineer,AI engineer,applied scientist,data engineer,applied AI")
    ap.add_argument("--ats-file", default=str(ATS_BOARDS), help="ATS board list; '' disables")
    ap.add_argument("--ats-days", type=int, default=30, help="ATS: score postings newer than this (everything is archived regardless)")
    ap.add_argument("--ats-cap", type=int, default=75, help="ATS: max scored postings per company")
    ap.add_argument("--db", default=str(JOBS_DB), help="SQLite archive of every scraped posting; '' disables")
    ap.add_argument("--dry-run", action="store_true", help="no network; print config and exit")
    a = ap.parse_args()

    curr = load_curriculum()
    skills = tracked_skills(curr)
    band = target_band(curr)
    terms = [t.strip() for t in a.terms.split(",") if t.strip()]
    boards = load_ats_boards(pathlib.Path(a.ats_file)) if a.ats_file else []

    if a.dry_run:
        json.dump({"dry_run": True, "terms": terms, "sites": SITES,
                   "ats_boards": len(boards), "ats_days": a.ats_days,
                   "tracked_skills": len(skills), "sample_skills": skills[:8],
                   "target_band": band}, sys.stdout, indent=2)
        print()
        return 0

    board_rows = [dict(r, relevant=True) for r in scrape(terms, a.location, a.limit, a.hours_old)]
    rows = board_rows + fetch_ats(boards, a.ats_days, a.ats_cap)
    # Boards + ATS can list the same posting under different URLs; the URL-hash
    # dedup in scrape() can't catch that, so postings from ATS keep their own
    # rows — the ATS row wins on score because it carries the full description.
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    # Score only the relevant rows (those are D1/shortlist candidates)…
    for r in rows:
        if r.get("relevant"):
            r.update(score_posting(r, skills, band))

    # …but archive EVERYTHING, descriptions included, to the local SQLite file.
    if a.db:
        try:
            fresh, total = archive_rows(rows, pathlib.Path(a.db), now)
            print(f"[scan-jobs] archived {total} postings to {a.db} ({fresh} never seen before)", file=sys.stderr)
        except Exception as exc:                     # noqa: BLE001 — archive failure must not kill the D1 path
            print(f"[scan-jobs] WARN: archive failed: {str(exc)[:150]}", file=sys.stderr)

    out = []
    for r in rows:
        if not r.get("relevant"):
            continue
        r = dict(r)
        r.pop("description", None)       # never sent to D1; only used for matching
        r.pop("relevant", None)
        r["first_seen"] = r["last_seen"] = now
        out.append(r)
    out.sort(key=lambda x: x["score"], reverse=True)

    json.dump({"scraped_at": now, "n": len(out),
               "tracked_skills": len(skills), "target_band": band,
               "postings": out}, sys.stdout, indent=2)
    print()
    print(f"[scan-jobs] {len(out)} scored postings, "
          f"{sum(1 for p in out if p['score'] >= 0.15)} above the shortlist bar",
          file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
