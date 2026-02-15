# Draft PR Metadata Helper

Use `scripts/draft_pr_metadata.py` to generate a consistent Draft PR markdown block from JSON metadata.

## Create starter metadata

```bash
python scripts/draft_pr_metadata.py --init draft_pr_metadata.json
```

## Render markdown for your PR description

```bash
python scripts/draft_pr_metadata.py --metadata draft_pr_metadata.json
```

## Metadata schema

```json
{
  "scope": {
    "in": ["string"],
    "out": ["string"]
  },
  "risks": [
    {
      "risk": "string",
      "mitigation": "string"
    }
  ],
  "test_plan": {
    "completed": ["string"],
    "pending": ["string"]
  },
  "known_gaps": ["string"],
  "next_checkpoints": [
    {
      "item": "string",
      "status": "todo|done"
    }
  ]
}
```

`status` values `done`, `complete`, or `completed` render as checked (`[x]`). All others render unchecked (`[ ]`).
