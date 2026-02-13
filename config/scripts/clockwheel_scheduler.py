"""Clockwheel scheduler module for radio-style programming.

Features:
- ClockTemplate entities with hourly/minute category slots.
- Rule engine for artist/title separation, tempo curve, explicit windows,
  and daypart persona constraints.
- Safe fallback behavior when category inventory is empty.
- 24-hour simulation endpoint that renders predicted logs without audio emission.
- Human-lock flags to protect manually placed items from AI replanning.
- Validation report support before schedule activation.

Run endpoint:
    python clockwheel_scheduler.py --serve --port 8080

Simulate from CLI:
    python clockwheel_scheduler.py --simulate
"""

from __future__ import annotations

import argparse
import json
import random
from dataclasses import dataclass, field
from datetime import date, datetime, time, timedelta
from enum import Enum
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Dict, Iterable, List, Optional, Sequence, Tuple


class Category(str, Enum):
    station_id = "station_id"
    power = "power"
    recurrent = "recurrent"
    gold = "gold"
    talk_break = "talk_break"
    ad_break = "ad_break"
    news = "news"
    sweeper = "sweeper"


@dataclass(frozen=True)
class ClockSlot:
    minute: int
    category: Category
    human_lock: bool = False


@dataclass
class ClockTemplate:
    """Defines an hourly clock as minute slots mapped to categories."""

    name: str
    slots: List[ClockSlot]

    def __post_init__(self) -> None:
        used_minutes = set()
        for slot in self.slots:
            if slot.minute < 0 or slot.minute > 59:
                raise ValueError(f"Clock slot minute out of range: {slot.minute}")
            if slot.minute in used_minutes:
                raise ValueError(f"Duplicate clock minute detected: {slot.minute}")
            used_minutes.add(slot.minute)
        self.slots.sort(key=lambda slot: slot.minute)


@dataclass
class InventoryItem:
    id: str
    title: str
    artist: str
    category: Category
    energy: int = 5
    explicit: bool = False
    personas: List[str] = field(default_factory=list)


@dataclass
class ScheduledItem:
    start: datetime
    slot_minute: int
    category: Category
    item: InventoryItem
    human_lock: bool = False
    fallback_used: bool = False


@dataclass
class DaypartRule:
    start_hour: int
    end_hour: int
    personas: List[str]

    def includes(self, hour: int) -> bool:
        if self.start_hour <= self.end_hour:
            return self.start_hour <= hour <= self.end_hour
        return hour >= self.start_hour or hour <= self.end_hour


@dataclass
class SchedulerRules:
    min_artist_separation: int = 2
    min_title_separation: int = 12
    explicit_allowed_windows: List[Tuple[time, time]] = field(
        default_factory=lambda: [(time(22, 0), time(23, 59))]
    )
    daypart_personas: List[DaypartRule] = field(
        default_factory=lambda: [
            DaypartRule(6, 9, ["morning"]),
            DaypartRule(10, 14, ["workday"]),
            DaypartRule(15, 19, ["drive"]),
            DaypartRule(20, 23, ["night"]),
        ]
    )


def in_time_window(moment: time, start: time, end: time) -> bool:
    if start <= end:
        return start <= moment <= end
    return moment >= start or moment <= end


def explicit_allowed(dt: datetime, rules: SchedulerRules) -> bool:
    current = dt.time()
    return any(in_time_window(current, start, end) for start, end in rules.explicit_allowed_windows)


def required_personas(dt: datetime, rules: SchedulerRules) -> List[str]:
    for rule in rules.daypart_personas:
        if rule.includes(dt.hour):
            return rule.personas
    return []


def target_energy(slot_index: int, slot_count: int) -> Tuple[int, int]:
    """A simple radio-style hour energy arc: rise -> peak -> settle."""
    if slot_count <= 1:
        return 4, 8
    ratio = slot_index / (slot_count - 1)
    if ratio < 0.33:
        return 5, 8
    if ratio < 0.66:
        return 7, 10
    return 4, 7


def safe_fallback_item(category: Category) -> InventoryItem:
    return InventoryItem(
        id=f"fallback-{category.value}",
        title=f"Safe {category.value.replace('_', ' ').title()}",
        artist="RoboDJ",
        category=category,
        energy=5,
        explicit=False,
        personas=["default", "workday", "drive", "night", "morning"],
    )


def _choose_item(
    candidates: Sequence[InventoryItem],
    category: Category,
    dt: datetime,
    rules: SchedulerRules,
    recent_artists: List[str],
    recent_titles: List[str],
    slot_idx: int,
    total_slots: int,
) -> Tuple[InventoryItem, bool, List[str]]:
    violations: List[str] = []

    if not candidates:
        return safe_fallback_item(category), True, [f"Inventory empty for {category.value}; used fallback."]

    energy_min, energy_max = target_energy(slot_idx, total_slots)
    personas_required = required_personas(dt, rules)

    filtered = list(candidates)
    if category in {Category.power, Category.recurrent, Category.gold}:
        filtered = [
            item for item in filtered if not (item.explicit and not explicit_allowed(dt, rules))
        ]
        if not filtered:
            return safe_fallback_item(category), True, [
                f"All {category.value} inventory blocked by explicit-content window; used fallback."
            ]

        filtered_persona = [
            item for item in filtered if not personas_required or set(item.personas) & set(personas_required)
        ]
        if filtered_persona:
            filtered = filtered_persona
        else:
            violations.append(
                f"No {category.value} items matched daypart personas {personas_required}; relaxing persona constraint."
            )

        filtered_energy = [item for item in filtered if energy_min <= item.energy <= energy_max]
        if filtered_energy:
            filtered = filtered_energy
        else:
            violations.append(
                f"No {category.value} items matched target energy {energy_min}-{energy_max}; relaxing energy curve."
            )

        filtered_sep = [
            item
            for item in filtered
            if item.artist not in recent_artists[: rules.min_artist_separation]
            and item.title not in recent_titles[: rules.min_title_separation]
        ]
        if filtered_sep:
            filtered = filtered_sep
        else:
            violations.append(
                f"No {category.value} items met artist/title separation; relaxing separation."
            )

    if not filtered:
        return safe_fallback_item(category), True, violations + [
            f"No usable {category.value} candidate after constraints; used fallback."
        ]

    return random.choice(filtered), False, violations


def generate_hour(
    template: ClockTemplate,
    start_dt: datetime,
    inventory: Dict[Category, List[InventoryItem]],
    rules: SchedulerRules,
    locked_items: Optional[Dict[int, InventoryItem]] = None,
    seed: Optional[int] = None,
) -> Tuple[List[ScheduledItem], List[str]]:
    if seed is not None:
        random.seed(seed)

    scheduled: List[ScheduledItem] = []
    report: List[str] = []
    recent_artists: List[str] = []
    recent_titles: List[str] = []
    locked_items = locked_items or {}

    for idx, slot in enumerate(template.slots):
        slot_dt = start_dt.replace(minute=slot.minute, second=0, microsecond=0)
        if slot.minute in locked_items:
            locked_item = locked_items[slot.minute]
            scheduled.append(
                ScheduledItem(
                    start=slot_dt,
                    slot_minute=slot.minute,
                    category=slot.category,
                    item=locked_item,
                    human_lock=True,
                    fallback_used=False,
                )
            )
            recent_artists.insert(0, locked_item.artist)
            recent_titles.insert(0, locked_item.title)
            continue

        pool = inventory.get(slot.category, [])
        chosen, fallback_used, messages = _choose_item(
            pool,
            slot.category,
            slot_dt,
            rules,
            recent_artists,
            recent_titles,
            idx,
            len(template.slots),
        )
        report.extend([f"{slot_dt.isoformat()} {m}" for m in messages])

        scheduled.append(
            ScheduledItem(
                start=slot_dt,
                slot_minute=slot.minute,
                category=slot.category,
                item=chosen,
                human_lock=slot.human_lock,
                fallback_used=fallback_used,
            )
        )
        recent_artists.insert(0, chosen.artist)
        recent_titles.insert(0, chosen.title)

    return scheduled, report


def replan_hour(
    existing: List[ScheduledItem],
    template: ClockTemplate,
    inventory: Dict[Category, List[InventoryItem]],
    rules: SchedulerRules,
    seed: Optional[int] = None,
) -> Tuple[List[ScheduledItem], List[str]]:
    """Replan an hour while preserving human-locked items."""
    if not existing:
        raise ValueError("Existing schedule is required for replanning.")

    locked = {
        item.slot_minute: item.item
        for item in existing
        if item.human_lock
    }
    hour_start = existing[0].start.replace(minute=0, second=0, microsecond=0)
    return generate_hour(template, hour_start, inventory, rules, locked_items=locked, seed=seed)


def simulate_24h(
    templates_by_hour: Dict[int, ClockTemplate],
    inventory: Dict[Category, List[InventoryItem]],
    rules: SchedulerRules,
    start_date: Optional[date] = None,
    seed: Optional[int] = None,
) -> Dict[str, object]:
    start_date = start_date or date.today()
    predicted_log: List[ScheduledItem] = []
    report: List[str] = []

    for hour in range(24):
        template = templates_by_hour[hour]
        dt = datetime.combine(start_date, time(hour=hour))
        hour_schedule, hour_report = generate_hour(template, dt, inventory, rules, seed=seed)
        predicted_log.extend(hour_schedule)
        report.extend(hour_report)

    return {
        "date": start_date.isoformat(),
        "items": [
            {
                "time": item.start.isoformat(),
                "category": item.category.value,
                "title": item.item.title,
                "artist": item.item.artist,
                "human_lock": item.human_lock,
                "fallback_used": item.fallback_used,
            }
            for item in predicted_log
        ],
        "warnings": report,
        "audio_emitted": False,
    }


def validate_schedule(
    predicted_log: List[ScheduledItem],
    rules: SchedulerRules,
) -> Dict[str, object]:
    violations: List[str] = []

    last_artist_positions: Dict[str, int] = {}
    last_title_positions: Dict[str, int] = {}

    music_categories = {Category.power, Category.recurrent, Category.gold}

    for idx, row in enumerate(predicted_log):
        item = row.item
        is_music = row.category in music_categories

        if is_music and item.artist in last_artist_positions:
            sep = idx - last_artist_positions[item.artist]
            if sep <= rules.min_artist_separation:
                violations.append(
                    f"Artist separation violation at {row.start.isoformat()}: {item.artist} repeated after {sep} slots."
                )
        if is_music and item.title in last_title_positions:
            sep = idx - last_title_positions[item.title]
            if sep <= rules.min_title_separation:
                violations.append(
                    f"Title separation violation at {row.start.isoformat()}: {item.title} repeated after {sep} slots."
                )

        if is_music and item.explicit and not explicit_allowed(row.start, rules):
            violations.append(
                f"Explicit-content window violation at {row.start.isoformat()} for {item.title}."
            )

        personas_required = required_personas(row.start, rules)
        if is_music and personas_required and not (set(item.personas) & set(personas_required)):
            violations.append(
                f"Daypart persona violation at {row.start.isoformat()} ({personas_required}) for {item.title}."
            )

        if is_music:
            last_artist_positions[item.artist] = idx
            last_title_positions[item.title] = idx

    return {
        "ok": not violations,
        "violation_count": len(violations),
        "violations": violations,
    }


def activate_schedule(predicted_log: List[ScheduledItem], rules: SchedulerRules) -> Dict[str, object]:
    """Validate before activation and return a report payload."""
    report = validate_schedule(predicted_log, rules)
    if not report["ok"]:
        raise ValueError("Schedule activation blocked due to validation failures.")
    return {
        "status": "activated",
        "item_count": len(predicted_log),
        "validated": True,
    }


def build_demo_template(name: str = "default") -> ClockTemplate:
    return ClockTemplate(
        name=name,
        slots=[
            ClockSlot(0, Category.station_id, human_lock=True),
            ClockSlot(2, Category.power),
            ClockSlot(6, Category.sweeper),
            ClockSlot(8, Category.recurrent),
            ClockSlot(14, Category.gold),
            ClockSlot(20, Category.talk_break),
            ClockSlot(25, Category.power),
            ClockSlot(30, Category.news),
            ClockSlot(35, Category.recurrent),
            ClockSlot(44, Category.ad_break),
            ClockSlot(47, Category.gold),
            ClockSlot(55, Category.sweeper),
        ],
    )


def build_demo_inventory() -> Dict[Category, List[InventoryItem]]:
    return {
        Category.station_id: [
            InventoryItem("st-1", "Robo FM Top ID", "RoboDJ", Category.station_id, energy=5, personas=["default"]),
        ],
        Category.power: [
            InventoryItem("p-1", "Neon Skyline", "Alta Vista", Category.power, energy=8, personas=["drive", "night"]),
            InventoryItem("p-2", "Sunrise Loop", "Nova Lane", Category.power, energy=6, personas=["morning", "workday"]),
            InventoryItem("p-3", "Rush Mode", "Pixel Heat", Category.power, energy=9, personas=["drive"]),
        ],
        Category.recurrent: [
            InventoryItem("r-1", "Signal Hearts", "Arc Tone", Category.recurrent, energy=7, personas=["workday", "drive"]),
            InventoryItem("r-2", "City Window", "Neon Trail", Category.recurrent, energy=5, personas=["morning", "workday"]),
        ],
        Category.gold: [
            InventoryItem("g-1", "Midnight Archive", "Retroline", Category.gold, energy=4, personas=["night"]),
            InventoryItem("g-2", "Classic Drift", "Retroline", Category.gold, energy=5, personas=["workday", "drive"]),
        ],
        Category.talk_break: [
            InventoryItem("t-1", "Host Break A", "Host", Category.talk_break, energy=4, personas=["morning", "drive"]),
        ],
        Category.ad_break: [
            InventoryItem("a-1", "Ad Cluster A", "Traffic", Category.ad_break, energy=4, personas=["default"]),
        ],
        Category.news: [
            InventoryItem("n-1", "Top Of Hour News", "Newsroom", Category.news, energy=5, personas=["default"]),
        ],
        Category.sweeper: [
            InventoryItem("s-1", "Station Sweeper", "Imaging", Category.sweeper, energy=6, personas=["default"]),
        ],
    }


class SimulationHandler(BaseHTTPRequestHandler):
    templates: Dict[int, ClockTemplate] = {}
    inventory: Dict[Category, List[InventoryItem]] = {}
    rules: SchedulerRules = SchedulerRules()

    def _write_json(self, payload: Dict[str, object], status: HTTPStatus = HTTPStatus.OK) -> None:
        raw = json.dumps(payload, indent=2).encode("utf-8")
        self.send_response(status.value)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def do_GET(self) -> None:  # noqa: N802
        if self.path == "/simulate":
            payload = simulate_24h(self.templates, self.inventory, self.rules)
            self._write_json(payload)
            return

        if self.path == "/validate":
            day = simulate_24h(self.templates, self.inventory, self.rules)
            parsed = []
            for row in day["items"]:
                parsed.append(
                    ScheduledItem(
                        start=datetime.fromisoformat(row["time"]),
                        slot_minute=datetime.fromisoformat(row["time"]).minute,
                        category=Category(row["category"]),
                        item=InventoryItem(
                            id=f"sim-{row['category']}",
                            title=row["title"],
                            artist=row["artist"],
                            category=Category(row["category"]),
                            personas=["default"],
                        ),
                        human_lock=bool(row["human_lock"]),
                        fallback_used=bool(row["fallback_used"]),
                    )
                )
            self._write_json(validate_schedule(parsed, self.rules))
            return

        self._write_json({"error": "Not found"}, status=HTTPStatus.NOT_FOUND)


def serve(port: int) -> None:
    SimulationHandler.templates = {hour: build_demo_template() for hour in range(24)}
    SimulationHandler.inventory = build_demo_inventory()
    SimulationHandler.rules = SchedulerRules()

    server = ThreadingHTTPServer(("0.0.0.0", port), SimulationHandler)
    print(f"Simulation endpoint running on http://0.0.0.0:{port}")
    print("GET /simulate for 24h predicted log")
    print("GET /validate for validation report")
    server.serve_forever()


def main(argv: Optional[Iterable[str]] = None) -> int:
    parser = argparse.ArgumentParser(description="Clockwheel scheduler simulation tooling")
    parser.add_argument("--serve", action="store_true", help="Run simulation HTTP endpoint")
    parser.add_argument("--port", type=int, default=8080, help="HTTP port for --serve")
    parser.add_argument("--simulate", action="store_true", help="Print a local 24h simulation")
    args = parser.parse_args(list(argv) if argv is not None else None)

    if args.serve:
        serve(args.port)
        return 0

    if args.simulate:
        templates = {hour: build_demo_template() for hour in range(24)}
        inventory = build_demo_inventory()
        rules = SchedulerRules()
        payload = simulate_24h(templates, inventory, rules)
        print(json.dumps(payload, indent=2))
        return 0

    parser.print_help()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
