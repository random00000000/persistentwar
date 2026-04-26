# Squad Tactical Actions Implementation Plan

## Objective

Ship the first reusable tactical-action slice for direct boy control:

- `Alt + G` grenade at cursor for the selected boy

## Phase 1: Shared Tactical Action State

- Add reusable tactical-action types to `src/game/simulation.ts`
- Extend `SquadMateState` with nullable `tacticalAction`
- Add age helpers so snapshot and HUD can report command freshness cleanly

Exit criteria:

- squadmates can carry tactical-action metadata without changing their base order

## Phase 2: Queue / Lifecycle Plumbing

- Add `queueSelectedSquadTacticalAction(...)` on the raid controller
- Store action target, status, issue time, and resume order
- Add cleanup for completed and failed actions so the overlay is visible briefly but does not stick forever

Exit criteria:

- a selected boy can receive a generic tactical action in sim state

## Phase 3: Grenade Execution Through Existing Runtime

- Resolve grenade actions inside the live friendly-combatant update loop
- Reuse the existing grenade stock, grenade cooldown, and `spawnGrenade(...)`
- Move into throw range when needed
- Fail cleanly when no grenade is available

Exit criteria:

- a selected boy can be ordered to frag a world point without creating a parallel grenade system

## Phase 4: Input / Tooling / Snapshot

- Bind `Alt + G` in `RaidScene`
- Keep plain `G` as player grenade
- Add `squad-action --id grenade --x --y` to the CLI
- Expose `raid.squadMates[*].tacticalAction` in the agent snapshot

Exit criteria:

- the feature is drivable from keyboard and CLI and inspectable from snapshot

## Phase 5: Readability / Documentation

- Update controls surfaces to advertise `Alt + G`
- Add a small boys-command HUD read for the active tactical action
- Update wiki and CLI manual

Exit criteria:

- future agents can discover and extend the system without digging through the sim

## Shipped In This Pass

- generic tactical-action overlay added to squadmate state
- selected-boy tactical action queue added
- grenade execution routed through the existing friendly-combatant grenade path
- `Alt + G` input added
- snapshot and CLI support added
- docs and wiki updated

## Next Recommended Extension

Build `suppress` next on top of the same lifecycle:

- selected boy
- world target
- temporary action override
- return to prior order after the suppress window ends

That will let the player combine:

- hold + suppress
- hold + grenade
- suppress + push
- shotgun hold + rifle suppress
