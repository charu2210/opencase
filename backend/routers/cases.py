"""
Cases router — serves case data from local JSON files.
No database needed: simple JSON files are perfect for a student project.
"""

import json
import os
from fastapi import APIRouter, HTTPException

router = APIRouter()

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")


def load_cases_index():
    path = os.path.join(DATA_DIR, "cases.json")
    with open(path, "r") as f:
        return json.load(f)


def load_case(case_id: str):
    path = os.path.join(DATA_DIR, f"{case_id}.json")
    if not os.path.exists(path):
        return None
    with open(path, "r") as f:
        return json.load(f)


@router.get("/")
def get_all_cases():
    """Return the index of all available cases."""
    return load_cases_index()


@router.get("/{case_id}")
def get_case(case_id: str):
    """Return full detail for a specific case by its ID (e.g. 'mh370')."""
    case = load_case(case_id)
    if case is None:
        raise HTTPException(status_code=404, detail=f"Case '{case_id}' not found")
    return case


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
