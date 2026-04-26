# Main Map Tactical Slice Implementation Spec

## Purpose

Define the implementation baseline and acceptance criteria for the main replayable tactical map slice.

This package should unify the project's existing strong authored route work into one north-star battlefield slice.

## Source Direction

- [Tactical Squad Extraction North Star](../../TACTICAL_SQUAD_EXTRACTION_NORTH_STAR.md)
- [Systemic Reuse And Prefab Rules](../../SYSTEMIC_REUSE_AND_PREFAB_RULES.md)
- [Infiltration Shooter Direction](../../INFILTRATION_SHOOTER_DIRECTION.md)
- [Core Verbs Raw Fantasy](../../CORE_VERVS_RAW_FANTASY.md)
- [Core Verbs Raw Fantasy V2](../../CORE_VERVS_RAW_FANTASYV2.md)
- [Extraction Direction](../../EXTRACTION_DIRECTION.md)
- [AI Pressure And Territorial Replayability Implementation Spec](../ai-pressure-and-territorial-replayability/IMPLEMENTATION_SPEC.md)
- [Gun Doctrine Implementation Spec](../gun-doctrine/IMPLEMENTATION_SPEC.md)
- [Stash Normalization And Squad Recovery Implementation Spec](../stash-normalization-and-squad-recovery/IMPLEMENTATION_SPEC.md)
- [Extraction Pressure And Operation Flow Implementation Spec](../extraction-pressure-and-operation-flow/IMPLEMENTATION_SPEC.md)
- [RimWorld Dialogue Campaign Flavor Implementation Spec](../rimworld-dialogue-campaign-flavor/IMPLEMENTATION_SPEC.md)

## Package Boundary

This package owns:

- district and sub-zone structure
- authored tactical geometry
- map-side readability for tactical spaces

This package depends on the AI package for:

- settlement control state
- pressure-driven map variation
- replayable return-state logic

This package should not take ownership of:

- AI posture tuning
- stash systems
- extraction-economy tuning
- operation-phase logic
- dialogue story-family logic

## Current Code Baseline

The current map and route baseline already contains a lot of useful tactical structure.

### Existing Route Structure

In [arena.ts](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/topdownextractionshooter/src/game/arena.ts), the playable raid layer already has:

- `RAID_ROUTES` with three route ids:
  - `crosswind-docks`
  - `broken-signal`
  - `sundered-run`
- `RaidRouteDefinition` with:
  - insertion points
  - extract options
  - intel positions
  - supply caches
  - enemy spawn points
  - noise-response tiers
  - scenic props
  - combat pockets
- obstacle geometry with:
  - authored `doorways`
  - authored `breach` points

This means the project already has a route-driven map architecture rather than a blank map runtime.

### Existing Tactical Geometry

Current code and UI already support:

- room stacks
- doorway telemetry
- authored breach points
- foothold reads
- active room-depth progression
- extraction-pressure reads
- route-level tactical briefings

Important evidence in [main.ts](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/topdownextractionshooter/src/main.ts):

- room-stack HUD surfaces
- doorway telemetry and nearest-doorway reads
- breach-point map markup
- foothold and support-card rendering
- route debrief and district fallout surfaces

This is a strong baseline for granular tactical spaces.

### Existing Operation And Consequence Context

The later north-star packages now clarify what this map has to support:

- gun doctrine needs stable spaces with different failure and success cases
- stash and recovery need casualty corridors, recoverable lanes, and believable return paths
- extraction flow needs distinct exfil edges that can stay clean or turn hot
- dialogue flavor needs remembered ground, bunker pauses, and identifiable route character

That means the map package is not only building geometry. It is building the battlefield truth the other packages consume.

### Existing Frontline Route Flavor

In [simulation.ts](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/topdownextractionshooter/src/game/simulation.ts), `FRONTLINE_BLUEPRINT` already gives each route:

- `zoneLabel`
- initial control
- pressure
- fortification
- scars
- active event text
- support need
- watch text

The route incident generators already give each route:

- firefights
- convoy beats
- casualty beats
- civilian beats
- bunker footholds

This means the map slice should deepen and unify an existing authored world language instead of replacing it.

## Problem Statement

The current game has:

- good local tactical slices
- good route flavor
- good authored room and breach work

but it does not yet have:

- one north-star main map that feels like the product's definitive battlefield
- one settlement-aware district that can be replayed and mastered as a whole
- one map structure where all key tactical spaces live together in a coherent loop

Right now the project feels like several strong route slices.

This package should make it feel like one replayable tactical district.

## Feature Goals

### 1. Build One Main Map Slice

The project needs one primary battlefield that serves as the north-star operation map.

This slice may internally reuse route architecture, but player-facing it should read as one major district with coherent sub-areas, not only three disconnected scenario routes.

### 2. Preserve Granular Tactical Geometry

The map must keep the existing investment in:

- doorway traversal
- room depth
- footholds
- breach points

and extend that quality outward into:

- settlement blocks
- trench elements
- roads
- extraction edges

### 3. Support Gray-Zone Replayability

The map must work with the AI and territorial package so at least one settlement or block can:

- change control
- change tactical posture
- change route feel
- remain worth revisiting

### 4. Support Full Operation Flow

The main map slice must cleanly support:

- insertion
- early tactical read
- mid-run foothold or escalation
- loot and objective pressure
- extraction under route pressure

without taking over extraction pacing or stash classification itself.

## Design Rules

### One Battlefield Rule

The north-star map should read as one battlefield with multiple tactical sub-zones.

It should not feel like unrelated combat dioramas stitched together.

### Granular Problems Rule

Every major sub-zone must be composed of small tactical problems.

The player should be reading:

- windows
- thresholds
- lanes
- trench lips
- bunker entries
- extraction edges

not just running toward markers.

### System Interlock Rule

The map must expose spaces that neighboring packages can read cleanly.

That means the first district must contain:

- gun-relevant spaces
- body-recovery-relevant spaces
- extract-relevant spaces
- remembered-ground spaces

without pushing those neighboring rules back into the map package itself.

### Reuse Rule

This package should prefer reusable tactical situations, subzone types, and district hooks over one-off map scripts.

If a new map problem appears to need a unique implementation, first ask whether it is actually:

- a new configuration of an existing tactical situation
- a new subzone state
- a new authored hook on an existing route or district primitive

### Follow-Through Rule

The map must support follow-through beyond first contact.

That means:

- room clearing cannot end at the first doorway
- trench fights cannot end at the lip
- footholds must matter after entry

### Readable Return Rule

When the player returns, the map must show what changed.

At minimum:

- control
- scars
- dressing
- route pressure
- support need

must shift in readable ways.

## Map-State Additions

### North-Star District Layer

Add a higher-level district model that groups current route logic into one main battlefield slice.

Suggested structure:

```ts
interface TacticalDistrictState {
  id: string;
  label: string;
  activeSubzones: string[];
  primarySettlementId: string;
  routeIds: RaidRouteId[];
  districtPressure: number;
  districtControlTone: "held" | "contested" | "lost" | "mixed";
}
```

The first version can be lightweight and largely presentational, but it should let the game describe the main map as one district with multiple sub-zones.

### Tactical Subzone Model

Add a map-side concept for major sub-zones inside the district:

- town block
- industrial yard
- trench or fighting line
- bunker chain
- extraction edge

Suggested structure:

```ts
type TacticalSubzoneType = "town-block" | "industrial-yard" | "trench-line" | "bunker-chain" | "extract-edge";

interface TacticalSubzoneState {
  id: string;
  districtId: string;
  routeId: RaidRouteId;
  label: string;
  type: TacticalSubzoneType;
  pressure: number;
  settlementId?: string;
  tacticalHooks: string[];
}
```

The goal is not to build editor complexity immediately.

The goal is to give the north-star map a clear tactical composition.

## Authored Tactical Situations

The first main map slice must intentionally support:

- one chained room-clear path
- one breachable entry problem
- one dangerous open crossing
- one bunker or basement foothold
- one trench or trench-adjacent assault problem
- one extraction edge that feels different when the district is hotter

Current authored room and breach work should be reused, not discarded.

## Territorial Hooks

The map package must interlock with the AI/territorial package.

Required hooks:

- at least one sub-zone tied to settlement control state
- settlement change reflected in map dressing and route reads
- debrief fallout naming the affected town or district block
- return-state changes visible on re-entry

## Cross-Package Hooks

The map package must intentionally provide hooks for the other north-star packages.

### Gun Hooks

The district must contain spaces that clearly reward:

- rifle lane control
- SMG or shotgun room tempo
- PKM-style suppression and crossing cover
- sidearm recovery or emergency use

### Stash And Recovery Hooks

The district must contain:

- body-recovery-relevant lanes
- returnable footholds
- believable routes where loot, bodies, and surviving boys can actually be brought out

### Extraction Hooks

The district must contain at least two extract personalities or one extract that can plausibly shift personality with pressure:

- faster but hotter
- slower but cleaner
- screenable but exposed

### Dialogue Hooks

The district must contain:

- named bad ground worth remembering
- bunker or basement pauses
- sub-zones that can feel different on return

## UI And CLI Requirements

### UI Reuse

Reuse before expanding:

- route briefing surface
- room-stack HUD
- doorway telemetry
- frontline cards
- debrief route/district reads
- breach map markup

Required additions:

- district label or main-map identity in at least one key surface
- one readable sub-zone callout system
- one clearer player-facing explanation of how current route/sub-zone fits the larger district

### CLI Requirements

The map slice must be testable through current CLI flows.

Needed verification visibility:

- district or main-map label
- active sub-zone label
- room-stack and doorway telemetry
- settlement-linked return-state read
- extract-pressure read

Needed showcase coverage:

- room-clear
- breach
- bunker foothold
- return-to-subzone or town-state variation
- extract-pressure under changed map state
- one route or sub-zone that reads as memorable ground rather than anonymous geometry

## Acceptance Criteria

The map slice is complete for the first north-star version when:

- one primary district reads as the game's main battlefield
- that district contains multiple tactical sub-zones with different combat problems
- at least one settlement-aware sub-zone can change state and feel different on return
- room, breach, foothold, crossing, and extraction problems all exist inside the same overall map identity
- current route flavor is preserved but unified into a more coherent battlefield story
- UI and CLI surfaces can explain where the player is, what kind of tactical problem they are in, and how the district has changed

## Out Of Scope For This Package

- a fully seamless giant open world
- replacing all current route architecture at once
- building multiple north-star districts before one is proven
- cinematic-only map dressing that does not affect tactics

## Risks

- trying to jump to giant-map scale before proving one district
- losing the current strong room and breach work during unification
- making the district concept purely narrative with no tactical consequences
- keeping routes too disconnected and failing to produce a true main map
