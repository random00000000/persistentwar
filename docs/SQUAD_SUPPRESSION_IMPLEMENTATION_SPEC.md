# Squad Suppression Implementation Spec

## Goal

Implement deeper targeted suppression as the next tactical-action family on top of the existing per-boy tactical-action overlay.

Initial suppression inputs:

- `Alt + Click`: selected boy suppresses the clicked point
- `Alt + V`: selected boy suppresses the current cursor point

This should not be a new command architecture. It should extend the same tactical-action system already used by `Alt + G`.

## Product Intent

The player should be able to use one brother to keep a lane dead while another brother moves, holds, grenades, or breaches.

The intended fantasy is:

- “Rook, pin that window.”
- “Makar, hose that doorway.”
- “Yara, keep their heads down while I cross.”

This is not normal autonomous firing. It is a deliberate player-authored battlefield effect.

## Design Rule

Suppression must reuse the existing combat runtime.

It must reuse:

- selected-boy tactical action state
- live friendly combatants
- existing weapon fire/projectile spawning
- existing ammo, reload, cooldown, and line-of-sight systems
- existing squad comms, HUD, world-cue, CLI, and snapshot surfaces

It must not create:

- fake suppression volumes disconnected from bullets
- invisible “pinning entities” that replace live actor behavior
- a second squad-only shooting system

## Input Model

Two suppression entry paths should exist and resolve to the same tactical action:

### `Alt + Click`

- direct point-and-command path
- most literal and player-readable
- should be treated as the primary suppression input

### `Alt + V`

- keyboard-first tactical action at the current cursor point
- should call the same queue method and produce the same action type

Design rule:

- both inputs queue the same `suppress` tactical action id
- do not fork behavior based on which input path was used

## Tactical Action Model

Extend the existing tactical-action overlay with a new reusable action id:

- `suppress`

Recommended extra shared metadata for suppression-family actions:

- `targetRadius`
- `durationSeconds`
- `shotsPlanned` or `burstsPlanned`
- `shotsFired`
- `requiresLineOfSight`
- `suppressionProfile`

Recommended suppression statuses:

- `queued`
- `moving-into-range`
- `lining-up`
- `executing`
- `completed`
- `failed`
- `cancelled`

`lining-up` is worth keeping for suppression even if grenade does not need it, because suppressive fire feels better if the actor visibly turns onto the lane before the burst sequence starts.

## Controller API

Add a reusable queue path:

- `queueSelectedSquadTacticalAction("suppress", targetPosition, options?)`

Recommended suppress options:

- `targetRadius`
- `durationSeconds`
- `source` such as `alt-click` or `alt-v`

Responsibilities:

1. resolve the selected live boy
2. validate that the boy has a real gun
3. stamp the suppress action with target position and suppress tuning
4. preserve the base order as `resumeOrderId`
5. emit readable squad comms and HUD copy

## Execution Rules

The live friendly-combatant update loop should own suppress execution.

High-level flow:

1. validate the boy is alive and armed
2. move into a usable suppress position if the target is out of effective range or sight
3. line up facing on the lane
4. fire repeated bursts at the target point or shallow target area
5. consume real ammo and obey real reload rules
6. end after the suppress window finishes or the action fails
7. return to the stored base order

## Suppression Positioning

Suppression should not require the actor to stand exactly on the point.

Instead, the actor should seek a usable firing relationship:

- within weapon-appropriate range
- with line of sight to the target point or target area
- without abandoning the resume-order anchor too far unless the player already put him on an aggressive base order

Recommended execution positioning rules:

- if already in usable range and sight, suppress immediately
- if out of range, move toward the nearest usable suppress position
- if line of sight is blocked but a nearby lateral shift can solve it, sidestep first
- if no usable relation is found within a sane leash, fail cleanly

## Firing Behavior

Suppression should use real weapon fire with suppress-specific tuning.

Recommended behavior:

- fire toward the target point or slight spread around it
- prioritize burst volume and lane denial over hit probability
- allow intentional inaccuracy rather than perfect precision
- keep the actor mostly anchored during the execution window

Recommended per-weapon bias:

- `rifle`: strongest long-lane suppressor, steadier burst spacing, better sustained suppression at range
- `smg`: best close-to-mid suppression, faster bursts, more drift, better doorway or short-house pinning
- `shotgun`: not a true suppressor at long range; should either fail on bad long suppress requests or only perform short brutal doorway denial at close range

This is an important skill-gap rule:

- not every brother should be equally good at every suppress job

## Pressure Effect

Suppression should matter even when it does not score many hits.

The existing combat runtime should be extended so target enemies near the suppress point receive:

- stronger pressure application
- more pinned / suppressed reactions
- reduced willingness to re-peek immediately

This should still come from real bullets and pressure hooks, not fake UI-only state.

## Ammo / Reload Rules

Suppression must obey real resource costs:

- consumes real ammo from the acting brother
- can trigger real reloads during or after execution
- should fail or end early on dry weapon if no reload path is available

Recommended behavior:

- if the actor can reload and still meaningfully continue, allow one reload during the suppress action
- otherwise mark the action complete or failed depending on whether enough suppressive fire was already delivered

## Completion Rules

Suppression ends when one of these happens:

- duration expires
- planned burst count is reached
- actor runs dry and cannot continue meaningfully
- line of sight collapses and cannot be recovered quickly
- actor is downed or loses the ability to act
- player issues a new tactical action that supersedes it

After completion:

- clear the tactical action after the usual short readable linger
- let the actor resume the stored base order

## Failure Rules

First-pass readable failures:

- no live selected boy
- no weapon
- target too far for meaningful suppression
- cannot acquire line of sight
- no ammo or cannot sustain suppression

Failure handling must:

- store `failureReason`
- emit squad comms
- leave the base order intact

## HUD / World Feedback

Suppression needs stronger feedback than grenade because its effect spans time, not a single throw.

Minimum reads:

- active tactical action title in `Boys Command`
- target label and age
- world-space suppression marker on the target point
- line from actor to suppress target while the action is live
- short squad bark on queue and completion

Recommended suppression-specific read:

- a pulsing target ellipse or lane marker instead of only a single point circle
- action status text such as `SUPPRESS LINING UP`, `SUPPRESS LIVE`, or `SUPPRESS BROKEN`

## CLI / Snapshot

CLI should support:

- `select-boy --index <n>`
- `squad-action --id suppress --x <n> --y <n>`

Snapshot should expose:

- `actionId: "suppress"`
- target point
- status
- age
- resume order
- failure reason
- suppress tuning if useful, such as duration or radius

## Input Collision Rules

Because `Alt + Click` overlaps with normal mouse fire expectations, the implementation should obey:

- while `Alt` is held, the click should queue suppression instead of normal player fire
- normal click fire should remain unchanged when `Alt` is not held
- `Alt + V` should be a keyboard equivalent, not a different tactical verb

## Scalability Rule

Suppression should be implemented as a family, not a one-off.

The deeper architecture should make it easy to add:

- `hose-doorway`
- `watch-lane`
- `short-burst suppress`
- `sustained suppress`

through tuning and presentation instead of rewriting the lifecycle.

## Success Criteria

This feature is successful when:

- the player can point at a place and deliberately pin it with one selected boy
- the boy uses real ammo and real gunfire
- the suppress action visibly pressures enemies and bends the fight
- the boy resumes his base stance when done
- `Alt + Click` and `Alt + V` feel like two inputs for the same tactical action
- grenade and suppress now clearly coexist inside one shared tactical-action architecture
