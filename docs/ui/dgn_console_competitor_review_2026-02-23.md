# DGN Console Competitor Review and Mapping (2026-02-23)

## Scope

This review maps Rekordbox 7 and VirtualDJ reference screenshots/features to DGN-DJ console implementations.

## Reference Inputs

### Rekordbox 7

- Local screenshots: `images/rb7.png`, `images/rb7 af.png`, `images/rb7 c.png`, `images/rb7 s.png`, `images/reckbox 7 .png`
- Local Rekordbox export folder: `images/rekordbox 7 Overview _ rekordbox - DJ software_files/`
- Official feature page: https://rekordbox.com/en/features/
- Official update history: https://rekordbox.com/en/download/

### VirtualDJ

- Local screenshots: `images/vdj1.png`, `images/vdj12.png`, `images/vdj23.png`, `images/vdjs.png`, `images/vdjas.png`
- Local versioned captures: `images/vdj_04_pro_4decks_v1_1920x1080.jpg`, `images/vdj_05_performance_v1_1920x1080.jpg`, `images/vdj_07_vertical_waveforms_v1_1920x1080.jpg`, `images/vdj_automix_v1_800x500.png`, `images/vdj_skins_v1_800x500.png`
- Official features page: https://www.virtualdj.com/features/

## Feature Review Summary

1. Dense deck + browser split is consistent across both products.
2. Multi-deck variants (2/4) are core to expert workflows.
3. Fast transport clusters (cue/play/next) are always visible.
4. Performance surfaces combine waveform, FX, pads/sampler, and quick metadata.
5. Broadcast/automix status signaling uses persistent, high-contrast indicators.
6. Vertical waveform mode is a distinct workflow for monitoring precision.

## DGN-DJ Mapping (Implemented)

| DGN profile | Competitor pattern mapped | Implemented behavior |
| --- | --- | --- |
| `DGN Starter` | 2-deck starter layouts | Two working decks, browser load, crossfader, keyboard workflow |
| `DGN Essentials` | 2-deck + utility tooling | Starter + sampler pads + quick rate FX |
| `DGN Pro 4` | 4-deck pro shell | Four working decks with independent transport/volume/rate |
| `DGN Vertical` | Vertical waveform mode | 4-deck with vertical progress/wave orientation |
| `DGN Broadcast` | Automix + radio ops rail | On-air/recording/automix controls and status rail |

## Stitch MCP Status

- Stitch MCP connector is not available in this environment's tool list.
- Implementation used the available local template/screenshot corpus and in-repo UI references.
- If Stitch MCP is installed later, this mapping can be re-bound to direct Stitch-generated layout assets.
