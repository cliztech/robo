# Segment Engine Usage

Run:

```bash
python config/scripts/segment_engine.py
```

The script emits a JSON package with:
- `turn_plan`: ordered utterances with role, tone, duration caps, interruptions, and memory pointers
- `ssml`: speech payload for TTS
- `script`: plain text rundown for mixing pipelines
