"""
Tests for the reusable investigation-file validation utility.

Run with:
    cd backend
    pytest tests/test_investigation_validator.py -v
"""

import json
import os
import sys

import pytest

# Make `validators` importable when running pytest from backend/
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from validators import validate_investigation_data, validate_investigation_file


VALID_CASE = {
    "id": "test-case",
    "name": "Test Case",
    "summary": "A one-paragraph summary of the test case.",
    "known_facts": ["Fact one.", "Fact two."],
    "theories": [
        {"id": "t1", "name": "Theory One", "description": "First theory."},
    ],
    "evidence": [
        {"id": "e1", "title": "Evidence One", "description": "First piece of evidence."},
    ],
}


def test_valid_investigation_passes():
    outcome = validate_investigation_data(VALID_CASE, source="test-case.json")
    assert outcome.is_valid
    assert outcome.errors == []
    assert bool(outcome) is True


@pytest.mark.parametrize("missing_field", ["name", "summary", "known_facts", "theories", "evidence"])
def test_missing_required_field_is_reported(missing_field):
    data = {k: v for k, v in VALID_CASE.items() if k != missing_field}
    outcome = validate_investigation_data(data, source="test-case.json")
    assert not outcome.is_valid
    assert any(missing_field in err for err in outcome.errors)


def test_wrong_type_is_reported():
    data = {**VALID_CASE, "known_facts": "not a list"}
    outcome = validate_investigation_data(data, source="test-case.json")
    assert not outcome.is_valid
    assert any("known_facts" in err and "type" in err for err in outcome.errors)


def test_empty_list_is_reported():
    data = {**VALID_CASE, "evidence": []}
    outcome = validate_investigation_data(data, source="test-case.json")
    assert not outcome.is_valid
    assert any("evidence" in err and "empty" in err for err in outcome.errors)


def test_empty_string_is_reported():
    data = {**VALID_CASE, "summary": "   "}
    outcome = validate_investigation_data(data, source="test-case.json")
    assert not outcome.is_valid
    assert any("summary" in err and "empty" in err for err in outcome.errors)


def test_malformed_evidence_item_is_reported():
    data = {**VALID_CASE, "evidence": [{"id": "e1"}]}  # missing title/description
    outcome = validate_investigation_data(data, source="test-case.json")
    assert not outcome.is_valid
    assert any("evidence[0]" in err and "title" in err for err in outcome.errors)
    assert any("evidence[0]" in err and "description" in err for err in outcome.errors)


def test_non_string_known_facts_item_is_reported():
    """known_facts items are rendered directly by the frontend, so a
    non-string item (e.g. an object) must be caught even though the
    list itself is well-formed."""
    data = {**VALID_CASE, "known_facts": ["A real fact.", {"not": "a string"}]}
    outcome = validate_investigation_data(data, source="test-case.json")
    assert not outcome.is_valid
    assert any("known_facts[1]" in err for err in outcome.errors)


def test_empty_string_known_facts_item_is_reported():
    data = {**VALID_CASE, "known_facts": ["A real fact.", "   "]}
    outcome = validate_investigation_data(data, source="test-case.json")
    assert not outcome.is_valid
    assert any("known_facts[1]" in err for err in outcome.errors)


def test_non_dict_input_is_reported():
    outcome = validate_investigation_data(["not", "a", "dict"], source="test-case.json")
    assert not outcome.is_valid
    assert "must be a JSON object" in outcome.errors[0]


def test_multiple_errors_all_reported_at_once():
    outcome = validate_investigation_data({"name": "Only a name"}, source="test-case.json")
    assert not outcome.is_valid
    assert len(outcome.errors) == 4  # summary, known_facts, theories, evidence


def test_missing_file_reported_without_raising(tmp_path):
    missing_path = tmp_path / "does-not-exist.json"
    outcome = validate_investigation_file(missing_path)
    assert not outcome.is_valid
    assert "file not found" in outcome.errors[0]


def test_malformed_json_reported_without_raising(tmp_path):
    bad_file = tmp_path / "broken.json"
    bad_file.write_text("{ not valid json ,,, ")
    outcome = validate_investigation_file(bad_file)
    assert not outcome.is_valid
    assert "malformed JSON" in outcome.errors[0]


def test_valid_file_on_disk_passes(tmp_path):
    good_file = tmp_path / "good.json"
    good_file.write_text(json.dumps(VALID_CASE))
    outcome = validate_investigation_file(good_file)
    assert outcome.is_valid
    assert outcome.errors == []


def test_real_mh370_fixture_passes():
    """The one real investigation file shipped in the repo should validate cleanly."""
    data_path = os.path.join(os.path.dirname(__file__), "..", "data", "mh370.json")
    outcome = validate_investigation_file(data_path)
    assert outcome.is_valid, outcome.errors