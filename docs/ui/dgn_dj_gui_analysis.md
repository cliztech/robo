# DGN-DJ GUI Analysis (Rekordbox-Inspired)

## Visual signals captured from the reference

- **Dense information hierarchy**: waveform timeline dominates the upper half while transport and browser dominate lower half.
- **High-contrast dark UI**: near-black panels with narrow neon accents for operational states.
- **Color-coded semantics**: blue/orange deck cues, green musical key highlights, and red emphasis for urgent timing markers.
- **Pro workflow layout**: persistent top status bar, deck lanes, mixer center strip, and large track library at bottom.

## Translation decisions for DGN-DJ

1. Added a branded **"DGN-DJ Studio" top bar** with subtitle "Console V2 Studio Mode".
2. Added a subtle **6% progress bar** to reflect the visual cue from the provided logo strip.
3. Added compact status chips (**Professional**, **Master**, **Live Safe**) to communicate mode and system readiness.
4. Added icon-only status controls on the right to mimic hardware-like utility clusters.
5. Replaced generic library placeholder with a **table-style collection browser** (track title, artist, BPM, key, rating, time).

## UX intent

- Keep the UI readable from a distance during live operation.
- Preserve fast scanning: primary timing controls above, selection/browsing below.
- Keep controls "DJ-familiar" while applying DGN-DJ branding.
