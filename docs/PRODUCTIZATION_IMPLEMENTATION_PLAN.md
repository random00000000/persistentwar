# Productization Implementation Plan

## Purpose

Turn the current tactical extraction prototype into a shippable product slice.

This plan exists because the project now has real differentiated systems:

- strong top-down combat control
- direct boy commands
- readable PKM and room-clear combat problems
- stash consequence
- extraction pressure
- campaign/endgame scaffolding

But those strengths are still distributed across proofs, showcases, and subsystem milestones.

The next phase is not:

- more isolated prototype wins
- more internal milestone green checks
- broader feature sprawl

The next phase is:

- one coherent product loop
- one strong first-session hook
- three routes with clear identity
- repeatable reasons to keep playing
- enough finish and readability that the game feels like a product instead of a promising build

## Product Goal

Ship a tactical squad extraction game where the player can immediately understand the fantasy:

- enter a dangerous route with the boys
- solve occupied buildings and PKM-owned lanes
- loot what matters
- extract before the route collapses
- return to a stash and squad board that changes the next run

The player should feel:

- this is a real game today
- this route has a tactical identity
- the squad and stash matter
- I want another run because the next decision is interesting

## Product Pillars

### 1. Fast Tactical Hook

The first run must reach the core fantasy fast:

- one scary lane
- one occupied building
- one room-clear solve
- one meaningful extract choice

### 2. Route Identity

Each major route must feel like its own tactical product, not one generic map with different labels.

### 3. Squad And Stash Consequence

The between-raid layer must create attachment, pressure, and doctrine change, not only inventory bookkeeping.

### 4. Readable Raid State

The player must understand:

- what is happening
- what structure is live
- what lane is dangerous
- when to keep pushing
- when to leave

### 5. Product Finish

The game must stop feeling like a debug-rich prototype and start feeling like a designed experience.

## Ship Slice

The productization target is one strong vertical slice:

- `Broken Signal`
  - occupied-building and room-clear route
- `Sundered Run`
  - trench, bunker, and med-lane pressure route
- `Crosswind Docks`
  - open-lane, dock, and peel-pressure route

These three routes must be enough to prove the full product loop:

- approach
- tactical solve
- loot
- extract
- stash consequence
- next-run preparation

## Non-Goals

Do not treat these as ship blockers for this phase:

- broad content count inflation
- large new economy layers
- PvP
- massive new UI systems
- new endgame feature families beyond what is needed to make the current loop feel complete

## Milestone Order

## Milestone 1. Product Slice Lock

### Goal

Freeze the actual ship promise and stop drifting.

### Status

Completed.

Primary output:

- [PRODUCT_SLICE_LOCK.md](./PRODUCT_SLICE_LOCK.md)

### Work

- define the exact vertical slice to polish first
- lock the three priority routes:
  - `Broken Signal`
  - `Sundered Run`
  - `Crosswind Docks`
- lock the default squad fantasy:
  - `me and the boys`
  - small-unit tactical extraction
  - occupied structures
  - PKM lane fear
  - room-clear mastery
- write the short player-facing product promise used by future implementation work
- identify the systems that are already “good enough for slice” versus “must improve before ship”

### Acceptance

- future work has one product target instead of multiple possible directions
- the team can explain the game in 1-2 sentences
- the next milestones are judged against product value, not only subsystem progress

## Milestone 2. First 20 Minutes

### Goal

Make the first session land the fantasy immediately.

### Status

Completed.

### Work

- script a clean first-run route recommendation
- ensure first-run loadout is strong enough to teach the game without flattening hardship
- guarantee the first run contains:
  - a quiet ingress beat
  - an obvious PKM-owned lane
  - one occupied building
  - one successful room-clear opportunity
  - one visible extraction decision
- tighten the first stash-to-raid-to-stash loop so the player understands what changed
- reduce or hide anything that feels like internal tooling during the first session

### Acceptance

- a new player can understand the game’s fantasy in one run
- the first run produces at least one memorable sentence
- the first run ends with a clear reason to launch another raid

## Milestone 3. Route Identity Pass

### Goal

Make the three core routes feel like distinct products.

### Status

Completed.

### Work

- define one dominant tactical identity per route
- make route composition, building occupation, and pressure reads reinforce that identity
- make route-specific copy, doctrine, and operation language reinforce the same identity
- ensure each route has at least 2-3 recognizable landmark problems

### Target route identities

- `Broken Signal`
  - relay houses
  - occupied structures
  - room clearing
  - dish-house and cellar pressure
- `Sundered Run`
  - trench lips
  - bunker mouths
  - mortar and med-lane pressure
  - brutal partial footholds
- `Crosswind Docks`
  - longer lanes
  - crane and dock pressure
  - peel-risk escalation
  - exposed crossings and salvage greed

### Acceptance

- players can describe each route with different tactical language
- route selection starts to feel like choosing an operation, not a map skin

## Milestone 4. Must-Clear Structure Pass

### Goal

Turn the core routes into sequences of meaningful tactical structures.

### Status

Completed.

### Work

- hand-author 2-3 must-clear structures per core route
- ensure those structures are occupied consistently
- tie each must-clear structure to one clear tactical read:
  - PKM lane owner
  - threshold hold
  - back-room threat
  - cellar compression
  - trench-entry denial
- reduce weak filler that competes with those structures

### Acceptance

- each core route contains memorable structures the player learns over repeated runs
- room clearing stops feeling incidental and becomes a core mastery ladder

## Milestone 5. Extraction Product Pass

### Goal

Make extraction a real emotional and tactical payoff.

### Status

Completed.

### Work

- tighten extract readability in live play
- make the extract decision easier to read from:
  - route heat
  - haul value
  - settlement state
  - squad risk
- improve the feel of:
  - disciplined clean peel
  - collapse-taxed extract
  - recovery-driven extract
- ensure the player clearly understands when greed is becoming failure

### Acceptance

- extracts feel like decisions, not only end buttons
- successful and bad extracts feel different in both raid and debrief

## Milestone 6. Stash And Squad Consequence Pass

### Goal

Make returning home feel like part of the game, not a detached menu.

### Work

- tighten the stash loop around:
  - loadout
  - recovered weapons
  - replacement pressure
  - memorial/chair consequences
  - route prep
- make post-raid decision surfaces simpler and stronger
- highlight what actually changed because of the last raid
- reduce low-signal stash noise that does not create meaningful decisions

### Acceptance

- the player can quickly answer:
  - what did I bring home
  - what did I lose
  - what changed for next run
  - what route or doctrine should I pick now

Completed. The stash lead and debrief now share one consolidated consequence read that answers those four questions directly, exports it in snapshot under `stash.consequenceRead` and `lastRaidSummary.consequenceRead`, and proves it through `verify --id stash-consequence-pass`.

## Milestone 7. Readability And Presentation Pass

### Goal

Make the live raid readable enough to feel like a finished product.

### Work

- audit the top-level raid boards for signal-to-noise
- prioritize player-facing reads for:
  - active structure ownership
  - active extract state
  - live squad package
  - noise/ingress state
  - current tactical ask
- remove or demote prototype-feeling language
- improve the consistency of battlefield language across:
  - pressure posture
  - operation flow
  - squad doctrine
  - route identity
  - stash/debrief summaries

### Acceptance

- players understand what the game wants from them without needing internal context
- the game feels authored and deliberate instead of system-dense but uneven

## Milestone 8. Retention Loop Pass

### Goal

Create reliable motivation for repeated play.

### Work

- make sure one successful run naturally leads to another meaningful choice
- ensure route prep, doctrine shifts, chair pressure, and haul decisions feed the next raid
- tighten short-term goals so players always have a reason to do:
  - one more route
  - one more recovery
  - one more doctrine pivot
  - one more better extract

### Acceptance

- the loop creates immediate “one more run” pull
- repeated raids feel strategically different, not only tactically different

## Milestone 9. Product QA And Ship Gate

### Goal

Set the minimum quality bar for calling this a product slice.

### Work

- define the canonical playthrough path through stash, raid, and return
- run product-level verification for the three core routes
- identify and fix:
  - onboarding confusion
  - route dead spots
  - weak structures
  - unclear extract reads
  - stash confusion
  - ugly prototype seams
- make the CLI proof stack cover the product-critical beats, not only subsystem proofs

### Acceptance

- the vertical slice is playable end to end without explanation
- the strongest route beats are reproducible
- the build can be shown as a product, not only as an internal milestone demo

## Recommended Implementation Order

Build in this order:

1. `Milestone 1`
2. `Milestone 2`
3. `Milestone 3`
4. `Milestone 4`
5. `Milestone 5`
6. `Milestone 6`
7. `Milestone 7`
8. `Milestone 8`
9. `Milestone 9`

This order is deliberate:

- first lock the promise
- then fix the first-session experience
- then make the routes feel like real products
- then strengthen extraction and stash consequence
- then polish readability
- then close the ship gate

## What Must Feel True At The End

By the end of this plan, the player should naturally say:

- `I knew what this game was in the first run.`
- `Each route had a different tactical personality.`
- `Buildings mattered and the PKM made me solve them correctly.`
- `Extracting felt tense and readable.`
- `Coming home changed the next run.`
- `This felt like a real tactical extraction game, not just a strong prototype.`

## Immediate Next Step

The first implementation pass should be:

- `Milestone 1. Product Slice Lock`

That work should end with one short authoritative product brief and one explicit decision:

- what exactly counts as the first shippable vertical slice
- what is deliberately deferred until after that slice feels real
