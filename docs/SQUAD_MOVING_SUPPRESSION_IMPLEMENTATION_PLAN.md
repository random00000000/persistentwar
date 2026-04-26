# Squad Moving Suppression Implementation Plan

## Goal

Deliver `Ctrl + RMB` as a real moving suppression / covering-fire command for the selected boy, using the existing command and combat architecture.

## Why This Order

This feature already overlaps an existing command slot (`move-watch`), so the safest path is:

1. lock the command model first
2. make it testable in CLI
3. tune simulation behavior
4. then finish player-facing surfaces

That keeps the feature generic and future-proof instead of scattering one-off input logic everywhere.

## Milestone 1: Command Model

Define how `Ctrl + RMB` maps into the command architecture.

Tasks:

- choose whether `move-watch` evolves in place or aliases into `move-suppress`
- lock the command semantics around moving suppression, not passive watch only
- ensure command state cleanly stores target point, direction, arc, and timing

Acceptance:

- the command model can represent moving suppression without needing a second parallel state tree
- future agents can add variants without rewriting the command architecture

## Milestone 2: CLI First

Expose the command for deterministic testing.

Tasks:

- add CLI support for the moving suppression order
- document the CLI path in the manual
- expose enough snapshot state to verify target/direction/order age

Recommended CLI flow:

1. `showcase --id boys-command`
2. `select-boy --index 0`
3. `squad-order --id move-suppress --x <n> --y <n>`
4. `snapshot`

Acceptance:

- the command can be issued from CLI
- the snapshot clearly shows the active moving suppression order

## Milestone 3: Simulation Behavior

Make the runtime feel correct.

Tasks:

- bias target acquisition toward the selected lane
- narrow off-sector fallback
- keep the boy leaning toward the movement anchor
- add disciplined moving burst logic
- degrade payoff when movement becomes too unstable
- keep clear separation from planted watch and static suppress

Acceptance:

- moving suppression buys crossing time
- the boy does not fully plant
- the boy does not break into chase AI
- the behavior is readable as controlled moving cover

## Milestone 4: Input Wiring

Make the live input authoritative.

Tasks:

- wire `Ctrl + RMB` through the real raid input path
- suppress browser context-menu behavior
- keep the existing reliability rules for modifier commands

Acceptance:

- `Ctrl + RMB` reliably queues the moving suppression command in live play
- no accidental default browser input leaks through

## Milestone 5: HUD And World Feedback

Make the feature readable without debug clutter.

Tasks:

- update the selected-boy HUD/card label
- show the command target and lane read
- distinguish moving suppression visually from planted watch
- add transient comms that teach the verb

Acceptance:

- the player can tell at a glance that the boy is covering a movement lane, not holding a hard sector

## Milestone 6: Documentation And Spec Cleanup

Tasks:

- update `wiki/project-cli.md`
- update `wiki/README.md`
- update `src/game/controls.ts`
- revise the older directional-brace docs later so `Ctrl + RMB` no longer means only passive move-watch

Acceptance:

- the project manual and wiki match the shipped behavior
- future agents will not reintroduce the old interpretation by accident

## Initial Tuning Intent

Use these as first-pass design targets, not final constants:

- off-sector emergency fallback smaller than current `move-watch`
- spread benefit weaker than planted watch
- cadence slightly slower and cleaner than uncontrolled moving fire
- movement slow only a little during disciplined bursts
- no full braced-shot payoff while moving

## Risks

### Boring Version

If this is only "slightly better moving fire," players will not feel the verb.

### Overpowered Version

If it grants too much free precision and pressure while moving, it erases the distinction between maneuver and planted control.

### Architecture Drift

If implemented as a special-case input hack, future tactical commands will become harder to add cleanly.

### Feedback Failure

If the command is not clearly surfaced in the HUD/world, it will feel like hidden AI behavior instead of a tactical tool.

## Battlefield Story Target

The feature should enable stories like:

- one boy walks suppressive fire onto a doorway
- another boy plants on the flank lane
- the player crosses open ground
- the enemy pop-out is answered quickly enough that the player gets through alive

That is the test for whether this is becoming a real tactical layer rather than one more button.
