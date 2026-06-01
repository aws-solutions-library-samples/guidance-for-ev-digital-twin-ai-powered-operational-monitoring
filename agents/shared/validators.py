"""Lightweight input validators shared across agents.

Kept dependency-free so Lambda functions and AgentCore Runtime containers can
reuse the same logic without pulling in extra packages. Lambda functions that
do not bundle this package should inline the same regex.
"""

import re


# Permissive but safe identifier pattern. Allows the codebase's short test IDs
# (for example ``VEH001``) and full 17-character VINs while rejecting path
# separators, whitespace, and other characters that could enable path traversal
# or injection when the value is interpolated into URLs, log lines, or queries.
_VEHICLE_ID_RE = re.compile(r'^[A-Za-z0-9_-]{1,32}$')


def validate_vehicle_id(vehicle_id: str) -> str:
    """Validate that ``vehicle_id`` is a safe identifier.

    Returns the input unchanged on success. Raises ``ValueError`` otherwise.
    """
    if not isinstance(vehicle_id, str) or not _VEHICLE_ID_RE.match(vehicle_id):
        raise ValueError(
            "vehicle_id must be 1-32 characters of letters, digits, '-', or '_'"
        )
    return vehicle_id
