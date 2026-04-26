# Systemic Reuse And Prefab Rules

## Purpose

Define the cross-cutting reuse rules that should govern all north-star implementation work.

This document exists to prevent the project from turning into a pile of feature-specific exceptions.

The goal is:

`build many tactical situations from a small number of reusable gameplay primitives`

not:

`build a separate custom system for every new cool idea`

## Source Direction

This document should be read alongside:

- [Tactical Squad Extraction North Star](./TACTICAL_SQUAD_EXTRACTION_NORTH_STAR.md)
- [North Star Spec Scaffolding](./north-star-specs/README.md)
- [Infiltration Shooter Direction](./INFILTRATION_SHOOTER_DIRECTION.md)

It is a cross-cutting architecture rulebook for all of the north-star packages:

- `main-map-tactical-slice`
- `ai-pressure-and-territorial-replayability`
- `gun-doctrine`
- `stash-normalization-and-squad-recovery`
- `extraction-pressure-and-operation-flow`
- `rimworld-dialogue-campaign-flavor`

## Core Rule

When adding a new feature, first ask:

`Is this truly a new kind of thing, or is it a new configuration of an existing thing?`

Default answer:

- prefer new configuration
- prefer new authored content
- prefer new hook composition

Only introduce a new core type when reuse would become dishonest, unreadable, or technically brittle.

## Product-Level Principle

The game should scale through composition, not exception handling.

That means:

- one combatant model, many combatant roles
- one map situation model, many authored tactical problems
- one operation-state grammar, many run outcomes
- one item model, many item categories
- one dialogue hook model, many story packs

If the project instead grows by adding:

- special trench NPCs
- special room NPCs
- special exfil NPCs
- special memorial NPCs
- special body-recovery maps
- special recovery-only items

then tuning, debugging, and content growth will become messy fast.

## The Prefab Meaning

`Prefab` here does not only mean an engine object.

It means:

- a reusable systemic building block
- a data-driven authored pattern
- a shared gameplay primitive with multiple configurations

Good prefab thinking for this project:

- one room-stack situation with different geometry and defenders
- one combatant type with different doctrine profiles
- one extraction edge with different pressure states
- one stash item type with different category behavior
- one dialogue event with different story-family output

## Reuse Hierarchy

When building new work, prefer this order:

1. Reuse an existing primitive with new authored data.
2. Reuse an existing primitive with one small extension.
3. Compose two or more existing primitives together.
4. Add a new primitive only if the first three fail cleanly.

This should be the default standard across the codebase.

## Canonical Shared Primitives

These are the major reusable layers the project should protect.

## 1. Combatant Primitive

There should be one canonical combatant model for:

- Blue
- the boys
- hostile fighters

Different factions or roles can still have different permissions, tuning, and authored behavior, but they should share the same underlying concepts where possible:

- movement
- cover seeking
- suppression response
- casualty state
- surrender eligibility
- weapon handling
- dialogue memory hooks
- perception and route response

Variation should mainly come from data such as:

- faction
- role
- courage
- discipline
- aggression
- room skill
- trench skill
- rescue bias
- weapon family
- voice or personality tags

Bad pattern:

- `TrenchEnemy`
- `RoomEnemy`
- `ExtractEnemy`

Better pattern:

- one combatant model with different role profiles and position context

## 2. Tactical Situation Primitive

The map should be built from reusable tactical situations rather than bespoke scripts for every encounter.

Examples:

- room stack
- breach point
- road crossing
- trench segment
- bunker foothold
- casualty corridor
- extraction edge
- civilian window
- convoy interruption

Each situation should ideally expose shared authored hooks such as:

- geometry anchors
- attacker approaches
- defender slots
- escalation hooks
- support hooks
- dialogue hooks
- loot or recovery hooks

Good pattern:

- one trench-segment situation used in several sub-zones with different state and defenders

Bad pattern:

- one-off scripted trench encounter with custom logic no other trench can reuse

## 3. District And Subzone Primitive

The map package should not create one giant special-case battlefield.

It should create:

- one district layer
- multiple reusable subzone types

Examples:

- town block
- industrial yard
- trench line
- bunker chain
- extract edge

A subzone should be able to carry shared state hooks such as:

- control state
- scar state
- pressure
- support need
- remembered-ground tag

That makes towns changing hands and routes feeling different on return a matter of configuration and state, not a full new map fork.

## 4. Operation-State Primitive

Every raid should use one shared operation grammar.

Suggested shared operation phases:

- `approach`
- `gain`
- `commitment`
- `exfil`
- `collapse`

Suggested shared operation intents:

- `profit`
- `contract`
- `recovery`
- `survival`

This should be the same grammar consumed by:

- map readability
- AI pressure
- extraction pressure
- debrief framing
- dialogue reaction

Bad pattern:

- each system invents its own separate run-state language

Better pattern:

- one shared operation state read interpreted by each system in its own way

## 5. Item Primitive

The stash, loot, and deploy systems should share one item model.

Categories can differ, but the underlying item logic should stay unified.

Good category examples:

- deployable weapon
- deployable sidearm
- deployable supply
- deployable support
- recovered haul
- broker haul
- operation token
- memorial token

Bad pattern:

- menu-only fake items
- raid-only fake items
- memorial-only custom item objects that cannot share the same framework

Better pattern:

- one item framework with category-driven behavior and surface-specific actions

## 6. Dialogue Hook Primitive

Dialogue should not be hardwired directly to bespoke feature code whenever possible.

It should consume shared hooks like:

- `entered_bad_ground`
- `route_turning_hot`
- `mate_downed`
- `body_sighted`
- `body_recovered`
- `town_flipped`
- `hot_exfil`
- `chair_filled`
- `quiet_bunker_moment`

Then story packs and delivery rules determine what gets said.

Good pattern:

- one `hot_exfil` hook used by multiple story families

Bad pattern:

- custom one-off line logic buried inside a single extract implementation branch

## 7. Support Or Incident Primitive

Campaign fallout, support orders, and frontline incidents should also prefer reuse.

Examples:

- firefight
- convoy
- casualty
- civilian
- bunker
- recovery

Each incident type can vary by district, state, and intensity, but the underlying framework should stay common enough that:

- AI can react to it
- debrief can summarize it
- dialogue can recognize it
- map dressing can reflect it

## Reuse Rules By Package

## Main Map Tactical Slice

The map package should reuse:

- tactical situations
- subzone types
- route and district hooks

It should avoid:

- unique geometry logic for every new sub-zone
- map-only bespoke extraction logic
- map-only bespoke recovery logic

## AI Pressure And Territorial Replayability

The AI package should reuse:

- one combatant model
- one pressure posture grammar
- one settlement-state model

It should avoid:

- separate AI species for each kind of location
- special-case surrender or casualty logic that only one content slice understands

## Gun Doctrine

The gun package should reuse:

- one weapon framework
- one squad role framework
- one combatant firing model

It should avoid:

- map-specific gun rules
- one-off gun behavior that only exists in a single showcase unless the weapon family itself truly requires it

## Stash Normalization And Squad Recovery

The stash package should reuse:

- one item model
- one roster model
- one memorial and replacement grammar

It should avoid:

- separate inventory logic for stash, loot, and deployables
- separate replacement logic for each kind of squad loss

## Extraction Pressure And Operation Flow

The extraction package should reuse:

- one operation grammar
- one extract-edge framework
- one hold and slip logic family

It should avoid:

- bespoke extraction flows that only one outcome understands
- separate exfil rules for profit, casualty, and body recovery that cannot share a base structure

## RimWorld Dialogue Campaign Flavor

The dialogue package should reuse:

- one story-pack workflow
- one dialogue-hook framework
- one memory-tag grammar

It should avoid:

- hardcoding lines against one feature branch
- turning flavor into the owner of tactical logic

## Authoring Rules

When authoring content, prefer:

- shared schemas
- shared tags
- shared hook names
- authored variations over new resolver branches

Before adding a new authored content family, ask:

- which primitive does this belong to
- which shared hook should trigger it
- which neighboring systems should be able to read it too

If the answer is “none,” the design is probably too bespoke.

## One-Type Rule For NPCs

This is the most important concrete rule for the project:

`All NPCs should be technically the same underlying kind of actor unless there is a very strong reason they cannot be.`

That does not mean every actor behaves identically.

It means they should share:

- actor lifecycle
- state grammar
- navigation grammar
- weapon grammar
- casualty grammar
- dialogue memory grammar

Then role, doctrine, faction, and state define the differences.

This is the cleanest way to keep:

- friendlies
- hostiles
- recovering actors
- suppressing actors
- surrendering actors

inside one scalable system.

## When To Create A New Primitive

A new primitive is justified only when at least one of these is true:

- reuse would create unreadable or dishonest gameplay
- reuse would create severe code complexity or unsafe branching
- the new thing has a genuinely different lifecycle
- the new thing has a genuinely different player-facing grammar

If the answer is only:

- `this was faster in the moment`
- `this one feature is special`
- `I did not want to thread the hook through`

then that is not a good enough reason.

## Smell Tests

The implementation is probably drifting if:

- a feature can only be described by naming a specific map or mission
- an NPC type exists only for one encounter family
- an item exists in one menu but not in the shared item framework
- a dialogue line requires custom code because no shared hook exists
- a new extraction outcome cannot reuse the existing operation grammar
- tuning one feature requires touching many unrelated special cases

## Review Checklist

When reviewing implementation specs or code, ask:

- what existing primitive should this reuse
- what data tags or config should vary instead of code
- what neighboring system should also understand this state
- is this a new type, or just a new authored situation
- will this make future content easier or harder to build

## Required Spec Rule

All north-star implementation specs should follow this rule:

`Prefer reusable systemic primitives over feature-specific one-off implementations.`

And this follow-up rule:

`If a feature introduces a new type of thing, justify why an existing primitive cannot represent it.`

## Success Criteria

This document is working if future implementation tends to produce:

- one actor model with many roles
- one district model with many sub-zones
- one operation grammar with many outcomes
- one item model with many categories
- one dialogue hook grammar with many story packs

and if new content becomes easier to build without making the codebase dirtier.

## Failure Modes

- every feature adds another special-case class or state machine
- authored content and code drift apart
- AI, map, stash, extraction, and dialogue all invent separate names for the same state
- new content is fast to prototype but painful to integrate
- the project starts feeling like many small games stitched together
