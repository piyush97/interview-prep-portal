"""Agent-agnostic LLM dispatcher.

The portal can call any of these backends to get a single completion.
Each backend implements the AgentBackend protocol:

    def call(self, system: str, user: str, *,
             model: str | None = None, max_tokens: int = 4000) -> AgentResponse

Selection precedence:
    1. profile.agent.backend (explicit)
    2. PREP_AGENT_BACKEND env var
    3. detect_available_backend() — try hermes, claude, codex in order
    4. OfflineBackend (last resort)
"""
from __future__ import annotations

import json
import logging
import os
import shutil
import subprocess
import time
from dataclasses import dataclass, field
from typing import Any, Protocol

logger = logging.getLogger(__name__)


# --- Errors ---

class BackendError(RuntimeError):
    """Raised when an agent backend fails to produce a response."""


# --- Response dataclass ---

@dataclass
class AgentResponse:
    text: str
    model: str
    tokens_in: int | None = None
    tokens_out: int | None = None
    duration_ms: int = 0
    raw: dict[str, Any] = field(default_factory=dict)


# --- Protocol ---

class AgentBackend(Protocol):
    name: str

    def call(
        self,
        system: str,
        user: str,
        *,
        model: str | None = None,
        max_tokens: int = 4000,
    ) -> AgentResponse: ...


# --- Helpers ---

def _run(cmd: list[str], timeout: int = 300) -> subprocess.CompletedProcess:
    """Run a command, raising BackendError on failure."""
    try:
        return subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout,
            env={**os.environ, "NO_COLOR": "1", "TERM": "dumb"},
        )
    except subprocess.TimeoutExpired as e:
        raise BackendError(f"Command timed out after {timeout}s: {cmd[0]}") from e
    except FileNotFoundError as e:
        raise BackendError(f"Executable not found: {cmd[0]}") from e


# --- Offline backend ---

class OfflineBackend:
    """No LLM. Returns a helpful message + echoes the input.

    Used as the safe default when no agent is available.
    """
    name = "offline"

    def call(
        self,
        system: str,
        user: str,
        *,
        model: str | None = None,
        max_tokens: int = 4000,
    ) -> AgentResponse:
        text = (
            "⚠️ AI backend is offline.\n\n"
            "To enable AI features, configure an agent in your profile:\n"
            "  • Hermes:    `agent.backend: hermes` (requires `hermes` CLI installed)\n"
            "  • Claude:    `agent.backend: claude` (requires `claude` CLI installed)\n"
            "  • Codex:     `agent.backend: codex` (requires `codex` CLI installed)\n"
            "  • HTTP:      `agent.backend: http` + endpoint + api_key_env\n"
            f"\nYour input was:\n{user[:500]}{'...' if len(user) > 500 else ''}"
        )
        return AgentResponse(text=text, model="offline", duration_ms=0)


# --- Hermes backend ---

class HermesBackend:
    """Shells out to `hermes chat -q ... -m <model> -Q`.

    Note: previous plugin used `hermes run` which is NOT a valid
    subcommand. The correct invocation is `hermes chat -q` (query)
    in non-interactive mode, with `-Q` to suppress the banner.
    """
    name = "hermes"

    def call(
        self,
        system: str,
        user: str,
        *,
        model: str | None = None,
        max_tokens: int = 4000,
    ) -> AgentResponse:
        # Hermes has no dedicated --system-prompt flag in this version,
        # so we fold system into the user prompt with a clear delimiter.
        merged = f"<system>\n{system}\n</system>\n\n{user}"
        cmd = [
            "hermes", "chat",
            "-q", merged,
            "-m", model or "deepseek/deepseek-v4-flash",
            "-Q",  # quiet
        ]
        start = time.time()
        result = _run(cmd)
        duration_ms = int((time.time() - start) * 1000)

        if result.returncode != 0:
            raise BackendError(
                f"hermes chat failed (rc={result.returncode}): {result.stderr.strip() or 'no stderr'}"
            )

        return AgentResponse(
            text=result.stdout.strip(),
            model=model or "deepseek/deepseek-v4-flash",
            duration_ms=duration_ms,
        )


# --- Claude backend ---

class ClaudeBackend:
    """Shells out to `claude -p ... --append-system-prompt ... -m <model> --output-format json`.

    Claude Code CLI's `-p` flag is non-interactive single-prompt mode.
    `--output-format json` returns a structured envelope.
    """
    name = "claude"

    def call(
        self,
        system: str,
        user: str,
        *,
        model: str | None = None,
        max_tokens: int = 4000,
    ) -> AgentResponse:
        cmd = [
            "claude",
            "-p", user,
            "--append-system-prompt", system,
            "-m", model or "claude-sonnet-4-6",
            "--output-format", "json",
        ]
        start = time.time()
        result = _run(cmd)
        duration_ms = int((time.time() - start) * 1000)

        if result.returncode != 0:
            raise BackendError(
                f"claude -p failed (rc={result.returncode}): {result.stderr.strip() or result.stdout.strip()}"
            )

        # Try to parse the JSON envelope
        try:
            envelope = json.loads(result.stdout)
            text = envelope.get("result") or envelope.get("content") or result.stdout
            tokens_in = envelope.get("usage", {}).get("input_tokens")
            tokens_out = envelope.get("usage", {}).get("output_tokens")
            return AgentResponse(
                text=text.strip() if isinstance(text, str) else result.stdout.strip(),
                model=envelope.get("model") or model or "claude-sonnet-4-6",
                tokens_in=tokens_in,
                tokens_out=tokens_out,
                duration_ms=envelope.get("duration_ms", duration_ms),
                raw=envelope,
            )
        except json.JSONDecodeError:
            # Plain text response (older Claude versions)
            return AgentResponse(
                text=result.stdout.strip(),
                model=model or "claude-sonnet-4-6",
                duration_ms=duration_ms,
            )


# --- Codex backend ---

class CodexBackend:
    """Shells out to `codex exec ... --instructions ... -m <model> --json`.

    Codex emits JSONL event stream; the final assistant message is
    the `item.completed` event with `text` field.
    """
    name = "codex"

    def call(
        self,
        system: str,
        user: str,
        *,
        model: str | None = None,
        max_tokens: int = 4000,
    ) -> AgentResponse:
        cmd = [
            "codex", "exec", user,
            "--instructions", system,
            "-m", model or "gpt-5-codex",
            "--json",
        ]
        start = time.time()
        result = _run(cmd)
        duration_ms = int((time.time() - start) * 1000)

        if result.returncode != 0:
            raise BackendError(
                f"codex exec failed (rc={result.returncode}): {result.stderr.strip() or 'no stderr'}"
            )

        # Parse JSONL: find the last item.completed with text
        text_parts: list[str] = []
        model_used = model or "gpt-5-codex"
        for line in result.stdout.splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                evt = json.loads(line)
            except json.JSONDecodeError:
                continue
            if evt.get("type") == "item.completed":
                item_text = evt.get("text") or evt.get("content")
                if item_text:
                    text_parts.append(str(item_text))
            if "model" in evt and isinstance(evt["model"], str):
                model_used = evt["model"]

        text = "\n".join(text_parts) if text_parts else result.stdout.strip()
        return AgentResponse(
            text=text,
            model=model_used,
            duration_ms=duration_ms,
        )


# --- HTTP backend ---

class HTTPBackend:
    """POSTs to an OpenAI-compatible /v1/chat endpoint.

    Works with: LiteLLM proxy, OpenRouter, Ollama, LM Studio,
    vLLM, llama.cpp's server, or any compatible API.
    """
    name = "http"

    def __init__(
        self,
        endpoint: str,
        api_key: str | None = None,
        timeout: int = 300,
    ):
        self.endpoint = endpoint
        self.api_key = api_key
        self.timeout = timeout

    def call(
        self,
        system: str,
        user: str,
        *,
        model: str | None = None,
        max_tokens: int = 4000,
    ) -> AgentResponse:
        import httpx  # local import to keep optional

        body = {
            "system": system,
            "user": user,
            "model": model or "",
            "max_tokens": max_tokens,
        }
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        start = time.time()
        try:
            resp = httpx.post(
                self.endpoint,
                json=body,
                headers=headers,
                timeout=self.timeout,
            )
        except httpx.RequestError as e:
            raise BackendError(f"HTTP backend request failed: {e}") from e

        duration_ms = int((time.time() - start) * 1000)

        if resp.status_code >= 400:
            raise BackendError(
                f"HTTP backend returned {resp.status_code}: {resp.text[:500]}"
            )

        data = resp.json()
        text = data.get("text") or data.get("content") or data.get("message") or ""
        usage = data.get("usage") or {}
        return AgentResponse(
            text=text,
            model=data.get("model") or model or "http",
            tokens_in=usage.get("prompt_tokens") or usage.get("input_tokens"),
            tokens_out=usage.get("completion_tokens") or usage.get("output_tokens"),
            duration_ms=data.get("duration_ms", duration_ms),
            raw=data,
        )


# --- Factory ---

BACKENDS: dict[str, type[AgentBackend]] = {
    "offline": OfflineBackend,
    "hermes": HermesBackend,
    "claude": ClaudeBackend,
    "codex": CodexBackend,
}


def list_backends() -> list[str]:
    # 'http' is always available but requires endpoint+api_key at get_backend() time
    return list(BACKENDS.keys()) + ["http"]


def get_backend(
    name: str,
    *,
    endpoint: str | None = None,
    api_key: str | None = None,
    api_key_env: str | None = None,
) -> AgentBackend:
    """Get a backend by name. 'http' needs endpoint + api_key."""
    if name == "http":
        if not endpoint:
            raise ValueError("HTTP backend requires `endpoint`")
        if api_key_env and not api_key:
            api_key = os.environ.get(api_key_env, "")
        return HTTPBackend(endpoint=endpoint, api_key=api_key)
    if name not in BACKENDS:
        raise ValueError(f"Unknown backend: {name}. Available: {list_backends()}")
    return BACKENDS[name]()


def detect_available_backend(prefer: str | None = None) -> AgentBackend:
    """Pick the best available backend, in priority order: prefer > hermes > claude > codex > offline."""
    if prefer:
        try:
            return get_backend(prefer)
        except ValueError:
            logger.warning("Preferred backend %r not recognized, falling back to detection", prefer)
    # Check env var
    env_backend = os.environ.get("PREP_AGENT_BACKEND")
    if env_backend:
        try:
            return get_backend(env_backend)
        except ValueError:
            logger.warning("PREP_AGENT_BACKEND=%r invalid, ignoring", env_backend)
    # Auto-detect
    for name in ("hermes", "claude", "codex"):
        exe = {"hermes": "hermes", "claude": "claude", "codex": "codex"}[name]
        if shutil.which(exe):
            return BACKENDS[name]()
    return OfflineBackend()
