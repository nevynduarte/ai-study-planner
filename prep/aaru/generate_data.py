"""
Generates two synthetic, deliberately messy datasets that mirror the kind of
multi-source entity resolution / schema harmonization exercise Aaru would
plausibly give a Data Integration candidate: a "panel" data source (e.g. a
demographic panel vendor) and a "survey response" data source covering an
overlapping population, with the kinds of real-world messiness Dan Kenefick
(Woodline) and similar interviewers grade on: inconsistent entity naming,
mixed date formats, duplicate records, missing fields, and unit mismatches.

Run: python3 generate_data.py
Produces: panel_data.csv, survey_data.csv
"""
import pandas as pd
import numpy as np
import random

random.seed(42)
np.random.seed(42)

# ---- Canonical "true" population: 60 synthetic individuals ----
first_names = ["James","Maria","Robert","Linda","Michael","Patricia","David","Barbara",
               "Richard","Susan","Joseph","Jessica","Thomas","Karen","Charles","Nancy",
               "Daniel","Lisa","Matthew","Betty","Mark","Sandra","Paul","Ashley","Steven"]
last_names = ["Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis",
              "Rodriguez","Martinez","Hernandez","Lopez","Gonzalez","Wilson","Anderson",
              "Thomas","Taylor","Moore","Jackson","Martin"]
cities = [("New York","NY",10001),("Brooklyn","NY",11201),("Newark","NJ",7102),
          ("Jersey City","NJ",7302),("Hoboken","NJ",7030),("Yonkers","NY",10701)]

N = 60
people = []
for i in range(N):
    fn = random.choice(first_names)
    ln = random.choice(last_names)
    city, state, zipc = random.choice(cities)
    age = random.randint(22, 68)
    income_band = random.choice(["<35k","35-65k","65-100k","100-150k","150k+"])
    people.append({
        "true_id": i,
        "first": fn, "last": ln, "city": city, "state": state, "zip": zipc,
        "age": age, "income_band": income_band
    })

# ---- SOURCE A: "Panel" vendor data (their naming/format conventions) ----
panel_rows = []
for person in people:
    # Vendor uses "Last, First" full name format, sometimes with middle initial junk
    name_variants = [
        f"{person['last']}, {person['first']}",
        f"{person['last']}, {person['first'][0]}.",  # occasionally abbreviated
        f"{person['last'].upper()}, {person['first'].upper()}",  # occasionally all caps
    ]
    name = random.choices(name_variants, weights=[0.8, 0.1, 0.1])[0]

    # Panel dates are ISO format YYYY-MM-DD
    join_date = f"2024-{random.randint(1,12):02d}-{random.randint(1,28):02d}"

    # Income reported as a numeric midpoint estimate (not the band) -- unit mismatch vs survey
    income_map = {"<35k": 28000, "35-65k": 50000, "65-100k": 82000,
                  "100-150k": 125000, "150k+": 210000}
    est_income = income_map[person["income_band"]] * np.random.normal(1.0, 0.08)

    panel_rows.append({
        "panelist_name": name,
        "panelist_zip": person["zip"],
        "panelist_age": person["age"],
        "est_annual_income_usd": round(est_income, -2),
        "panel_join_date": join_date,
        "source_system": "PanelVendorX"
    })

    # Inject ~12% duplicate panelist records (re-enrolled, slightly different format)
    if random.random() < 0.12:
        dup_name = f"{person['last']}, {person['first']}"
        panel_rows.append({
            "panelist_name": dup_name,
            "panelist_zip": person["zip"],
            "panelist_age": person["age"] + random.choice([0, 1]),  # birthday drift
            "est_annual_income_usd": round(est_income * np.random.normal(1.0, 0.03), -2),
            "panel_join_date": f"2024-{random.randint(1,12):02d}-{random.randint(1,28):02d}",
            "source_system": "PanelVendorX"
        })

panel_df = pd.DataFrame(panel_rows)
# Inject a handful of missing zips (vendor data gaps)
missing_idx = panel_df.sample(frac=0.05, random_state=1).index
panel_df.loc[missing_idx, "panelist_zip"] = np.nan
panel_df.to_csv("panel_data.csv", index=False)

# ---- SOURCE B: "Survey response" data (different vendor/format conventions) ----
survey_rows = []
for person in people:
    # Survey uses "First Last" format
    name = f"{person['first']} {person['last']}"

    # Survey dates are US format MM/DD/YYYY  <-- the classic mixed-date-format trap
    resp_date = f"{random.randint(1,12)}/{random.randint(1,28)}/2024"

    survey_rows.append({
        "respondent_full_name": name,
        "city": person["city"],
        "state_code": person["state"],
        "age_bracket": (
            "18-29" if person["age"] < 30 else
            "30-44" if person["age"] < 45 else
            "45-59" if person["age"] < 60 else "60+"
        ),
        "household_income_band": person["income_band"],
        "response_date": resp_date,
        "source_system": "SurveyPlatformY"
    })

# Only 80% of the population responded to the survey (deliberate non-overlap)
survey_df = pd.DataFrame(survey_rows).sample(frac=0.82, random_state=7).reset_index(drop=True)

# Inject a few records for people NOT in the panel at all (survey-only respondents)
# to simulate imperfect source overlap, a key data-quality issue to surface.
for i in range(4):
    fn, ln = random.choice(first_names), random.choice(last_names)
    survey_df.loc[len(survey_df)] = {
        "respondent_full_name": f"{fn} {ln}",
        "city": random.choice(cities)[0],
        "state_code": random.choice(["NY","NJ"]),
        "age_bracket": random.choice(["18-29","30-44","45-59","60+"]),
        "household_income_band": random.choice(["<35k","35-65k","65-100k","100-150k","150k+"]),
        "response_date": f"{random.randint(1,12)}/{random.randint(1,28)}/2024",
        "source_system": "SurveyPlatformY"
    }

survey_df.to_csv("survey_data.csv", index=False)

print(f"panel_data.csv: {len(panel_df)} rows")
print(f"survey_data.csv: {len(survey_df)} rows")
print(f"true underlying population: {N} individuals")
print("\nDeliberately injected issues:")
print("  - Mixed date formats (ISO in panel, MM/DD/YYYY in survey)")
print("  - Name format mismatch (Last, First vs First Last) + casing variants")
print("  - ~12% duplicate panel enrollments")
print("  - ~5% missing zip codes in panel data")
print("  - Income reported as numeric estimate (panel) vs. band (survey) -- needs reconciliation")
print("  - Imperfect population overlap: not every panelist responded to survey, and a few survey")
print("    respondents are NOT in the panel at all")
