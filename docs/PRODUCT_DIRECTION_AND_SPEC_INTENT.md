# Product Direction And Spec Intent

## Purpose

This document is the short agent-facing intent wrapper for the whole current product-direction stack.

If an agent needs to understand what this project is trying to become without reading every spec first, this is the first doc to point them at.

It exists to make the hierarchy explicit:

1. the game has a real north star
2. the combat-and-command runtime is the main differentiator
3. the spec packages are implementation tracks in service of that north star
4. the project is building toward a finishable product, not a pile of disconnected features

## Read Order

Agents should read these in this order:

1. [Tactical Squad Extraction North Star](./TACTICAL_SQUAD_EXTRACTION_NORTH_STAR.md)
   Path: `C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\topdownextractionshooter\docs\TACTICAL_SQUAD_EXTRACTION_NORTH_STAR.md`
2. [Combat Center Of Gravity Direction](./COMBAT_CENTER_OF_GRAVITY_DIRECTION.md)
   Path: `C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\topdownextractionshooter\docs\COMBAT_CENTER_OF_GRAVITY_DIRECTION.md`
3. [Systemic Reuse And Prefab Rules](./SYSTEMIC_REUSE_AND_PREFAB_RULES.md)
   Path: `C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\topdownextractionshooter\docs\SYSTEMIC_REUSE_AND_PREFAB_RULES.md`
4. [Endgame Direction](./ENDGAME_DIRECTION.md)
   Path: `C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\topdownextractionshooter\docs\ENDGAME_DIRECTION.md`
5. [North Star Spec Scaffolding](./north-star-specs/README.md)
   Path: `C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\topdownextractionshooter\docs\north-star-specs\README.md`

If more atmosphere and original fantasy are needed after that, read:

- [Infiltration Shooter Direction](./INFILTRATION_SHOOTER_DIRECTION.md)
  Path: `C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\topdownextractionshooter\docs\INFILTRATION_SHOOTER_DIRECTION.md`
- [Core Verbs Raw Fantasy](./CORE_VERVS_RAW_FANTASY.md)
  Path: `C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\topdownextractionshooter\docs\CORE_VERVS_RAW_FANTASY.md`
- [Core Verbs Raw Fantasy V2](./CORE_VERVS_RAW_FANTASYV2.md)
  Path: `C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\topdownextractionshooter\docs\CORE_VERVS_RAW_FANTASYV2.md`
- [Extraction Direction](./EXTRACTION_DIRECTION.md)
  Path: `C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\topdownextractionshooter\docs\EXTRACTION_DIRECTION.md`

## What The Project Is Trying To Become

This project is trying to become:

- a mastery-driven tactical squad extraction shooter

Not:

- a generic extraction shooter
- a broad war sandbox with shallow mechanics
- a feature collection where every system competes for attention

The product target is:

- deep command system
- granular tactical combat spaces
- adaptive AI pressure
- meaningful gun doctrine
- harsh stash consequence
- strong extraction tension
- replayable operations
- a real endgame and true escape

## The Main Product Truth

The north star matters.

Agents should assume the project is actively building toward it, not treating it as optional flavor text.

The main product truth is:

- the player controller and squad-command runtime are already among the strongest parts of the game

That means the rest of the product should rise to match them.

The game should revolve around:

- direct boy commands
- delegated grenade throws
- suppression
- brace and sector control
- covering movement
- room clearing
- trench pressure
- extraction under stress

The control language surfaced in the briefing is not just UI.

It is the skill ladder.

## Combat Center Of Gravity

Agents should treat the following as central:

- gunplay
- player movement and aiming feel
- live squad commands
- tactical actions
- shared combat runtime

Everything else should support those strengths:

- AI should make those verbs necessary
- maps should create situations that reward those verbs
- guns should deepen those verbs
- stash should make those verbs matter across runs
- dialogue should react to those verbs
- audio and VFX should make those verbs feel serious and readable

## Hardcore Progression Intent

The intended progression is not abundance-first.

Agents should assume the desired opening is closer to:

- poor conscript
- weak gear
- almost-empty stash
- meaningful squad-versus-player weapon allocation

and farther from:

- instantly rich Tarkov-style locker fantasy

The player should grow into competence and power over time.

## What The Spec Packages Are For

The spec packages in [north-star-specs](./north-star-specs/README.md) are not idea dumps.
Path: `C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\topdownextractionshooter\docs\north-star-specs\README.md`

They are the implementation tracks that turn the north star into product work.

They should be used to:

- scope work
- protect boundaries
- keep systems complementary
- avoid one-off feature drift

Agents should not invent a parallel product direction when the package set already covers the area.

## Key Package Paths

Use these paths when traversing the current product stack:

- `C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\topdownextractionshooter\docs\north-star-specs\main-map-tactical-slice`
- `C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\topdownextractionshooter\docs\north-star-specs\ai-pressure-and-territorial-replayability`
- `C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\topdownextractionshooter\docs\north-star-specs\gun-doctrine`
- `C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\topdownextractionshooter\docs\north-star-specs\stash-normalization-and-squad-recovery`
- `C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\topdownextractionshooter\docs\north-star-specs\extraction-pressure-and-operation-flow`
- `C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\topdownextractionshooter\docs\north-star-specs\rimworld-dialogue-campaign-flavor`
- `C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\topdownextractionshooter\docs\north-star-specs\endgame-campaign-finale`
- `C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\topdownextractionshooter\docs\north-star-specs\combat-center-of-gravity-and-presentation`

## Rules For Future Work

When making decisions, prefer work that:

- strengthens tactical mastery
- reinforces the command language
- makes AI and maps justify the controls
- preserves reuse and shared primitives
- supports stash consequence and extraction pressure
- remains compatible with the eventual endgame

Avoid work that:

- adds spectacle without tactical depth
- creates bespoke systems when a shared primitive should be extended
- flattens the command system to make implementation easier
- makes the player too rich too early
- drifts into a different genre

## Short Agent Summary

If an agent only remembers one paragraph, it should be this:

This project is building toward a north-star tactical squad extraction shooter where the controller, gunplay, and squad-command runtime are the center of gravity. The rest of the game exists to justify and strengthen that combat language through better AI, better tactical spaces, better gun doctrine, harsher stash consequence, stronger extraction pressure, readable presentation, and a finishable campaign that ends in a true escape.
