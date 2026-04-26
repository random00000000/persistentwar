# RimWorld Dialogue Campaign Flavor Implementation Spec

## Purpose

Define the implementation baseline and acceptance criteria for dialogue expansion tied to campaign memory and tactical situations.

This package should deepen the human layer already present in the game while keeping it clearly downstream of the tactical systems.

## Source Direction

- [Tactical Squad Extraction North Star](../../TACTICAL_SQUAD_EXTRACTION_NORTH_STAR.md)
- [Systemic Reuse And Prefab Rules](../../SYSTEMIC_REUSE_AND_PREFAB_RULES.md)
- [Main Map Tactical Slice Implementation Spec](../main-map-tactical-slice/IMPLEMENTATION_SPEC.md)
- [AI Pressure And Territorial Replayability Implementation Spec](../ai-pressure-and-territorial-replayability/IMPLEMENTATION_SPEC.md)
- [Stash Normalization And Squad Recovery Implementation Spec](../stash-normalization-and-squad-recovery/IMPLEMENTATION_SPEC.md)
- [Extraction Pressure And Operation Flow Implementation Spec](../extraction-pressure-and-operation-flow/IMPLEMENTATION_SPEC.md)
- [Gun Doctrine Implementation Spec](../gun-doctrine/IMPLEMENTATION_SPEC.md)

## Package Boundary

This package should consume real tactical and campaign state from the other packages.

It should not become a backdoor owner of those systems.

It owns:

- dialogue story-family definition
- memory-hook usage
- delivery rules
- campaign-flavor surfaces

It does not own:

- tactical state generation
- memorial or stash mechanics themselves
- territorial state logic
- extract pacing logic

## Current Code Baseline

The dialogue and flavor baseline is already unusually strong for this stage of the project.

### Existing Dialogue Runtime Baseline

In [simulation.ts](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/topdownextractionshooter/src/game/simulation.ts), the runtime already includes:

- dialogue events and delivery helpers
- memory tags and recent dialogue memories
- event kinds such as `mate-down`, `body-sighted`, and `body-recovery`
- dialogue memory-tag gathering
- raid history tracking

This means the game already has a live reactive dialogue backbone, not just static text files.

### Existing Flavor And Debrief Baseline

In [main.ts](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/topdownextractionshooter/src/main.ts), the project already exposes:

- memorial wall and handoff board surfaces
- family-call and wake follow-through reads
- campaign fallout and war-log reads
- frontline focus surfaces
- coffee-pocket flavor reads
- story finale choice and credits surfaces

This is already the right product direction: the campaign is being framed through human aftermath and not just mechanical summaries.

### Existing CLI And Authoring Baseline

In [wiki/project-cli.md](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/topdownextractionshooter/wiki/project-cli.md), the CLI already supports:

- `story-pack list`
- `story-pack scaffold`
- showcases such as:
  - `war-beat-focus`
  - `field-coffee`
  - `burner-coffee`
  - `drone-sweep`
  - `hostile-lane-chatter`
  - `body-recovery`
  - `memorial-wall`
  - `civilian-window`
  - `hunter-search`

This package should treat that CLI story-pack flow as the trusted authoring path.

## Problem Statement

The game already has good dialogue flavor, but it now needs to be deliberately aligned with the north-star product.

Right now:

- the dialogue layer works
- the memorial and war-log layer works
- the game already has quieter atmospheric beats

But the north-star gap is:

- story families are not yet fully organized around the new tactical squad extraction identity
- campaign memory needs to more deliberately react to town returns, body debt, extraction identity, and doctrine
- dialogue needs explicit guardrails so it never starts compensating for missing tactical depth

## Design Rules

- Dialogue reacts to tactical truth. It does not invent stakes the simulation did not create.
- Reuse one shared dialogue-hook and memory-tag grammar across combat, stash, memorial, debrief, and campaign-fallout surfaces.
- Short lines are better than longer lines in almost every combat or active-raid context.
- Quiet moments are valuable and should be preserved.
- Each story family should have a clear delivery context:
  - combat
  - route move
  - downtime
  - memorial
  - debrief
  - campaign fallout
- Repetition is acceptable when it builds identity, but not when it becomes obvious bark spam.
- Story-pack authoring should stay data-driven and CLI-friendly.

## Feature Goals

### 1. Align Dialogue With The Tactical Product

Make the dialogue clearly serve:

- tactical mastery
- operation flow
- stash consequence
- campaign memory

### 2. Strengthen Campaign Memory

Make repeated places, losses, and recoveries show up in human reaction more reliably.

### 3. Preserve Quiet Life Beats

Protect coffee, bunker, civilian, and search moments as product identity, not side fluff.

### 4. Keep Authoring Sustainable

Expand through story families and hook rules, not hard-coded one-off writing everywhere.

## State And Content Additions

### Story Family Expansion

Continue using offline story packs under `src/game/dialogue/story-packs`.

Add or expand families around:

- returning-to-bad-ground
- trench-memory
- body-debt-and-recovery
- hot-exfil recognition
- casualty-pull tone
- chair handoff and replacement
- district-flip memory
- quiet bunker or coffee life

The rule is:

- story packs should correspond to real gameplay or campaign truth

### Memory Hook Expansion

Extend or standardize hookable memory inputs for dialogue.

At minimum, support memory reads around:

- route id
- settlement or district state
- casualty state
- body recovered or left behind
- memorial debt state
- extract ending type
- repeated route returns
- loadout doctrine where meaningful

Not every hook needs immediate authoring, but the system should preserve enough truth to support it.

### Speaker Identity Layer

Strengthen light-weight differentiation for the boys.

This can remain compact and trait-driven rather than becoming a huge RPG companion system.

Useful identity axes:

- calm under pressure
- bitter or dry humor
- practical or procedural
- body- and memorial-sensitive
- civilian-sensitive
- route-memory-sensitive

These should bias line selection, not force giant authored trees.

## Behavior Requirements

### Tactical Reaction Dialogue

Dialogue should react to:

- suppression and collapse pressure
- route-turning recognition
- room and trench commitment
- bad-lane warnings
- exfil heat recognition
- casualty and body-recovery state

Required rule:

- these lines must be shorter and more urgent than downtime or debrief writing

### Campaign Memory Dialogue

Dialogue should recognize:

- returning to the same district
- a town or route changing hands
- unresolved bodies
- recovered bodies
- replacement seats filling
- repeated extraction patterns

Required rule:

- these lines should make the player feel continuity without requiring them to read a codex

### Downtime Dialogue

Dialogue should preserve:

- coffee moments
- bunker pauses
- civilian windows
- search chatter
- low-heat route conversation

Required rule:

- these moments should be allowed to stay small and quiet

### Debrief And Stash Flavor

Dialogue and flavor text should support:

- war-log framing
- memorial-wall tone
- handoff-board tone
- campaign fallout recommendations
- story-finale reads when triggered

Required rule:

- these surfaces should feel like aftermath, not lore articles

## CLI Changes

This package should remain authorable and testable through the existing CLI flow.

### CLI Authoring

Continue to use:

- `story-pack list`
- `story-pack scaffold`

Required improvement:

- document recommended story-family categories and hook expectations so agents author packs that fit the product direction

### Snapshot Additions

Extend `snapshot` only where it materially helps dialogue verification.

At minimum, useful additions could include:

- `raid.dialogueMemoryTags`
- `raid.lastDialogueEvent`
- `campaign.memoryPressure`
- `debrief.storyTags`

These should stay compact. Do not bloat snapshot with raw writing payloads unless needed for verification.

### Showcases

Add or expand showcases for:

- returning route memory
- hot-exfil reaction
- memorial and chair handoff tone
- trench coffee or bunker downtime
- district flip or gray-zone return memory

## Manual / Documentation Changes

Update [wiki/project-cli.md](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/topdownextractionshooter/wiki/project-cli.md) with:

- recommended story-pack authoring workflow
- new showcases or snapshot fields if introduced
- one example of scaffolding a story family aligned to the north star

Update [wiki/README.md](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/topdownextractionshooter/wiki/README.md) if the dialogue package adds new authoring or review surfaces.

## UI Changes

### Raid Delivery

Raid dialogue should stay lightweight and readable.

Required outcomes:

- combat lines do not flood the screen
- quiet lines do not interrupt action
- memorable reactions are delivered when they matter

### Stash And Debrief Delivery

Use existing surfaces rather than adding new large dialogue panels.

Required outcomes:

- memorial wall feels personal
- handoff board feels human
- war log feels like campaign memory, not analytics

### Campaign Focus Surfaces

Frontline focus and fallout cards should keep carrying a portion of the dialogue flavor.

Required outcomes:

- the player can feel the campaign breathing between raids
- cards stay concise and grounded

## Transient Feedback Changes

Dialogue delivery is itself transient feedback.

Required qualities:

- short burst timing
- clear speaker attribution where useful
- no repeated spam loops
- enough silence between lines for contrast

## System Interactions

This package must interlock cleanly with:

- AI pressure
- operation flow
- stash and memorial consequence
- territorial replayability
- gun doctrine where tactically meaningful

Important rule:

- dialogue should support the tactical game the player is actually playing, not a parallel imaginary game

## Acceptance Criteria

The package is complete for the first north-star version when:

- story-pack authoring is clearly aligned to the tactical squad extraction identity
- live dialogue reacts to tactical and campaign truth rather than generic triggers
- repeated routes, losses, and recoveries feel remembered
- memorial, handoff, coffee, and war-log surfaces all feel like parts of one human campaign layer
- CLI showcases can verify both combat and downtime flavor passes

## Out Of Scope For This Package

- full branching narrative campaign
- cinematic cutscene system
- fully voiced narrative companion arcs
- deep relationship-sim mechanics

Those would risk competing with the tactical product instead of seasoning it.

## Risks

- dialogue becomes filler noise
- dialogue starts explaining missing mechanics
- campaign memory exists in data but not in delivery
- every story family sounds tonally identical
- authoring becomes too bespoke and stops scaling
