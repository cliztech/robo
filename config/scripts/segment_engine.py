"""Segment engine for multi-role radio breaks.

Usage:
    python config/scripts/segment_engine.py

This script generates a demo segment package containing:
- ordered utterances (turn plan)
- interruption annotations
- SSML payload for TTS
- plain script lines for downstream mixing
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date
from enum import Enum
import json
from typing import Dict, List, Optional


class SpeakerRole(str, Enum):
    HOST = "host"
    CO_HOST = "co_host"
    GUEST = "guest"
    CALLER = "caller"
    NEWS_READER = "news_reader"


class SegmentType(str, Enum):
    BANTER = "banter"
    INTERVIEW = "interview"
    PHONE_IN = "phone_in"
    TEASER = "teaser"
    RECAP = "recap"


class CallerArchetype(str, Enum):
    FAN = "fan"
    CRITIC = "critic"
    FIRST_TIME_LISTENER = "first_time_listener"


CONVERSATION_TEMPLATES: Dict[SegmentType, List[Dict[str, str]]] = {
    SegmentType.BANTER: [
        {"role": "host", "tone": "playful", "prompt": "set up a light topic"},
        {"role": "co_host", "tone": "witty", "prompt": "add a contrasting take"},
        {"role": "host", "tone": "warm", "prompt": "land with a station bridge"},
    ],
    SegmentType.INTERVIEW: [
        {"role": "host", "tone": "curious", "prompt": "welcome guest and frame topic"},
        {"role": "guest", "tone": "reflective", "prompt": "answer with a personal detail"},
        {"role": "host", "tone": "engaged", "prompt": "ask follow-up tied to listeners"},
    ],
    SegmentType.PHONE_IN: [
        {"role": "host", "tone": "inviting", "prompt": "introduce caller"},
        {"role": "caller", "tone": "animated", "prompt": "share reaction on topic"},
        {"role": "host", "tone": "steady", "prompt": "summarize and move forward"},
    ],
    SegmentType.TEASER: [
        {"role": "host", "tone": "energetic", "prompt": "tease upcoming content"},
        {"role": "news_reader", "tone": "crisp", "prompt": "drop one hard fact"},
        {"role": "host", "tone": "urgent", "prompt": "call to stay tuned"},
    ],
    SegmentType.RECAP: [
        {"role": "co_host", "tone": "friendly", "prompt": "recap key moments"},
        {"role": "host", "tone": "grateful", "prompt": "thank participants/listeners"},
        {"role": "host", "tone": "confident", "prompt": "handoff to next element"},
    ],
}


CALLER_STYLE: Dict[CallerArchetype, Dict[str, str]] = {
    CallerArchetype.FAN: {
        "tone_modifier": "excited and positive",
        "lexicon": "enthusiastic phrases and compliments",
    },
    CallerArchetype.CRITIC: {
        "tone_modifier": "firm but respectful",
        "lexicon": "specific complaints and comparisons",
    },
    CallerArchetype.FIRST_TIME_LISTENER: {
        "tone_modifier": "curious and tentative",
        "lexicon": "questions and newcomer observations",
    },
}


@dataclass
class PersonaMemory:
    persona_id: str
    role: SpeakerRole
    display_name: str
    continuity_notes: List[str] = field(default_factory=list)
    last_seen: Optional[str] = None

    def pointer(self) -> Dict[str, object]:
        return {
            "persona_id": self.persona_id,
            "role": self.role.value,
            "display_name": self.display_name,
            "continuity_notes": self.continuity_notes,
            "last_seen": self.last_seen,
        }


@dataclass
class Turn:
    order: int
    role: SpeakerRole
    tone: str
    max_duration_sec: int
    prompt: str
    text: str
    memory_pointer: Optional[Dict[str, object]] = None
    interruption: Optional[Dict[str, object]] = None

    def to_dict(self) -> Dict[str, object]:
        payload: Dict[str, object] = {
            "order": self.order,
            "role": self.role.value,
            "tone": self.tone,
            "max_duration_sec": self.max_duration_sec,
            "prompt": self.prompt,
            "text": self.text,
        }
        if self.memory_pointer:
            payload["memory_pointer"] = self.memory_pointer
        if self.interruption:
            payload["interruption"] = self.interruption
        return payload


class PersonaMemoryStore:
    """Lightweight day-to-day persona memory pointers."""

    def __init__(self) -> None:
        self._store: Dict[str, PersonaMemory] = {}

    def register(self, memory: PersonaMemory) -> None:
        self._store[memory.persona_id] = memory

    def update_last_seen(self, persona_id: str, seen_date: str) -> None:
        if persona_id in self._store:
            self._store[persona_id].last_seen = seen_date

    def pointer_for_role(self, role: SpeakerRole) -> Optional[Dict[str, object]]:
        for memory in self._store.values():
            if memory.role == role:
                return memory.pointer()
        return None


class SegmentEngine:
    def __init__(self) -> None:
        self.memory_store = PersonaMemoryStore()

    def seed_memory(self) -> None:
        self.memory_store.register(
            PersonaMemory(
                persona_id="guest-ava-lee",
                role=SpeakerRole.GUEST,
                display_name="Ava Lee",
                continuity_notes=[
                    "Producer and synth artist",
                    "Prefers analog gear references",
                ],
                last_seen="2026-02-10",
            )
        )
        self.memory_store.register(
            PersonaMemory(
                persona_id="caller-ryan-404",
                role=SpeakerRole.CALLER,
                display_name="Ryan from Northside",
                continuity_notes=["Calls in after night shifts", "Loves deep cuts"],
                last_seen="2026-02-11",
            )
        )

    def plan_turns(
        self,
        segment_type: SegmentType,
        max_segment_duration_sec: int,
        default_turn_duration_sec: int,
        caller_archetype: Optional[CallerArchetype] = None,
    ) -> List[Turn]:
        template = CONVERSATION_TEMPLATES[segment_type]
        turns: List[Turn] = []

        for idx, slot in enumerate(template, start=1):
            role = SpeakerRole(slot["role"])
            tone = slot["tone"]
            prompt = slot["prompt"]
            text = self._compose_text(role=role, prompt=prompt, tone=tone, caller_archetype=caller_archetype)

            turns.append(
                Turn(
                    order=idx,
                    role=role,
                    tone=tone,
                    max_duration_sec=default_turn_duration_sec,
                    prompt=prompt,
                    text=text,
                    memory_pointer=self.memory_store.pointer_for_role(role),
                )
            )

        turns = self._enforce_duration(turns=turns, max_total_duration=max_segment_duration_sec)
        turns = self._inject_radio_safe_interruptions(turns)
        self._touch_memory(turns)
        return turns

    def _compose_text(
        self,
        role: SpeakerRole,
        prompt: str,
        tone: str,
        caller_archetype: Optional[CallerArchetype],
    ) -> str:
        base = f"[{tone}] {role.value.replace('_', ' ').title()}: {prompt}."
        if role == SpeakerRole.CALLER and caller_archetype:
            style = CALLER_STYLE[caller_archetype]
            base += (
                f" Caller style: {caller_archetype.value} "
                f"({style['tone_modifier']}; {style['lexicon']})."
            )
        return base

    def _enforce_duration(self, turns: List[Turn], max_total_duration: int) -> List[Turn]:
        total = sum(turn.max_duration_sec for turn in turns)
        if total <= max_total_duration:
            return turns

        overflow = total - max_total_duration
        for turn in reversed(turns):
            if overflow <= 0:
                break
            reducible = max(0, turn.max_duration_sec - 8)
            reduction = min(reducible, overflow)
            turn.max_duration_sec -= reduction
            overflow -= reduction
        return turns

    def _inject_radio_safe_interruptions(self, turns: List[Turn]) -> List[Turn]:
        for idx, turn in enumerate(turns):
            if turn.role != SpeakerRole.CALLER:
                continue
            if idx + 1 >= len(turns):
                continue
            next_turn = turns[idx + 1]
            if next_turn.role == SpeakerRole.HOST:
                next_turn.interruption = {
                    "mode": "radio_safe_wrap",
                    "trigger": "caller_overrun_or_ramble",
                    "target": "host",
                    "max_wrap_sec": 8,
                    "instruction": "Acknowledge caller, summarize in one sentence, pivot cleanly.",
                }
        return turns

    def _touch_memory(self, turns: List[Turn]) -> None:
        today = date.today().isoformat()
        for turn in turns:
            pointer = turn.memory_pointer
            if pointer:
                self.memory_store.update_last_seen(pointer["persona_id"], today)
                turn.memory_pointer = self.memory_store.pointer_for_role(turn.role)

    def emit_package(self, segment_id: str, turns: List[Turn]) -> Dict[str, object]:
        ssml_chunks = []
        script_lines = []
        for turn in turns:
            voice_name = turn.role.value
            ssml_chunks.append(
                "".join(
                    [
                        f'<voice name="{voice_name}">',
                        f'<prosody rate="medium">{turn.text}</prosody>',
                        "</voice>",
                    ]
                )
            )
            script_lines.append(f"{turn.order:02d} {turn.role.value.upper()}: {turn.text}")

        return {
            "segment_id": segment_id,
            "turn_plan": [turn.to_dict() for turn in turns],
            "ssml": f"<speak>{''.join(ssml_chunks)}</speak>",
            "script": "\n".join(script_lines),
        }


def build_demo_segment() -> Dict[str, object]:
    engine = SegmentEngine()
    engine.seed_memory()
    turns = engine.plan_turns(
        segment_type=SegmentType.PHONE_IN,
        max_segment_duration_sec=54,
        default_turn_duration_sec=20,
        caller_archetype=CallerArchetype.CRITIC,
    )
    return engine.emit_package(segment_id="drive_time_phone_in_001", turns=turns)


if __name__ == "__main__":
    package = build_demo_segment()
    print(json.dumps(package, indent=2))
