# North Star Spec Scaffolding

This folder holds the implementation-spec packages that turn the tactical squad extraction north star into concrete product work.

Each feature area should normally be represented by three documents:

- `PLAYER_SPEC.md`
- `IMPLEMENTATION_SPEC.md`
- `IMPLEMENTATION_PLAN.md`

These specs should stay aligned with:

- [Tactical Squad Extraction North Star](../TACTICAL_SQUAD_EXTRACTION_NORTH_STAR.md)
- [Endgame Direction](../ENDGAME_DIRECTION.md)
- [Combat Center Of Gravity Direction](../COMBAT_CENTER_OF_GRAVITY_DIRECTION.md)
- [Systemic Reuse And Prefab Rules](../SYSTEMIC_REUSE_AND_PREFAB_RULES.md)
- [Infiltration Shooter Direction](../INFILTRATION_SHOOTER_DIRECTION.md)
- [Core Verbs Raw Fantasy](../CORE_VERVS_RAW_FANTASY.md)
- [Core Verbs Raw Fantasy V2](../CORE_VERVS_RAW_FANTASYV2.md)
- [Extraction Direction](../EXTRACTION_DIRECTION.md)

## Package Order

These packages are meant to complement each other in this order:

1. `main-map-tactical-slice`
2. `ai-pressure-and-territorial-replayability`
3. `gun-doctrine`
4. `stash-normalization-and-squad-recovery`
5. `extraction-pressure-and-operation-flow`
6. `rimworld-dialogue-campaign-flavor`
7. `endgame-campaign-finale`
8. `combat-center-of-gravity-and-presentation`

This order matters:

- the map package defines the battlefield and tactical spaces
- the AI package defines the pressure, control swings, and replayable town-state changes inside that battlefield
- the gun package defines how the player and squad solve those spaces
- the stash package defines how raids, losses, loadouts, and replenishment persist across runs
- the extraction package defines leave-or-stay tension and operation closure
- the dialogue package reacts to all of the above and gives the campaign its human voice
- the endgame package turns the whole campaign into a beatable arc with a real final offensive and true escape
- the combat-center package makes explicit that the controller, boy commands, tactical actions, and their presentation are the product's center of gravity

All of those packages should also be building toward the game's eventual ending, not only toward a richer endless loop.

That means the package set as a whole should support:

- a campaign arc that can be completed
- a final fortified district or stronghold
- preparation, survival, and mastery that culminate in a true escape

## Package Boundaries

Use these rules to keep packages integrated instead of overlapping.

### Main Map Tactical Slice

Owns:

- district identity
- sub-zone composition
- room, breach, trench, bunker, road, and extract geometry

Does not own:

- AI pressure posture logic
- weapon-role tuning
- stash consequence rules

### AI Pressure And Territorial Replayability

Owns:

- pressure posture
- surrender and collapse logic
- settlement state
- control swings and retakes

Does not own:

- district geometry itself
- weapon families
- stash progression

### Gun Doctrine

Owns:

- weapon roles
- doctrinal fit by space
- squad gun identity

Does not own:

- map geometry
- settlement state machine
- extraction pacing

### Stash Normalization And Squad Recovery

Owns:

- raid item flow
- squad replacement or replenishment
- persistent consequence around bodies, gear, and readiness

Does not own:

- battlefield geometry
- pressure posture logic

### Extraction Pressure And Operation Flow

Owns:

- leave-or-stay tension
- route collapse pressure
- operation pacing
- exfil consequence

Does not own:

- core room or trench geometry
- weapon doctrine itself

### RimWorld Dialogue Campaign Flavor

Owns:

- human flavor
- memory callbacks
- campaign voice

Does not own:

- primary tactical depth
- core map structure
- AI pressure mechanics

### Endgame Campaign Finale

Owns:

- final stronghold direction
- campaign-end structure
- preparation-raid relationship to finale
- true-escape win condition

Does not own:

- core map geometry by itself
- shared weapon framework
- stash or dialogue base systems

### Combat Center Of Gravity And Presentation

Owns:

- command-runtime centrality
- combat presentation direction
- hardcore opening hardship framing
- cross-cutting rule that the rest of the game should validate the controller

Does not own:

- separate combat primitives
- separate AI logic tree
- separate weapon framework

## Planned Spec Packages

### 1. Main Map Tactical Slice

- [PLAYER_SPEC](./main-map-tactical-slice/PLAYER_SPEC.md)
- [IMPLEMENTATION_SPEC](./main-map-tactical-slice/IMPLEMENTATION_SPEC.md)
- [IMPLEMENTATION_PLAN](./main-map-tactical-slice/IMPLEMENTATION_PLAN.md)

### 2. AI Pressure And Territorial Replayability

- [PLAYER_SPEC](./ai-pressure-and-territorial-replayability/PLAYER_SPEC.md)
- [IMPLEMENTATION_SPEC](./ai-pressure-and-territorial-replayability/IMPLEMENTATION_SPEC.md)
- [IMPLEMENTATION_PLAN](./ai-pressure-and-territorial-replayability/IMPLEMENTATION_PLAN.md)

### 3. Gun Doctrine

- [PLAYER_SPEC](./gun-doctrine/PLAYER_SPEC.md)
- [IMPLEMENTATION_SPEC](./gun-doctrine/IMPLEMENTATION_SPEC.md)
- [IMPLEMENTATION_PLAN](./gun-doctrine/IMPLEMENTATION_PLAN.md)

### 4. Stash Normalization And Squad Recovery

- [PLAYER_SPEC](./stash-normalization-and-squad-recovery/PLAYER_SPEC.md)
- [IMPLEMENTATION_SPEC](./stash-normalization-and-squad-recovery/IMPLEMENTATION_SPEC.md)
- [IMPLEMENTATION_PLAN](./stash-normalization-and-squad-recovery/IMPLEMENTATION_PLAN.md)

### 5. Extraction Pressure And Operation Flow

- [PLAYER_SPEC](./extraction-pressure-and-operation-flow/PLAYER_SPEC.md)
- [IMPLEMENTATION_SPEC](./extraction-pressure-and-operation-flow/IMPLEMENTATION_SPEC.md)
- [IMPLEMENTATION_PLAN](./extraction-pressure-and-operation-flow/IMPLEMENTATION_PLAN.md)

### 6. RimWorld Dialogue Campaign Flavor

- [PLAYER_SPEC](./rimworld-dialogue-campaign-flavor/PLAYER_SPEC.md)
- [IMPLEMENTATION_SPEC](./rimworld-dialogue-campaign-flavor/IMPLEMENTATION_SPEC.md)
- [IMPLEMENTATION_PLAN](./rimworld-dialogue-campaign-flavor/IMPLEMENTATION_PLAN.md)

### 7. Endgame Campaign Finale

- [PLAYER_SPEC](./endgame-campaign-finale/PLAYER_SPEC.md)
- [IMPLEMENTATION_SPEC](./endgame-campaign-finale/IMPLEMENTATION_SPEC.md)
- [IMPLEMENTATION_PLAN](./endgame-campaign-finale/IMPLEMENTATION_PLAN.md)

### 8. Combat Center Of Gravity And Presentation

- [PLAYER_SPEC](./combat-center-of-gravity-and-presentation/PLAYER_SPEC.md)
- [IMPLEMENTATION_SPEC](./combat-center-of-gravity-and-presentation/IMPLEMENTATION_SPEC.md)
- [IMPLEMENTATION_PLAN](./combat-center-of-gravity-and-presentation/IMPLEMENTATION_PLAN.md)

## Authoring Rule

These are not placeholder idea dumps.

They should also obey the reuse rules in [Systemic Reuse And Prefab Rules](../SYSTEMIC_REUSE_AND_PREFAB_RULES.md).
They should also remain compatible with [Endgame Direction](../ENDGAME_DIRECTION.md), so the project is always building toward a game that can actually be finished.

Each package should:

- anchor to the current codebase and current playable slice
- describe the player fantasy clearly
- define the simulation and UI implications
- include CLI-first or tooling-first verification where appropriate
- explain how the feature improves tactical mastery, replayability, and extraction consequence
- explain how the feature could support the eventual endgame or at minimum avoid blocking it
- state what neighboring package it depends on
- state what it explicitly does not own
