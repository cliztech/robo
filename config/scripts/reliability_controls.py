import json
import random
import re
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable, Dict, List, Optional, Tuple


@dataclass
class ProviderResult:
    provider_name: str
    payload: str
    latency_ms: int


@dataclass
class CircuitBreaker:
    failure_threshold: int = 2
    open_seconds: int = 30
    consecutive_failures: int = 0
    opened_at: Optional[float] = None

    def can_attempt(self) -> bool:
        if self.opened_at is None:
            return True
        elapsed = time.time() - self.opened_at
        if elapsed >= self.open_seconds:
            self.opened_at = None
            self.consecutive_failures = 0
            return True
        return False

    def on_success(self) -> None:
        self.consecutive_failures = 0
        self.opened_at = None

    def on_failure(self) -> None:
        self.consecutive_failures += 1
        if self.consecutive_failures >= self.failure_threshold:
            self.opened_at = time.time()


@dataclass
class Provider:
    name: str
    handler: Callable[[str], str]
    timeout_ms: int
    circuit_breaker: CircuitBreaker = field(default_factory=CircuitBreaker)


@dataclass
class ReliabilityConfig:
    script_confidence_threshold: float = 0.7
    tts_confidence_threshold: float = 0.75
    profanity_terms: Tuple[str, ...] = ("damn", "hell", "shit", "fuck")
    max_retries_per_provider: int = 2
    dead_air_timeout_ms: int = 1800
    postmortem_log_path: Path = Path("config/logs/reliability_postmortem.jsonl")


class ReliabilityController:
    def __init__(self, config: ReliabilityConfig):
        self.config = config
        self.config.postmortem_log_path.parent.mkdir(parents=True, exist_ok=True)

    def score_script_confidence(self, text: str) -> float:
        if not text.strip():
            return 0.0
        punctuation_bonus = 0.1 if re.search(r"[.!?]", text) else 0
        length_penalty = 0.25 if len(text.split()) < 10 else 0
        uppercase_penalty = 0.2 if text.isupper() else 0
        profanity_penalty = 0.4 if self.contains_profanity(text) else 0
        base = 0.9 + punctuation_bonus - length_penalty - uppercase_penalty - profanity_penalty
        return max(0.0, min(1.0, base))

    def score_tts_confidence(self, transcript: str, expected_script: str) -> float:
        if not transcript.strip():
            return 0.0
        script_words = set(expected_script.lower().split())
        transcript_words = set(transcript.lower().split())
        overlap = len(script_words.intersection(transcript_words)) / max(1, len(script_words))
        profanity_penalty = 0.35 if self.contains_profanity(transcript) else 0
        return max(0.0, min(1.0, overlap - profanity_penalty))

    def contains_profanity(self, text: str) -> bool:
        lowered = f" {text.lower()} "
        return any(f" {term} " in lowered for term in self.config.profanity_terms)

    def filter_script(self, text: str) -> str:
        filtered = text
        for term in self.config.profanity_terms:
            filtered = re.sub(rf"\b{re.escape(term)}\b", "[redacted]", filtered, flags=re.IGNORECASE)
        return filtered

    def call_with_retries(self, prompt: str, providers: List[Provider], stage: str) -> Optional[ProviderResult]:
        for provider in providers:
            if not provider.circuit_breaker.can_attempt():
                self.emit_alert("provider_circuit_open", stage, provider=provider.name)
                continue

            for attempt in range(1, self.config.max_retries_per_provider + 1):
                started = time.time()
                try:
                    payload = provider.handler(prompt)
                    latency_ms = int((time.time() - started) * 1000)
                    if latency_ms > provider.timeout_ms:
                        raise TimeoutError(f"{provider.name} timeout ({latency_ms}ms)")
                    provider.circuit_breaker.on_success()
                    return ProviderResult(provider.name, payload, latency_ms)
                except Exception as exc:
                    provider.circuit_breaker.on_failure()
                    self.emit_alert(
                        "provider_failure",
                        stage,
                        provider=provider.name,
                        attempt=attempt,
                        error=str(exc),
                    )
        return None

    def dead_air_watchdog(self, start_time: float, stage: str) -> Optional[str]:
        elapsed_ms = int((time.time() - start_time) * 1000)
        if elapsed_ms > self.config.dead_air_timeout_ms:
            filler = "You're listening to RoboDJ — more music coming right up."
            self.emit_alert("dead_air_watchdog_triggered", stage, elapsed_ms=elapsed_ms, filler=filler)
            return filler
        return None

    def fallback_liner(self, reason: str) -> str:
        liner = "This is RoboDJ. Stay tuned for nonstop music while we reset the studio stack."
        self.emit_alert("fallback_liner_inserted", "fallback", reason=reason, liner=liner)
        return liner

    def emergency_music_mode(self, reason: str) -> Dict[str, str]:
        payload = {
            "mode": "music_only_emergency",
            "reason": reason,
            "action": "queue_music_bed_and_station_ids",
        }
        self.emit_alert("music_only_emergency_mode", "fallback", **payload)
        return payload

    def emit_alert(self, event_type: str, stage: str, **details: object) -> None:
        entry = {
            "timestamp": int(time.time()),
            "event_type": event_type,
            "stage": stage,
            "details": details,
        }
        print(f"[ALERT] {event_type} ({stage}): {details}")
        with self.config.postmortem_log_path.open("a", encoding="utf-8") as fh:
            fh.write(json.dumps(entry) + "\n")


# Demo provider handlers for local verification.
def fast_provider(prompt: str) -> str:
    return f"Tonight's mix keeps rolling. {prompt}"


def flaky_provider(prompt: str) -> str:
    if random.random() < 0.6:
        raise RuntimeError("upstream 502")
    return f"Backup voice: {prompt}"


def slow_provider(prompt: str) -> str:
    time.sleep(2.2)
    return f"Slow response for: {prompt}"


def run_demo() -> None:
    controller = ReliabilityController(ReliabilityConfig())

    script_providers = [
        Provider(name="llm-primary", handler=slow_provider, timeout_ms=600),
        Provider(name="llm-secondary", handler=flaky_provider, timeout_ms=900),
        Provider(name="llm-tertiary", handler=fast_provider, timeout_ms=900),
    ]

    tts_providers = [
        Provider(name="tts-primary", handler=flaky_provider, timeout_ms=700),
        Provider(name="tts-secondary", handler=fast_provider, timeout_ms=700),
    ]

    start = time.time()
    prompt = "Up next is Neon Nights by AI Synthwave Collective."

    script_result = controller.call_with_retries(prompt, script_providers, stage="script_generation")
    watchdog_filler = controller.dead_air_watchdog(start, stage="script_generation")

    if watchdog_filler:
        print("Watchdog filler inserted:", watchdog_filler)

    if not script_result:
        print(controller.fallback_liner("all_script_providers_failed"))
        print(controller.emergency_music_mode("script_generation_outage"))
        return

    script = controller.filter_script(script_result.payload)
    script_confidence = controller.score_script_confidence(script)

    if script_confidence < controller.config.script_confidence_threshold:
        print(controller.fallback_liner("low_script_confidence"))
        print(controller.emergency_music_mode("script_low_confidence"))
        return

    tts_result = controller.call_with_retries(script, tts_providers, stage="tts_synthesis")
    if not tts_result:
        print(controller.fallback_liner("tts_timeout_or_failure"))
        print(controller.emergency_music_mode("tts_outage"))
        return

    transcript = controller.filter_script(tts_result.payload)
    tts_confidence = controller.score_tts_confidence(transcript, script)

    if tts_confidence < controller.config.tts_confidence_threshold:
        print(controller.fallback_liner("low_tts_confidence"))
        print(controller.emergency_music_mode("tts_low_confidence"))
        return

    print("Script provider:", script_result.provider_name)
    print("TTS provider:", tts_result.provider_name)
    print("Script confidence:", round(script_confidence, 3))
    print("TTS confidence:", round(tts_confidence, 3))
    print("Final approved output:", transcript)


if __name__ == "__main__":
    run_demo()
