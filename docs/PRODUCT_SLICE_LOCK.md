# Product Slice Lock

## Purpose

Lock the first shippable vertical slice for `Top Down Extraction Shooter`.

This document is the implementation output of `Milestone 1. Product Slice Lock` from [PRODUCTIZATION_IMPLEMENTATION_PLAN.md](./PRODUCTIZATION_IMPLEMENTATION_PLAN.md).

It exists to stop drift.

Future work should treat this as the current product boundary:

- what the game is trying to ship first
- what the player should understand immediately
- what is already strong enough to build on
- what still must improve before this feels like a product

## The 2-Sentence Product Pitch

`Top Down Extraction Shooter` is a mastery-driven top-down tactical extraction game where you command a small squad through occupied buildings, survive PKM-owned lanes, clear rooms, loot what matters, and extract before the route collapses.

Between raids, you return to a harsh squad-and-stash board where weapons, losses, recoveries, route prep, and chair pressure change the next operation.

## The Locked First Ship Slice

The first shippable slice is:

- stash
- raid
- extraction
- return-to-stash

across these three routes:

- `Broken Signal`
- `Sundered Run`
- `Crosswind Docks`

This slice must be strong enough that a player can play repeated runs and clearly understand:

- what the game is
- why the squad matters
- why routes feel different
- why extraction is tense
- why coming home changes the next run

## Locked Route Roles

### `Broken Signal`

The room-clear route.

Its job in the product:

- occupied structures
- dish-house and relay-house fighting
- cellar and back-room pressure
- obvious PKM-to-room-clear transition

If a player says “this is the route where I had to solve houses correctly,” the route is doing its job.

### `Sundered Run`

The trench-and-bunker route.

Its job in the product:

- trench lips
- med-lane and mortar pressure
- bunker mouths
- ugly partial footholds

If a player says “this route felt like surviving a brutal line fight and holding bad ground,” the route is doing its job.

### `Crosswind Docks`

The crossing-and-peel route.

Its job in the product:

- longer exposed lanes
- dock and crane pressure
- salvage greed
- harder extract timing

If a player says “this route made me think hardest about leaving,” the route is doing its job.

## Locked Core Fantasy

The slice must preserve these truths:

- `me and the boys`
- small-unit tactical extraction
- occupied buildings
- scary PKM lanes
- room-clear mastery
- extraction as relief, not safety
- stash and squad consequence after the raid

The game is not shipping first as:

- a pure loot game
- a broad war sandbox
- an atmosphere-first narrative game
- an arcade top-down shooter

## What The First Session Must Teach

The first successful session must naturally teach:

1. routes contain real tactical structures
2. PKM lanes make bad crossings wrong
3. buildings are meant to be cleared, not only peeked
4. extracting early can be correct
5. the stash matters because the next run changes

The player should be able to produce a sentence like:

`We crossed under pressure, cleared one ugly building, grabbed what mattered, and got out before the route folded.`

## Good Enough For Slice

These areas are already strong enough to build the product around:

### 1. Combat And Control Core

- top-down movement and aiming
- squad-command runtime
- brace, covering move, suppression, grenade delegation
- readable tactical verbs

### 2. Enemy Tactical Direction

- PKM-led fireteams
- building occupation
- room-clear and back-room reads
- ownership language

### 3. Extraction Pressure Foundation

- clean vs hot vs collapse reads
- operation-flow pressure language
- extract as a live decision

### 4. Stash Consequence Foundation

- chair pressure
- memorial and recovery framing
- recovered-gun doctrine changes
- route prep surfaces

### 5. Route Proof Surface

- three routes already exist
- authored proofs already establish different tactical identities

These systems do not need reinvention before productization.

## Must Improve Before Ship

These are the current blockers to “this feels like a product”:

### 1. First-Run Clarity

The first 20 minutes are not yet controlled tightly enough.

Needs:

- clearer recommended first route
- clearer first loadout
- cleaner first stash-to-raid-to-stash teaching

### 2. Route Identity In Free Play

The routes have strong authored proofs, but free play still needs stronger identity and landmark consistency.

Needs:

- route-authored must-clear structures
- cleaner route-specific problem composition

### 3. Product Readability

There is still too much prototype-style information density and not enough immediate player comprehension.

Needs:

- stronger signal hierarchy
- better tactical ask surfaces
- less debug-feeling state exposure

### 4. Stash Compression

The stash has strong consequences, but the decision layer still needs simplification and stronger emphasis.

Needs:

- clearer “what changed” read
- faster post-raid comprehension
- stronger next-run recommendation

### 5. Canonical Play Loop

The game still needs one clearly polished, repeatable loop that can be called the default product experience.

Needs:

- one recommended progression path across the three routes
- one default repeat-play rhythm

## Deferred For This Slice

These are explicitly not required before calling the first slice real:

- major new economy systems
- broad content count growth
- PvP
- large-scale campaign expansion beyond current finale scaffolding
- major new UI feature families unrelated to comprehension or product finish

## Product Acceptance For Milestone 1

Milestone 1 is complete when future agents can answer these questions with no ambiguity:

### What is the game?

A tactical squad extraction game built around commanding the boys through occupied structures, surviving PKM pressure, extracting alive, and returning to a meaningful stash.

### What is the first slice?

The stash-to-raid-to-stash loop across `Broken Signal`, `Sundered Run`, and `Crosswind Docks`.

### What is already strong enough?

Combat control, squad commands, AI fireteam direction, extraction-pressure foundations, stash consequence foundations, and the three-route tactical base.

### What still must improve?

First-session clarity, route identity in free play, readability, stash compression, and the canonical repeat-play loop.

## Immediate Next Implementation Target

The next implementation milestone is:

- `Milestone 2. First 20 Minutes`

That work should tighten:

- first route recommendation
- first loadout clarity
- first raid tactical teaching
- first extraction decision
- first return-to-stash comprehension
