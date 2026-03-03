# Tracked Issue File Rules

Each tracked issue markdown file in this directory must contain exactly:

1. One top-level header matching `# TI-xxx ...`
2. One `- **Status:** ...` metadata line
3. One `## Definition of done` section

Run this validation before committing tracked-issue edits:

- `python scripts/validate_tracked_issue_format.py`
