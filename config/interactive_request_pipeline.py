"""Controlled interactivity pipeline feeding the segment engine.

Usage:
    python interactive_request_pipeline.py

This script is intentionally lightweight for this distribution repository. It
models intake channels, moderation, eligibility checks, host acknowledgements,
synthetic off-peak generation, and staffed live-human takeover routing.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
import random
import re
from typing import Dict, Iterable, List, Optional


SPAM_PATTERNS = [
    re.compile(r"\b(buy now|free money|crypto giveaway|click here)\b", re.IGNORECASE),
    re.compile(r"https?://", re.IGNORECASE),
]

ABUSE_PATTERNS = [
    re.compile(r"\b(hate|slur|kill)\b", re.IGNORECASE),
]

PII_PATTERNS = {
    "email": re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}"),
    "phone": re.compile(r"(?:\+?\d[\d\s\-()]{7,}\d)"),
}


@dataclass
class Request:
    request_id: str
    channel: str
    listener_name: str
    raw_text: str
    submitted_at: datetime
    requested_track: Optional[str] = None
    synthetic: bool = False
    live_human_opt_in: bool = False

    clean_text: str = ""
    moderation_flags: List[str] = field(default_factory=list)
    eligibility: List[str] = field(default_factory=list)


class ModerationPipeline:
    def run(self, request: Request) -> Request:
        text = request.raw_text

        for pattern in SPAM_PATTERNS:
            if pattern.search(text):
                request.moderation_flags.append("spam")
                break

        for pattern in ABUSE_PATTERNS:
            if pattern.search(text):
                request.moderation_flags.append("abuse")
                break

        clean_text = text
        pii_found = False
        for label, pattern in PII_PATTERNS.items():
            if pattern.search(clean_text):
                pii_found = True
                clean_text = pattern.sub(f"[{label}_redacted]", clean_text)

        if pii_found:
            request.moderation_flags.append("pii_redacted")

        request.clean_text = clean_text.strip()
        return request


class EligibilityEngine:
    def __init__(self, library: Iterable[str], max_requests_per_listener: int = 3) -> None:
        self.library = {track.lower() for track in library}
        self.max_requests_per_listener = max_requests_per_listener
        self.listener_history: Dict[str, int] = {}
        self.recent_request_texts: List[str] = []

    def evaluate(self, request: Request) -> Request:
        if request.moderation_flags and any(
            flag in {"spam", "abuse"} for flag in request.moderation_flags
        ):
            request.eligibility.append("rejected: moderation")
            return request

        if request.requested_track:
            if request.requested_track.lower() not in self.library:
                request.eligibility.append("rejected: library_mismatch")
            else:
                request.eligibility.append("passed: library_match")

        count = self.listener_history.get(request.listener_name.lower(), 0)
        if count >= self.max_requests_per_listener:
            request.eligibility.append("rejected: repetition_limit")
        else:
            request.eligibility.append("passed: repetition_limit")

        normalized_text = request.clean_text.lower()
        if normalized_text and normalized_text in self.recent_request_texts:
            request.eligibility.append("rejected: duplicate_request")
        else:
            request.eligibility.append("passed: uniqueness")

        if not any(item.startswith("rejected") for item in request.eligibility):
            self.listener_history[request.listener_name.lower()] = count + 1
            if normalized_text:
                self.recent_request_texts.append(normalized_text)
                self.recent_request_texts = self.recent_request_texts[-100:]

        return request


class SegmentRequestQueue:
    def __init__(self) -> None:
        self.pending: List[Request] = []
        self.live_human_queue: List[Request] = []

    def enqueue(self, request: Request, staffed_hours: bool) -> None:
        rejected = any(item.startswith("rejected") for item in request.eligibility)
        if rejected:
            return

        if request.live_human_opt_in and staffed_hours:
            self.live_human_queue.append(request)
            return

        self.pending.append(request)


class HostAcknowledgementAgent:
    ACK_TEMPLATES = [
        "{name}, great pick. We'll line up {track} shortly!",
        "Love this one, {name}. Thanks for sending in {track}.",
        "{name}, your request is in. {track} fits today's vibe perfectly.",
    ]

    def acknowledge(self, request: Request) -> str:
        track = request.requested_track or "your request"
        template = random.choice(self.ACK_TEMPLATES)
        synthetic_label = " [synthetic queue seed]" if request.synthetic else ""
        return template.format(name=request.listener_name, track=track) + synthetic_label


class SyntheticCallGenerator:
    def __init__(self, synthetic_names: Optional[List[str]] = None) -> None:
        self.synthetic_names = synthetic_names or ["Alex", "Jordan", "Casey", "Sam"]

    def generate(self, count: int) -> List[Request]:
        seeds = [
            ("Requesting an upbeat throwback for the late crew.", "Midnight City"),
            ("Can we get a chill groove while working night shift?", "Sunset Drive"),
            ("Sending love to everyone awake right now!", "Neon Nights"),
        ]

        generated: List[Request] = []
        for index in range(count):
            text, track = random.choice(seeds)
            generated.append(
                Request(
                    request_id=f"syn-{index+1}",
                    channel="synthetic_generator",
                    listener_name=random.choice(self.synthetic_names),
                    raw_text=text,
                    submitted_at=datetime.utcnow(),
                    requested_track=track,
                    synthetic=True,
                )
            )
        return generated


class InteractivityOrchestrator:
    def __init__(self, config: Dict[str, object]) -> None:
        library = config.get("library_catalog", [])
        self.moderation = ModerationPipeline()
        self.eligibility = EligibilityEngine(library=library)
        self.queue = SegmentRequestQueue()
        self.host = HostAcknowledgementAgent()
        self.synthetic = SyntheticCallGenerator()

        self.channels = config.get("channels", {})
        self.staffed_hours = bool(config.get("staffed_hours", False))
        self.synthetic_off_peak_count = int(config.get("synthetic_off_peak_count", 0))

    def intake(self, request: Request) -> Optional[str]:
        enabled = bool(self.channels.get(request.channel, False))
        if not enabled:
            return None

        self.moderation.run(request)
        self.eligibility.evaluate(request)
        self.queue.enqueue(request, staffed_hours=self.staffed_hours)

        if any(item.startswith("rejected") for item in request.eligibility):
            return None

        return self.host.acknowledge(request)

    def seed_off_peak(self) -> List[str]:
        acknowledgements: List[str] = []
        for request in self.synthetic.generate(self.synthetic_off_peak_count):
            ack = self.intake(request)
            if ack:
                acknowledgements.append(ack)
        return acknowledgements


def example_configuration() -> Dict[str, object]:
    return {
        "channels": {
            "web_form": True,
            "chat": True,
            "messaging_bridge": False,
            "synthetic_generator": True,
        },
        "library_catalog": [
            "Midnight City",
            "Sunset Drive",
            "Neon Nights",
            "Ocean Air",
        ],
        "staffed_hours": True,
        "synthetic_off_peak_count": 2,
    }


def demo() -> None:
    orchestrator = InteractivityOrchestrator(example_configuration())

    requests = [
        Request(
            request_id="req-1",
            channel="web_form",
            listener_name="Maya",
            raw_text="Hey team, play Neon Nights for my drive home!",
            requested_track="Neon Nights",
            submitted_at=datetime.utcnow(),
        ),
        Request(
            request_id="req-2",
            channel="chat",
            listener_name="Luis",
            raw_text="I am at luis@example.com if you need details. Can I hear Ocean Air?",
            requested_track="Ocean Air",
            submitted_at=datetime.utcnow(),
            live_human_opt_in=True,
        ),
        Request(
            request_id="req-3",
            channel="messaging_bridge",
            listener_name="Nina",
            raw_text="Can you spin Midnight City?",
            requested_track="Midnight City",
            submitted_at=datetime.utcnow(),
        ),
    ]

    print("=== Live Intake ===")
    for req in requests:
        ack = orchestrator.intake(req)
        print(f"{req.request_id}: eligibility={req.eligibility} flags={req.moderation_flags}")
        if ack:
            print(f"  host_ack: {ack}")

    print("\n=== Synthetic Off-Peak Queue Seeding ===")
    for ack in orchestrator.seed_off_peak():
        print(f"  host_ack: {ack}")

    print("\n=== Queue Status ===")
    print(f"segment_pending={len(orchestrator.queue.pending)}")
    print(f"live_human_takeover_queue={len(orchestrator.queue.live_human_queue)}")


if __name__ == "__main__":
    demo()
