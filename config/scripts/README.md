# Script Utilities

## `reliability_controls.py`
Prototype reliability guardrails for radio automation pipelines that use LLM + TTS providers.

### What it demonstrates
- Confidence scoring for generated scripts and synthesized transcript output.
- Profanity/compliance filtering at script and transcript stages.
- Retry strategy across multiple providers with per-provider circuit breakers.
- Timeout and dead-air watchdog with strict filler insertion.
- Fallback behavior:
  - Insert pre-rendered liner/sweeper text.
  - Switch to music-only emergency mode.
- Operator alerts and JSONL postmortem event logging.

### Usage
From repository root:

```bash
python config/scripts/reliability_controls.py
```

Postmortem events are written to:
- `config/logs/reliability_postmortem.jsonl`
