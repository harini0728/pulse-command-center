# TransferPulse Command Center

## Scope
Build only the application shell and the Command Center at `/`. Other navigation destinations remain visibly unavailable rather than linking to unfinished pages.

## Interface
- Create a compact left rail with TransferPulse identity, Command Center navigation, and live system status.
- Add a slim top status bar with emergency network state, simulated time, health, and operator identity.
- Build an information-dense Command Center centered on the active transfer, predicted acceptance, network map, acceptance window, recommendation rationale, and event stream.
- Use a near-black command-center palette with restrained cyan, emerald, amber, and critical red; pair a modern sans-serif interface font with monospace operational data.

## Emergency scenario
- Start with CityCare / Hospital A recommended at 92% and the ambulance routed there.
- On “Play emergency scenario,” step Hospital A through 92 → 78 → 61 → 41 as two ICU admissions arrive.
- Synchronize the large probability, hospital node state, predictive curve, route, recommendation, rationale, and timestamped event stream.
- Finish with Hospital B recommended at 84% and a clear “Destination re-evaluated” notice.
- Keep replay/reset behavior deterministic and disable conflicting actions while the sequence runs.

## Polish and validation
- Use purposeful transitions, subtle map motion, and reduced-motion fallbacks.
- Preserve readable hierarchy and stable geometry at desktop and mobile widths.
- Add app-specific page metadata.
- Verify the complete simulation and visual layout in the running preview.
