# Extraction Pressure And Operation Flow Implementation Plan

## Purpose

Sequence the work required to make extraction the decisive operation-ending wrapper around the district, the squad, and the stash.

## Source Direction

- [Tactical Squad Extraction North Star](../../TACTICAL_SQUAD_EXTRACTION_NORTH_STAR.md)
- [Systemic Reuse And Prefab Rules](../../SYSTEMIC_REUSE_AND_PREFAB_RULES.md)
- [Extraction Pressure And Operation Flow Player Spec](./PLAYER_SPEC.md)
- [Extraction Pressure And Operation Flow Implementation Spec](./IMPLEMENTATION_SPEC.md)
- [Main Map Tactical Slice Implementation Plan](../main-map-tactical-slice/IMPLEMENTATION_PLAN.md)
- [AI Pressure And Territorial Replayability Implementation Plan](../ai-pressure-and-territorial-replayability/IMPLEMENTATION_PLAN.md)
- [Stash Normalization And Squad Recovery Implementation Plan](../stash-normalization-and-squad-recovery/IMPLEMENTATION_PLAN.md)

## Package Boundary

This plan should follow after the map, AI, and stash packages are strong enough that leaving the district can carry real consequence.

It should also stay close to casualty-state work, because casualty exfil and body extraction are part of the same operation wrapper.

## Why This Order

The codebase already has a strong extract spine.

The risk is not that extraction does nothing. The risk is that it stays a collection of good mechanics instead of becoming the clear emotional and tactical end-state of the run.

So the order should be:

1. formalize operation-state readability
2. strengthen focused-extract planning
3. prove clean versus collapsing exits
4. lock casualty and body exfil into the same loop
5. strengthen debrief closure

The reuse rule for this plan is:

- formalize one shared operation grammar and one shared extract-edge framework before adding more exfil variants

That keeps the work anchored to the real gameplay arc rather than turning extraction into one more side system.

## Milestone 1. Operation State Readability

### Goal

Make the raid's pacing legible enough that extraction timing can become a skill.

### Work

- derive or formalize operation phases
- derive or formalize operation pressure reads
- map current extract, casualty-extract, and body-extract flows into the same operation-state language
- expose operation-state summaries in `snapshot`
- ensure the player can tell when the run is still in gain versus when it has tipped toward exfil or collapse

### Acceptance

- snapshot exposes a stable operation-phase read
- the player can tell when the district is no longer in a clean early state
- the operation arc is readable without debug-only interpretation

## Milestone 2. Focused Exfil Planning

### Goal

Make exfil planning a mid-run tactical stance rather than a late button press.

### Work

- deepen focused-extract comparison reads
- strengthen planned-extract posture and cue summaries
- make extract heat and cleanliness legible
- ensure one extract can be clearly safer, faster, or more screen-friendly than another

### Acceptance

- changing the focused extract changes player-facing guidance in a meaningful way
- the player can explain why one exit is better right now than another
- the package proves at least one extract-choice tradeoff that is not cosmetic

## Milestone 3. Clean Exit Versus Collapse

### Goal

Prove that disciplined extraction and greedy extraction produce different tactical endings.

### Work

- tune contested-ring and slip logic for readability
- tune crash-wave timing and pressure
- ensure route heat and surviving enemy presence can make a late exit meaningfully worse
- add one authored clean-exit showcase and one greed-collapse showcase

### Acceptance

- a disciplined run can leave through a cleaner exfil
- a greedy run can turn the same exit into the hardest fight of the raid
- the difference feels earned, not random

## Milestone 4. Casualty And Body Exfil Integration

### Goal

Make recovery-driven endings first-class operation outcomes rather than special cases.

### Work

- deepen casualty-extract readability
- ensure body extraction and carried extraction share the same operation language
- make recovery-driven exits legible in snapshot and debrief
- ensure recovery exits still feel like valid wins, not merely partial failure states

### Acceptance

- a raid can clearly become a casualty pull
- a raid can clearly become a body-recovery extract
- those endings feel distinct from a normal profit extract

## Milestone 5. Debrief Closure Pass

### Goal

Make the debrief explain the run as an operation, not just an economy result.

### Work

- add one concise operation-summary surface
- summarize why the player left
- summarize whether the run ended disciplined, greedy, forced, or recovery-driven
- keep the debrief tight enough to read fast

### Acceptance

- the debrief explains the operation's ending in one quick read
- the player can understand why the run felt successful, reckless, or costly
- the debrief connects cleanly into stash and roster consequence

## Milestone 6. Expansion Pass

### Goal

Only after the core operation wrapper is readable, broaden extraction variation carefully.

### Work

- add one more meaningful extract tradeoff if the first pair proves clearly
- add more operation-summary variation only when it clarifies runs
- add more exfil-pressure flavor only when it reinforces tactical reading

### Acceptance

- additional variation deepens the same operation language instead of complicating it

## Verification Strategy

Every milestone should be verified in three ways.

### 1. CLI Snapshot

Must expose:

- operation phase
- operation pressure
- focused extract state
- extract cleanliness or heat
- recovery-driven exit state where relevant

### 2. Authored Showcases

Need at least:

- focused-extract comparison
- clean early extract
- hot collapsing extract
- casualty extract
- body-recovery extract
- debrief closure showcase

### 3. Debrief Proof

Must show:

- what kind of run it became
- why the player left
- what the district had become by the end
- what changed for the stash or squad next

## Initial Tuning Guidance

- keep early extracts viable enough that discipline feels smart
- make late greed dangerous enough to matter without guaranteeing failure
- keep crash waves readable and authored rather than spammy
- let casualty and body exfils feel slower and heavier, but still credible to complete
- prefer two strong extract personalities over many weak ones

## Risks

### 1. Spawn-Tax Extraction

If exfil pressure just means arbitrary reinforcements, the package fails.

Mitigation:

- tie pressure to route heat, map truth, and focused extract state

### 2. Flat Operation Arc

If the run never clearly changes from gain to danger, extraction timing never becomes mastery.

Mitigation:

- formalize operation-phase readability first

### 3. Cosmetic Extract Choice

If extracts differ only in flavor text, the player will stop caring.

Mitigation:

- require distinct tradeoffs in heat, safety, hold time, or screenability

### 4. Recovery Endings Feel Like Failure

If casualty and body exfils only read as punishment, the feature undercuts the product's emotional depth.

Mitigation:

- make them distinct valid outcomes with clear debrief framing

### 5. Debrief Bloat

If the debrief gets longer instead of clearer, players will not absorb the operation read.

Mitigation:

- add one concise operation-summary surface instead of a large new text block

## First Build Recommendation

If implementation begins immediately, the first concrete build should be:

1. expose operation-phase and extract-cleanliness reads in `snapshot`
2. deepen focused-extract comparison in the staged raid surfaces
3. prove one clean exit showcase and one greed-collapse exit showcase
4. unify casualty/body exfil under one operation-summary language
5. add one concise debrief card that explains how the run ended

That build should prove reuse first, not three unrelated extraction systems with similar UI.

That is the smallest build that turns extraction from a good mechanic into the true wrapper around the whole raid.
