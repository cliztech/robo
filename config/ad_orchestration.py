"""Ad orchestration utilities integrated with clockwheel scheduling and content context.

Usage:
    from ad_orchestration import AdOrchestrator, Campaign, Creative, ClockwheelSpot

    orchestrator = AdOrchestrator()
    # add campaigns/creatives then request spots via `select_for_spot()`
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta
import json
from pathlib import Path
from typing import Dict, List, Optional, Sequence


@dataclass(frozen=True)
class Daypart:
    """Allowed airing window by weekday/hour.

    Weekday uses Python datetime convention (Monday=0, Sunday=6).
    """

    weekdays: Sequence[int]
    start_hour: int
    end_hour: int

    def matches(self, when: datetime) -> bool:
        return when.weekday() in self.weekdays and self.start_hour <= when.hour < self.end_hour


@dataclass(frozen=True)
class FrequencyCap:
    """Frequency caps used for campaign/creative pacing."""

    per_hour: int = 0
    per_day: int = 0


@dataclass(frozen=True)
class Creative:
    creative_id: str
    campaign_id: str
    name: str
    duration_seconds: int
    audio_asset: str
    priority: int = 1
    target_dayparts: Sequence[Daypart] = field(default_factory=list)
    separation_minutes: int = 0
    frequency_cap: FrequencyCap = field(default_factory=FrequencyCap)
    contextual_exclusions: Sequence[str] = field(default_factory=list)
    sponsor_name: Optional[str] = None


@dataclass(frozen=True)
class Campaign:
    campaign_id: str
    name: str
    priority: int = 1
    active: bool = True
    target_dayparts: Sequence[Daypart] = field(default_factory=list)
    frequency_cap: FrequencyCap = field(default_factory=FrequencyCap)


@dataclass(frozen=True)
class ClockwheelSpot:
    """A scheduled ad spot in the clockwheel."""

    spot_id: str
    break_id: str
    scheduled_at: datetime
    slot_duration_seconds: int
    content_topics: Sequence[str] = field(default_factory=list)


@dataclass(frozen=True)
class ProofOfPlay:
    spot_id: str
    break_id: str
    campaign_id: str
    creative_id: str
    played_at: datetime
    scheduled_at: datetime
    duration_seconds: int
    status: str

    def as_json(self) -> Dict[str, object]:
        payload = {
            "spot_id": self.spot_id,
            "break_id": self.break_id,
            "campaign_id": self.campaign_id,
            "creative_id": self.creative_id,
            "played_at": self.played_at.isoformat(),
            "scheduled_at": self.scheduled_at.isoformat(),
            "duration_seconds": self.duration_seconds,
            "status": self.status,
        }
        return payload


HOST_READ_TEMPLATES: Dict[str, str] = {
    "standard": (
        "This segment is sponsored by {sponsor_name}. {brand_message} "
        "Sponsored content; terms and conditions may apply."
    ),
    "disclosure_heavy": (
        "Paid sponsorship notice: {sponsor_name} supports this programming. "
        "{brand_message} This is a paid promotional mention."
    ),
    "cta": (
        "Thanks to {sponsor_name} for supporting the show. {brand_message} "
        "Learn more at {cta_url}. Sponsored message."
    ),
}


class AdOrchestrator:
    def __init__(self, proof_log_path: str = "config/ad_proof_of_play.jsonl") -> None:
        self.campaigns: Dict[str, Campaign] = {}
        self.creatives: Dict[str, Creative] = {}
        self.rotation_cursor: int = 0
        self.proof_log_path = Path(proof_log_path)
        self.play_history: List[ProofOfPlay] = []
        self.makegood_queue: List[ClockwheelSpot] = []

    def add_campaign(self, campaign: Campaign) -> None:
        self.campaigns[campaign.campaign_id] = campaign

    def add_creative(self, creative: Creative) -> None:
        if creative.campaign_id not in self.campaigns:
            raise ValueError(f"Campaign '{creative.campaign_id}' is not registered")
        self.creatives[creative.creative_id] = creative

    def select_for_spot(self, spot: ClockwheelSpot) -> Optional[Creative]:
        """Rotate through eligible creatives by weighted priority and freshness."""

        eligible = [c for c in self.creatives.values() if self._is_eligible(c, spot)]
        if not eligible:
            return None

        ranked = sorted(eligible, key=lambda c: (-self._score_creative(c), self._last_played_rank(c.creative_id)))
        chosen = ranked[self.rotation_cursor % len(ranked)]
        self.rotation_cursor += 1
        return chosen

    def _score_creative(self, creative: Creative) -> int:
        campaign = self.campaigns[creative.campaign_id]
        return campaign.priority * 10 + creative.priority

    def _last_played_rank(self, creative_id: str) -> datetime:
        for event in reversed(self.play_history):
            if event.creative_id == creative_id and event.status == "played":
                return event.played_at
        return datetime.min

    def _is_eligible(self, creative: Creative, spot: ClockwheelSpot) -> bool:
        campaign = self.campaigns[creative.campaign_id]
        if not campaign.active:
            return False
        if creative.duration_seconds > spot.slot_duration_seconds:
            return False
        if self._outside_daypart(campaign.target_dayparts, spot.scheduled_at):
            return False
        if self._outside_daypart(creative.target_dayparts, spot.scheduled_at):
            return False
        if self._is_frequency_capped(campaign.campaign_id, None, campaign.frequency_cap, spot.scheduled_at):
            return False
        if self._is_frequency_capped(campaign.campaign_id, creative.creative_id, creative.frequency_cap, spot.scheduled_at):
            return False
        if self._fails_separation(campaign.campaign_id, creative.creative_id, creative.separation_minutes, spot.scheduled_at):
            return False
        if self._has_contextual_conflict(creative, spot.content_topics):
            return False
        return True

    def _outside_daypart(self, dayparts: Sequence[Daypart], when: datetime) -> bool:
        if not dayparts:
            return False
        return not any(part.matches(when) for part in dayparts)

    def _is_frequency_capped(
        self,
        campaign_id: str,
        creative_id: Optional[str],
        cap: FrequencyCap,
        when: datetime,
    ) -> bool:
        if cap.per_hour <= 0 and cap.per_day <= 0:
            return False
        hour_floor = when.replace(minute=0, second=0, microsecond=0)
        day_floor = when.replace(hour=0, minute=0, second=0, microsecond=0)

        hour_plays = 0
        day_plays = 0
        for event in self.play_history:
            if event.status != "played":
                continue
            if event.campaign_id != campaign_id:
                continue
            if creative_id and event.creative_id != creative_id:
                continue
            if event.played_at >= hour_floor:
                hour_plays += 1
            if event.played_at >= day_floor:
                day_plays += 1

        if cap.per_hour > 0 and hour_plays >= cap.per_hour:
            return True
        if cap.per_day > 0 and day_plays >= cap.per_day:
            return True
        return False

    def _fails_separation(
        self,
        campaign_id: str,
        creative_id: str,
        separation_minutes: int,
        when: datetime,
    ) -> bool:
        if separation_minutes <= 0:
            return False
        cutoff = when - timedelta(minutes=separation_minutes)
        for event in reversed(self.play_history):
            if event.status != "played":
                continue
            if event.played_at < cutoff:
                break
            if event.campaign_id == campaign_id or event.creative_id == creative_id:
                return True
        return False

    def _has_contextual_conflict(self, creative: Creative, topics: Sequence[str]) -> bool:
        excluded = {entry.lower() for entry in creative.contextual_exclusions}
        context = {entry.lower() for entry in topics}
        return bool(excluded.intersection(context))

    def mark_played(self, spot: ClockwheelSpot, creative: Creative, played_at: Optional[datetime] = None) -> ProofOfPlay:
        played = played_at or datetime.utcnow()
        event = ProofOfPlay(
            spot_id=spot.spot_id,
            break_id=spot.break_id,
            campaign_id=creative.campaign_id,
            creative_id=creative.creative_id,
            played_at=played,
            scheduled_at=spot.scheduled_at,
            duration_seconds=creative.duration_seconds,
            status="played",
        )
        self._record_event(event)
        return event

    def mark_missed(self, spot: ClockwheelSpot, reason: str = "missed") -> ProofOfPlay:
        event = ProofOfPlay(
            spot_id=spot.spot_id,
            break_id=spot.break_id,
            campaign_id="",
            creative_id="",
            played_at=datetime.utcnow(),
            scheduled_at=spot.scheduled_at,
            duration_seconds=spot.slot_duration_seconds,
            status=reason,
        )
        self.makegood_queue.append(spot)
        self._record_event(event)
        return event

    def pop_makegood(self) -> Optional[ClockwheelSpot]:
        if not self.makegood_queue:
            return None
        return self.makegood_queue.pop(0)

    def render_sponsor_mention(
        self,
        sponsor_name: str,
        brand_message: str,
        template_key: str = "standard",
        cta_url: str = "https://example.com",
    ) -> str:
        template = HOST_READ_TEMPLATES.get(template_key, HOST_READ_TEMPLATES["standard"])
        return template.format(
            sponsor_name=sponsor_name,
            brand_message=brand_message,
            cta_url=cta_url,
        )

    def _record_event(self, event: ProofOfPlay) -> None:
        self.play_history.append(event)
        self.proof_log_path.parent.mkdir(parents=True, exist_ok=True)
        with self.proof_log_path.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(event.as_json()) + "\n")
