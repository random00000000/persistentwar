# Stash Normalization And Squad Recovery Implementation Spec

## Purpose

Define the implementation baseline and acceptance criteria for turning the current stash, memorial, and roster aftermath into one coherent persistent-consequence package.

This package should make the stash trustworthy:

- every important visible item has a clear gameplay category
- prep stock and raid stock flow cleanly
- recovered haul feeds the next run
- squad losses and replenishment stay playable but meaningful

## Source Direction

- [Tactical Squad Extraction North Star](../../TACTICAL_SQUAD_EXTRACTION_NORTH_STAR.md)
- [Systemic Reuse And Prefab Rules](../../SYSTEMIC_REUSE_AND_PREFAB_RULES.md)
- [Main Map Tactical Slice Implementation Spec](../main-map-tactical-slice/IMPLEMENTATION_SPEC.md)
- [AI Pressure And Territorial Replayability Implementation Spec](../ai-pressure-and-territorial-replayability/IMPLEMENTATION_SPEC.md)
- [Gun Doctrine Implementation Spec](../gun-doctrine/IMPLEMENTATION_SPEC.md)

## Package Boundary

This package should persist and normalize the consequences created by the battlefield packages.

It should not redefine:

- battlefield geometry
- suppression and collapse logic
- territorial posture logic
- weapon-family doctrine itself

It should define:

- stash item meaning
- deploy-versus-store-versus-sell flow
- squad roster continuity
- memorial and replacement consequence
- UI and CLI surfaces for the above

## Current Code Baseline

The current codebase already has a strong foundation. This package should deepen and organize that work rather than replacing it.

### Existing Stash Baseline

In [main.ts](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/topdownextractionshooter/src/main.ts), the stash already includes:

- a real rack surface with `STASH_RACK_COLUMNS`, `STASH_RACK_ROWS`, and placement validation
- equipped item surfaces via `stashUiState.equippedItems`
- storage surfaces via `stashUiState.storageItems` and `stashUiState.storagePlacements`
- a prep-loadout model for `medkits` and `ammoPacks`
- rack search, rack filters, broker tags, and inspectors
- top tabs for operator, gear, health, skills, map, and tasks
- memorial wall and handoff board surfaces in the operator tab

The gear bench already supports a real operational read instead of a blank inventory sheet.

### Existing Supply And Deployment Baseline

The current stash flow already tracks:

- `stashCredits`
- `stashSupplies`
- `prepLoadout`
- carried and returned medkits
- extracted sealed supplies
- deployment cost
- hot-market and contract payout

This means the game already has the outline of a valid stash-to-raid-to-debrief loop.

### Existing Squad Recovery Baseline

In [simulation.ts](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/topdownextractionshooter/src/game/simulation.ts), the runtime already tracks:

- `SquadRosterState`
- `SquadRecruitCandidate`
- `SquadCasualtyRecord`
- `SquadRosterStatus = "active" | "reserve" | "killed"`
- `reserveDays`
- `bodyRecovered`
- `familyNotified`
- `wakeHeld`
- fallen squad body state and active body-recovery state

The game also already supports:

- persistent missing bodies across raids
- body-recovery support operations like `recover-body`
- memorial penalties and unresolved-body burden

### Existing CLI And Manual Baseline

In [wiki/project-cli.md](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/topdownextractionshooter/wiki/project-cli.md), the CLI already exposes:

- `snapshot`
- stash-phase reads
- authored showcases for `memorial-wall`, `body-recovery`, `persistent-body-return`, and `debrief`

This package should extend that trusted inspection path instead of inventing a UI-only workflow.

## Problem Statement

The current system is rich but not fully normalized yet.

Right now:

- the stash looks alive and already carries real state
- the prep-loadout already matters
- the memorial and body-recovery loop already matters

But the north-star gap is still visible:

- some rack items are clearly atmospheric or illustrative rather than normalized gameplay categories
- deployable versus decorative versus broker-only meaning is not yet fully formalized
- squad replenishment exists in pieces, but the replacement loop is not yet the explicit operational system it needs to be
- the player can feel the direction, but not every wall item and roster state is equally legible

## Design Rules

- The stash must stay product-facing and operational, not become a general inventory sim.
- Reuse one shared item model and one shared roster or memorial grammar across stash, loot, deploy, recovery, and aftermath surfaces.
- Every important visible stash item needs a clear gameplay category.
- The player should understand where an item can go next:
  - raid
  - broker
  - support action
  - memorial or operator board
- Replacement must be human enough to matter and light enough to keep the game playable.
- Missing-body debt must remain actionable, not decorative tragedy text.
- The stash should remain dense and flavorful, but flavor cannot obscure what matters.

## Feature Goals

### 1. Normalize The Stash Wall

Turn the current stash from a rich mixed wall into a clearly categorized operational wall.

### 2. Formalize Raid Item Flow

Make the item path readable:

- staged into raid
- consumed in raid
- recovered from raid
- banked, sold, or staged for support

### 3. Formalize Squad Recovery And Replacement

Turn the existing roster, memorial, and recruit surfaces into one clear continuity loop.

### 4. Preserve The Human Tone

Keep memorial, handoff, family-call, and quiet debrief beats as flavor and consequence, not abstract debuffs.

## State Additions

### Stash Item Classification

Add or derive a normalized stash item category layer.

At minimum, every stash tile should resolve to one of:

- `deployable-weapon`
- `deployable-sidearm`
- `deployable-supply`
- `deployable-support`
- `recovered-haul`
- `broker-haul`
- `operation-token`
- `memorial-token`

This can be implemented as explicit metadata on `StashTileDefinition` or derived from existing item properties.

The rule is more important than the exact field name:

- item meaning must be machine-readable and surfaceable in UI and snapshot output

### Stash Item Action Model

Add or normalize supported actions per item category.

Examples:

- deploy
- equip
- stage-support
- tag-for-broker
- sell
- hold-for-next-run
- memorial-only

The current context menu and rack inspector are the right place to surface this.

### Squad Readiness State

The current roster model is close, but the stash package should formalize a readiness read for each boy.

At minimum, expose or derive:

- `ready`
- `reserve`
- `missing`
- `killed`
- `replacement-pending`

This can be a derived UI-layer concept over the existing `status`, `reserveDays`, `bodyRecovered`, and memorial flags.

### Replacement Seat State

The current handoff board already points at this direction.

Formalize a seat or chair continuity read so the player can understand:

- which role is vacant
- whether a replacement candidate is available
- whether memorial follow-through still blocks or burdens the handoff

This does not need to become a heavy staffing sim. It does need to become a clear gameplay surface.

## Behavior Requirements

### Stash Normalization

The stash wall must distinguish between:

- things the player can field now
- things the player can bank or sell
- things that represent squad consequence

The player should not need to inspect flavor copy to know whether an item matters materially.

### Deployable Item Flow

The first north-star slice should guarantee that the following categories can enter the raid or materially affect the raid:

- primary weapons
- sidearms
- medkits
- ammo packs
- support packets if staged

Recovered enemy guns should support:

- immediate next-run staging
- rack storage
- sale or broker tagging

### Recovery And Replenishment Flow

The squad loop should support:

- active-to-reserve rotation after strain or injury
- killed-to-memorial transition
- unresolved missing-body pressure
- delayed replacement rather than instant refill
- replacement candidate arrival through the handoff board

The player should be able to read:

- who can go now
- who will be back soon
- who is still owed recovery or rites
- whether the squad can support another high-intensity push

### Memorial And Body Debt Interlock

The memorial wall and body-recovery support operation should be explicitly tied together.

Rules:

- if a body is unrecovered, the stash and operator surfaces should keep that debt visible
- body recovery should relieve both emotional and readiness burden
- memorial follow-through should matter, but should not fully soft-lock progress

## CLI Changes

This package must remain testable from CLI before UI polish is considered complete.

### Snapshot Additions

Extend `snapshot` with a normalized stash and roster read, including at minimum:

- `stash.items[*].category`
- `stash.items[*].actions`
- `stash.items[*].deployable`
- `stash.items[*].brokerTagged`
- `stash.items[*].origin`
- `stash.prepLoadout`
- `stash.readyWeapons`
- `stash.readySupplies`
- `stash.recoveredHaulSummary`
- `stash.squadReadiness`
- `stash.replacementSeats`
- `stash.memorialDebt`

These can be compact summaries if the raw stash wall remains large.

### CLI Flows

Support or extend CLI paths for:

- stash snapshot inspection
- staging a weapon and sidearm package
- staging medkits and ammo packs
- inspecting memorial debt
- inspecting replacement readiness

The package does not need a huge new command family if `snapshot`, stash-phase config, and showcases remain sufficient, but the flows must be verifiable.

### Showcases

Add or extend authored showcases for:

- deployable stash wall
- recovered weapon kept for next run
- body debt visible in stash
- chair handoff or replacement-ready state
- thin-stock prep decision

## Manual / Documentation Changes

Update [wiki/project-cli.md](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/topdownextractionshooter/wiki/project-cli.md) with:

- normalized stash snapshot fields
- any new stash configuration or inspection flow
- new or expanded showcases for memorial and replacement verification

Update [wiki/README.md](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/topdownextractionshooter/wiki/README.md) to keep the north-star spec package indexed if new docs or showcases are added.

## UI Changes

### Gear Bench

Keep the current rack and gear bench structure, but make item meaning clearer.

Required outcomes:

- clearer category labels
- clearer action affordances
- clearer distinction between deployable gear and sale-only haul
- visible sidearm readiness once handgun doctrine ships

### Operator Tab

Strengthen the existing operator surfaces:

- squad roster
- handoff board
- memorial wall

Required outcomes:

- clear `ready`, `reserve`, `missing`, and `chair open` reads
- explicit replacement pressure
- explicit unresolved-body pressure

### Debrief

The debrief should summarize both:

- material recovery
- human consequence

It should clearly answer:

- what came home
- what was spent
- what is still owed
- who is available for the next run

## Transient Feedback Changes

This package is mostly persistent UI, but it still needs a small amount of transient feedback.

Recommended short-lived feedback:

- `Recovered weapon`
- `Broker tagged`
- `Chair filled`
- `Body debt cleared`
- `Prep stock committed`
- `Not enough ready boys`

Avoid covering the stash in permanent debug labels.

## System Interactions

This package must interlock cleanly with:

- gun doctrine
- extraction pressure
- casualty state
- body recovery
- territorial replayability
- RimWorld-style emergent dialogue

Important rule:

- the stash should translate battlefield truth into the next operation, not compensate for missing battlefield truth

## Acceptance Criteria

The package is complete for the first north-star version when:

- every important stash item has a readable gameplay category
- deployable versus sellable versus memorial-only meaning is clear
- recovered weapons can matter to the next run
- the squad roster clearly communicates readiness, reserve, death, and replacement pressure
- missing-body debt remains visible and actionable
- memorial and handoff surfaces feel like one continuity loop rather than isolated widgets
- snapshot and showcase flows can prove the whole stash-to-recovery loop

## Out Of Scope For This Package

- full Tarkov-style nested inventory simulation
- trader network expansion
- attachment-level stash micro
- deep crafting economy
- broad hospital or barracks sim

Those can come later only if they strengthen the operational loop instead of burying it.

## Risks

- normalization strips too much flavor out of the stash
- flavor remains strong but item meaning stays ambiguous
- replacement is too abstract and reads like a spreadsheet
- replacement is too slow and turns loss into frustration admin
- memorial debt becomes only UI sadness with weak gameplay consequence
- the stash grows broader without getting clearer
