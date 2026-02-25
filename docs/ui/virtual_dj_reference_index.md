# Virtual DJ Reference Index

Status: draft  
Scope: first-level files under `images/` only (`images/*`)

## Classification legend

- **layout reference**: whole-screen compositions that define module placement, density, and scan hierarchy.
- **control/component reference**: close-ups or focused captures of a specific control family (pads, mixer strip, browser table, FX rack).
- **interaction/flow reference**: sequences or assets that communicate transitions, operating flow, or state progression.
- **non-reference noise**: scraped web assets, promo tiles, or branding-heavy items that should not drive UI implementation.

## First-level `images/` inventory and classification

| File | Classification | Notes |
| --- | --- | --- |
| `04_Pro_4decks.jpg` | layout reference | 4-deck overview with browser + mixer anchoring. |
| `05_Performance.jpg` | layout reference | Performance-centric full console density and balance. |
| `06_PerformanceFX.jpg` | layout reference | Full surface with FX-heavy center/mid controls. |
| `06_PerformanceFX (1).jpg` | layout reference | Alternate FX-performance shell framing. |
| `07_Vertical_waveforms.jpg` | layout reference | Vertical waveform-focused deck arrangement. |
| `08_video_mix.jpg` | layout reference | Video-mix shell composition and module stacking. |
| `08_video_mix_rack.jpg` | layout reference | Rack-heavy video workflow layout variant. |
| `EssentialsMarked.png` | layout reference | Annotated essentials layout with grouped regions. |
| `ProMarked.png` | layout reference | Annotated pro layout emphasizing dense module packing. |
| `StarterMarked.png` | layout reference | Annotated starter layout and reduced surface complexity. |
| `MixerMain.png` | control/component reference | Mixer strip/detail reference (EQ/faders/meter area). |
| `automix.png` | interaction/flow reference | Auto-transition flow and automation signaling. |
| `broadcast.png` | interaction/flow reference | Broadcast-state controls and output flow context. |
| `clouddrive.png` | interaction/flow reference | Cloud source ingest/lookup flow concept. |
| `cloudlists.png` | interaction/flow reference | Cloud list interaction and source selection flow. |
| `editors.png` | control/component reference | Editor tool panel components and parameter controls. |
| `effects.png` | control/component reference | FX module controls and parameter slot density. |
| `library.png` | control/component reference | Browser table, source tree, and dense row treatment. |
| `link.png` | interaction/flow reference | Device/link workflow and synchronization context. |
| `pads.png` | control/component reference | Pad grid structure, spacing, and color semantics. |
| `playlists.png` | control/component reference | Playlist table/browser component treatment. |
| `playlists (1).png` | control/component reference | Alternate playlist/browser visual treatment. |
| `record.png` | interaction/flow reference | Recording-state workflow, action confirmation cues. |
| `remote.png` | interaction/flow reference | Remote-control session flow and state signaling. |
| `sampler.png` | control/component reference | Sampler grid and bank-control references. |
| `sandbox.png` | interaction/flow reference | Preview/sandbox operation flow (safe pre-listen mode). |
| `skins.png` | control/component reference | Skin/layout switcher controls (not visual skin copy). |
| `tracklists.png` | control/component reference | Track list density, columns, and row affordances. |
| `videobroadcast.png` | interaction/flow reference | Video broadcast workflow and status signaling. |
| `Using AUTOMIX to Auto TRANSITION - virtual DJ 2023 tutorials.mp4` | interaction/flow reference | Timeline evidence for automix behavior and transitions. |
| `Virtual DJ 2025 is Here_ Master the New StemSwap Sampler Feature! (Virtual DJ tutorials).mp4` | interaction/flow reference | Sampler/StemSwap operating sequence cues. |
| `Virtual DJ 2026 is Finally HERE! + Download Links.mp4` | interaction/flow reference | Feature walk-through flow (high-level behavior only). |
| `Virtual DJ 2026 – INSANE New Features You Must Try!.mp4` | interaction/flow reference | Rapid capability tour; useful for interaction sequencing. |
| `askthedj.png` | non-reference noise | Product marketing/promo tile; low implementation fidelity. |
| `geniousdj.png` | non-reference noise | Marketing-oriented feature graphic; not UI-spec quality. |
| `keyfeatures2.png` | non-reference noise | Promo collage, not a stable operator UI surface. |
| `scratchdna.png` | non-reference noise | Branding/concept asset; not actionable UI structure. |
| `soundengine.png` | non-reference noise | Marketing callout tile; lacks implementation-level detail. |

## Implementation-grade reference set (true references)

Quality rubric (1-5 each):
- **clarity**: visual readability of controls/layout.
- **completeness**: coverage of module states/adjacent context.
- **direct usability**: how directly this can guide React implementation decisions.

| File | Demonstrates | UI module mapping | Clarity | Completeness | Direct usability | Total/15 |
| --- | --- | --- | ---: | ---: | ---: | ---: |
| `04_Pro_4decks.jpg` | Deck symmetry and 4-deck information density around central mixer. | deck, mixer, browser, transport, status rail | 5 | 5 | 5 | 15 |
| `05_Performance.jpg` | Performance-first shell with high-visibility controls. | deck, mixer, browser, transport | 5 | 4 | 5 | 14 |
| `06_PerformanceFX.jpg` | FX-forward arrangement with dense mid-surface controls. | deck, mixer, browser, transport | 4 | 4 | 4 | 12 |
| `06_PerformanceFX (1).jpg` | Alternate FX panel balance and spacing strategy. | deck, mixer, browser, transport | 4 | 4 | 4 | 12 |
| `07_Vertical_waveforms.jpg` | Vertical waveform rail behavior and deck alignment. | deck, transport, status rail | 5 | 4 | 5 | 14 |
| `08_video_mix.jpg` | Video-centric stacking of preview/output and deck controls. | deck, mixer, browser, transport, status rail | 4 | 4 | 4 | 12 |
| `08_video_mix_rack.jpg` | Rack-heavy video workflow with utility docking. | deck, mixer, browser, sampler, transport, status rail | 4 | 4 | 4 | 12 |
| `EssentialsMarked.png` | Simplified module grouping and minimum viable console zones. | deck, mixer, browser, transport, status rail | 5 | 4 | 5 | 14 |
| `ProMarked.png` | Annotated high-density pro module map for shell planning. | deck, mixer, browser, sampler, transport, status rail | 5 | 5 | 5 | 15 |
| `StarterMarked.png` | Reduced-complexity starter arrangement and progressive disclosure path. | deck, mixer, browser, transport, status rail | 5 | 4 | 5 | 14 |
| `MixerMain.png` | Channel strip geometry, EQ/volume relationships, meter stack. | mixer, transport | 5 | 4 | 5 | 14 |
| `automix.png` | Automated transition controls and operator override points. | transport, status rail | 4 | 3 | 4 | 11 |
| `broadcast.png` | Broadcast mode activation and monitoring cues. | status rail, transport | 4 | 3 | 4 | 11 |
| `clouddrive.png` | Remote/cloud source browsing pattern. | browser, status rail | 4 | 3 | 4 | 11 |
| `cloudlists.png` | Cloud list selection and browsing states. | browser | 4 | 3 | 4 | 11 |
| `editors.png` | Utility editor controls and parameter panes. | mixer, sampler, transport | 3 | 3 | 3 | 9 |
| `effects.png` | FX slot controls, toggles, and parameter clustering. | mixer, transport | 5 | 4 | 5 | 14 |
| `library.png` | Dense browser table with source tree + metadata columns. | browser | 5 | 5 | 5 | 15 |
| `link.png` | Device/link sync workflow signaling. | status rail, transport | 3 | 3 | 3 | 9 |
| `pads.png` | Pad-bank matrix sizing, color coding, and hit-target rhythm. | sampler, deck | 5 | 4 | 5 | 14 |
| `playlists.png` | Playlist browsing table, rows, and hierarchy. | browser | 5 | 4 | 5 | 14 |
| `playlists (1).png` | Alternate browser table composition for lists. | browser | 4 | 4 | 4 | 12 |
| `record.png` | Record workflow state cues and safety actions. | status rail, transport | 4 | 3 | 4 | 11 |
| `remote.png` | Remote interaction state handoff model. | status rail, transport | 3 | 3 | 3 | 9 |
| `sampler.png` | Sampler bank/pad organization and compact control density. | sampler, deck, transport | 5 | 4 | 5 | 14 |
| `sandbox.png` | Preview/sandbox state transitions before committing to output. | transport, status rail | 4 | 3 | 4 | 11 |
| `skins.png` | Layout selection controls (use behavior, not skin visuals). | status rail, browser | 3 | 3 | 3 | 9 |
| `tracklists.png` | Dense track table with high scannability columns. | browser | 5 | 4 | 5 | 14 |
| `videobroadcast.png` | Video broadcast state/flow indicators. | status rail, transport, browser | 4 | 3 | 4 | 11 |
| `Using AUTOMIX to Auto TRANSITION - virtual DJ 2023 tutorials.mp4` | Full automix transition sequence and intervention timing. | transport, status rail | 4 | 4 | 4 | 12 |
| `Virtual DJ 2025 is Here_ Master the New StemSwap Sampler Feature! (Virtual DJ tutorials).mp4` | Sampler/stem interaction flow and control cadence. | sampler, deck, transport | 4 | 4 | 4 | 12 |
| `Virtual DJ 2026 is Finally HERE! + Download Links.mp4` | End-to-end feature navigation flow references. | deck, mixer, browser, sampler, transport, status rail | 3 | 3 | 3 | 9 |
| `Virtual DJ 2026 – INSANE New Features You Must Try!.mp4` | Rapid interaction tour for feature discoverability flows. | deck, mixer, browser, sampler, transport, status rail | 3 | 3 | 3 | 9 |

## Do not emulate

- Vendor logos, trademarks, wordmarks, and branded iconography.
- Exact color skins/themes from third-party products.
- Pixel-identical panel textures, control art, or proprietary visual signatures.
- Product names or feature labels that imply affiliation.

Use only transferable interaction/layout patterns and implement original DGN-DJ branded styling.
