# FILE_META
# INPUT:  OpenClaw sessions directory
# OUTPUT: list of qualifying session dicts (model, path, agent_id)
# POS:    skill lib — called by the openclaw adapter
# MISSION: Discover and filter sessions by model whitelist.

"""Parse OpenClaw sessions.json index for quick model filtering."""

from __future__ import annotations

import json
import os
import re
from typing import Optional

from .dag import detect_file_encoding

# Models accepted for trajectory collection
# Match loosely — different providers may use varying naming conventions
# (e.g. "claude-opus-4-6", "anthropic/claude-opus-4-6", "opus-4-6", "opus4.6").
# We only require the key identifier to appear anywhere in the model ID.
ALLOWED_MODEL_PATTERNS = [
    re.compile(r"sonnet[_\-.]?4[_\-.]?6", re.IGNORECASE),
    re.compile(r"opus[_\-.]?4[_\-.]?5", re.IGNORECASE),
    re.compile(r"opus[_\-.]?4[_\-.]?6", re.IGNORECASE),
]


def is_allowed_model(model_id: Optional[str]) -> bool:
    """Check if a model ID matches the allowed model patterns."""
    if not model_id:
        return False
    return any(p.search(model_id) for p in ALLOWED_MODEL_PATTERNS)


def find_openclaw_sessions_dirs() -> list[str]:
    """Find all OpenClaw agent session directories.

    Returns list of paths like ~/.openclaw/agents/{agentId}/sessions/
    """
    state_dir = os.path.expanduser("~/.openclaw")

    # Also check OPENCLAW_STATE_DIR env variable
    env_dir = os.environ.get("OPENCLAW_STATE_DIR")
    if env_dir:
        state_dir = env_dir

    agents_dir = os.path.join(state_dir, "agents")
    if not os.path.isdir(agents_dir):
        return []

    result = []
    for agent_id in os.listdir(agents_dir):
        sessions_dir = os.path.join(agents_dir, agent_id, "sessions")
        if os.path.isdir(sessions_dir):
            result.append(sessions_dir)

    return result


def load_sessions_index(sessions_dir: str) -> dict:
    """Load and parse sessions.json from a sessions directory.

    Returns dict of {session_key: session_entry}.
    """
    index_path = os.path.join(sessions_dir, "sessions.json")
    if not os.path.isfile(index_path):
        return {}

    with open(index_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # sessions.json may have the entries at top level or nested
    if isinstance(data, dict):
        return data

    return {}


def _read_model_from_jsonl_head(file_path: str, any_model: bool = False) -> Optional[str]:
    """Read model ID from the first few lines of a .jsonl file.

    Checks two sources (first 10 lines):
    1. type=model_change → modelId field
    2. First assistant message containing "model:" → extract from text

    When any_model=False (default), only returns values that pass
    is_allowed_model() to avoid picking up gateway-internal names.
    When any_model=True, returns any model found (for display purposes).
    """
    fallback_model = None
    try:
        with open(file_path, "r", encoding=detect_file_encoding(file_path), errors="replace") as f:
            for i, line in enumerate(f):
                if i >= 10:  # only check first 10 lines
                    break
                line = line.strip()
                if not line:
                    continue
                try:
                    node = json.loads(line)
                    if node.get("type") == "model_change":
                        mid = node.get("modelId")
                        if mid:
                            if is_allowed_model(mid):
                                return mid
                            if fallback_model is None:
                                fallback_model = mid
                    # Fallback: extract from "New session started · model: xxx"
                    if node.get("type") == "message":
                        msg = node.get("message", {})
                        if msg.get("role") == "assistant":
                            content = msg.get("content", [])
                            if isinstance(content, list):
                                for block in content:
                                    if isinstance(block, dict):
                                        text = block.get("text", "")
                                        if "model:" in text:
                                            candidate = text.split("model:")[-1].strip()
                                            if is_allowed_model(candidate):
                                                return candidate
                                            if fallback_model is None:
                                                fallback_model = candidate
                except (json.JSONDecodeError, UnicodeDecodeError):
                    continue
    except OSError:
        pass
    return fallback_model if any_model else None


_RESET_RE = re.compile(r"^(?P<sid>[0-9a-f\-]+)\.jsonl(?:\.reset\..+)?$")


def _discover_sessions_from_files(sessions_dir: str, include_all_models: bool = False, verbose: bool = False) -> list[dict]:
    """Discover sessions by scanning .jsonl and .jsonl.reset.* files.

    Used when sessions.json is missing or incomplete, and also used to
    supplement the index with reset (archived) sessions that are no longer
    tracked in sessions.json.
    Only reads the first few lines of each file to check the model.

    When include_all_models=True, includes sessions with non-whitelisted
    models (for display in --list-only).
    When verbose=True, prints discovery log to stderr (used when this is the
    sole discovery method, i.e. sessions.json is empty/missing).
    """
    import sys
    agent_id = os.path.basename(os.path.dirname(sessions_dir))
    qualifying = []

    for filename in os.listdir(sessions_dir):
        m = _RESET_RE.match(filename)
        if not m:
            continue

        file_path = os.path.join(sessions_dir, filename)
        model = _read_model_from_jsonl_head(file_path, any_model=include_all_models)

        model_ok = is_allowed_model(model) if model else False
        if not include_all_models and not model_ok:
            continue

        session_id = m.group("sid")

        qualifying.append({
            "session_id": session_id,
            "session_key": "",
            "agent_id": agent_id,
            "model": model or "unknown",
            "model_provider": "",
            "file_path": file_path,
            "model_allowed": model_ok,
        })

    if qualifying and verbose:
        print(f"  Fallback: found {len(qualifying)} session(s) from .jsonl files in {sessions_dir}", file=sys.stderr)

    return qualifying


def get_qualifying_sessions(sessions_dir: str, include_all_models: bool = False) -> list[dict]:
    """Get sessions, optionally including non-whitelisted models.

    First tries sessions.json index for fast filtering.
    Falls back to scanning .jsonl file headers if index is missing.

    When include_all_models=False (default), only returns sessions with
    whitelisted models (existing behavior).
    When include_all_models=True, returns all sessions with a
    model_allowed flag indicating whitelist status.

    Returns list of dicts with session_id, model, file_path, agent_id,
    and model_allowed (bool).
    """
    index = load_sessions_index(sessions_dir)
    agent_id = os.path.basename(os.path.dirname(sessions_dir))
    qualifying = []

    if index:
        for session_key, entry in index.items():
            if not isinstance(entry, dict):
                continue

            model = entry.get("model") or entry.get("modelOverride") or ""

            model_ok = is_allowed_model(model)
            if not include_all_models and not model_ok:
                continue

            session_id = entry.get("sessionId", "")
            session_file = entry.get("sessionFile", f"{session_id}.jsonl")
            file_path = os.path.join(sessions_dir, session_file)

            if not os.path.isfile(file_path):
                continue

            qualifying.append({
                "session_id": session_id,
                "session_key": session_key,
                "agent_id": agent_id,
                "model": model,
                "model_provider": entry.get("modelProvider", ""),
                "file_path": file_path,
                "model_allowed": model_ok,
            })

    # Always scan files to pick up reset (archived) sessions not in the index.
    # When index is empty this is the sole discovery method — log in that case.
    seen_ids = {q["session_id"] for q in qualifying}
    for extra in _discover_sessions_from_files(sessions_dir, include_all_models, verbose=not index):
        if extra["session_id"] not in seen_ids:
            qualifying.append(extra)
            seen_ids.add(extra["session_id"])

    return qualifying
