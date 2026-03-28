# DGN-DJ Studio: Operations Manual

## 1. Daily Workflow

1. **Launch**: Start `DGN-DJ_Launcher.bat`.
2. **Pre-flight**: Ensure `startup_safety.py` passes all diagnostics.
3. **Studio Console**: Access the Next.js dashboard for real-time monitoring.

## 2. Managing Personas

- All personas should be scored against the **Studio Quality Rubric**.
- Transitions should be reviewed in the **Decision Trace Panel**.

## 3. Handling Conflicts

- Use the **Timeline Editor** to resolve overlaps.
- High-severity conflicts block the **Publish** action.

## 4. Maintenance

- Run `make qa` weekly to ensure contract integrity.
- Verify `config/schedules.json` against the schema after manual edits.

## 5. Emergency Procedures

- **Rollback**: Use the "One-Click Rollback Assistant" in the UI.
- **Safe Mode**: Toggle the boot safety switch if AI autonomy behaves unexpectedly.
