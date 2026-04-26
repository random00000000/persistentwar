# AI Pressure And Territorial Replayability Implementation Spec

## Purpose

Define the implementation baseline and acceptance criteria for the feature package that makes enemy pressure masterable and settlements replayable across repeated operations.

This package should turn the current frontline scaffold into a true gray-zone tactical layer.

## Source Direction

- [Tactical Squad Extraction North Star](../../TACTICAL_SQUAD_EXTRACTION_NORTH_STAR.md)
- [Systemic Reuse And Prefab Rules](../../SYSTEMIC_REUSE_AND_PREFAB_RULES.md)
- [Infiltration Shooter Direction](../../INFILTRATION_SHOOTER_DIRECTION.md)
- [Core Verbs Raw Fantasy](../../CORE_VERVS_RAW_FANTASY.md)
- [Core Verbs Raw Fantasy V2](../../CORE_VERVS_RAW_FANTASYV2.md)
- [Extraction Direction](../../EXTRACTION_DIRECTION.md)
- [Main Map Tactical Slice Implementation Spec](../main-map-tactical-slice/IMPLEMENTATION_SPEC.md)
- [Fireteam Building Doctrine Amendment](./FIRETEAM_BUILDING_DOCTRINE_AMENDMENT.md)

## Active Amendment

This implementation package now explicitly includes a living specialization direction:

- hostile groups should increasingly read as small fireteams
- towns should more often be solved through building holds and room clears
- support-fire-first pressure is preferred over default immediate rush behavior

Future AI work that touches building fights should be evaluated against [Fireteam Building Doctrine Amendment](./FIRETEAM_BUILDING_DOCTRINE_AMENDMENT.md).

## Package Boundary

This package owns:

- pressure posture
- territorial volatility
- retake logic
- settlement memory and replayability

It depends on the map package for:

- rooms
- trench spaces
- bunker footholds
- settlement-facing geography

It should not become a replacement for the map package itself.

## Current Code Baseline

The project already has meaningful groundwork in [simulation.ts](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/topdownextractionshooter/src/game/simulation.ts) and [main.ts](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/topdownextractionshooter/src/main.ts).

### Existing Territorial State

Current simulation types already include:

- `FrontlineControl = "held" | "contested" | "lost"`
- `FrontlineSectorState` with `pressure`, `fortification`, `scars`, `routeModifierTitle`, `supportNeed`, `lastOutcome`, `lastRaidResult`, and persistent fallen-body arrays
- `FrontlineIncidentState` with `status`, `casualtyPressure`, `territoryState`, `territoryRadius`, `territoryNote`, `actionVerb`, `markerState`, and `markerNote`
- `PendingFrontlineOperationState` for pre-raid route operations like `reinforce-pickets`, `mark-exfil`, and `recover-body`

Current code also ships:

- route-level control shifting via `shiftFrontlineControl`
- route modifier generation through `getFrontlineRouteModifier`
- scar ledger generation via `buildRaidScarLedger`
- HUD/debrief surfaces for focus incidents, aftermath, and debrief frontline cards
- persistent body debt and missing-body routing into next-push recommendations

This is a strong baseline, but it is still mostly:

- route-state driven
- incident-state driven
- authored-slice driven

It is not yet a full settlement replayability system.

### Existing AI Pressure Baseline

Current baseline already includes:

- suppression-oriented combat reads and support-order payoff surfaces
- incident states like `sweeping`, `engaged`, `collapsing`, `routed`, and `secured`
- surrender windows in routed pockets
- casualty incidents and casualty-pull beats
- medevac and armored-evac flavored slices
- support orders that can shift fire, draw heat, secure exfil, hold, and breach-push

This means the feature should extend a live tactical runtime, not invent one from zero.

### Existing Presentation Baseline

The DOM HUD, debrief boards, and authored showcases already support:

- frontline incident cards
- frontline focus board
- aftermath scar read
- debrief frontline sector cards
- route claim ledger
- extract-pressure and war-beat context

The implementation should reuse and deepen these surfaces before inventing new permanent UI.

## Problem Statement

The current system proves that the game can track route pressure, scars, and territorial tone, but it does not yet fully deliver the north-star promise that:

- towns can change hands multiple times
- those changes create different tactical problems
- the AI participates in suppression, collapse, surrender, casualty response, and retake logic as a coherent battlefield language

Right now the game has the vocabulary.

This package must make that vocabulary systemic, replayable, and readable.

## Feature Goals

### 1. Deepen AI Pressure

AI must create tactical situations the player can learn to read and solve.

Priority battlefield states:

- `holding`
- `pinned`
- `collapsing`
- `routed`
- `surrendering`
- `withdrawing`
- `reinforcing`
- `recovering casualty`
- `retaking`

### 2. Turn Route State Into Settlement State

The current route-level scaffold should deepen into settlement-aware state for at least one north-star town or settlement cluster.

A settlement must be able to exist in clearly readable states such as:

- held
- contested
- lost
- breaking
- reclaimed
- scarred

These states should affect:

- enemy posture
- support posture
- tactical opportunities
- debrief fallout
- next-raid expectations

### 3. Make Territorial Change Replayable

The same settlement should produce different operations over time.

The player should be able to return to a settlement and experience:

- different entry pressure
- different defender posture
- different hold dressing
- different route pressure
- different casualty or surrender opportunities

### 4. Keep It Performant

This is not a full RTS sim.

The system should remain event-table and state-transition based, with authored support where useful, so it stays lightweight and inspectable.

## Design Rules

### Reuse Rule

This package should reuse the shared combatant, pressure-posture, settlement-state, and operation-state primitives wherever possible.

Do not solve a new location or incident by inventing a new NPC species if a role profile on the existing combatant model can represent it.

### Shared Tactical Language Rule

The AI must operate in the same verbs the player is mastering:

- suppression
- sector watch
- room hold
- trench hold
- casualty pull
- surrender pressure
- hold, lose, and retake ground

No opaque difficulty spikes.

### Readability Rule

Every territorial swing must be readable through battlefield expression, not just debrief text.

Minimum expression sources:

- marker state
- territory note
- world dressing
- dialogue or comms
- debrief fallout

### Causality Rule

Settlement state changes must happen for understandable reasons.

Examples:

- a routed pocket becomes reclaimed because the player held it and planted the claim
- a settlement becomes lost because the player extracted while the pocket was still breaking
- a casualty corridor changes route pressure because body debt and recovery state remain unresolved

### Single-Player Mastery Rule

The implementation should make single-player stronger first.

This package should not assume multiplayer rescue.

## State Additions

### Settlement Layer

Add a lightweight settlement model on top of existing `FrontlineSectorState`.

Suggested structure:

```ts
type SettlementControlState = "held" | "contested" | "lost";
type SettlementVolatilityState = "stable" | "breaking" | "fragile" | "reclaiming";

interface SettlementState {
  id: string;
  routeId: RaidRouteId;
  label: string;
  type: "town" | "compound" | "bunker-chain" | "trench-line";
  control: SettlementControlState;
  volatility: SettlementVolatilityState;
  pressure: number;
  fortification: number;
  scars: number;
  lastRaidResult: "success" | "failed" | "standby";
  lastMeaningfulShiftCycle: number;
  memoryTags: string[];
  activeSituationIds: string[];
}
```

The first milestone only needs one settlement family to prove the system.

### AI Pressure State

Deepen current incident runtime with explicit pressure posture.

Suggested addition:

```ts
type PressurePosture =
  | "holding"
  | "pinned"
  | "collapsing"
  | "routed"
  | "surrendering"
  | "withdrawing"
  | "reinforcing"
  | "recovering";
```

This can either be added directly to `FrontlineIncidentState` or derived from current timers and fields, but it must become inspectable.

### Settlement Memory Layer

Add lightweight memory tags to support return-state variation:

- `flag-planted`
- `body-left-behind`
- `body-recovered`
- `surrender-pocket`
- `town-lost`
- `town-reclaimed`
- `casualty-corridor-open`
- `convoy-hit`

This should feed:

- world dressing
- dialogue
- next-raid state selection

## Behavior Requirements

### Suppression And Pinning

Suppression must have meaningful AI consequences.

Required behaviors:

- pinned enemies reduce movement confidence
- pinned enemies hesitate to peek
- pinned enemies become more vulnerable to grenade or flank follow-up
- defenders in windows or trench lips should feel structurally stronger until suppressed or broken

Acceptance does not require a brand-new suppression system, but it does require that the existing pressure logic visibly produces these outcomes.

### Collapse And Surrender

When a pocket is isolated and correctly pressured:

- defenders should move from `holding` to `collapsing`
- some routed states should become surrender windows
- surrender should only happen after tactical advantage is established

Current routed-pocket behavior should be preserved and generalized.

### Casualty And Medevac Response

Casualties should materially change fight shape.

Required behaviors:

- casualty incidents can escalate local risk
- casualty pulls can modify route pressure or extract pressure
- medevac responses can create short-lived reinforcement or withdrawal windows

This should build on the project's already-shipped casualty and armored-evac flavor rather than replacing it.

### Territorial Retake Logic

At least one settlement must be able to change hands repeatedly through understandable rules.

Required transitions for the first vertical slice:

- held -> contested
- contested -> reclaimed
- contested -> lost
- lost -> contested
- reclaimed -> fragile

These transitions must affect the next operation in that settlement.

## World And UI Requirements

### Battlefield Readability

World expression for the first settlement slice should include a subset of:

- planted or torn-down flags
- scar dressing
- body lanes
- changed barricade or trench dressing
- changed support notes
- different hostile or friendly presence flavor

### HUD And Debrief Reuse

Use the current frontline surfaces before inventing persistent new panels:

- frontline incident cards
- frontline focus board
- aftermath board
- debrief frontline cards
- scar ledger

Required additions:

- settlement label or settlement-state read on at least one core surface
- readable distinction between `temporarily reclaimed` and `stable hold`
- debrief explanation for why a settlement changed state

## CLI And Verification Requirements

This package must stay CLI-verifiable before it is considered done.

At minimum the snapshot path should expose:

- settlement state
- pressure posture or equivalent derived AI pressure read
- current control and volatility
- active settlement memory tags
- territorial shift reason for the last raid

Needed showcase or verification paths:

- one pinned-room or pinned-trench pressure slice
- one surrender pocket slice
- one casualty or medevac pressure slice
- one town-return slice where the same settlement changed hands

## Acceptance Criteria

The feature is complete for the first north-star slice when:

- at least one settlement can change hands multiple times across operations
- those changes alter the next raid in readable ways
- AI pressure states produce visible tactical differences between holding, pinned, collapsing, and routed behavior
- suppression materially helps break rooms, trenches, or crossings
- surrender is earned through pressure rather than random trigger
- casualty and medevac logic can influence how a settlement operation plays out
- CLI and debrief surfaces can explain what changed and why

## Out Of Scope For This Package

- full multi-settlement campaign map
- fully generalized strategic simulation for the whole war
- multiplayer-facing balance
- huge new permanent HUD stacks

Those can come later after the first settlement slice proves the concept.

## Risks

- building a fake territorial layer that only changes copy
- making suppression look dramatic without tactical consequence
- over-randomizing settlement state and losing causality
- adding too much abstract sim logic with too little battlefield expression
- trying to solve the whole war instead of proving one replayable settlement well
