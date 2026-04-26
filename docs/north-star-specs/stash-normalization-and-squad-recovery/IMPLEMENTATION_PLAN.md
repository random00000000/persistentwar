# Stash Normalization And Squad Recovery Implementation Plan

## Purpose

Sequence the work required to turn the current stash, memorial wall, handoff board, and roster aftermath into one coherent operational backbone.

## Source Direction

- [Tactical Squad Extraction North Star](../../TACTICAL_SQUAD_EXTRACTION_NORTH_STAR.md)
- [Systemic Reuse And Prefab Rules](../../SYSTEMIC_REUSE_AND_PREFAB_RULES.md)
- [Stash Normalization And Squad Recovery Player Spec](./PLAYER_SPEC.md)
- [Stash Normalization And Squad Recovery Implementation Spec](./IMPLEMENTATION_SPEC.md)
- [Gun Doctrine Implementation Plan](../gun-doctrine/IMPLEMENTATION_PLAN.md)
- [AI Pressure And Territorial Replayability Implementation Plan](../ai-pressure-and-territorial-replayability/IMPLEMENTATION_PLAN.md)

## Package Boundary

This plan should begin only after the main map and AI packages are strong enough to create meaningful returns, losses, and repeat operations.

It should also stay tightly paired with the gun package, because stash normalization is where recovered guns and loadout doctrine become a product loop.

## Why This Order

The current stash is already strong in tone.

The risk is not emptiness. The risk is ambiguity.

So the order should be:

1. normalize what the wall means
2. prove deployable and recovered item flow
3. formalize squad readiness and handoff
4. tighten memorial and body-debt consequence
5. only then broaden variety

The reuse rule for this plan is:

- normalize around one shared item model and one shared roster or memorial grammar before adding more stash content variety

That keeps the work product-facing and avoids building a giant inventory simulation before the core operational loop is clear.

## Milestone 1. Stash Meaning Pass

### Goal

Make the current stash wall legible as an operational wall instead of a rich mixed display.

### Work

- classify existing stash tiles into clear gameplay categories
- expose deployable, sellable, support, and memorial meaning in snapshot and inspector surfaces
- map current rack content into shared item categories before adding new item-specific logic
- identify and remove or relabel ambiguous stash tiles
- keep atmospheric density only where the gameplay category remains readable

### Acceptance

- every important visible stash tile resolves to a readable category
- the player can tell what can go into the next raid
- the wall still feels alive after normalization

## Milestone 2. Deployable Item Flow

### Goal

Prove that the stash-to-raid and raid-to-stash loop is materially real.

### Work

- formalize weapon, sidearm, medkit, and ammo-pack staging
- formalize recovered-weapon storage and next-run use
- formalize broker-tagged versus field-ready haul
- ensure debrief cleanly reports what came home and what was spent

### Acceptance

- one recovered gun can be seen, kept, and staged for a later raid
- medkits and ammo packs flow cleanly from stash to prep to raid to debrief
- the player can distinguish sale cargo from field gear without guesswork

## Milestone 3. Squad Readiness And Chair Handoff

### Goal

Turn roster continuity into a readable operational surface.

### Work

- formalize `ready`, `reserve`, `missing`, and `replacement-pending` reads
- upgrade the handoff board into a clear replacement-status surface
- make reserve timers and open seats legible
- ensure the operator tab answers whether the squad can support another hard run

### Acceptance

- the roster tells the player who can go right now
- an empty chair is visible before it is silently filled
- a replacement arrival reads like a handoff, not a respawn

## Milestone 4. Memorial And Body-Debt Interlock

### Goal

Make missing-body debt, memorial follow-through, and recovery operations feel like one system.

### Work

- keep unrecovered bodies visible in stash and debrief surfaces
- tie body-recovery support operations more directly to the operator and memorial tabs
- let successful recovery visibly clear part of the stash burden
- preserve wake and family-call language without making it a pure roleplay stub

### Acceptance

- an unrecovered boy creates visible next-run pressure
- a successful body recovery changes both the operator read and the stash tone
- the player understands what debt remains and how to answer it

## Milestone 5. Readability And CLI Verification Pass

### Goal

Make the whole operational loop inspectable and teachable.

### Work

- expand `snapshot` with normalized stash and readiness summaries
- add or update authored showcases for stash, memorial, and replacement states
- update the CLI manual with one full stash-to-debrief-to-recovery verification path
- refine inspector and debrief copy so the operational meaning is fast to read

### Acceptance

- an agent can verify the package from CLI without guessing through the DOM
- a player can understand the stash and roster state quickly
- the debrief clearly explains what changed for the next run

## Milestone 6. Expansion Pass

### Goal

Only after the core loop is clear, broaden item and roster variation carefully.

### Work

- add more recovered-haul categories only when they create distinct decisions
- add more replacement-candidate variation only when it improves squad identity
- add more stash wall richness only when it stays legible

### Acceptance

- additional variety deepens the same operational loop instead of hiding it

## Verification Strategy

Every milestone should be verified in three ways.

### 1. CLI Snapshot

Must expose:

- stash item categories
- deployable stock
- ready-versus-reserve squad read
- unresolved memorial debt
- replacement-seat status

### 2. Authored Showcases

Need at least:

- deployable stash wall
- thin-stock loadout decision
- recovered-weapon kept for next run
- memorial debt visible in stash
- replacement-ready handoff board

### 3. Debrief Proof

Must show:

- what came home
- what was consumed
- what burden remains
- what changed about next-run readiness

## Initial Tuning Guidance

- keep the first normalized stash categories few and blunt
- replacement delay should be long enough to matter and short enough to preserve momentum
- memorial burden should shape decisions without functioning like a hard punishment tax
- recovered guns should be tempting but not automatically optimal
- keep the wall visually dense, but never at the cost of item meaning

## Risks

### 1. Over-Simulation

Trying to turn this into a full inventory-management game would bury the extraction loop.

Mitigation:

- normalize around operational meaning, not endless sub-systems

### 2. Flavor Loss

Making the wall too clean could erase the atmosphere that currently gives it soul.

Mitigation:

- preserve the handoff board, memorial wall, broker flavor, and quiet debrief tone

### 3. Replacement Feels Fake

If replacement is too instant or too abstract, squad loss loses weight.

Mitigation:

- use chair, handoff, and reserve language rather than silent refill

### 4. Replacement Feels Punitive

If replacement and reserve friction are too slow, the player stops wanting to engage with the system.

Mitigation:

- tune for pressure, not punishment

### 5. Stash Still Ambiguous

If item categories exist in code but are not surfaced cleanly, the package fails.

Mitigation:

- require item meaning in snapshot, inspector, and debrief copy

## First Build Recommendation

If implementation begins immediately, the first concrete build should be:

1. categorize the current stash wall
2. expose normalized stash summaries in `snapshot`
3. prove one recovered-weapon keep-or-sell loop
4. make the handoff board explicitly show one open chair and one incoming replacement
5. prove one body-debt run where recovery pressure changes the next stash plan

That build should prove that stash, loot, deployables, memorial debt, and replacement are all being expressed through shared primitives rather than separate mini-systems.

That is the smallest build that makes the stash and squad-recovery package feel like a real product layer instead of several good fragments.
