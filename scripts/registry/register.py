#!/usr/bin/env python3
"""
AgentCore Registry Integration CLI

Registers the EV Digital Twin multi-agent system into AWS Agent Registry.
Supports creating a registry, publishing A2A agent card and MCP server records,
submitting them for approval, and verifying discoverability via search.

Usage:
    python register.py register --config registry-config.yaml
    python register.py verify --config registry-config.yaml
    python register.py status --config registry-config.yaml
"""

import argparse
import functools
import json
import logging
import os
import random
import re
import sys
import time
from datetime import datetime, timezone
from typing import Any, Callable, Dict, List, Optional

import boto3
import yaml
from botocore.exceptions import ClientError

logger = logging.getLogger("registry")

STATE_FILE = os.path.join(os.path.dirname(__file__), ".registry-state.json")


# ---------------------------------------------------------------------------
# Logging setup
# ---------------------------------------------------------------------------

def setup_logging(level: str = "INFO") -> None:
    """Configure logging with the specified level."""
    numeric_level = getattr(logging, level.upper(), logging.INFO)
    logging.basicConfig(
        level=numeric_level,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S",
    )


# ---------------------------------------------------------------------------
# Environment variable substitution
# ---------------------------------------------------------------------------

def _substitute_env_vars(value: Any) -> Any:
    """Recursively substitute ${VAR_NAME} placeholders with environment variable values."""
    if isinstance(value, str):
        def _replace(match: re.Match) -> str:
            var_name = match.group(1)
            return os.environ.get(var_name, '')
        return re.sub(r"\$\{([^}]+)\}", _replace, value)
    if isinstance(value, dict):
        return {k: _substitute_env_vars(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_substitute_env_vars(item) for item in value]
    return value


# ---------------------------------------------------------------------------
# Task 1.2: load_config — YAML loading, CLI override, validation
# ---------------------------------------------------------------------------

def load_config(
    path: str,
    overrides: Optional[Dict[str, Optional[str]]] = None,
) -> Dict[str, Any]:
    """Load YAML configuration, apply CLI overrides, and validate required fields.

    Args:
        path: Path to the YAML configuration file.
        overrides: Optional dict with keys ``region`` and/or ``registry_name``
            whose non-None values override the corresponding YAML values.

    Returns:
        Dictionary with ``registry`` and ``records`` top-level keys.

    Raises:
        FileNotFoundError: If the YAML file does not exist.
        yaml.YAMLError: If the file is not valid YAML.
        ValueError: If a required configuration field is missing.
    """
    if not os.path.isfile(path):
        raise FileNotFoundError(f"Configuration file not found: {path}")

    with open(path, "r") as fh:
        try:
            raw = yaml.safe_load(fh)
        except yaml.YAMLError as exc:
            raise yaml.YAMLError(f"Failed to parse YAML configuration: {exc}") from exc

    if raw is None:
        raw = {}

    # Validate top-level structure
    if "registry" not in raw or not isinstance(raw.get("registry"), dict):
        raise ValueError("Missing required configuration field: registry")

    registry = raw["registry"]

    # Apply CLI overrides before validation
    if overrides:
        if overrides.get("region") is not None:
            registry["region"] = overrides["region"]
        if overrides.get("registry_name") is not None:
            registry["name"] = overrides["registry_name"]

    # Validate required registry fields
    for field in ("name", "region", "description"):
        if field not in registry or not registry[field]:
            raise ValueError(f"Missing required configuration field: registry.{field}")

    # Validate records list
    if "records" not in raw or not isinstance(raw.get("records"), list):
        raise ValueError("Missing required configuration field: records")
    if len(raw["records"]) == 0:
        raise ValueError("Missing required configuration field: records (list is empty)")

    # Substitute environment variables throughout the config
    config = _substitute_env_vars(raw)

    return {"registry": config["registry"], "records": config["records"],
            **({"verification": config["verification"]} if "verification" in config else {})}


# ---------------------------------------------------------------------------
# Task 2.1: retry_with_backoff decorator
# ---------------------------------------------------------------------------

RETRYABLE_ERRORS = frozenset([
    "ThrottlingException",
    "InternalServerException",
    "ServiceUnavailableException",
])


def retry_with_backoff(max_retries: int = 3, base_delay: float = 1.0) -> Callable:
    """Decorator that retries a function on transient AWS errors.

    Exponential backoff: base_delay * 2^attempt + jitter.
    Max 3 retries (4 total attempts). Only retries on RETRYABLE_ERRORS.
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            last_exc: Optional[Exception] = None
            for attempt in range(max_retries + 1):
                try:
                    return func(*args, **kwargs)
                except ClientError as exc:
                    error_code = exc.response["Error"]["Code"]
                    if error_code not in RETRYABLE_ERRORS:
                        raise
                    last_exc = exc
                    if attempt < max_retries:
                        delay = base_delay * (2 ** attempt) + random.uniform(0, 0.5)
                        logger.warning(
                            "Retryable error %s on attempt %d/%d, retrying in %.1fs",
                            error_code, attempt + 1, max_retries + 1, delay,
                        )
                        time.sleep(delay)
            raise last_exc  # type: ignore[misc]
        return wrapper
    return decorator


# ---------------------------------------------------------------------------
# Task 2.3: wait_for_status — poll get_registry_record with backoff
# ---------------------------------------------------------------------------

def wait_for_status(
    control_client: Any,
    registry_id: str,
    record_id: str,
    target_status: str,
    timeout: int = 120,
) -> Dict[str, Any]:
    """Poll get_registry_record until the record reaches target_status or timeout.

    Uses exponential backoff starting at 2s, capped at 10s.
    Handles ResourceNotFoundException as "not yet created — retry".

    Returns:
        The record dict once target_status is reached.

    Raises:
        TimeoutError: If target_status is not reached within timeout seconds.
    """
    start = time.time()
    poll_delay = 2.0
    current_status = "UNKNOWN"

    while time.time() - start < timeout:
        try:
            resp = control_client.get_registry_record(
                registryId=registry_id,
                recordId=record_id,
            )
            current_status = resp.get("status", "UNKNOWN")
            logger.debug("Record %s status: %s", record_id, current_status)

            if current_status == target_status:
                return resp

            # If record was rejected, stop polling
            if current_status == "REJECTED":
                logger.warning("Record %s was REJECTED", record_id)
                return resp

        except ClientError as exc:
            error_code = exc.response["Error"]["Code"]
            if error_code == "ResourceNotFoundException":
                logger.debug("Record %s not found yet, retrying...", record_id)
            else:
                raise

        time.sleep(poll_delay)  # nosemgrep: arbitrary-sleep
        poll_delay = min(poll_delay * 1.5, 10.0)

    raise TimeoutError(
        f"Record {record_id} did not reach status '{target_status}' within {timeout}s "
        f"(current: {current_status})"
    )


# ---------------------------------------------------------------------------
# Task 4.1: build_mcp_server_definition
# ---------------------------------------------------------------------------

def build_mcp_server_definition(record_config: Dict[str, Any]) -> Dict[str, Any]:
    """Build MCP server definition dict from record config.

    Returns dict with name, description, version, protocol, and metadata.
    """
    server_cfg = record_config.get("server", {})
    definition: Dict[str, Any] = {
        "name": record_config["name"],
        "description": server_cfg.get("description", record_config.get("description", "")),
        "version": record_config.get("version", "1.0.0"),
        "protocol": "MCP",
    }
    metadata = server_cfg.get("metadata")
    if metadata:
        definition["metadata"] = metadata
    return definition


# ---------------------------------------------------------------------------
# Task 4.2: build_mcp_tools_definition
# ---------------------------------------------------------------------------

def build_mcp_tools_definition(record_config: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Build list of MCP tool definition dicts from record config.

    Each tool dict has name, description, and inputSchema.
    """
    tools_cfg = record_config.get("tools", [])
    tools: List[Dict[str, Any]] = []
    for tool in tools_cfg:
        tool_def: Dict[str, Any] = {
            "name": tool["name"],
            "description": tool.get("description", ""),
        }
        if "inputSchema" in tool:
            tool_def["inputSchema"] = tool["inputSchema"]
        tools.append(tool_def)
    return {"tools": tools}


# ---------------------------------------------------------------------------
# Task 4.3: build_a2a_agent_card
# ---------------------------------------------------------------------------

def build_a2a_agent_card(record_config: Dict[str, Any]) -> Dict[str, Any]:
    """Build A2A agent card dict from record config.

    Returns dict with name, description, version, url, provider,
    capabilities, defaultInputModes, defaultOutputModes, and skills.
    """
    card_cfg = record_config.get("agentCard", {})
    card: Dict[str, Any] = {
        "name": record_config["name"],
        "url": card_cfg.get("url", "") or "https://bedrock-agentcore.us-east-1.amazonaws.com",
        "version": record_config.get("version", "1.0.0"),
        "protocolVersion": "0.3.0",
        "capabilities": {k: v for k, v in card_cfg.get("capabilities", {}).items() if v},
        "defaultInputModes": card_cfg.get("defaultInputModes", ["text/plain"]),
        "defaultOutputModes": card_cfg.get("defaultOutputModes", ["text/plain"]),
        "skills": [],
    }
    # Optional fields
    desc = record_config.get("description", "")
    if desc:
        card["description"] = desc
    for skill in card_cfg.get("skills", []):
        card["skills"].append({
            "id": skill["id"],
            "name": skill["name"],
            "description": skill.get("description", ""),
            **({"tags": skill["tags"]} if "tags" in skill else {}),
        })
    return card


# ---------------------------------------------------------------------------
# State file helpers
# ---------------------------------------------------------------------------

def _load_state() -> Dict[str, Any]:
    """Load the registry state file, or return empty state."""
    if os.path.isfile(STATE_FILE):
        with open(STATE_FILE, "r") as fh:
            return json.load(fh)
    return {}


def _save_state(state: Dict[str, Any]) -> None:
    """Persist registry state to the state file."""
    state["lastUpdated"] = datetime.now(timezone.utc).isoformat()
    with open(STATE_FILE, "w") as fh:
        json.dump(state, fh, indent=2)
    logger.info("State saved to %s", STATE_FILE)


# ---------------------------------------------------------------------------
# Task 5.1: create_or_get_registry
# ---------------------------------------------------------------------------

@retry_with_backoff()
def _create_registry_api(control_client: Any, **kwargs: Any) -> Dict[str, Any]:
    return control_client.create_registry(**kwargs)


@retry_with_backoff()
def _get_registry_api(control_client: Any, **kwargs: Any) -> Dict[str, Any]:
    return control_client.get_registry(**kwargs)


def create_or_get_registry(
    control_client: Any,
    config: Dict[str, Any],
) -> str:
    """Create the registry or retrieve existing ID. Poll until READY.

    Returns:
        The registry ID string.
    """
    registry_cfg = config["registry"]
    registry_name = registry_cfg["name"]

    try:
        resp = _create_registry_api(
            control_client,
            name=registry_name,
            description=registry_cfg.get("description", ""),
            authorizerType=registry_cfg.get("authorizerType", "AWS_IAM"),
            approvalConfiguration={"autoApproval": registry_cfg.get("autoApproval", True)},
        )
        registry_arn = resp.get("registryArn", "")
        # Extract registry ID from ARN: arn:aws:bedrock-agentcore:region:account:registry/ID
        registry_id = registry_arn.split("/")[-1] if "/" in registry_arn else resp.get("registryId", "")
        logger.info("Created registry '%s' (id=%s)", registry_name, registry_id)
    except ClientError as exc:
        if exc.response["Error"]["Code"] == "ConflictException":
            logger.info("Registry '%s' already exists, fetching ID", registry_name)
            # List registries to find the existing one
            resp = control_client.list_registries()
            for reg in resp.get("registries", []):
                if reg.get("name") == registry_name:
                    registry_id = reg.get("registryId", reg.get("registryArn", "").split("/")[-1])
                    break
            else:
                raise RuntimeError(f"Registry '{registry_name}' exists but could not be found in list")
        else:
            raise

    # Poll until READY
    start = time.time()
    poll_delay = 2.0
    while time.time() - start < 120:
        resp = control_client.get_registry(registryId=registry_id)
        status = resp.get("status", "UNKNOWN")
        if status == "READY":
            logger.info("Registry %s is READY", registry_id)
            break
        logger.debug("Registry status: %s, waiting...", status)
        time.sleep(poll_delay)  # nosemgrep: arbitrary-sleep
        poll_delay = min(poll_delay * 1.5, 10.0)
    else:
        raise TimeoutError(f"Registry {registry_id} did not reach READY within 120s")

    # Save state
    state = _load_state()
    state["registryId"] = registry_id
    state["registryArn"] = resp.get("registryArn", "")
    state.setdefault("records", {})
    _save_state(state)

    return registry_id


# ---------------------------------------------------------------------------
# Task 5.2: create_mcp_record
# ---------------------------------------------------------------------------

@retry_with_backoff()
def _create_registry_record_api(control_client: Any, **kwargs: Any) -> Dict[str, Any]:
    return control_client.create_registry_record(**kwargs)


def create_mcp_record(
    control_client: Any,
    registry_id: str,
    record_config: Dict[str, Any],
) -> str:
    """Build MCP descriptors and create a registry record of type MCP.

    Returns:
        The record ID.
    """
    server_def = build_mcp_server_definition(record_config)
    tools_def = build_mcp_tools_definition(record_config)

    try:
        resp = _create_registry_record_api(
            control_client,
            registryId=registry_id,
            name=record_config["name"],
            description=record_config.get("description", ""),
            descriptorType="MCP",
            recordVersion=record_config.get("version", "1.0.0"),
            descriptors={
                "mcp": {
                    "server": {
                        "inlineContent": json.dumps(server_def),
                        "schemaVersion": "2025-12-11",
                    },
                    "tools": {
                        "inlineContent": json.dumps(tools_def),
                        "protocolVersion": "2024-11-05",
                    },
                }
            },
        )
        record_arn = resp.get("recordArn", "")
        record_id = record_arn.split("/")[-1] if "/" in record_arn else resp.get("recordId", "")
        logger.info("Created MCP record '%s' (id=%s)", record_config["name"], record_id)
    except ClientError as exc:
        if exc.response["Error"]["Code"] == "ConflictException":
            logger.info("MCP record '%s' already exists", record_config["name"])
            # Fetch existing — use list or get by name
            record_id = _find_existing_record_id(control_client, registry_id, record_config["name"])
        else:
            raise

    # Poll until DRAFT
    wait_for_status(control_client, registry_id, record_id, "DRAFT")
    return record_id


# ---------------------------------------------------------------------------
# Task 5.3: create_agent_record
# ---------------------------------------------------------------------------

def create_agent_record(
    control_client: Any,
    registry_id: str,
    record_config: Dict[str, Any],
) -> str:
    """Build A2A agent card and create a registry record of type AGENT.

    Returns:
        The record ID.
    """
    agent_card = build_a2a_agent_card(record_config)

    try:
        resp = _create_registry_record_api(
            control_client,
            registryId=registry_id,
            name=record_config["name"],
            description=record_config.get("description", ""),
            descriptorType="A2A",
            recordVersion=record_config.get("version", "1.0.0"),
            descriptors={
                "a2a": {
                    "agentCard": {
                        "inlineContent": json.dumps(agent_card),
                        "schemaVersion": "0.3",
                    }
                }
            },
        )
        record_arn = resp.get("recordArn", "")
        record_id = record_arn.split("/")[-1] if "/" in record_arn else resp.get("recordId", "")
        logger.info("Created AGENT record '%s' (id=%s)", record_config["name"], record_id)
    except ClientError as exc:
        if exc.response["Error"]["Code"] == "ConflictException":
            logger.info("AGENT record '%s' already exists", record_config["name"])
            record_id = _find_existing_record_id(control_client, registry_id, record_config["name"])
        else:
            raise

    # Poll until DRAFT
    wait_for_status(control_client, registry_id, record_id, "DRAFT")
    return record_id


def _find_existing_record_id(
    control_client: Any,
    registry_id: str,
    record_name: str,
) -> str:
    """Find an existing record ID by name using list_registry_records."""
    resp = control_client.list_registry_records(registryId=registry_id)
    for rec in resp.get("registryRecords", []):
        if rec.get("name") == record_name:
            return rec["recordId"]
    raise RuntimeError(f"Could not find existing record '{record_name}' in registry {registry_id}")


# ---------------------------------------------------------------------------
# Task 5.4: submit_for_approval
# ---------------------------------------------------------------------------

@retry_with_backoff()
def _submit_for_approval_api(control_client: Any, **kwargs: Any) -> Dict[str, Any]:
    return control_client.submit_registry_record_for_approval(**kwargs)


def submit_for_approval(
    control_client: Any,
    registry_id: str,
    record_id: str,
) -> str:
    """Submit a record for approval and poll until APPROVED.

    Returns:
        The final status string.
    """
    try:
        _submit_for_approval_api(
            control_client,
            registryId=registry_id,
            recordId=record_id,
        )
        logger.info("Submitted record %s for approval", record_id)
    except ClientError as exc:
        error_code = exc.response["Error"]["Code"]
        if error_code == "ConflictException":
            logger.info("Record %s already submitted for approval", record_id)
        else:
            raise

    resp = wait_for_status(control_client, registry_id, record_id, "APPROVED")
    status = resp.get("status", "UNKNOWN")
    if status == "REJECTED":
        logger.warning("Record %s was REJECTED: %s", record_id, resp.get("statusReason", ""))
    else:
        logger.info("Record %s is APPROVED", record_id)
    return status


# ---------------------------------------------------------------------------
# Task 5.5: handle_register — main orchestration
# ---------------------------------------------------------------------------

def handle_register(args: argparse.Namespace) -> None:
    """Handler for the 'register' subcommand."""
    config = load_config(
        args.config,
        overrides={"region": args.region, "registry_name": args.registry_name},
    )
    region = config["registry"]["region"]

    session_kwargs: Dict[str, Any] = {"region_name": region}
    if args.profile:
        session_kwargs["profile_name"] = args.profile
    session = boto3.Session(**session_kwargs)

    control_client = session.client("bedrock-agentcore-control")

    # Create or get registry
    registry_id = create_or_get_registry(control_client, config)

    state = _load_state()
    state.setdefault("records", {})

    # Iterate records
    for record_cfg in config["records"]:
        record_name = record_cfg["name"]
        record_type = record_cfg.get("type", "MCP")
        logger.info("Processing record: %s (type=%s)", record_name, record_type)

        if record_type in ("MCP",):
            record_id = create_mcp_record(control_client, registry_id, record_cfg)
        elif record_type in ("AGENT", "A2A"):
            record_id = create_agent_record(control_client, registry_id, record_cfg)
        else:
            logger.error("Unknown record type '%s' for %s, skipping", record_type, record_name)
            continue

        # Submit for approval
        final_status = submit_for_approval(control_client, registry_id, record_id)

        state["records"][record_name] = {
            "recordId": record_id,
            "status": final_status,
            "version": record_cfg.get("version", "1.0.0"),
        }
        _save_state(state)

    logger.info("Registration complete. %d records processed.", len(config["records"]))


# ---------------------------------------------------------------------------
# Task 7.1: verify_search
# ---------------------------------------------------------------------------

def verify_search(
    search_client: Any,
    registry_id: str,
    queries: List[Dict[str, Any]],
) -> bool:
    """Run search queries and validate that expected records appear.

    Returns:
        True if all queries pass, False otherwise.
    """
    all_passed = True

    for q in queries:
        query_text = q["query"]
        expected = q.get("expectedRecords", [])
        logger.info("Searching: '%s'", query_text)

        try:
            resp = search_client.search_registry_records(
                registryIds=[registry_id],
                searchQuery=query_text,
                maxResults=10,
            )
        except ClientError as exc:
            logger.error("Search failed for '%s': %s", query_text, exc)
            all_passed = False
            continue

        results = resp.get("registryRecords", [])
        if not results:
            logger.warning("No results for query '%s' — records may not yet be indexed", query_text)
            all_passed = False
            continue

        found_names = {r.get("name") for r in results}
        for expected_name in expected:
            matched = [r for r in results if r.get("name") == expected_name]
            if matched:
                rec = matched[0]
                status = rec.get("status", "UNKNOWN")
                print(f"  ✓ {rec.get('name')}  type={rec.get('descriptorType', '?')}  "
                      f"version={rec.get('recordVersion', '?')}  id={rec.get('recordId', '?')}  "
                      f"status={status}")
                if status != "APPROVED":
                    logger.warning("Record '%s' status is %s, expected APPROVED", expected_name, status)
                    all_passed = False
            else:
                logger.warning("Expected record '%s' not found in results for '%s'", expected_name, query_text)
                all_passed = False

    return all_passed


# ---------------------------------------------------------------------------
# Task 7.2: handle_verify
# ---------------------------------------------------------------------------

def handle_verify(args: argparse.Namespace) -> None:
    """Handler for the 'verify' subcommand."""
    config = load_config(
        args.config,
        overrides={"region": args.region, "registry_name": args.registry_name},
    )
    region = config["registry"]["region"]

    session_kwargs: Dict[str, Any] = {"region_name": region}
    if args.profile:
        session_kwargs["profile_name"] = args.profile
    session = boto3.Session(**session_kwargs)

    search_client = session.client("bedrock-agentcore")

    state = _load_state()
    registry_id = state.get("registryId")
    if not registry_id:
        logger.error("No registry ID found in state file. Run 'register' first.")
        sys.exit(1)

    queries = config.get("verification", {}).get("queries", [])
    if not queries:
        logger.warning("No verification queries defined in config")
        return

    passed = verify_search(search_client, registry_id, queries)
    if passed:
        print("\n✓ All verification queries passed")
    else:
        print("\n✗ Some verification queries failed")
        sys.exit(1)


# ---------------------------------------------------------------------------
# Task 7.3: handle_status
# ---------------------------------------------------------------------------

@retry_with_backoff()
def _get_registry_record_api(control_client: Any, **kwargs: Any) -> Dict[str, Any]:
    return control_client.get_registry_record(**kwargs)


def handle_status(args: argparse.Namespace) -> None:
    """Handler for the 'status' subcommand."""
    state = _load_state()
    registry_id = state.get("registryId")
    if not registry_id:
        logger.error("No registry ID found in state file. Run 'register' first.")
        sys.exit(1)

    config = load_config(
        args.config,
        overrides={"region": args.region, "registry_name": args.registry_name},
    )
    region = config["registry"]["region"]

    session_kwargs: Dict[str, Any] = {"region_name": region}
    if args.profile:
        session_kwargs["profile_name"] = args.profile
    session = boto3.Session(**session_kwargs)

    control_client = session.client("bedrock-agentcore-control")

    records = state.get("records", {})
    if not records:
        print("No records in state file.")
        return

    # Print table header
    print(f"{'Record Name':<40} {'Type':<8} {'Status':<16} {'Version':<10}")
    print("-" * 78)

    for record_name, record_info in records.items():
        record_id = record_info.get("recordId", "")
        try:
            resp = _get_registry_record_api(
                control_client,
                registryId=registry_id,
                recordId=record_id,
            )
            status = resp.get("status", "UNKNOWN")
            desc_type = resp.get("descriptorType", "?")
            version = resp.get("recordVersion", "?")
        except ClientError:
            status = "ERROR"
            desc_type = "?"
            version = record_info.get("version", "?")

        print(f"{record_name:<40} {desc_type:<8} {status:<16} {version:<10}")


# ---------------------------------------------------------------------------
# Task 9.2: CLI parser and entry point — wire all handlers
# ---------------------------------------------------------------------------

def build_parser() -> argparse.ArgumentParser:
    """Build the CLI argument parser with subcommands and global arguments."""
    parser = argparse.ArgumentParser(
        prog="register.py",
        description="Register EV Digital Twin agents and tools into AWS Agent Registry",
    )

    # Global arguments
    parser.add_argument(
        "--config",
        default="scripts/registry/registry-config.yaml",
        help="Path to YAML configuration file (default: scripts/registry/registry-config.yaml)",
    )
    parser.add_argument(
        "--region",
        default=None,
        help="Override AWS region from config",
    )
    parser.add_argument(
        "--registry-name",
        default=None,
        help="Override registry name from config",
    )
    parser.add_argument(
        "--profile",
        default=None,
        help="AWS CLI profile name",
    )
    parser.add_argument(
        "--log-level",
        default="INFO",
        choices=["DEBUG", "INFO", "WARNING", "ERROR"],
        help="Set logging level (default: INFO)",
    )

    # Subcommands
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    register_parser = subparsers.add_parser(
        "register",
        help="Create registry, register all records, and submit for approval",
    )
    register_parser.set_defaults(func=handle_register)

    verify_parser = subparsers.add_parser(
        "verify",
        help="Run search queries and validate record discoverability",
    )
    verify_parser.set_defaults(func=handle_verify)

    status_parser = subparsers.add_parser(
        "status",
        help="Print current status of all registered records",
    )
    status_parser.set_defaults(func=handle_status)

    return parser


def main() -> int:
    """CLI entry point."""
    parser = build_parser()
    args = parser.parse_args()

    setup_logging(args.log_level)

    if not args.command:
        parser.print_help()
        return 1

    try:
        args.func(args)
    except Exception as e:
        logger.error("Command failed: %s", e)
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
