# Building Navigation Plan

This plan exists to satisfy the standing directive that buildings and doorways need an explicit fix plan, not only piecemeal tweaks.

## Problem

- Actors can still stall at doorway mouths or keep choosing the same failed entry line when the first waypoint is technically valid but the next segment collapses back into nearby walls.
- The current navigation chooser evaluates two-hop routes, but movers only remember the best immediate waypoint for the current frame and can recommit into the same blocked mouth repeatedly.

## This Run

1. Keep the existing hollow-room and doorway assist logic.
2. Add committed navigation targets for enemies, support teams, and frontline incidents so doorway-lane choices persist long enough to actually cross a mouth instead of being recomputed every frame.
3. Keep the authored room-clear stack and its doorway telemetry as the regression surface for the navigation pass.
4. Re-run both `room-clear-drill` and `room-clear-chain` at `1920x1080` so automation checks the smoother AI/support movement and exposes the remaining player-side traversal gap.
5. Verify the raid still boots and the CLI capture flow still works at 1920x1080.

## Next Building Pass

1. Decide whether the next doorway pass should stay on AI/support navigation stabilization or pivot into player-authored chained room traversal, because the current chain-walk verification still tops out in room one.
2. Expand the chain-walk macro into repeated forward-and-back doorway crossings so door-mouth oscillation is caught under longer movement.
3. Add route-specific dressing, cover props, and defender identity for each room in the stack instead of reusing one generic footprint.

## Latest Result

- Doorway-adjacent navigation targets now stay committed longer for enemies, support teams, and frontline incidents, so room-mouth crossings should stop re-rolling as aggressively while actors are still threading the same threshold.
