# Ad Orchestration Usage

`ad_orchestration.py` provides lightweight ad scheduling primitives for RoboDJ clockwheel automation.

## Features
- Ad inventory model (campaign + creative + dayparts + priority + caps)
- Rotation with priority weighting, frequency caps, and separation
- Contextual exclusions using content topics
- Proof-of-play JSONL logging (`config/ad_proof_of_play.jsonl`)
- Makegood queue for missed spots
- Sponsor mention templates with compliance phrasing

## Quick Example

```python
from datetime import datetime
from ad_orchestration import (
    AdOrchestrator, Campaign, Creative, ClockwheelSpot, Daypart, FrequencyCap
)

orchestrator = AdOrchestrator()
orchestrator.add_campaign(Campaign(
    campaign_id="cmp_1",
    name="Morning Sponsor",
    priority=5,
    target_dayparts=[Daypart(weekdays=[0, 1, 2, 3, 4], start_hour=6, end_hour=12)],
    frequency_cap=FrequencyCap(per_hour=2, per_day=10),
))
orchestrator.add_creative(Creative(
    creative_id="cr_1",
    campaign_id="cmp_1",
    name="30s spot",
    duration_seconds=30,
    audio_asset="assets/sponsor_30s.wav",
    contextual_exclusions=["breaking_news", "tragedy"],
    separation_minutes=15,
    frequency_cap=FrequencyCap(per_hour=1, per_day=6),
))

spot = ClockwheelSpot(
    spot_id="spot_1001",
    break_id="break_08_30",
    scheduled_at=datetime.utcnow(),
    slot_duration_seconds=30,
    content_topics=["music", "weather"],
)

creative = orchestrator.select_for_spot(spot)
if creative:
    orchestrator.mark_played(spot, creative)
else:
    orchestrator.mark_missed(spot)
```
