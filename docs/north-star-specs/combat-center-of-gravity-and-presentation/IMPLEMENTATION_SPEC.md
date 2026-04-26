# Combat Center Of Gravity And Presentation Implementation Spec

## Purpose

Define the implementation baseline for treating combat and command as the product's center of gravity, then making presentation and progression support that truth.

## Source Direction

- [Combat Center Of Gravity Direction](../../COMBAT_CENTER_OF_GRAVITY_DIRECTION.md)
- [Tactical Squad Extraction North Star](../../TACTICAL_SQUAD_EXTRACTION_NORTH_STAR.md)
- [Systemic Reuse And Prefab Rules](../../SYSTEMIC_REUSE_AND_PREFAB_RULES.md)
- [Main Map Tactical Slice Implementation Spec](../main-map-tactical-slice/IMPLEMENTATION_SPEC.md)
- [AI Pressure And Territorial Replayability Implementation Spec](../ai-pressure-and-territorial-replayability/IMPLEMENTATION_SPEC.md)
- [Gun Doctrine Implementation Spec](../gun-doctrine/IMPLEMENTATION_SPEC.md)
- [Stash Normalization And Squad Recovery Implementation Spec](../stash-normalization-and-squad-recovery/IMPLEMENTATION_SPEC.md)
- [Extraction Pressure And Operation Flow Implementation Spec](../extraction-pressure-and-operation-flow/IMPLEMENTATION_SPEC.md)
- [RimWorld Dialogue Campaign Flavor Implementation Spec](../rimworld-dialogue-campaign-flavor/IMPLEMENTATION_SPEC.md)

## Package Boundary

This package is cross-cutting.

It owns:

- the rule that the command runtime and controller are first-class product assets
- combat presentation requirements for audio and VFX
- hardcore early-game starting scarcity in support of combat mastery
- verification surfaces that prove combat verbs remain central

It does not own:

- a separate combat engine
- a separate AI framework
- a separate onboarding system detached from the briefing

## Current Code Baseline

The current codebase already justifies this package.

### Existing Command And Briefing Baseline

In [controls.ts](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/topdownextractionshooter/src/game/controls.ts), the game already exposes a deep battlefield control grammar:

- player movement and brace
- frag use
- live boy selection
- follow, defend, attack
- brace lane
- covering move
- quick suppress
- commit suppress
- frag cursor

In [main.ts](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/topdownextractionshooter/src/main.ts), that grammar is already surfaced through:

- briefing control strips
- mission briefing beats
- squad command queue hooks
- squad tactical action queue hooks

This means the skill ladder already has a real UI and input foundation.

### Existing Shared Combat Runtime Baseline

In [simulation.ts](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/topdownextractionshooter/src/game/simulation.ts), the project already has:

- shared grenade state
- shared tracer state
- shared impact state
- shared suppression and pressure state
- blind-fire reads
- a shared friendly-combatant runtime for squadmates, supports, and incident allies
- squad tactical actions for `grenade` and `suppress`

That is already a serious combat spine.

### Existing Weapon Baseline

In [weapons.ts](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/topdownextractionshooter/src/game/weapons.ts), current weapon support is:

- `none`
- `rifle`
- `smg`
- `shotgun`

This means the current baseline already supports low-start deployment through `none`, but still needs the intended hardcore sidearm floor and broader weapon ladder from the gun package.

## Problem Statement

Right now the game has unusually deep command and combat verbs, but the broader product still risks treating them as one feature among many.

The direction of this package is:

- the combat runtime is the reason the game can be tactical

So the implementation goal is not to add random combat features.

It is to make:

- AI
- map interactions
- stash scarcity
- gun identity
- audio
- VFX

all reinforce the controller and command layer that already exists.

## Reuse Rule

This package should explicitly follow [Systemic Reuse And Prefab Rules](../../SYSTEMIC_REUSE_AND_PREFAB_RULES.md).

It should reuse:

- the shared command and tactical-action grammar
- the shared friendly-combatant runtime
- the shared projectile, grenade, tracer, and impact structures
- the shared weapon definitions
- the shared briefing and CLI showcase surfaces

It should not introduce:

- special-case combat logic only for one flashy moment
- separate presentation logic that lies about simulation truth

## Design Rules

### 1. Keys Are Doctrine

The existing briefing keys should remain the primary expression of the skill ladder.

### 2. Combat Presentation Must Tell The Truth

Audio and VFX should read from the real combat state.

### 3. Hardship Must Exist Early

The early game should support a poor conscript start.

### 4. The Command Runtime Must Stay Central

Map, AI, and extraction work should continue to prove the value of suppress, grenade delegation, lane brace, and direct boy orders.

## State Additions

### Combat Presentation Read

Add or derive a compact combat presentation read for CLI and showcase verification.

Suggested fields:

```ts
interface CombatPresentationRead {
  activeTracerCount: number;
  activeImpactCount: number;
  activeGrenadeCount: number;
  nearbySuppressedEnemies: number;
  nearbyFriendlySuppressors: number;
  selectedBoyAction: string | null;
  commandDepthSummary: string;
}
```

### Starting Hardship Read

Add or derive a compact start-of-campaign readiness read.

Suggested fields:

```ts
interface HardcoreStartRead {
  primaryWeaponId: WeaponId;
  stashWeaponCount: number;
  medkitCount: number;
  ammoPackCount: number;
  squadBetterArmedThanPlayer: boolean;
}
```

## CLI Changes

### Snapshot Additions

Extend `snapshot` with a compact combat-center read, for example:

- `combat.commandDepthSummary`
- `combat.selectedBoyAction`
- `combat.activeTracerCount`
- `combat.activeImpactCount`
- `combat.activeGrenadeCount`
- `combat.nearbySuppressedEnemies`
- `combat.startingHardship`

### Showcases

Add or expand showcases for:

- `boys-frag-runtime`
- `suppression-runtime`
- `combat-presentation`
- `hardcore-start`

## Audio Changes

First version audio work should be organized by runtime truth:

- weapon discharge family
- suppression / snap-by layer
- grenade lifecycle layer
- casualty / danger callout priority
- extract-pressure escalation layer

## Visual Effects Changes

First version VFX work should be organized by shared combat state:

- weapon muzzle flash variants by weapon family
- tracers by faction and weapon identity
- impact material reads using existing `FrontlineImpactState.material`
- suppression / blast / hit emphasis using existing `FrontlineImpactState.kind`
- grenade and pressure burst readability

## UI Changes

The briefing and combat HUD should continue to teach and validate the command grammar.

Priority updates:

- stronger wording that the briefing is the doctrine sheet
- clearer surfacing of selected boy tactical action state
- concise live confirmation when a boy frag or suppress action is committed
- optional low-clutter combat presentation indicators in raid

## Manual / Documentation Changes

Update [wiki/project-cli.md](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/topdownextractionshooter/wiki/project-cli.md) with:

- new combat-center snapshot fields
- any new combat presentation or hardcore-start showcases

## System Interactions

This package must reinforce:

- map tactical spaces
- AI suppression and pressure states
- weapon identity and doctrine
- stash scarcity and squad gear decisions
- extraction pressure
- remembered dialogue

## Acceptance Criteria

- the game has an explicit direction doc saying combat and command are the center of gravity
- the spec stack reflects that direction
- CLI can verify combat runtime and presentation state together
- audio and VFX requirements are tied to shared runtime truth
- the product direction explicitly supports a poor conscript start with near-empty stash conditions
- the existing briefing-and-key language is preserved as the main skill ladder

## Risks

- audio and VFX become pure spectacle and stop helping readability
- early scarcity becomes frustrating instead of meaningful
- this package overlaps too much with gun or AI tuning instead of reinforcing them
- the game broadens in content while the controller remains under-validated
