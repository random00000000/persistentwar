# Extraction Pressure And Operation Flow Implementation Spec

## Purpose

Define the implementation baseline and acceptance criteria for extraction pressure and overall operation flow.

This package should connect the existing extract systems, crash-wave pressure, casualty exfil, and debrief consequence into one readable operation arc.

## Source Direction

- [Tactical Squad Extraction North Star](../../TACTICAL_SQUAD_EXTRACTION_NORTH_STAR.md)
- [Systemic Reuse And Prefab Rules](../../SYSTEMIC_REUSE_AND_PREFAB_RULES.md)
- [Main Map Tactical Slice Implementation Spec](../main-map-tactical-slice/IMPLEMENTATION_SPEC.md)
- [AI Pressure And Territorial Replayability Implementation Spec](../ai-pressure-and-territorial-replayability/IMPLEMENTATION_SPEC.md)
- [Stash Normalization And Squad Recovery Implementation Spec](../stash-normalization-and-squad-recovery/IMPLEMENTATION_SPEC.md)
- [Gun Doctrine Implementation Spec](../gun-doctrine/IMPLEMENTATION_SPEC.md)

## Package Boundary

This package should connect map pressure, AI pressure, gun doctrine, and stash consequence into one operation loop.

It should not redefine:

- district geometry
- territorial state logic
- gun-family tuning
- stash classification

It should define:

- extraction pacing
- extraction commitment and slip rules
- operation-phase readability
- exfil planning surfaces
- debrief closure of the run

## Current Code Baseline

The current extraction foundation is already real and should be deepened rather than replaced.

### Existing Extract Planning And UI Baseline

In [main.ts](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/topdownextractionshooter/src/main.ts), the game already exposes:

- extract labels and tradeoff summaries
- focused extract planning
- `getPlannedExtractPosture`
- `getPlannedExtractStageCues`
- `getPlannedExtractBenefit`
- extract decision and squad wedge surfaces
- debrief economy and consequence rendering
- next-order recommendation logic

This is already the correct direction: extraction is being surfaced as a tactical decision before the hold starts.

### Existing Runtime Extract Baseline

In [simulation.ts](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/topdownextractionshooter/src/game/simulation.ts), the runtime already supports:

- multiple extract zones
- focused extract selection
- extraction-hold timers
- contested-ring logic
- extraction slip state
- extraction crash waves
- extract-specific pressure spawns
- extraction signal noise pulses
- casualty extract support
- body extraction and carried extract flows

This means the product already has the spine of a real extraction-shooter end state.

### Existing CLI Baseline

In [wiki/project-cli.md](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/topdownextractionshooter/wiki/project-cli.md), the CLI already supports:

- `focus-extract`
- `snapshot`
- `showcase --id extract-pressure`
- `showcase --id blue-carried-extract-success`
- `showcase --id blue-body-extract`
- capture and verify paths for exfil and casualty-exfil flows

The package should build on those trusted proof paths.

## Problem Statement

The game already has good extraction parts, but they still need to be unified into one clearer operation model.

Right now:

- extract choice exists
- hold-the-ring extraction exists
- crash-wave pressure exists
- casualty exfil exists
- debrief consequence exists

But the north-star gap is still:

- operation pacing is implied more than formalized
- the relationship between greed, district escalation, and exfil choice is not yet explicit enough
- extraction is strong as a mechanic, but not yet fully locked as the decisive wrapper around the raid

## Design Rules

- Extraction should start as planning before it becomes a ring hold.
- Reuse one shared operation grammar and one shared extract-edge framework for normal, casualty, and body-recovery endings wherever possible.
- Exfil pressure should come from map and AI truth, not arbitrary punishment.
- A run must be able to change identity:
  - profit run
  - contract run
  - body recovery
  - casualty pull
- The debrief must explain why the operation felt clean, reckless, disciplined, or broken.
- Multiple extracts should create different tactical endings, not cosmetic options.

## Feature Goals

### 1. Formalize The Operation Arc

Make the raid read as:

- entry
- gain
- pressure build
- recognition point
- exfil problem
- debrief consequence

### 2. Make Extract Choice Matter Earlier

Deepen focused-extract planning so it feels like part of mid-raid doctrine.

### 3. Make Route Collapse Readable

Escalation toward extraction should be caused by understandable signals:

- noise
- unresolved threats
- settlement instability
- squad depletion
- casualty burden

### 4. Make Debrief Close The Loop

The debrief should explain not only what happened materially, but what kind of operation it became.

## State Additions

### Operation Flow Read

Add or derive a compact operation-flow state in snapshot output.

At minimum, expose:

- `raid.operationPhase`
- `raid.operationPressure`
- `raid.operationExitIntent`

Suggested values:

- phases:
  - `approach`
  - `gain`
  - `commitment`
  - `exfil`
  - `collapse`
- exit intent:
  - `profit`
  - `contract`
  - `recovery`
  - `survival`

These can be derived rather than hand-authored if the logic is stable and legible.

### Extract Commitment State

The current focused-extract baseline should be expanded into a more inspectable commitment read.

At minimum, expose:

- focused extract id
- current extract heat
- planned benefit
- current risk read
- whether the extract is still `clean`, `warming`, `hot`, or `slipping`

### Debrief Operation Summary

Add or derive a summary that answers:

- why the player left
- what the district had become by the end
- whether the exit was disciplined, greedy, forced, or recovery-driven

This should become a concise debrief card or summary line rather than a giant narrative dump.

## Behavior Requirements

### Planned Exfil

Focused extract planning must matter before the ring starts.

Required outcomes:

- one focused extract should provide a different mid-raid read than another
- staged extract cues should help the player understand why one exit is safer, faster, or more screenable
- extract planning should remain readable in CLI and UI

### Exfil Pressure

The exfil itself must create a real tactical problem.

Required outcomes:

- contested rings punish sloppy arrival
- crash waves punish overextension and noisy exits
- extract slips punish stepping off the ring or losing the hold
- casualty extracts create distinct movement and hold pressure

### Greed Escalation

The game should become more dangerous to leave late for understandable reasons.

Required escalation sources:

- route heat
- extract heat
- crash-wave readiness
- surviving enemies near likely exits
- district instability from the AI package
- squad casualty or ammo burden

This should not become a hidden difficulty tax.

### Operation Identity Shift

The system must support the raid changing category mid-run.

Examples:

- contract run becomes survival-only
- loot run becomes body recovery
- room-clear run becomes casualty exfil

Required outcomes:

- snapshot surfaces must be able to express this
- debrief must be able to summarize it
- extraction pressure should respect it

## CLI Changes

This package must remain CLI-first and inspectable.

### Snapshot Additions

Extend `snapshot` with at minimum:

- `raid.operationPhase`
- `raid.operationPressure`
- `raid.operationExitIntent`
- `raid.focusedExtractHeat`
- `raid.extractRiskRead`
- `raid.extractCleanliness`
- `raid.crashWaveReadiness`
- `raid.debriefPreview` or equivalent compact run-summary read

These should complement, not replace, the existing `raid.plannedExtractPosture` and casualty-extract fields.

### CLI Flows

Support or deepen verification paths for:

- selecting a different focused extract mid-run
- reading planned extract posture before commitment
- forcing or showcasing a hot exfil
- verifying a casualty exfil
- verifying a body extract

### Showcases

Add or expand authored showcases for:

- clean early extract
- greed-punished hot extract
- focused-extract comparison
- casualty-pull extract
- body-recovery extract
- debrief showing operation identity shift

## Manual / Documentation Changes

Update [wiki/project-cli.md](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/topdownextractionshooter/wiki/project-cli.md) with:

- new operation-flow snapshot fields
- focused-extract and exfil-pressure verification examples
- any new showcases or verify ids introduced by this package

Update [wiki/README.md](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/topdownextractionshooter/wiki/README.md) if new docs or showcase guidance need indexing.

## UI Changes

### Raid HUD

Keep the current extraction surfaces, but make operation state clearer.

Required outcomes:

- the player can tell whether the chosen exit is still clean
- the player can tell whether the operation has tipped into exfil or collapse
- the player can tell when the run has become recovery-driven

### Extract Decision Surface

Deepen the existing planned-extract board and wedge reads rather than replacing them.

Required outcomes:

- cleaner before-versus-after focused-extract comparison
- visible exfil risk tradeoff
- visible benefit of early discipline

### Debrief

Strengthen debrief closure with one operation-summary read.

Required outcomes:

- clear outcome of the run
- clear reason the player left
- clear summary of what pressure the district imposed by the end

## Transient Feedback Changes

This package needs clear transient pressure feedback.

Recommended short-lived feedback:

- `Ring contested`
- `Extract slipping`
- `Crash wave inbound`
- `Clean exit fading`
- `Casualty pull committed`
- `Leave now`

These should help the player read the flow without filling the HUD with permanent clutter.

## System Interactions

This package must interlock cleanly with:

- the district map package
- AI pressure and territorial replayability
- stash normalization and squad recovery
- casualty state
- gun doctrine
- dialogue flavor

Important rule:

- extraction should be where those systems converge, not a separate minigame layered on top

## Acceptance Criteria

The package is complete for the first north-star version when:

- a raid has a readable operation arc from entry to debrief
- focused-extract choice meaningfully changes how the player thinks about leaving
- hot exfils, casualty exfils, and body extracts feel like distinct endings
- greed and discipline produce different debrief reads
- snapshot and showcase flows can prove both clean and collapsing exits

## Out Of Scope For This Package

- global campaign win-state
- broad strategic map travel
- convoy meta-system expansion beyond what extraction pressure needs
- full stealth or disguise exfil designs

Those can come later if they strengthen the operation wrapper instead of diluting it.

## Risks

- extraction pressure becomes a generic spawn tax
- operation phases are too abstract for players to feel
- all extracts still collapse into one best answer
- debrief over-explains instead of clarifying
- casualty exfil becomes a special-case gimmick rather than a natural run state
