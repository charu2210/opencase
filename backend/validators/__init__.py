"""
Validators package.

Exposes the investigation-file validation utility so it can be imported
as `from validators import validate_investigation_data` (or `_file`)
from anywhere in the backend — routers, startup hooks, scripts, tests.
"""

from .investigation_validator import (
    InvestigationValidationError,
    ValidationOutcome,
    validate_investigation_data,
    validate_investigation_file,
)

__all__ = [
    "InvestigationValidationError",
    "ValidationOutcome",
    "validate_investigation_data",
    "validate_investigation_file",
]