"""Regression tests for generate_data utility functions."""
import sys
import os

# Ensure the pipeline package is on the path when pytest is run from the repo root.
sys.path.insert(0, os.path.dirname(__file__))

import generate_data as gd  # noqa: E402


class TestAumString:
    """Tests for _aum_string — the AUM formatter used in manager_selfreport.json."""

    # ── regression: boundary bug ────────────────────────────────────────────
    def test_rounds_up_to_billion_not_million(self):
        # Values in [999.5, 1000) round to 1000 under :.0f.
        # The old code used f"${musd:.0f}M" and produced the invalid "$1000M".
        for v in (999.5, 999.7, 999.9, 999.99):
            result = gd._aum_string(v)
            assert result != "$1000M", (
                f"_aum_string({v}) returned '$1000M' — should be a B-denomination"
            )
            assert result == "$1.0B", f"Expected '$1.0B', got '{result}' for {v}"

    # ── values clearly in the M range ───────────────────────────────────────
    def test_small_values_format_as_millions(self):
        assert gd._aum_string(210.0) == "$210M"
        assert gd._aum_string(380.0) == "$380M"
        assert gd._aum_string(500.0) == "$500M"
        assert gd._aum_string(760.0) == "$760M"
        assert gd._aum_string(880.0) == "$880M"
        assert gd._aum_string(920.0) == "$920M"
        assert gd._aum_string(999.4) == "$999M"

    # ── values clearly in the B range ───────────────────────────────────────
    def test_large_values_format_as_billions(self):
        assert gd._aum_string(1000.0) == "$1.0B"
        assert gd._aum_string(5400.0) == "$5.4B"

    # ── suffix consistency for all canonical AUM seeds ──────────────────────
    def test_canonical_aum_seeds_have_correct_suffix(self):
        canonical = [
            1850, 920, 3100, 1450, 2750, 4200, 380, 2600, 1100,
            5400, 760, 640, 210, 1980, 1240, 3300, 2100, 1550,
            6100, 2400, 880, 540,
        ]
        for v in canonical:
            result = gd._aum_string(v)
            if v >= 1000:
                assert result.endswith("B"), f"_aum_string({v}) → '{result}', expected B suffix"
            else:
                assert result.endswith("M"), f"_aum_string({v}) → '{result}', expected M suffix"
            if result.endswith("M"):
                numeric = int(result[1:-1])  # strip "$" and "M"
                assert numeric < 1000, (
                    f"_aum_string({v}) → '{result}': M-suffix value must be < 1000 "
                    f"(got {numeric}), which means the rounding-past-threshold bug is present"
                )
