---
id: t2-theme-tokens
title: "Implement Design Token System and Theming"
status: "Todo"
priority: "High"
order: 20
created: 2026-02-20
updated: 2026-02-20
links:
  - url: ../linear_ticket_parent.md
    title: Parent Ticket
---

# Description

## Problem to solve
The UI needs to support dark mode, high contrast, and neon-green branding consistently.

## Solution
Implement a CSS variable-based token system integrated with Tailwind.

## Implementation Details
- Create `src/styles/tokens.css` with light/dark/high-contrast modes.
- Map `config.ui.accent_color` to `--accent` token.
- Configure Tailwind to use these CSS variables.
- Implement `ThemeRegistry` for runtime switching.
