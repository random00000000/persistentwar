# Fireteam Building Doctrine Implementation Plan

## Purpose

Turn the active fireteam-building amendment into a concrete implementation order that future agents can execute without redefining the problem.

This plan sits under the existing AI pressure package and should be treated as the next specialization pass inside that package.

## Source Direction

- [AI Pressure And Territorial Replayability Player Spec](./PLAYER_SPEC.md)
- [AI Pressure And Territorial Replayability Implementation Spec](./IMPLEMENTATION_SPEC.md)
- [AI Pressure And Territorial Replayability Implementation Plan](./IMPLEMENTATION_PLAN.md)
- [Fireteam Building Doctrine Amendment](./FIRETEAM_BUILDING_DOCTRINE_AMENDMENT.md)
- [Main Map Tactical Slice Player Spec](../main-map-tactical-slice/PLAYER_SPEC.md)

## Problem Statement

The project already has stronger pressure posture, surrender, replayable settlement state, and better quiet ingress than before.

The next AI gap is more specific:

- hostile contacts still risk reading as individual bodies instead of a coordinated small unit
- building fights do not yet consistently preserve support-gun suppression and deep-room danger
- room clear exists as a slice, but not yet as the dominant repeatable language of town fighting

This plan fixes that by making enemy squads more role-readable and more building-dependent.

## Target Runtime

The default hostile element should increasingly behave like:

- `1 support gunner`
- `3 rifles`

The building-defense loop should read like:

1. support gun fixes the outside lane
2. one rifle anchors the near threshold
3. one rifle threatens a side shift
4. one rifle preserves depth inside the structure
5. the player suppresses, isolates, enters, clears, and converts the hold

## Why This Order

This work should not begin with fancy squad UI or bespoke one-off scenes.

The order should be:

1. formalize composition and roles
2. make building holds and anchor discipline stable
3. make suppression and role-kill consequences visible
4. make room-clear compression reliable
5. broaden authored proofs and then spread across free play

That order protects the real product goal:

- room clearing becomes a masterable raid verb

not:

- add more AI state without changing how building fights actually feel

## Milestone 1. Squad Role Formalization

### Goal

Make enemy groups read as squads with roles instead of spawn-adjacent independent bots.

### Work

- add a lightweight `EnemySquadState` or equivalent derived grouping layer
- assign baseline roles:
  - `support-gunner`
  - `anchor-rifle`
  - `probe-rifle`
  - `deep-rifle`
- group nearby staged spawns into one squad identity where possible
- expose squad role data in snapshot output

### Acceptance

- one hostile group can be inspected as a four-role squad
- snapshot output exposes squad composition and each enemy's role
- future authored slices can target specific hostile roles without bespoke hacks

## Milestone 2. Building Hold Discipline

### Goal

Make squads prefer solving town fights from buildings and interior cover.

### Work

- bias hot-pocket squads toward `hold` and `reserve` postures
- keep support gunners out of first-wave rush logic
- strengthen anchor discipline for hold/reserve roles
- preserve deeper interior defenders when the player only skirmishes outside
- ensure line-of-sight loss tends to compress defenders back into the structure instead of sending them on long chases

### Acceptance

- more hot-pocket defenders remain building-bound until the player forces entry
- support-gun suppression appears before a building becomes an easy room flood
- free-play openings read less like yard swarms and more like defended footholds

## Milestone 3. Role-Kill Consequences

### Goal

Make squad roles matter to the player.

### Work

- killing the support gunner reduces crossing danger and compresses outside pressure
- killing the anchor rifle softens the first threshold
- killing the deep rifle reduces second-room punishment
- propagate squad degradation into pressure posture, operation read, and dialogue where useful

### Acceptance

- one authored slice proves the support gunner materially changes the push
- one authored slice proves the deep-room rifle materially changes second-room danger
- the player can feel that specific kills change the building fight shape

## Milestone 4. Room-Clear Compression

### Goal

Turn loud or partial entries into deeper room-clear problems rather than instant outside chaos.

### Work

- when the building is woken, defenders compress deeper before breaking outward
- near-threshold defenders hold long enough to punish bad first entries
- deeper defenders preserve room-two / room-three danger
- only allow aggressive outward rush in narrow cases:
  - short-range punish
  - panic collapse
  - sweeper exception

### Acceptance

- first-room success does not automatically solve the structure
- second-room danger remains live in authored room-clear slices
- building fights feel like process, not one threshold check

## Milestone 5. Readability Pass

### Goal

Make the squad/building model learnable without docs.

### Work

- expose squad composition and dominant role in snapshot output
- feed support-gun / room-depth language into pressure posture and operation copy
- add selective hostile dialogue that indicates:
  - gunner still owns the lane
  - building is compressing
  - deep room is still live
- use transient battlefield language, not debug clutter

### Acceptance

- players can infer when the support gun still owns the crossing
- players can infer whether the building is only first-room broken or fully solved
- authored slices speak in room-clear language rather than generic contact language

## Milestone 6. Proof Expansion

### Goal

Prove the doctrine through reusable slices and then spread it into broader raid play.

### Work

- expand room-clear proof slices
- add one support-gun crossing slice
- add one building-compression slice
- add one role-kill payoff slice
- spread the same role logic into additional settlement types only after the first building loops are reliable

### Acceptance

- at least four authored AI proofs share the same fireteam-building logic
- free-play pockets increasingly inherit the same squad/building read

## CLI And Verification Requirements

The feature must remain CLI-first.

Snapshot should eventually expose:

- `enemySquads[]`
- per-squad role composition
- dominant squad doctrine
- support-gunner alive/dead state
- deep-room defenders alive count
- structure compression state

Required verifier families:

- `room-clear-drill`
- `dish-house-breach`
- a new `support-lane-fix` verifier
- a new `compressed-interior` verifier

## Initial Tuning Guidance

Start conservative.

- support gunner should be common in hot pockets, not omnipresent everywhere
- building holds should be stronger in towns and compounds than in open lanes
- deep-room defenders should be scary, but not random aim gods
- outward rush should be the exception, not the baseline

## Risks

### 1. Fake Squad Logic

If squads only exist in snapshot text and not in behavior, the feature fails.

Mitigation:

- tie role death and posture changes to real steering and hold logic

### 2. Overstatic Defenders

If building defenders never shift or compress, fights become solved puzzles.

Mitigation:

- preserve shift, compression, and break states

### 3. Open-Lane Regression

If this pass makes all enemies too passive outside, raids lose pressure.

Mitigation:

- keep sweepers, probes, and reserve arrivals live
- preserve support-fire danger on crossings

### 4. Room-Clear Fatigue

If every structure feels identical, mastery turns into repetition.

Mitigation:

- vary near-threshold, side-shift, and deep-room arrangements across the same shared squad model

## First Build Recommendation

If future implementation starts immediately, the first concrete build should be:

1. lightweight hostile squad grouping and role exposure
2. support-gunner role assignment in one hot-pocket slice
3. hold/reserve anchor discipline for building defenders
4. one verifier proving that killing the support gun changes the room-clear push

That is the smallest build that makes this direction real instead of aspirational.
