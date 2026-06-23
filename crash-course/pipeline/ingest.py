"""
Atlas-FoF — L1, Day 1: INGEST + INSPECT + QUALITY LOG.

Goal for today (~2 hours of build):
  1. Load all three raw vendor feeds into pandas.
  2. Inspect each one — shape, dtypes, nulls, duplicates, and eyeball the mess.
  3. Start the data-quality log: one entry per issue you find. This log is the
     single most-graded artifact in a data-integration take-home — you never
     fix an issue silently, you record it.

You only FILL IN THE BLANKS marked `# TODO`. The admin feed is done for you as a
worked example — copy its shape for the other two feeds and the two finders.

Run:  python pipeline/ingest.py
Dep:  pip install -r requirements.txt   (just pandas for today)
"""

import json
import os
import pandas as pd

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(os.path.dirname(HERE), "data", "raw")


# ── loaders ─────────────────────────────────────────────────────────────────
def load_admin():
    return pd.read_csv(os.path.join(RAW, "admin_feed.csv"))


def load_manager():
    with open(os.path.join(RAW, "manager_selfreport.json"), encoding="utf-8") as f:
        return pd.DataFrame(json.load(f))


def load_panel():
    return pd.read_csv(os.path.join(RAW, "panel_thirdparty.csv"))


# ── inspection (worked example — reuse this on every feed) ───────────────────
def inspect(df, name):
    print(f"\n{'='*64}\n{name}  -  {df.shape[0]} rows x {df.shape[1]} cols\n{'='*64}")
    print("dtypes:\n" + df.dtypes.to_string())
    print("\nnulls per column:\n" + df.isna().sum().to_string())
    print(f"\nfully-duplicated rows: {df.duplicated().sum()}")
    print("\nhead:\n" + df.head(3).to_string())


# ── data-quality log (the graded artifact) ───────────────────────────────────
quality_log = []


def log_issue(source, record_ref, field, issue, severity, action):
    """Record one issue. severity in {'low','medium','high'}. Never fix silently."""
    quality_log.append(dict(source=source, record_ref=record_ref, field=field,
                            issue=issue, severity=severity, action=action))


def print_quality_log():
    if not quality_log:
        print("\n(no issues logged yet — implement the TODO finders below)")
        return
    print(f"\n{'='*64}\nDATA QUALITY LOG  -  {len(quality_log)} issue(s)\n{'='*64}")
    print(pd.DataFrame(quality_log).to_string(index=False))


# ── TODO: the two finders you implement today ────────────────────────────────
def find_panel_issues(panel):
    """
    TODO (core rep). The generator deliberately injected bad rows into the panel
    feed. Find each with pandas and log_issue(...) — do NOT drop them yet.

      - negative aum_usd            hint: panel[panel.aum_usd < 0]
      - future vintage_year (>2026) hint: panel[panel.vintage_year > 2026]
      - duplicate panel_id          hint: panel[panel.duplicated('panel_id', keep=False)]

    For each offending row call:
      log_issue('panel', row.panel_id, '<field>', '<what is wrong>',
                '<severity>', 'quarantine')
    """
    # TODO: implement (3 checks)
    pass


def find_format_issues(admin, manager):
    """
    TODO. Log the schema/consistency problems you'll harmonize on Day 2 — one
    log_issue per observation (severity usually 'medium', action 'normalize-on-silver'):

      - admin.inception_date is ISO, but manager.inception is mixed (US / long / year-only)
      - manager.reported_aum is a STRING like '$2.2B' (not numeric)
      - the three feeds use three different strategy vocabularies
        (admin strategy_code 'CR' vs manager 'Credit' vs panel asset_class 'Credit')
    """
    # TODO: implement (3 observations)
    pass


if __name__ == "__main__":
    admin, manager, panel = load_admin(), load_manager(), load_panel()

    # 1) INSPECT — admin done; TODO: uncomment the other two
    inspect(admin, "admin_feed")
    # inspect(manager, "manager_selfreport")   # TODO
    # inspect(panel,   "panel_thirdparty")     # TODO

    # 2) worked example so you see the log shape
    log_issue("admin", "ADM-1000", "manager_name",
              "manager name appears UPPERCASE on some rows, mixed-case on others",
              "medium", "normalize-on-silver")

    # 3) TODO: implement these two finders above, then watch the log grow
    find_panel_issues(panel)
    find_format_issues(admin, manager)

    print_quality_log()
    print(f"\nDay 1 is done when: all 3 feeds inspected + the quality_log catches the "
          f"injected panel issues AND the format issues.\nRight now: {len(quality_log)} logged.")
