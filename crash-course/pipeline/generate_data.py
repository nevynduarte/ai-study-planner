"""
Atlas-FoF — L0: Synthetic messy data generator.

Generates a small fund-of-funds universe described by THREE inconsistent
"vendor" feeds plus a set of fund documents. The whole point of this file is
to manufacture *realistic mess* so the L1 integration pipeline has something
real to resolve:

  - the same fund/manager appears under different IDs and name spellings
    across sources (entity resolution problem)
  - dates, AUM units, and strategy taxonomies disagree across sources
    (schema harmonization problem)
  - some sources are missing funds, some carry junk/noise funds, and a few
    rows are simply bad: negative AUM, future vintages, duplicates
    (data-quality problem)

It also writes data/ground_truth.csv — the hidden answer key mapping every
source record back to its canonical fund/manager. Do NOT read that file from
your L1 logic. Use it only to *score* your entity resolution afterward, the
same way a take-home grader would. That scoring loop is the single best Aaru
interview rep in this whole project.

Run:  python pipeline/generate_data.py
Deps: none (Python standard library only — so it runs tonight with no pip).
"""

import csv
import json
import os
import random
from datetime import date, timedelta

SEED = 20260622          # fixed so the universe is reproducible across runs
random.seed(SEED)

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
RAW = os.path.join(ROOT, "data", "raw")
DATA = os.path.join(ROOT, "data")
os.makedirs(RAW, exist_ok=True)

# ──────────────────────────────────────────────────────────────────────────
# CANONICAL TRUTH  (this is what the 3 feeds are noisy observations of)
# ──────────────────────────────────────────────────────────────────────────
# Canonical strategy taxonomy. Each source will re-label these differently,
# which is the harmonization challenge in L1.
CANON_STRATEGIES = [
    "Long/Short Equity",
    "Credit",
    "Global Macro",
    "Private Equity - Buyout",
    "Venture",
    "Real Assets",
]

# Managers. Note the two deliberate near-collisions: "Northgate Capital" vs
# "Northgate Advisors" are DIFFERENT firms. A naive fuzzy matcher will want to
# merge them — your L1 should NOT. That over-merge trap is exactly the kind of
# thing an interviewer pokes at.
MANAGERS = [
    {"mid": "M01", "name": "Brightwater Capital Management", "hq": "New York, NY",     "founded": 2009},
    {"mid": "M02", "name": "Northgate Capital",              "hq": "Greenwich, CT",    "founded": 2004},
    {"mid": "M03", "name": "Northgate Advisors",            "hq": "Boston, MA",        "founded": 2016},
    {"mid": "M04", "name": "Cedar Peak Partners",           "hq": "San Francisco, CA", "founded": 2011},
    {"mid": "M05", "name": "Halcyon Asset Management",      "hq": "New York, NY",      "founded": 2007},
    {"mid": "M06", "name": "Meridian Global Investors",     "hq": "London, UK",        "founded": 2002},
    {"mid": "M07", "name": "Stonehill Ventures",           "hq": "Menlo Park, CA",     "founded": 2014},
    {"mid": "M08", "name": "Aldridge Credit Partners",     "hq": "Chicago, IL",        "founded": 2010},
    {"mid": "M09", "name": "Pinnacle Macro Advisors",      "hq": "New York, NY",       "founded": 2008},
    {"mid": "M10", "name": "Ironwood Real Assets",         "hq": "Houston, TX",        "founded": 2013},
    {"mid": "M11", "name": "Vantage Equity Partners",      "hq": "New York, NY",       "founded": 2006},
    {"mid": "M12", "name": "Solstice Capital Group",       "hq": "Austin, TX",         "founded": 2015},
]

# Funds, each tied to a canonical manager + strategy. share_classes and a
# "true" AUM (in USD millions) so we can perturb units/values per source.
_FUND_SEEDS = [
    ("Credit Opportunities Fund II", "M01", "Credit",                  1850),
    ("Senior Secured Lending Fund",  "M01", "Credit",                  920),
    ("Diversified Holdings Fund",    "M02", "Long/Short Equity",       3100),
    ("Northgate Equity Long/Short",  "M02", "Long/Short Equity",       1450),
    ("Strategic Opportunities Fund", "M03", "Private Equity - Buyout", 2750),
    ("Cedar Peak Growth Fund III",   "M04", "Private Equity - Buyout", 4200),
    ("Cedar Peak Venture Fund I",    "M04", "Venture",                 380),
    ("Halcyon Equity Alpha Fund",    "M05", "Long/Short Equity",       2600),
    ("Halcyon Event Driven Fund",    "M05", "Long/Short Equity",       1100),
    ("Meridian Global Macro Fund",   "M06", "Global Macro",            5400),
    ("Meridian Currency Fund",       "M06", "Global Macro",            760),
    ("Stonehill Venture Fund IV",    "M07", "Venture",                 640),
    ("Stonehill Early Stage Fund",   "M07", "Venture",                 210),
    ("Aldridge Direct Lending Fund", "M08", "Credit",                  1980),
    ("Aldridge Distressed Fund II",  "M08", "Credit",                  1240),
    ("Pinnacle Macro Fund",          "M09", "Global Macro",            3300),
    ("Ironwood Infrastructure Fund", "M10", "Real Assets",             2100),
    ("Ironwood Energy Fund II",      "M10", "Real Assets",             1550),
    ("Vantage Buyout Fund V",        "M11", "Private Equity - Buyout", 6100),
    ("Vantage Growth Equity Fund",   "M11", "Private Equity - Buyout", 2400),
    ("Solstice Long/Short Fund",     "M12", "Long/Short Equity",       880),
    ("Solstice Credit Fund",         "M12", "Credit",                  540),
]

SHARE_CLASSES = ["Class A", "Class I", "Founders"]


def _inception(mid_idx, fund_idx):
    """Deterministic-ish inception date per fund, within a plausible window."""
    base = date(2012, 1, 1)
    offset = (mid_idx * 137 + fund_idx * 53) % (11 * 365)
    return base + timedelta(days=offset)


FUNDS = []
for i, (name, mid, strat, aum) in enumerate(_FUND_SEEDS):
    FUNDS.append({
        "fid": f"F{i+1:03d}",
        "name": name,
        "mid": mid,
        "strategy": strat,
        "aum_musd": aum,                       # canonical AUM, USD millions
        "inception": _inception(int(mid[1:]), i),
        "share_classes": random.sample(SHARE_CLASSES, k=random.choice([1, 2, 2, 3])),
    })

MANAGER_BY_ID = {m["mid"]: m for m in MANAGERS}

# ──────────────────────────────────────────────────────────────────────────
# NOISE HELPERS  (the functions that make each source disagree)
# ──────────────────────────────────────────────────────────────────────────
_ABBR = {
    "Management": "Mgmt", "Capital": "Cap.", "Partners": "Ptnrs",
    "Advisors": "Adv.", "Opportunities": "Opps", "Global": "Glb",
    "Fund": "Fd", "Strategic": "Strat.", "Infrastructure": "Infra",
}
_PREFIX_ABBR = {
    "Brightwater": "BW", "Northgate": "NG", "Cedar Peak": "CP",
    "Halcyon": "HAL", "Meridian": "MER", "Stonehill": "SH",
    "Aldridge": "ALD", "Pinnacle": "PIN", "Ironwood": "IW",
    "Vantage": "VAN", "Solstice": "SOL",
}
_ROMAN = {" II": " 2", " III": " 3", " IV": " 4", " V": " 5", " I": " 1"}


def abbreviate(name):
    out = name
    for k, v in _ABBR.items():
        out = out.replace(k, v)
    return out


def prefix_abbrev(name):
    for k, v in _PREFIX_ABBR.items():
        if name.startswith(k):
            return name.replace(k, v, 1)
    return name


def roman_to_num(name):
    out = name
    for k, v in _ROMAN.items():
        if out.endswith(k):
            out = out[: -len(k)] + v
    return out


def typo(name):
    """Drop one interior character — simulates a fat-finger in a vendor feed."""
    if len(name) < 6:
        return name
    i = random.randint(2, len(name) - 2)
    return name[:i] + name[i + 1:]


def drop_suffix(name):
    for s in (" LLC", " LP", " L.P.", " Inc"):
        if name.endswith(s):
            return name[: -len(s)]
    return name


def fmt_date(d, style):
    if style == "iso":
        return d.isoformat()
    if style == "us":
        return d.strftime("%m/%d/%Y")
    if style == "long":
        return d.strftime("%B %d, %Y").replace(" 0", " ")
    if style == "year":
        return str(d.year)
    return d.isoformat()


# strategy taxonomies per source (same canonical concept, different labels)
ADMIN_STRAT = {
    "Long/Short Equity": "LSE", "Credit": "CR", "Global Macro": "MAC",
    "Private Equity - Buyout": "PE-BO", "Venture": "VC", "Real Assets": "RA",
}
PANEL_STRAT = {
    "Long/Short Equity": "Equity Hedge", "Credit": "Credit",
    "Global Macro": "Global Macro", "Private Equity - Buyout": "Buyout",
    "Venture": "Venture Capital", "Real Assets": "Real Assets",
}

ground_truth = []   # list of dicts -> data/ground_truth.csv


def gt(source, source_id, fid, mid):
    ground_truth.append({
        "source": source, "source_record_id": source_id,
        "canonical_fund_id": fid, "canonical_manager_id": mid,
    })


# ──────────────────────────────────────────────────────────────────────────
# SOURCE 1 — admin_feed.csv  (fund administrator: clean-ish, own ID scheme,
# AUM in $millions, coded strategies, ISO/US dates, monthly return %)
# ──────────────────────────────────────────────────────────────────────────
def build_admin():
    rows = []
    for n, f in enumerate(FUNDS):
        m = MANAGER_BY_ID[f["mid"]]
        admin_id = f"ADM-{1000 + n}"
        # admin keeps mostly legal names but with casing/whitespace noise + LLC
        mgr_name = drop_suffix(m["name"]) + (" LLC" if n % 3 == 0 else "")
        if n % 5 == 0:
            mgr_name = mgr_name.upper()
        for sc in f["share_classes"]:
            rows.append({
                "fund_admin_id": admin_id,
                "fund_legal_name": f["name"],
                "manager_name": mgr_name.strip(),
                "share_class": sc,
                "strategy_code": ADMIN_STRAT[f["strategy"]],
                "aum_musd": round(f["aum_musd"] * random.uniform(0.97, 1.03), 1),
                "mtd_return_pct": round(random.uniform(-3.5, 4.5), 2),
                "as_of_date": fmt_date(date(2026, 5, 31), random.choice(["iso", "us"])),
                "inception_date": fmt_date(f["inception"], "iso"),
            })
        gt("admin", admin_id, f["fid"], f["mid"])
    with open(os.path.join(RAW, "admin_feed.csv"), "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)
    return len(rows)


# ──────────────────────────────────────────────────────────────────────────
# SOURCE 2 — manager_selfreport.json  (manager-submitted: informal names,
# mixed date formats, self-reported AUM as "$X.XB/M" strings, own strategy
# words, occasionally inflated AUM)
# ──────────────────────────────────────────────────────────────────────────
def _aum_string(musd):
    if musd >= 1000:
        return f"${musd/1000:.1f}B"
    return f"${musd:.0f}M"


def build_manager_report():
    records = []
    for n, f in enumerate(FUNDS):
        m = MANAGER_BY_ID[f["mid"]]
        rec_id = f"MR-{n:03d}"
        mgr = m["name"]
        # apply 1-2 messy transforms to the manager name
        if n % 2 == 0:
            mgr = abbreviate(mgr)
        if n % 4 == 0:
            mgr = drop_suffix(mgr).lower()
        if n % 7 == 0:
            mgr = typo(mgr)
        fund = f["name"]
        if n % 3 == 0:
            fund = abbreviate(fund)
        if n % 5 == 0:
            fund = roman_to_num(fund)
        # managers inflate self-reported AUM
        inflated = f["aum_musd"] * random.uniform(1.0, 1.25)
        records.append({
            "record_id": rec_id,
            "manager": mgr,
            "fund": fund,
            "strategy": f["strategy"],            # managers use canonical-ish words
            "inception": fmt_date(f["inception"], random.choice(["us", "long", "year"])),
            "reported_aum": _aum_string(inflated),
            "headquarters": m["hq"],
        })
        gt("manager", rec_id, f["fid"], f["mid"])
    with open(os.path.join(RAW, "manager_selfreport.json"), "w", encoding="utf-8") as fh:
        json.dump(records, fh, indent=2)
    return len(records)


# ──────────────────────────────────────────────────────────────────────────
# SOURCE 3 — panel_thirdparty.csv  (Preqin-style panel: yet another ID,
# heavily abbreviated names, AUM in RAW DOLLARS, own taxonomy, MISSING some
# funds, EXTRA noise funds, plus genuinely BAD rows)
# ──────────────────────────────────────────────────────────────────────────
def build_panel():
    rows = []
    # drop ~15% of real funds (panel coverage gaps)
    covered = [f for f in FUNDS if random.random() > 0.15]
    for n, f in enumerate(covered):
        m = MANAGER_BY_ID[f["mid"]]
        panel_id = f"PNL{50000 + n}"
        fund = prefix_abbrev(roman_to_num(f["name"]))
        mgr = prefix_abbrev(m["name"])
        rows.append({
            "panel_id": panel_id,
            "fund_name": fund,
            "manager_name": mgr,
            "asset_class": PANEL_STRAT[f["strategy"]],
            "aum_usd": int(f["aum_musd"] * 1_000_000 * random.uniform(0.9, 1.1)),
            "vintage_year": f["inception"].year,
            "domicile": random.choice(["Delaware", "Cayman Islands", "Luxembourg"]),
        })
        gt("panel", panel_id, f["fid"], f["mid"])

    # --- inject bad rows (these must be CAUGHT by L1 validation, not joined) ---
    rows.append({  # negative AUM
        "panel_id": "PNL59001", "fund_name": "Vantage Buyout Fd 5",
        "manager_name": "VAN Equity Ptnrs", "asset_class": "Buyout",
        "aum_usd": -250_000_000, "vintage_year": 2018, "domicile": "Delaware",
    })
    rows.append({  # future vintage year
        "panel_id": "PNL59002", "fund_name": "Pinnacle Macro Fd",
        "manager_name": "PIN Macro Adv.", "asset_class": "Global Macro",
        "aum_usd": 3_300_000_000, "vintage_year": 2027, "domicile": "Cayman Islands",
    })
    # --- inject NOISE funds (do not exist in canonical truth — must NOT match) ---
    for j, (fn, mn, ac) in enumerate([
        ("Westfield Opportunistic Fund", "Westfield Capital", "Credit"),
        ("Quantum Systematic Fund", "Quantum Trading LLC", "Global Macro"),
        ("Harborview Real Estate Fund", "Harborview Advisors", "Real Assets"),
    ]):
        rows.append({
            "panel_id": f"PNL5900{3+j}", "fund_name": fn, "manager_name": mn,
            "asset_class": ac, "aum_usd": random.randint(200, 4000) * 1_000_000,
            "vintage_year": random.randint(2012, 2022), "domicile": "Delaware",
        })
    # --- inject a DUPLICATE row (same panel_id repeated) ---
    if covered:
        dup = dict(rows[0])
        rows.append(dup)

    with open(os.path.join(RAW, "panel_thirdparty.csv"), "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)
    return len(rows)


# ──────────────────────────────────────────────────────────────────────────
# DOCUMENTS — fund_documents.json  (for the L2 RAG layer; numbers here are the
# ground truth your numeric-verification guardrail will check answers against)
# ──────────────────────────────────────────────────────────────────────────
def build_documents():
    docs = []
    for f in FUNDS:
        m = MANAGER_BY_ID[f["mid"]]
        q_ret = round(random.uniform(-2.0, 6.5), 1)
        ytd = round(random.uniform(-5.0, 14.0), 1)
        loss_rate = round(random.uniform(0.2, 3.0), 1)
        docs.append({
            "doc_id": f"{f['fid']}-LETTER-2026Q1",
            "fund_id": f["fid"],
            "fund_name": f["name"],
            "manager": m["name"],
            "doc_type": "Quarterly Letter",
            "as_of": "2026-03-31",
            "text": (
                f"{m['name']} — {f['name']} Q1 2026 Investor Letter. "
                f"The fund returned {q_ret}% net of fees for the quarter, bringing "
                f"year-to-date performance to {ytd}%. The {f['strategy']} strategy "
                f"continues to focus on capital preservation. Realized loss rate on "
                f"the portfolio over the trailing twelve months was {loss_rate}%. "
                f"Assets under management stood at approximately ${f['aum_musd']}M "
                f"as of quarter-end."
            ),
        })
        docs.append({
            "doc_id": f"{f['fid']}-DD-MEMO",
            "fund_id": f["fid"],
            "fund_name": f["name"],
            "manager": m["name"],
            "doc_type": "Due Diligence Memo",
            "as_of": "2026-02-15",
            "text": (
                f"Due diligence summary for {f['name']} managed by {m['name']} "
                f"(founded {m['founded']}, {m['hq']}). Strategy: {f['strategy']}. "
                f"Key person risk is concentrated in the founding partner. The fund "
                f"offers {', '.join(f['share_classes'])} share classes. Liquidity terms "
                f"are quarterly with a 90-day notice period. Recommended allocation "
                f"pending operational due diligence sign-off."
            ),
        })
    with open(os.path.join(RAW, "fund_documents.json"), "w", encoding="utf-8") as fh:
        json.dump(docs, fh, indent=2)
    return len(docs)


def write_ground_truth():
    with open(os.path.join(DATA, "ground_truth.csv"), "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=["source", "source_record_id",
                                           "canonical_fund_id", "canonical_manager_id"])
        w.writeheader()
        w.writerows(ground_truth)


if __name__ == "__main__":
    n_admin = build_admin()
    n_mgr = build_manager_report()
    n_panel = build_panel()
    n_docs = build_documents()
    write_ground_truth()
    print("Atlas-FoF L0 — synthetic data generated")
    print(f"  canonical universe : {len(MANAGERS)} managers, {len(FUNDS)} funds")
    print(f"  admin_feed.csv          : {n_admin} rows (share-class granularity)")
    print(f"  manager_selfreport.json : {n_mgr} records")
    print(f"  panel_thirdparty.csv    : {n_panel} rows (incl. bad + noise + dup)")
    print(f"  fund_documents.json     : {n_docs} documents")
    print(f"  ground_truth.csv        : {len(ground_truth)} mappings (answer key — don't peek in L1)")
    print(f"\n  wrote to: {RAW}")
