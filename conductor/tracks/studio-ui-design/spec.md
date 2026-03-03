# DGN DJ Studio - World-Class Interface PRD

## HR Eng

| DGN DJ Studio PRD |  | [Summary: Implementation of a high-performance, professional DJ studio interface for DGN-DJ, inspired by industry standards like rekordbox 7 and VDJ. Focuses on dark-mode aesthetics, neon-green branding, and integrated AI agent observability.] |
| :---- | :---- | :---- |
| **Author**: Pickle Rick **Contributors**: Gemini **Intended audience**: Engineering, Design | **Status**: Draft **Created**: 2026-02-20 | **Self Link**: [Link] **Context**: [Link] 

## Introduction

DGN-DJ needs a "World Class" studio interface that transcends typical radio automation tools. The goal is to provide an immersive, dark-mode environment that feels like professional DJ software (rekordbox, Traktor) while surfacing the unique "Agentic" intelligence driving the station.

## Problem Statement

**Current Process:** Users interact with a legacy "RoboDJ" binary or basic config files. There is no unified, high-fidelity visual workspace to monitor the AI's "thoughts," active playout, and upcoming schedule in a single high-density view.
**Primary Users:** Radio station operators, AI DJ supervisors, and listeners (via broadcast visuals).
**Pain Points:** Low visual density, lack of real-time "agent" feedback, "Jerry-tier" UI that doesn't inspire professional confidence.
**Importance:** To establish DGN-DJ as a premium, AI-driven radio solution, the interface must reflect its technical sophistication.

## Objective & Scope

**Objective:** Create a React-based, high-performance Studio UI with dark-mode/neon-green branding.
**Ideal Outcome:** A single-page studio console that looks like a 4-deck rekordbox setup but is optimized for automated AI DJ operations.

### In-scope or Goals
- Dark Mode UI Shell (Next.js/Tailwind).
- "World Class" Waveform visualizations (CSS/Canvas).
- 2/4 Deck Virtual Mixer Layout.
- Agent Thought Stream (Visualizing AI reasoning in real-time).
- Neon-Green "Gorilla" Branding integration.
- Responsive, accessible performance (60fps targets).

### Not-in-scope or Non-Goals
- Real-time low-latency audio mixing *inside* the browser (handled by backend).
- Full mobile editing (Desktop-first focus).

## Product Requirements

### Critical User Journeys (CUJs)
1. **The Supervisor Monitor**: User logs in and immediately sees the active "AI DJ" persona, their current "thought" (e.g., "Selecting high-energy track for midday peak"), and the live waveforms of the active and cued tracks.
2. **The Conflict Resolver**: An agent detects a scheduling conflict; the UI alerts the user with a neon-green pulse, highlights the affected block in the grid, and offers a one-click "Accept Agent Fix" button.
3. **The Brand Customizer**: Operator toggles "High Contrast" or "Compact Density" mode to suit their monitoring hardware without losing the professional aesthetic.

### Functional Requirements

| Priority | Requirement | User Story |
| :---- | :---- | :---- |
| P0 | **Dark Mode Studio Shell** | As a user, I want a black/neon-green studio frame so it feels like professional DJ gear. |
| P0 | **Active Playout Decks** | As a user, I want to see waveforms and timers for the active and next-up tracks. |
| P1 | **Agent Thought Overlay** | As a user, I want to see the AI's internal reasoning (e.g., "Choosing track based on energy: 78%") so I trust the automation. |
| P1 | **4-Deck Toggle** | As a user, I want to switch between 2-deck (simple) and 4-deck (expert) layouts. |
| P2 | **Performance FX Viz** | As a user, I want visual feedback when the AI DJ applies filters or transitions. |

## Assumptions

- Backend provides a WebSocket/API for real-time playout and agent state updates.
- Users have modern browsers capable of Canvas/Framer Motion acceleration.

## Risks & Mitigations

- **Risk**: Visual overload (too much neon/motion). -> **Mitigation**: Implement "Simplified Density" and "Reduced Motion" presets from the blueprint.
- **Risk**: Performance lag on low-power dashboards. -> **Mitigation**: Use Canvas for waveforms and avoid heavy layout-thrashing animations.

## Tradeoff

- **Option**: Use heavy library components (e.g., full DJ JS libs). **Chosen**: Build custom light-weight primitives (Pickle Rick style) to ensure absolute control over branding and performance.

## Business Benefits/Impact/Metrics

**Success Metrics:**

| Metric | Current State (Benchmark) | Future State (Target) | Savings/Impacts |
| :---- | :---- | :---- | :---- |
| UI Density | Low (Text-heavy) | High (Visual/Deck-based) | Better situational awareness |
| Perceived "Intelligence" | Low | High (Visible agent thoughts) | Increased user trust in AI |
| Frame Rate | N/A | >55fps | Premium professional feel |

## Stakeholders / Owners

| Name | Team/Org | Role | Note |
| :---- | :---- | :---- | :---- |
| DGN Radio | Branding | Stakeholder | Logo/Colors owner |
| Gemini Agent | Engineering | Lead Implementer | Responsible for React architecture |
