---
id: t3-shell-components
title: "Develop Core Shell Components (Topbar, Sidebar, Tabs)"
status: "Todo"
priority: "Medium"
order: 30
created: 2026-02-20
updated: 2026-02-20
links:
  - url: ../linear_ticket_parent.md
    title: Parent Ticket
---

# Description

## Problem to solve
The navigation surfaces must feel fluid and "browser-like" with strong keyboard support.

## Solution
Build the Topbar, Sidebar, and Tab Strip primitives using Radix/shadcn and Framer Motion.

## Implementation Details
- `TabStrip`: Browser-like tab management with `role="tablist"`.
- `Sidebar`: Collapsible navigation with accessibility persistence.
- `AddressBar`: Location/Command entry point (`Ctrl+L`).
- Integrate motion tokens for micro-interactions.
