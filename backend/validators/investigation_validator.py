"""
Reusable validation utility for OpenCase "investigation" files.

An investigation file is the JSON blob that describes a single case
(e.g. backend/data/mh370.json). Right now these are loaded with a bare
`json.load()` and no structural checks, so a missing field or a typo in
one file can throw an unhandled exception and take down a request — or
worse, get served to the frontend and crash the UI when it dereferences
a field that isn't there.

This module is the fix: given raw JSON data (or a path to a JSON file),
it validates that the required shape is present and returns a structured
result with human-readable errors instead of raising. Callers decide
what to do with an invalid result (log it, skip the file, return a 4xx,
etc.) — this module never crashes the caller and never raises for
"normal" bad input (missing fields, wrong types, bad JSON). It only
raises for programmer errors (e.g. calling it with the wrong argument
types).

Field naming note
-----------------
The original feature request described required fields generically:
    title, description, timeline, suspects, evidence

This repository's actual case schema (see backend/data/mh370.json)
uses different names for the same concepts:

    issue term      actual field      meaning
    ----------      ------------      -------
    title       ->  name              short case name, e.g. "MH370"
    description ->  summary           one-paragraph case summary
    timeline    ->  known_facts       chronological list of known facts
    suspects    ->  theories          list of competing explanations
    evidence    ->  evidence          list of evidence items

REQUIRED_FIELDS below enforces the actual field names so validation
lines up with what routers/cases.py and the frontend already expect
(frontend/src/app/case/[slug]/page.tsx reads caseData.known_facts,
caseData.evidence, caseData.theories, caseData.summary directly, so
these are the fields that actually prevent runtime errors if missing).
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Union

# --------------------------------------------------------------------------
# Schema definition
# --------------------------------------------------------------------------

# Top-level required fields -> expected Python type.
# (issue term in the comment for traceability back to the original ask)
REQUIRED_FIELDS: Dict[str, type] = {
    "name": str,          # issue: "title"
    "summary": str,       # issue: "description"
    "known_facts": list,  # issue: "timeline"
    "theories": list,     # issue: "suspects"
    "evidence": list,     # issue: "evidence"
}

# Fields required inside each item of the "evidence" list.
REQUIRED_EVIDENCE_ITEM_FIELDS = ("id", "title", "description")

# Fields required inside each item of the "theories" list.
REQUIRED_THEORY_ITEM_FIELDS = ("id", "name", "description")

# "known_facts" (timeline) is a plain list of strings, not objects —
# each item still needs to be a non-empty string or the frontend crashes
# trying to render it directly (React can't render arbitrary objects as
# a child node).


class InvestigationValidationError(ValueError):
    """
    Raised only by validate_investigation_file() when the file itself
    can't be read at all (missing file, unreadable, not valid JSON) and
    the caller has asked to fail loudly rather than get a result object.
    Normal *content* problems (missing fields, wrong types) are never
    raised — they're reported through ValidationOutcome.errors.
    """


@dataclass
class ValidationOutcome:
    """Result of validating one investigation file."""

    is_valid: bool
    source: str                              # filename or case id, for error messages
    errors: List[str] = field(default_factory=list)

    def __bool__(self) -> bool:
        return self.is_valid

    def error_message(self) -> str:
        """A single, human-readable string combining all errors."""
        return "; ".join(self.errors)


# --------------------------------------------------------------------------
# Core validation logic
# --------------------------------------------------------------------------

def validate_investigation_data(data: Any, source: str = "<unknown>") -> ValidationOutcome:
    """
    Validate an already-parsed investigation dict.

    This is the reusable core: it takes plain Python data (dict/list/etc,
    as produced by json.load) so it can be used no matter where the data
    came from — a file on disk, an API request body, a test fixture, ...

    Args:
        data: parsed JSON content, expected to be a dict.
        source: filename or case id, used to make error messages useful.

    Returns:
        ValidationOutcome — never raises for bad *content*.
    """
    errors: List[str] = []

    if not isinstance(data, dict):
        return ValidationOutcome(
            is_valid=False,
            source=source,
            errors=[f"'{source}': investigation must be a JSON object, got {type(data).__name__}"],
        )

    # 1. Required top-level fields: present, correct type, non-empty.
    for field_name, expected_type in REQUIRED_FIELDS.items():
        if field_name not in data:
            errors.append(f"'{source}': missing required field '{field_name}'")
            continue

        value = data[field_name]
        if not isinstance(value, expected_type):
            errors.append(
                f"'{source}': field '{field_name}' must be of type "
                f"{expected_type.__name__}, got {type(value).__name__}"
            )
            continue

        if expected_type is str and not value.strip():
            errors.append(f"'{source}': field '{field_name}' must not be empty")
        elif expected_type is list and len(value) == 0:
            errors.append(f"'{source}': field '{field_name}' must not be an empty list")

    # 2. Spot-check known_facts items (only if it's a usable list) — the
    #    frontend renders each item directly, so a non-string entry would
    #    crash rendering even though the top-level field itself is fine.
    known_facts = data.get("known_facts")
    if isinstance(known_facts, list):
        for i, item in enumerate(known_facts):
            if not isinstance(item, str) or not item.strip():
                errors.append(f"'{source}': known_facts[{i}] must be a non-empty string")

    # 3. Spot-check nested evidence items (only if evidence is a usable list).
    evidence = data.get("evidence")
    if isinstance(evidence, list):
        for i, item in enumerate(evidence):
            if not isinstance(item, dict):
                errors.append(f"'{source}': evidence[{i}] must be an object")
                continue
            for key in REQUIRED_EVIDENCE_ITEM_FIELDS:
                if key not in item or not str(item[key]).strip():
                    errors.append(f"'{source}': evidence[{i}] is missing required field '{key}'")

    # 4. Spot-check nested theory ("suspect") items.
    theories = data.get("theories")
    if isinstance(theories, list):
        for i, item in enumerate(theories):
            if not isinstance(item, dict):
                errors.append(f"'{source}': theories[{i}] must be an object")
                continue
            for key in REQUIRED_THEORY_ITEM_FIELDS:
                if key not in item or not str(item[key]).strip():
                    errors.append(f"'{source}': theories[{i}] is missing required field '{key}'")

    return ValidationOutcome(is_valid=len(errors) == 0, source=source, errors=errors)


def validate_investigation_file(path: Union[str, Path]) -> ValidationOutcome:
    """
    Read + parse + validate an investigation JSON file in one call.

    Handles missing files and malformed JSON as validation failures
    (returned in ValidationOutcome.errors) rather than raising, so a
    caller looping over many files can simply skip any file where
    outcome.is_valid is False and keep going.

    Args:
        path: path to the investigation .json file.

    Returns:
        ValidationOutcome
    """
    path = Path(path)
    source = path.name

    if not path.exists():
        return ValidationOutcome(is_valid=False, source=source, errors=[f"'{source}': file not found"])

    try:
        raw_text = path.read_text(encoding="utf-8")
    except UnicodeDecodeError as exc:
        return ValidationOutcome(
            is_valid=False, source=source, errors=[f"'{source}': file is not valid UTF-8 text ({exc})"]
        )
    except OSError as exc:
        return ValidationOutcome(is_valid=False, source=source, errors=[f"'{source}': could not read file ({exc})"])

    try:
        data = json.loads(raw_text)
    except json.JSONDecodeError as exc:
        return ValidationOutcome(
            is_valid=False,
            source=source,
            errors=[f"'{source}': malformed JSON ({exc.msg} at line {exc.lineno}, column {exc.colno})"],
        )

    return validate_investigation_data(data, source=source)