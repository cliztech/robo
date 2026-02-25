---
id: t1-shell-scaffold
title: "Scaffold Next.js App Shell and Routing"
status: "Todo"
priority: "High"
order: 10
created: 2026-02-20
updated: 2026-02-20
links:
  - url: ../linear_ticket_parent.md
    title: Parent Ticket
---

# Description

## Problem to solve
We need a robust, performant React base for the DGN DJ Studio.

## Solution
Initialize the Next.js environment (within `apps/dj-console` if applicable or as a new standalone if preferred), set up the App Router, and define the primary layout regions.

## Implementation Details
- Setup `src/app/layout.tsx` with standard providers.
- Configure `app-shell.tsx` structural frame.
- Define routes for Dashboard, Studio, and Library.
