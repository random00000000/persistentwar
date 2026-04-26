# Main Map Tactical Slice Implementation Plan

## Purpose

Sequence the work required to build the project's first true north-star main map slice.

## Source Direction

- [Tactical Squad Extraction North Star](../../TACTICAL_SQUAD_EXTRACTION_NORTH_STAR.md)
- [Systemic Reuse And Prefab Rules](../../SYSTEMIC_REUSE_AND_PREFAB_RULES.md)
- [Main Map Tactical Slice Player Spec](./PLAYER_SPEC.md)
- [Main Map Tactical Slice Implementation Spec](./IMPLEMENTATION_SPEC.md)
- [AI Pressure And Territorial Replayability Implementation Plan](../ai-pressure-and-territorial-replayability/IMPLEMENTATION_PLAN.md)
- [Gun Doctrine Implementation Plan](../gun-doctrine/IMPLEMENTATION_PLAN.md)
- [Stash Normalization And Squad Recovery Implementation Plan](../stash-normalization-and-squad-recovery/IMPLEMENTATION_PLAN.md)
- [Extraction Pressure And Operation Flow Implementation Plan](../extraction-pressure-and-operation-flow/IMPLEMENTATION_PLAN.md)
- [RimWorld Dialogue Campaign Flavor Implementation Plan](../rimworld-dialogue-campaign-flavor/IMPLEMENTATION_PLAN.md)

## Package Boundary

This plan should stay ahead of gun, stash, extraction, and dialogue work because those packages all depend on the battlefield being real and coherent first.

It should stay tightly paired with the AI package, because a static district is not enough to prove the product.

## Why This Order

The project already has strong local authored geometry.

The risk is either:

- trying to build a giant new map immediately

or:

- leaving the project fragmented into several good slices that never become one real battlefield

So the order should be:

1. define the district identity
2. preserve and unify the best authored tactical slices
3. prove one settlement-aware return loop
4. prove extraction and replayability at district scale

The reuse rule for this plan is:

- prove reusable tactical situations and subzone types before adding more bespoke district content

## Milestone 1. District Framing

### Goal

Give the current route architecture one main-map identity.

### Work

- define one tactical district built from the current route baseline
- choose the primary settlement or town block inside that district
- identify which existing route slices can be promoted into reusable district subzone patterns
- define named sub-zones:
  - town block
  - industrial pocket
  - trench or fighting line
  - bunker foothold zone
  - extraction edge
- expose district and sub-zone identity in snapshot and key UI surfaces

### Acceptance

- the player can tell what the main district is called
- the current route is legible as one part of that district
- the project stops reading like only separate raid cards

## Milestone 2. Preserve The Best Tactical Slices

### Goal

Carry forward the current strongest authored geometry as the backbone of the main map slice.

### Work

- keep the current room-stack path as a first-class tactical sub-zone
- keep the current breach geometry as a first-class tactical sub-zone
- keep bunker or basement footholds as reset pockets
- keep dangerous open-lane and extract-pressure reads
- define how each current slice maps into the district
- make sure at least one slice clearly serves later gun doctrine, body recovery, and extract-pressure work

### Acceptance

- room, breach, foothold, and extraction slices all still verify
- those slices now read as part of the same battlefield identity

## Milestone 3. Add Trench Or Fighting-Line Slice

### Goal

Close the main geometry gap by adding a trench or trench-adjacent tactical problem into the north-star map.

### Work

- author one trench-line or trench-edge sub-zone
- support meaningful lip, corner, or segment assault
- tie suppression and grenade use into that geometry
- ensure the trench slice connects naturally to at least one settlement or route transition

### Acceptance

- the map includes one non-trivial trench or trench-edge assault problem
- the trench slice feels tactically different from room-clearing

## Milestone 4. Settlement-Aware Return Loop

### Goal

Make one settlement or district block feel replayable rather than static.

### Work

- connect one sub-zone to settlement state from the AI/territorial package
- reflect state shifts in world dressing, route reads, and debrief
- prove that the same sub-zone feels different on return

### Acceptance

- one district block can be revisited in a changed state
- the change affects tactical play, not just text

## Milestone 5. Operation Flow Pass

### Goal

Ensure the district supports a full extraction-shooter run.

### Work

- tune insertion reads so early choices matter
- tune mid-run foothold and tactical escalation
- ensure loot and objective pressure do not fight the geometry
- ensure extraction edge changes with district heat and pressure
- ensure at least one body-recovery or casualty-return path reads naturally inside the district

### Acceptance

- the main map supports a complete stash-to-raid-to-extract loop
- the extraction phase feels like part of the district, not a detached final step

## Milestone 6. Readability And Teaching Pass

### Goal

Make the main map teach its tactical language without becoming cluttered.

### Work

- refine route and sub-zone briefing language
- keep room-stack and breach reads concise
- add only the minimum persistent district-level labels needed
- ensure players understand the tactical problem they are entering
- preserve enough named ground and quiet pockets that the dialogue package has real remembered places to react to

### Acceptance

- new players can understand the map’s tactical problems
- veteran players are not buried in explanatory UI

## Verification Strategy

Every milestone should be verified through:

### 1. CLI Snapshot

Must expose:

- district label
- active sub-zone
- room-stack / doorway telemetry where relevant
- settlement-aware state where relevant
- extract-pressure state

### 2. Authored Showcases

Need at least:

- room-clear
- breach
- bunker foothold
- trench or fighting-line problem
- changed-state return to the same district block
- extract-pressure under district pressure
- one remembered-ground or recovery-lane showcase

### 3. Debrief Proof

Must show:

- what part of the district was affected
- what changed
- what that means for the next run

## Initial Tuning Guidance

- keep the first district dense rather than huge
- prefer one memorable block over broad empty travel
- protect the room-clear and breach quality already achieved
- make footholds tactically valuable, not only atmospheric
- make at least one return-state reversal frequent enough to prove replayability
- make at least one route or block memorable enough that dialogue and memorial systems have somewhere specific to point back to

## Risks

### 1. Giant-Map Trap

Trying to jump to Foxhole-scale immediately could destroy the current tactical quality.

Mitigation:

- prove one dense district first

### 2. Fragmented Identity

Keeping all slices independent prevents the player from feeling one true battlefield.

Mitigation:

- define one district and map every authored slice into it

### 3. Lost Geometry Quality

Map unification could accidentally regress the current doorway, breach, or room-stack quality.

Mitigation:

- keep existing map verifiers and showcase paths green throughout

### 4. Decorative Replayability

If changed-state returns are only cosmetic, the map slice fails.

Mitigation:

- require tactical and extraction consequences for every meaningful district state change

## First Build Recommendation

If implementation begins immediately, the first concrete build should be:

1. name and expose one main district
2. define one settlement-aware town block inside it
3. map current room-clear, breach, and bunker slices into that district
4. add one trench or fighting-line sub-zone
5. prove one changed-state return to the same district block
6. do it by reusing route and subzone primitives rather than writing one-off district logic

That is the smallest build that turns the current route collection into a real main map slice.
