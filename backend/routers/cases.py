"""
Cases router — serves case data from local JSON files.
No database needed: simple JSON files are perfect for a student project.
"""

import json
import logging
import os
from fastapi import APIRouter, HTTPException

from validators import validate_investigation_file

router = APIRouter()
logger = logging.getLogger("opencase.cases")

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")


def load_cases_index():
    path = os.path.join(DATA_DIR, "cases.json")
    with open(path, "r") as f:
        return json.load(f)


def load_case_with_outcome(case_id: str):
    """
    Load and validate a single investigation file by case id.

    Returns (data, outcome):
      - data is the parsed dict if valid, otherwise None.
      - outcome is the ValidationOutcome (is_valid flag + descriptive
        errors, including "file not found" for missing files).

    This never raises for missing or malformed files — every caller
    (an API route, the startup scan, a script) decides for itself what
    to do with an invalid result, and the app keeps running either way.
    """
    path = os.path.join(DATA_DIR, f"{case_id}.json")
    outcome = validate_investigation_file(path)

    if not outcome.is_valid:
        logger.warning("Skipping investigation file '%s.json': %s", case_id, outcome.error_message())
        return None, outcome

    with open(path, "r") as f:
        return json.load(f), outcome


def load_case(case_id: str):
    """Convenience wrapper: parsed case dict, or None if missing/invalid."""
    data, _outcome = load_case_with_outcome(case_id)
    return data


def load_all_cases_validated():
    """
    Validate every investigation file referenced in the cases index at
    once. Used at application startup so a single bad file is reported
    and skipped, rather than left to surface later as a crash on first
    request — and so startup never aborts because of one bad file.

    Returns a tuple of (valid_case_ids, error_report) where error_report
    is a dict of case_id -> list of validation error strings.
    """
    valid_case_ids = []
    error_report = {}

    try:
        index = load_cases_index()
    except (OSError, json.JSONDecodeError) as exc:
        logger.error("Could not load cases index (cases.json): %s", exc)
        return valid_case_ids, error_report

    for entry in index:
        if not isinstance(entry, dict):
            logger.error("Skipping malformed entry in cases.json (not an object): %r", entry)
            continue

        case_id = entry.get("id")
        if not case_id:
            logger.error("Skipping entry in cases.json with no 'id' field: %r", entry)
            continue

        path = os.path.join(DATA_DIR, f"{case_id}.json")
        outcome = validate_investigation_file(path)

        if outcome.is_valid:
            valid_case_ids.append(case_id)
        else:
            error_report[case_id] = outcome.errors
            logger.warning("Investigation '%s' failed validation: %s", case_id, outcome.error_message())

    return valid_case_ids, error_report


@router.get("/")
def get_all_cases():
    """Return the index of all available cases."""
    return load_cases_index()


@router.get("/{case_id}")
def get_case(case_id: str):
    """Return full detail for a specific case by its ID (e.g. 'mh370')."""
    data, outcome = load_case_with_outcome(case_id)

    if data is None:
        # "file not found" vs. "found but invalid" get different status
        # codes so API consumers (and the frontend) can tell the two apart.
        if outcome.errors and "file not found" in outcome.errors[0]:
            raise HTTPException(status_code=404, detail=f"Case '{case_id}' not found")
        raise HTTPException(
            status_code=422,
            detail={
                "message": f"Case '{case_id}' exists but failed validation",
                "errors": outcome.errors,
            },
        )

    return data


@router.get("/{case_id}/interpretability")
def get_interpretability(case_id: str):
    """Return the interpretability data for a case (evidence importance + reasoning trace)."""
    case = load_case(case_id)
    if case is None:
        raise HTTPException(status_code=404, detail=f"Case '{case_id}' not found")
    if "interpretability" not in case:
        raise HTTPException(status_code=404, detail="No interpretability data for this case")
    return {
        "case_id": case_id,
        "case_name": case["name"],
        **case["interpretability"]
    }