# AI Pressure And Territorial Replayability Implementation Plan

## Purpose

Sequence the work required to turn the current frontline scaffold into a replayable gray-zone tactical system with masterable AI pressure.

## Source Direction

- [Tactical Squad Extraction North Star](../../TACTICAL_SQUAD_EXTRACTION_NORTH_STAR.md)
- [Systemic Reuse And Prefab Rules](../../SYSTEMIC_REUSE_AND_PREFAB_RULES.md)
- [AI Pressure And Territorial Replayability Player Spec](./PLAYER_SPEC.md)
- [AI Pressure And Territorial Replayability Implementation Spec](./IMPLEMENTATION_SPEC.md)
- [Fireteam Building Doctrine Amendment](./FIRETEAM_BUILDING_DOCTRINE_AMENDMENT.md)
- [Fireteam Building Doctrine Implementation Plan](./FIRETEAM_BUILDING_IMPLEMENTATION_PLAN.md)
- [Main Map Tactical Slice Implementation Plan](../main-map-tactical-slice/IMPLEMENTATION_PLAN.md)

## Active Amendment

This package now has an active specialization direction:

- enemy AI is evolving toward small fireteams
- building-first defense is preferred over instant rushdown
- room clearing is a first-class mastery verb

Future agents should read [Fireteam Building Doctrine Amendment](./FIRETEAM_BUILDING_DOCTRINE_AMENDMENT.md) before making major enemy-AI changes inside town and building fights.

## Package Boundary

This plan should be executed immediately after the main map slice is coherent enough to host one real replayable settlement.

## Why This Order

This package should start by proving one settlement and one tactical vocabulary slice well.

The risk is trying to simulate an entire war before the game has proven:

- pinning
- collapse
- surrender
- casualty response
- territorial retake readability

So the implementation order is:

1. formalize state
2. prove AI pressure states
3. prove one replayable settlement
4. wire debrief and return-state readability
5. expand variation only after the core loop is learnable

The reuse rule for this plan is:

- extend the shared combatant, pressure, and settlement primitives first
- do not solve a new settlement beat by inventing a bespoke actor or state machine unless reuse clearly fails

## Milestone 1. Baseline Formalization

### Goal

Make the current frontier scaffold inspectable and stable enough to build on.

### Work

- add or derive an explicit AI pressure posture model from current incident state
- add a lightweight settlement state model on top of `FrontlineSectorState`
- map current incident and route state into the shared settlement grammar before adding new custom branches
- choose one route and one settlement cluster as the proving ground
- add snapshot exposure for settlement state, control, volatility, and last shift reason

### Acceptance

- one route exposes settlement-state data in snapshot output
- AI pressure posture is inspectable
- baseline reads are stable enough for authored verification

## Milestone 2. Pressure-State AI Slice

### Goal

Make AI pressure feel tactically meaningful before broadening territory replayability.

### Work

- tune suppression so pinned states visibly alter enemy movement and peeking
- deepen hold-versus-collapse behavior for rooms and trench segments
- ensure routed pockets can progress into surrender windows through real tactical pressure
- ensure casualty incidents alter fight shape and not just flavor text

### Acceptance

- one authored pinned slice proves suppression changed the outcome
- one authored hold slice proves defenders punish shallow entry
- one authored surrender slice proves collapse leads to surrender under correct pressure
- one casualty slice proves casualty response materially changes operation flow

## Milestone 3. One Replayable Settlement

### Goal

Prove that the same settlement can produce different tactical problems across multiple operations.

### Work

- select one town, compound, or bunker chain to become the first settlement state machine
- implement settlement transitions:
  - held -> contested
  - contested -> reclaimed
  - contested -> lost
  - lost -> contested
  - reclaimed -> fragile
- map those transitions to tactical consequences:
  - route pressure
  - defender posture
  - hold dressing
  - support need
  - scar expression

### Acceptance

- the player can revisit the same settlement and see a meaningful change
- the change is visible in both the world and the debrief
- the settlement does not feel permanently solved after one success

## Milestone 4. Return-State Readability

### Goal

Make the territorial replayability understandable without reading implementation notes.

### Work

- add settlement labels and state reads to reused frontline surfaces
- add debrief explanation for why a settlement changed state
- add dialogue hooks for reclaimed, lost, breaking, and remembered-settlement beats
- add small world-expression changes keyed off settlement memory tags

### Acceptance

- players can tell whether a settlement is held, fragile, contested, or lost
- debrief copy explains what shifted
- dialogue acknowledges meaningful returns and reversals

## Milestone 5. Operation Interlock

### Goal

Connect AI pressure and territorial replayability to extraction decisions.

### Work

- make settlement state influence route pressure and extract pressure in a readable way
- connect unresolved settlement instability to greed-vs-extract decisions
- connect missing-body debt and settlement return pressure where appropriate

### Acceptance

- staying too long in a fragile or breaking settlement creates understandable extra danger
- extracting early can leave a settlement unstable
- returning later can become strategically attractive or necessary

## Milestone 6. Expansion Pass

### Goal

Only after the first settlement works, broaden variation carefully.

### Work

- add one more settlement type if the first proved clearly
- broaden pressure-posture use across additional authored slices
- add more memory tags only if they improve replayability rather than noise

### Acceptance

- additional variety deepens the same tactical language instead of diluting it

## Verification Strategy

Every milestone should be verified in three ways:

### 1. CLI Snapshot

Must expose:

- settlement state
- AI pressure posture
- territorial shift reason
- memory tags

### 2. Authored Showcases

Need at least:

- pinned pressure
- surrender pocket
- casualty or medevac pressure
- town return or retake

### 3. Debrief Proof

Must show:

- what changed
- why it changed
- what it means for the next run

## Initial Tuning Guidance

Start conservative.

- pinned should reduce aggression before it fully freezes movement
- surrender should be uncommon but legible
- retakes should happen often enough to make the map feel alive, but not so often that success feels fake
- the first settlement should oscillate enough to prove replayability without becoming random

## Risks

### 1. Scope Explosion

Trying to build a whole-war sim immediately will bury the actual tactical gain.

Mitigation:

- prove one settlement first

### 2. Fake Territory

If territorial shifts only change copy, the feature fails.

Mitigation:

- require tactical consequences and world expression for every state shift

### 3. Noisy AI

If pressure reads as chaos, mastery dies.

Mitigation:

- formalize posture states and keep them inspectable

### 4. Replayability Without Memory

If returns to the same settlement do not visibly remember prior fights, the gray-zone promise weakens.

Mitigation:

- ship memory tags, scar expression, and debrief fallout in the first slice

## First Build Recommendation

If implementation starts immediately, the first concrete build should be:

1. explicit pressure posture read
2. one pinned-and-collapse authored firefight
3. one settlement state model on a single route
4. one return-to-town showcase where the same place changed hands

That build should reuse the same combatant and pressure primitives across all four proof points.

That is the smallest build that proves the package is real.
