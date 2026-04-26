# Squad Suppression Implementation Plan

## Objective

Ship deeper reusable suppression on top of the tactical-action overlay:

- `Alt + Click` to suppress the clicked point
- `Alt + V` to suppress the current cursor point

## Phase 1: Extend Tactical Action Types

- add `suppress` as a new tactical action id
- extend shared tactical-action metadata for duration, target radius, and execution tuning
- keep grenade working unchanged on the same lifecycle

Exit criteria:

- the shared tactical-action model can represent both grenade and suppression cleanly

## Phase 2: Queue Path And Input Unification

- add suppress queueing through the existing `queueSelectedSquadTacticalAction(...)`
- bind `Alt + Click` in the raid scene
- bind `Alt + V` in the raid scene
- ensure both inputs create the same suppress action payload

Exit criteria:

- both suppression inputs drive one tactical action id with one lifecycle

## Phase 3: Movement And Lineup

- teach friendly combatants to seek usable suppress positions
- add a short `lining-up` stage before firing
- handle blocked sight, bad geometry, and range recovery

Exit criteria:

- the selected boy visibly gets into position and lines up before the suppress burst starts

## Phase 4: Real Suppressive Fire

- reuse real projectile spawning and ammo consumption
- fire repeated bursts at the suppress target area
- apply stronger pressure logic around the target point
- obey reload and dry-fire rules

Exit criteria:

- suppression is real gunfire with real ammo cost and visible enemy pressure payoff

## Phase 5: Weapon-Role Tuning

- tune rifle suppression for longer range and steadier bursts
- tune SMG suppression for short-to-mid aggressive lanes
- restrict shotgun suppression to close doorway denial instead of fake long-range hose behavior

Exit criteria:

- weapon choice meaningfully changes whether a suppress order is smart or dumb

## Phase 6: Feedback And Readability

- add suppression world marker and actor-to-target link
- surface suppress status in `Boys Command`
- add concise comms for queued, live, complete, and failed suppress states
- update briefing/control reference copy

Exit criteria:

- the player can instantly tell who is suppressing what and whether it is still live

## Phase 7: CLI And Snapshot

- add `squad-action --id suppress --x --y`
- expose suppress state in agent snapshot
- include enough state to verify action age, target, and lifecycle status

Exit criteria:

- suppression is automation-friendly and reviewable without manual play only

## Key Risks

- if suppression is too accurate, it becomes disguised attack instead of lane denial
- if suppression has no real pressure payoff, it feels fake
- if shotgun suppression works unrealistically at range, the weapon-role depth collapses
- if `Alt + Click` steals normal fire too aggressively, the input will feel clumsy

## Recommended Implementation Order

1. add `suppress` to tactical-action types
2. wire `Alt + Click` and `Alt + V` to one queue path
3. implement lineup plus burst execution in the friendly combatant loop
4. tune pressure effect and ammo/reload behavior
5. add HUD, world cue, CLI, and snapshot support
6. tune rifle / SMG / shotgun role expression

## Verification Targets

The first good suppression pass should prove:

- one brother can pin a window while another holds or pushes
- suppression can chain with `Alt + G` grenade on a second brother
- bad suppress asks fail legibly
- weapon role changes the outcome in obvious ways

## Follow-Up After Ship

Once suppression lands, the next high-value tactical combinations are:

- suppress + grenade
- hold + suppress
- breach + grenade
- doorway hose as a tuned suppression variant
