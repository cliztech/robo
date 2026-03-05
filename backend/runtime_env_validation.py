from __future__ import annotations

import json
import os
from dataclasses import dataclass

RUNTIME_CONTEXT_ENV = "ROBODJ_RUNTIME_CONTEXT"
ALLOWED_RUNTIME_CONTEXTS = ("desktop_app", "docker_stack", "ci")

REQUIRED_ENV_BY_CONTEXT: dict[str, tuple[str, ...]] = {
    "desktop_app": (),
    "docker_stack": (
        "ROBODJ_SECRET_KEY",
        "ROBODJ_SECRET_V2_KEY",
        "ROBODJ_SCHEDULER_API_KEY",
    ),
    "ci": (
        "ROBODJ_SECRET_KEY",
        "ROBODJ_SECRET_V2_KEY",
        "ROBODJ_SCHEDULER_API_KEY",
    ),
}


@dataclass(frozen=True)
class RuntimeEnvValidationResult:
    ok: bool
    context: str | None
    missing_keys: tuple[str, ...]
    invalid_context: bool

    def to_summary(self) -> dict[str, object]:
        return {
            "ok": self.ok,
            "runtime_context": self.context,
            "invalid_context": self.invalid_context,
            "missing_keys": list(self.missing_keys),
        }


def validate_runtime_environment(env: dict[str, str] | None = None) -> RuntimeEnvValidationResult:
    source = env if env is not None else os.environ
    context = source.get(RUNTIME_CONTEXT_ENV)
    if context not in ALLOWED_RUNTIME_CONTEXTS:
        return RuntimeEnvValidationResult(
            ok=False,
            context=context,
            missing_keys=(RUNTIME_CONTEXT_ENV,),
            invalid_context=True,
        )

    required_keys = REQUIRED_ENV_BY_CONTEXT[context]
    missing_keys = tuple(key for key in required_keys if not source.get(key))
    return RuntimeEnvValidationResult(
        ok=not missing_keys,
        context=context,
        missing_keys=missing_keys,
        invalid_context=False,
    )


def log_runtime_validation_summary(result: RuntimeEnvValidationResult) -> None:
    print(
        "runtime_env_validation_summary=" + json.dumps(result.to_summary(), sort_keys=True),
        flush=True,
    )


def enforce_runtime_environment(env: dict[str, str] | None = None) -> RuntimeEnvValidationResult:
    result = validate_runtime_environment(env=env)
    log_runtime_validation_summary(result)
    if result.ok:
        return result

    raise RuntimeError(
        "Runtime environment contract validation failed: "
        + json.dumps(result.to_summary(), sort_keys=True)
    )
