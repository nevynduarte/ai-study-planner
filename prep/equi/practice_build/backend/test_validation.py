"""
Input-validation tests for the Equi practice API.

Run from the backend directory:
    pip install pytest httpx fastapi scikit-learn
    pytest test_validation.py -v

These tests exercise the Pydantic / FastAPI boundary layer — they check that
the API returns structured 422 errors (not 500s or silent bad behaviour) for
invalid inputs.  They do NOT call any external service.
"""

import pytest
from fastapi.testclient import TestClient

from main import app

client = TestClient(app, raise_server_exceptions=True)


# ─── /api/ask — question validation ─────────────────────────────────────────

class TestAskQuestionValidation:
    def test_missing_question_field_is_422(self):
        r = client.post("/api/ask", json={})
        assert r.status_code == 422

    def test_empty_string_question_is_422(self):
        r = client.post("/api/ask", json={"question": ""})
        assert r.status_code == 422

    def test_whitespace_only_question_is_422(self):
        r = client.post("/api/ask", json={"question": "   "})
        assert r.status_code == 422

    def test_question_over_2000_chars_is_422(self):
        r = client.post("/api/ask", json={"question": "x" * 2001})
        assert r.status_code == 422

    def test_valid_question_at_max_length_is_200(self):
        r = client.post("/api/ask", json={"question": "x" * 2000})
        assert r.status_code == 200

    def test_question_is_stripped_before_use(self):
        # Whitespace around a real question should be accepted (stripped internally).
        r = client.post("/api/ask", json={"question": "  What is the AUM?  "})
        assert r.status_code == 200
        # The echoed question in the response should be the stripped form.
        assert r.json()["question"] == "What is the AUM?"


# ─── /api/ask — top_k validation ─────────────────────────────────────────────

class TestAskTopKValidation:
    def test_top_k_zero_is_422(self):
        r = client.post("/api/ask", json={"question": "What is the AUM?", "top_k": 0})
        assert r.status_code == 422

    def test_top_k_negative_is_422(self):
        r = client.post("/api/ask", json={"question": "What is the AUM?", "top_k": -1})
        assert r.status_code == 422

    def test_top_k_over_50_is_422(self):
        r = client.post("/api/ask", json={"question": "What is the AUM?", "top_k": 51})
        assert r.status_code == 422

    def test_top_k_float_is_422(self):
        r = client.post("/api/ask", json={"question": "What is the AUM?", "top_k": 2.5})
        assert r.status_code == 422

    def test_top_k_1_is_200(self):
        r = client.post("/api/ask", json={"question": "What is the AUM?", "top_k": 1})
        assert r.status_code == 200

    def test_top_k_50_is_200(self):
        r = client.post("/api/ask", json={"question": "What is the AUM?", "top_k": 50})
        assert r.status_code == 200

    def test_top_k_defaults_to_3(self):
        r = client.post("/api/ask", json={"question": "What is the AUM?"})
        assert r.status_code == 200
        # Response should have at most 3 citations (top_k default).
        assert len(r.json()["citations"]) <= 3


# ─── /api/ask — fund_name validation ─────────────────────────────────────────

class TestAskFundNameValidation:
    def test_fund_name_over_200_chars_is_422(self):
        r = client.post("/api/ask", json={"question": "What is the AUM?", "fund_name": "x" * 201})
        assert r.status_code == 422

    def test_fund_name_none_is_200(self):
        r = client.post("/api/ask", json={"question": "What is the AUM?", "fund_name": None})
        assert r.status_code == 200

    def test_unknown_fund_name_returns_empty_citations(self):
        r = client.post("/api/ask", json={"question": "What is the AUM?", "fund_name": "No Such Fund"})
        assert r.status_code == 200
        assert r.json()["citations"] == []


# ─── /api/documents — query param validation ─────────────────────────────────

class TestDocumentsValidation:
    def test_fund_name_query_over_200_chars_is_422(self):
        r = client.get("/api/documents", params={"fund_name": "x" * 201})
        assert r.status_code == 422

    def test_unknown_fund_name_returns_404(self):
        r = client.get("/api/documents", params={"fund_name": "No Such Fund"})
        assert r.status_code == 404

    def test_no_filter_returns_all_documents(self):
        r = client.get("/api/documents")
        assert r.status_code == 200
        assert len(r.json()) > 0


# ─── /api/ask — response contract ────────────────────────────────────────────

class TestAskResponseContract:
    """Verify that a valid request always returns the documented response shape."""

    def test_response_has_required_fields(self):
        r = client.post("/api/ask", json={"question": "What is the AUM?"})
        assert r.status_code == 200
        body = r.json()
        assert "question" in body
        assert "answer" in body
        assert "citations" in body
        assert "note" in body

    def test_citation_fields_are_complete(self):
        r = client.post("/api/ask", json={"question": "What is the AUM?"})
        assert r.status_code == 200
        for c in r.json()["citations"]:
            for key in ("chunk_id", "doc_id", "fund_name", "doc_type", "doc_date", "excerpt", "relevance_score"):
                assert key in c, f"missing key '{key}' in citation"

    def test_relevance_scores_are_in_0_1_range(self):
        r = client.post("/api/ask", json={"question": "What is the AUM?"})
        assert r.status_code == 200
        for c in r.json()["citations"]:
            assert 0.0 <= c["relevance_score"] <= 1.0, f"score {c['relevance_score']} out of range"
