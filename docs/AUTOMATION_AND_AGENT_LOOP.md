# Automation And Agent Loop

This document explains how recurring agents should work on `Frontline Officer`
without drifting back into the inherited extraction-shooter direction.

## Loop Shape

1. The 2D engine template defines the recurring automation pattern.
2. `docs/automation_prompt.md` binds that pattern to this exact fork path.
3. `AGENTS.md`, `DIRECTIVES.md`, and `AUTOMATION.md` define the local rules.
4. `docs/PERSISTENT_WAR_OFFICER_FORK_INTENT.md` is the active product north star.
5. `C:\Users\Javier\Desktop\CodexCLI\AgileSprints\Frontline Officer` owns sprint cards and agent handoff.
6. `npm run game:cli -- <command>` inspects, stages, verifies, and captures game behavior.
7. The automation updates docs, Agile state, and verification evidence before triggering the next run.

## Command Surfaces

Use the 2D game engine CLI from `C:\Users\Javier\Desktop\CodexCLI\2d-game-engine`
for project-level status and directives:

```powershell
python .\cli\game_engine_cli.py status frontline-officer
python .\cli\game_engine_cli.py show-directives frontline-officer
```

Use the AgileSprints CLI from `C:\Users\Javier\Desktop\CodexCLI\AgileSprints`
for work sequencing:

```powershell
python .\agile.py --project-path "C:\Users\Javier\Desktop\CodexCLI\AgileSprints\Frontline Officer" sprint-status
python .\agile.py --project-path "C:\Users\Javier\Desktop\CodexCLI\AgileSprints\Frontline Officer" board
```

Use the project CLI from this fork for runtime inspection and verification:

```powershell
npm run game:cli -- snapshot --url http://127.0.0.1:5847
npm run game:cli -- regression-gate --url http://127.0.0.1:5847
```

## Current First Card

The current first Agile card is:

`CARD-001 Audit inherited runtime and name the officer-war cutover seams`

That card should identify the smallest safe boundaries for:

- first-town war state,
- two opposing camps,
- autonomous soldier state,
- officer build orders,
- construction orders,
- trench and cover payoff,
- camp damage and match end,
- protected operation banking,
- CLI verification surfaces.

## Automation Guardrails

- Keep all game work inside `C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\frontline-officer`.
- Use AgileSprints only through its CLI unless the CLI cannot express the required maintenance.
- Use the game CLI before browser-only inspection when a state can be staged or verified.
- Keep dev and preview ports dedicated: `5847` and `5848`.
- Treat inherited extraction decisions as archived reference, not active work.
- Record unresolved product choices in `docs/decision_making_document.md`.
- Include screenshot or runtime verification evidence when gameplay-facing behavior changes.

## What Future Automation Should Build Toward

The first complete slice is not a bigger extraction raid. It is a small
Foxhole-like town war where the player is an officer placing consequential
orders:

- soldiers move, suppress, retreat, resupply, and build without being puppets,
- trenches and ammo positions alter survivability and tempo,
- every build order exposes someone to risk,
- the player can personally enter the war but death costs progress,
- protected stash banking lets the player prepare tomorrow's operation,
- the match ends when one camp is destroyed.
