# Squad Tactical Actions Implementation Spec

## Goal

Implement tactical actions as a reusable overlay on top of the current per-boy stance system.

The first shipped slice is:

- `Alt + G`: selected boy throws a grenade at the cursor

This implementation must reuse the existing raid runtime:

- live squadmate combatants
- existing grenade stock and cooldown
- existing `spawnGrenade(...)` and `getClampedGrenadeTarget(...)`
- existing selected-boy command state and command selection

## Architecture

Each live squadmate keeps:

- `command`
  - long-lived base stance
  - `follow`, `defend`, or `attack`
- `tacticalAction`
  - short-lived overlay action
  - queued and resolved independently of the base stance

The tactical action never replaces the base command. It temporarily bends the actor's behavior, then the actor naturally falls back to the already-stored command.

## Data Model

Add `SquadMateState.tacticalAction` with:

- `actionId`
- `status`
- `targetPosition`
- `targetLabel`
- `issuedAtSeconds`
- `startedAtSeconds`
- `completedAtSeconds`
- `resumeOrderId`
- `failureReason`

Allowed statuses for the shared lifecycle:

- `queued`
- `moving-into-range`
- `executing`
- `completed`
- `failed`
- `cancelled`

## Controller API

Expose a reusable controller entry point:

- `queueSelectedSquadTacticalAction(actionId, targetPosition)`

Responsibilities:

1. resolve the selected live boy
2. clamp the world target
3. stamp reusable action metadata
4. attach the tactical action to that boy
5. emit squad comms and player message

## Friendly Combatant Execution

The live friendly combatant loop owns execution.

For the grenade slice:

1. read the owning squadmate's active tactical action
2. validate grenade stock
3. if out of throw range, move into range
4. when in range and cooldown is clear, call the normal grenade runtime
5. mark the action `completed`
6. let the base command continue naturally

Important rule:

- do not create a separate squad-only grenade entity or grenade simulation

## Movement / Range Rules

For `grenade`:

- use the stored action target as the intended battlefield point
- if the actor is outside throw range, bias movement toward that point
- once inside range, use `getClampedGrenadeTarget(...)`
- preserve the actor's existing command so post-throw behavior stays correct

## Failure Rules

First-slice failures:

- no live selected boy
- no grenade stock

Failure handling must:

- mark the action `failed`
- store `failureReason`
- emit readable squad comms
- leave the base command intact

## Input / Surfaces

### Raid Input

- `8 / 9 / 0`: select boy
- `C / X / V`: base order
- `Alt + G`: tactical grenade at cursor
- plain `G`: player grenade remains unchanged

### CLI

Expose:

- `select-boy --index <n>`
- `squad-order --id <follow|defend|attack>`
- `squad-action --id grenade --x <n> --y <n>`

### Snapshot

Expose:

- `raid.selectedSquadMateId`
- `raid.squadMates[*].command`
- `raid.squadMates[*].tacticalAction`

The tactical snapshot should include lifecycle status, target, resume order, failure read, and age.

## UI / Feedback

Minimum shipped readability:

- controls reference includes `Alt + G`
- boys-command HUD shows whether a tactical action is active
- squad comms and raid message explain queued, completed, and failed grenade orders

## Extension Rule

Future actions such as `suppress`, `smoke`, `breach`, or `clear-room` should only need:

1. a new `actionId`
2. execution logic inside the same tactical-action lifecycle
3. snapshot / HUD wording
4. CLI and input binding if needed

They should not need a second command architecture.
