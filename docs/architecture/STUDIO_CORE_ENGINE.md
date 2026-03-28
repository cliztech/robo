# Studio Core Engine: Architecture & Vision

## Overview

The DGN-DJ Studio Core Engine is the heart of the next-generation radio automation system. It manages the delicate balance between deterministic scheduling and autonomous AI hosting.

## Component Stack

### 1. The Scheduler (Clockwheel & Timeline)

- **Responsibility**: Ensuring the right audio plays at the exact right time.
- **Brand Synergy**: Moves from "Static Playlist" to "Dynamic Studio Timeline".

### 2. The AI Host (Persona Ops)

- **Responsibility**: Generating contextual talk breaks that bridge tracks.
- **Technology**: Leverages Next.js AI pipeline and localized LLM embeddings.

### 3. The Audio Pipeline (Encoding & Streaming)

- **Responsibility**: Icecast integration and loudness normalization.
- **Verification**: Hard-gated by `startup_safety.py` diagnostics.

## Data Flow

1. **Intake**: Media and Metadata ingestion.
2. **Plan**: AI analyzes upcoming segments and risks.
3. **Execute**: Studio Engine renders audio and metadata.
4. **Verify**: Observability logs capture every decision.

## Implementation Principles

- **Safety First**: Never drop audio ("Dead-air is death").
- **Brand Consistency**: All logs and UI must use "DGN-DJ Studio" terminology.
- **Developer Experience**: Standardized artifacts for every change.
