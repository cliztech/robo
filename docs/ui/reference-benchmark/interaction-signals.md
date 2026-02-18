# Interaction Signals

Behavior cues below are extracted from tutorial `.mp4` references and should guide interaction design, not dictate exact implementation.

## Transition timing

- Treat core transport actions as immediate (<100ms perceived response for button-down feedback).
- For transition-heavy flows (automix, crossfade, stem swap), show progress states continuously until completion.
- Motion should be short and functional: quick ease-out for panel reveals, linear timing for meters/progress.

## Visibility priorities

- Keep primary status always visible: deck play state, cue/loop state, crossfader position, and active automation mode.
- Elevate conflict-prone states (recording active, broadcast active, sync lock, quantize) with persistent indicators.
- De-prioritize secondary settings to collapsible zones so live operation keeps core controls in view.

## Control grouping

- Group controls by live task sequence: load → prep (cue/loop/key) → perform (transport/fx/pads) → transition.
- Keep browser actions near track-selection context; avoid forcing users across distant panels for common load actions.
- Separate destructive or session-impacting actions (clear, reset, stop broadcast/record) from rapid-performance clusters.

## Tutorial-derived implementation cues

- `Using AUTOMIX to Auto TRANSITION - virtual DJ 2023 tutorials.mp4`: expose automix state transitions in-place and in real time.
- `Virtual DJ 2025 is Here_ Master the New StemSwap Sampler Feature! (Virtual DJ tutorials).mp4`: pair sampler controls with immediate auditory-context indicators.
- `Virtual DJ 2026 is Finally HERE! + Download Links.mp4`: keep new-feature affordances discoverable but non-blocking for existing workflows.
- `Virtual DJ 2026 – INSANE New Features You Must Try!.mp4`: preserve fast path actions for expert users while keeping labels understandable for new users.

## Do / Don’t anchors

### Do

- `automix.png`: keep transition intent, progress, and override controls visible in one cluster.
- `sampler.png`: surface trigger state and bank context without requiring extra modal steps.
- `library.png`: keep load actions close to highlighted rows and maintain predictable keyboard focus flow.

### Don’t

- `automix.png`: do not bury transition parameters in disconnected settings pages.
- `sampler.png`: do not hide performance-critical controls behind hover-only affordances.
- `library.png`: do not force users to lose row context when opening detail/metadata views.
