# Conversation Orchestrator Specification

## Purpose
This document defines a conversation orchestration model for dynamic radio-style programming. It is designed to produce natural, consistent, and personality-driven multi-speaker segments while maintaining safety and continuity.

## 1) Persona Model

### 1.1 Host Archetypes
Use archetypes as reusable personas. Each archetype has a default voice profile, pacing profile, and interaction bias.

- **Anchor Host**
  - Core role: Structure the segment, keep timing, maintain clarity.
  - Strengths: Summarization, transitions, framing key points.
  - Risks: Can sound rigid if overused.

- **Charismatic Entertainer**
  - Core role: Add humor, warmth, and spontaneity.
  - Strengths: Improvisation, audience connection, memorable lines.
  - Risks: Can derail topic if unconstrained.

- **Analyst/Expert**
  - Core role: Provide depth, factual framing, nuanced critique.
  - Strengths: Detail, credibility, explanatory precision.
  - Risks: Overly dense language, long turns.

- **Provocateur/Debater**
  - Core role: Challenge assumptions, create tension and momentum.
  - Strengths: Conflict generation, perspective expansion.
  - Risks: Escalation, repetitive contrarian posture.

- **Community Connector**
  - Core role: Highlight listener voices and local relevance.
  - Strengths: Empathy, relatability, call-in flow.
  - Risks: Can drift into anecdotal loops.

### 1.2 Speaking Styles
Each persona defines weighted style dimensions:

- **Lexical complexity**: plain ↔ technical
- **Sentence rhythm**: clipped ↔ elaborate
- **Emotional register**: calm ↔ animated
- **Humor density**: none ↔ frequent
- **Assertion style**: tentative ↔ decisive
- **Audience address**: indirect ↔ direct

Recommended representation:

```json
{
  "persona_id": "anchor_host",
  "style": {
    "lexical_complexity": 0.35,
    "sentence_rhythm": 0.45,
    "emotional_register": 0.50,
    "humor_density": 0.20,
    "assertion_style": 0.75,
    "audience_address": 0.80
  }
}
```

### 1.3 Energy Curves
Every segment uses an energy curve over time to avoid monotony.

- **Cold open**: quick setup, moderate energy.
- **Build**: rising momentum through contrast/questioning.
- **Peak**: strongest emotional/factual exchange.
- **Resolve**: synthesis, practical takeaway, clean transition.

Use an `energy_target(t)` function where `t` is normalized `[0,1]` in segment runtime. Persona turn generation should be regularized toward the curve target.

---

## 2) Segment Templates

Templates define role obligations, pacing, and required beats.

### 2.1 Interview
- **Roles**: Host + Guest (+ optional Co-host).
- **Beats**:
  1. Intro + guest credential framing
  2. Narrative opener question
  3. Deep-dive follow-ups
  4. Rapid-fire clarifiers
  5. Takeaway + plug/next step
- **Constraints**:
  - Host questions should progressively narrow in scope.
  - Guest should receive majority speaking share (~55–70%).

### 2.2 Listener Call-In
- **Roles**: Host + Caller + optional Producer voice.
- **Beats**:
  1. Caller setup and context
  2. Caller main point
  3. Host clarification
  4. Reaction + audience bridge
  5. Polite close + transition
- **Constraints**:
  - Validate caller emotion before rebuttal.
  - Keep caller turn lengths short and focused.

### 2.3 Contest
- **Roles**: Host + Contestant(s) + optional Sidekick.
- **Beats**:
  1. Rules and stakes
  2. Prompt/question round
  3. Time-pressure banter
  4. Scoring reveal
  5. Winner callout + legal/housekeeping line
- **Constraints**:
  - Rules must be repeated at least once before scoring.
  - Avoid ambiguous scoring language.

### 2.4 Debate
- **Roles**: Moderator + Debater A + Debater B.
- **Beats**:
  1. Motion framing
  2. Opening statements
  3. Cross-exam turns
  4. Rebuttals
  5. Closing + neutral synthesis
- **Constraints**:
  - Balanced speaking share between A and B.
  - Moderator enforces time and civility.

### 2.5 News Reaction
- **Roles**: Anchor + Analyst + Entertainer/Community voice.
- **Beats**:
  1. Headline summary
  2. Why it matters
  3. Competing interpretations
  4. Local/personal impact
  5. Practical conclusion
- **Constraints**:
  - Distinguish facts from opinion explicitly.
  - Avoid speculative claims presented as certainty.

---

## 3) Turn-Taking Policy

### 3.1 Max Turn Length
Set explicit limits by role and segment type.

- Default spoken turn: **1–3 sentences**.
- Hard cap: **75 tokens** for high-tempo segments, **120 tokens** for analytical segments.
- Moderator/anchor summary turns can exceed by +20% once per segment.

### 3.2 Interruption Rules
Interruptions are intentional and bounded.

- Allow interruption only when:
  - speaker exceeds turn cap,
  - repeated point detected,
  - factual correction required,
  - timing cliff reached.
- Interruption style must remain non-hostile; prepend a softener phrase.
- Never allow two consecutive interruptions by the same persona unless safety-related.

### 3.3 Handoff Phrases
Use controlled handoff phrase banks to preserve flow.

Examples:
- “Let me bring [name] in on this.”
- “Quick reaction from you, [name]?”
- “Before we move on, one sentence from [name].”
- “I want to zoom out for listeners here.”
- “Hold that thought—let’s clarify one key point.”

Policy:
- Do not reuse the same handoff phrase within the last 3 handoffs.
- Prefer explicit addressee and turn intent (question, challenge, summary, close).

---

## 4) Memory Windows

### 4.1 Short-Term Segment Memory
Maintains coherence inside the active segment.

Store:
- last 6–10 turns,
- unresolved questions,
- factual claims pending verification,
- current emotional tone,
- active segment beat index.

TTL:
- Reset at segment end,
- Persist only carryover summary to next segment.

### 4.2 Long-Term Station Memory
Maintains identity and continuity across episodes.

Store:
- station voice guidelines,
- recurring host traits,
- running jokes/catchphrases (with overuse counters),
- persistent listener/community references,
- evergreen editorial boundaries.

Retention policy:
- Time-decay low-value details.
- Pin high-salience identity cues.
- Track phrase repetition frequency to avoid stale output.

Memory resolution order:
1. Safety constraints
2. Current segment goals
3. Short-term segment memory
4. Long-term station memory

---

## 5) Safety and Consistency Checks

### 5.1 No Contradictions
Before emitting a turn, run contradiction scan against:
- prior claims in segment memory,
- known station policy facts,
- current segment objective.

If contradiction risk > threshold:
- rewrite turn,
- or emit clarification phrase (“To clarify…”, “What I should have said…”).

### 5.2 Avoid Repetitive Phrasing
Track n-gram and semantic repetition across rolling window.

Rules:
- Disallow exact sentence reuse within last 20 turns.
- Flag high-overlap opening patterns (e.g., repeated “Look, here’s the thing…”).
- Inject paraphrase transforms when repetition score exceeds threshold.

### 5.3 Tone and Role Consistency
Validate generated turn against persona profile:
- style vector drift must remain within tolerance,
- role obligation for current beat must be satisfied,
- emotional intensity must not exceed curve bounds unless explicit “peak” state.

### 5.4 Recovery Behavior
When policy conflict occurs, prioritize:
1. Safety
2. Factual consistency
3. Segment objective
4. Entertainment value

---

## Pseudo-APIs

```python
from typing import Any, Dict, List, Optional, Tuple


def generate_segment_outline(
    segment_type: str,
    personas: List[Dict[str, Any]],
    topic: str,
    duration_s: int,
    station_memory: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Build beat-level plan.

    Returns:
      {
        "segment_id": str,
        "energy_curve": List[float],
        "beats": [
          {"beat_id": str, "goal": str, "required_roles": [...], "time_budget_s": int}
        ],
        "turn_policy": {...},
        "safety_checks": {...}
      }
    """
    ...


def generate_turn(
    outline: Dict[str, Any],
    current_beat_id: str,
    speaker_id: str,
    short_term_memory: Dict[str, Any],
    station_memory: Dict[str, Any],
    max_tokens: int = 90,
) -> Dict[str, Any]:
    """
    Generate one on-air turn with policy guardrails.

    Returns:
      {
        "text": str,
        "intent": "question|challenge|summary|reaction|handoff|close",
        "energy": float,
        "citations": Optional[List[str]],
        "checks": {
          "contradiction": float,
          "repetition": float,
          "persona_drift": float
        }
      }
    """
    ...


def score_authenticity(
    transcript_window: List[Dict[str, Any]],
    persona_profiles: Dict[str, Dict[str, Any]],
    target_segment_type: str,
) -> Dict[str, float]:
    """
    Compute realism and format-faithfulness metrics.

    Returns scores in [0, 1]:
      {
        "voice_consistency": float,
        "turn_rhythm_naturalness": float,
        "segment_template_adherence": float,
        "listener_engagement_signal": float,
        "overall_authenticity": float
      }
    """
    ...


def recover_from_offtopic(
    off_topic_turn: str,
    current_beat: Dict[str, Any],
    recent_context: List[Dict[str, Any]],
    recovery_style: str = "gentle",
) -> Tuple[str, Dict[str, Any]]:
    """
    Create a bridge back to segment goals.

    Returns:
      (recovery_line, metadata)

      metadata = {
        "strategy": "acknowledge_and_pivot|timebox_tangent|question_redirect|summary_reset",
        "handoff_target": Optional[str],
        "beat_reentry_confidence": float
      }
    """
    ...
```

## Implementation Notes
- Keep orchestration deterministic where possible by separating planning (`generate_segment_outline`) from realization (`generate_turn`).
- Use explicit scoring thresholds to trigger rewrite loops.
- Persist only compact memory summaries between segments to avoid drift.
- Prefer small phrase banks plus paraphrase generation over large static scripts.
