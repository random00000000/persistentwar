# Regression Proofing Plan

## Purpose

Prevent project collapse through regression, hidden state drift, and half-wired runtime paths.

This plan exists to make the CLI, manual, inspect surfaces, force/stage commands, and verify commands part of the core product infrastructure instead of optional debug tooling.

The game runtime is the product.

The CLI/manual/verify layer is the anti-collapse system that keeps the product from decaying while features keep moving.

## Problem Statement

The project already has:

- a deep raid runtime
- stash and route configuration
- extraction pressure
- adaptive enemy behavior
- authored showcases
- a growing set of verify commands

The real risk is not lack of ideas.

The real risk is:

- one subsystem fix silently breaking another
- old runtime paths staying alive after new ones ship
- authored slices being more reliable than generic play
- UI showing state that no longer matches the runtime
- game promises existing in docs but not in stable command surfaces

This is the collapse path.

## Core Rule

If a feature cannot be:

- staged
- inspected
- configured
- and verified

through the CLI/manual layer, it is not stable enough yet.

## Product Truth

The CLI is not a convenience.

The CLI is the authoritative control layer for keeping the tactical squad extraction product healthy while the live game keeps evolving.

The manual is not notes.

The manual is the contract that tells future agents and future work what is stable, what is supported, and what can be trusted.

## Goals

1. Make critical systems inspectable.
2. Make critical systems forceable without code edits.
3. Make core player promises verifiable.
4. Remove legacy paths that bypass the verified runtime.
5. Keep the manual aligned with the real command surface.

## Non-Goals

This plan is not for:

- adding new major gameplay systems
- expanding content breadth for its own sake
- writing more docs without matching command coverage
- building showcase-only debug helpers that do not protect generic runtime

## Stability Surfaces

These are the systems that must be covered by regression-proofing:

- stash entry and exit
- route configuration
- raid start
- loadout/equip flow
- weapon selection and live use
- intel capture
- extraction hold
- wave triggering and spawn targeting
- enemy room chase and doorway traversal
- squadmate survivability and recovery
- UI overlay visibility and state transitions
- route identity and must-clear structure reads

## Milestones

## Milestone 1. Command Surface Audit

### Goal

Map what the current CLI and manual already cover, and identify where the product still relies on hidden runtime behavior.

### Status

Completed.

Primary output:

- [REGRESSION_COMMAND_SURFACE_AUDIT.md](./REGRESSION_COMMAND_SURFACE_AUDIT.md)

### Work

- audit `wiki/project-cli.md`
- audit `scripts/project-cli.mjs`
- list all current inspect, configure, showcase, verify, and capture commands
- map those commands against the product-critical systems
- identify missing command coverage and duplicate or stale command paths

### Output

- one explicit command-surface matrix
- one missing-coverage list
- one stale-path list

### Acceptance

- future work can answer `do we have a command for this system?`
- missing stability coverage is explicit instead of guessed

## Milestone 2. Inspect Layer Completion

### Goal

Make the critical runtime state visible without opening the browser or reading code.

### Status

Completed.

Primary runtime contract updates:

- `src/main.ts` snapshot surfaces:
  - `ui.overlays`
  - `ui.frontDoorPanel`
  - `raid.extraction`
  - `raid.pendingReinforcementSummary`
  - `regression.legacyToggles`
  - `regression.overlayTruth`
- `wiki/project-cli.md` snapshot contract notes
- `wiki/README.md` milestone note

### Work

Add or tighten inspectable snapshot surfaces for:

- active route
- live raid phase
- stash open/front-door open/briefing open state
- selected weapon and support
- active extraction hold and time remaining
- pending reinforcement waves with source, target, and timer
- active enemy squads and doctrine
- room-chain traversal state
- legacy runtime toggles that should be off

### Acceptance

- `snapshot` can explain the live game state for critical systems
- agents can diagnose common regressions from terminal-visible state

## Milestone 3. Force And Stage Layer

### Goal

Stop relying on code edits or fragile browser choreography to reach risky game states.

### Status

Completed.

Primary runtime and command outputs:

- `src/main.ts`
  - `stageState(...)` agent API surface
  - targeted helpers for:
    - extract hold active
    - body alarm pending
- `scripts/project-cli.mjs`
  - `stage-state --id <...>`
- `wiki/project-cli.md`
  - stage-state contract and supported ids
- `wiki/README.md`
  - milestone note

### Work

Add or tighten commands that can force or stage:

- stash
- briefing
- raid
- first intel live
- extraction ready
- extraction hold active
- body-alarm pending
- intel crash pending
- room-clear pocket active
- selected weapon/loadout package
- visible overlay states

### Acceptance

- common regression states can be reached by command
- future bug work can reproduce state from terminal instructions alone

## Milestone 4. Core Verify Ladder

### Goal

Lock the main product loop behind named verifies instead of relying on memory or smoke feelings.

### Status

Completed.

Primary outputs:

- `scripts/project-cli.mjs`
  - direct regression verifies:
    - `main-menu-to-stash`
    - `stash-to-raid`
    - `equip-major-weapons`
    - `equip-low-tier-guns`
    - `wave-target-discipline`
    - `same-room-reinforcement-guard`
    - `no-immortal-runtime`
    - `legacy-crossfire-disabled`
- `src/main.ts`
  - snapshot reinforcement containment truth:
    - `raid.player.containingObstacleId`
    - `raid.pendingReinforcements[*].containingObstacleId`
- `wiki/project-cli.md`
  - core verify ladder contract
- `wiki/README.md`
  - milestone note

### Work

Add or tighten verifies for:

- main menu to stash
- stash to raid
- equip each major weapon class
- knife equip and kill
- low-tier gun equip path
- intel capture path
- extraction hold path
- wave spawn target correctness
- no same-room reinforcement spawn
- no immortal allied or hostile pseudo-units
- enemy doorway chase through normal buildings
- no hidden legacy crossfire paths

### Acceptance

- the game’s core loop is represented by a stable verify ladder
- regressions fail commands, not just player trust

## Milestone 5. Legacy Path Elimination

### Goal

Remove runtime paths that can bypass the verified product behavior.

### Status

Completed.

Primary outputs:

- `src/game/simulation.ts`
  - `clearLegacyFrontlineRuntimeState(...)`
  - `hasLegacyFrontlineRuntimeState(...)`
- `src/main.ts`
  - normal `stage-state` and `configureNextRaid(...)` now purge legacy frontline runtime
  - `regression.legacyRuntime`
  - `regression.legacyToggles.playerSideSupportsEnabled = false`
- `scripts/project-cli.mjs`
  - `verify --id legacy-runtime-clean-states`
- manual/wiki updates

### Work

- audit non-projectile or non-killable combatants
- audit old ambient support/incident spawns
- audit hidden overlay surfaces that still update in the background
- audit duplicate wave or extract logic
- audit old equip or stash fallback item pathways
- hard-disable or remove legacy paths that should not ship

### Acceptance

- one runtime truth exists for each critical system
- old codepaths cannot silently reappear in normal play

## Milestone 6. Manual As Contract

### Goal

Make the manual the authoritative stability reference instead of a partial command dump.

### Status

Completed.

Primary outputs:

- `wiki/project-cli.md`
  - explicit supported command categories for:
    - inspect
    - configure
    - force/stage
    - verify
    - showcase/authored review
    - internal/debug-only
  - anti-collapse contract section
  - supported stability workflow order
- `wiki/README.md`
  - milestone note pointing future agents at the manual contract

### Work

Update `wiki/project-cli.md` to clearly separate:

- inspect commands
- configure commands
- force/stage commands
- showcase commands
- verify commands
- deprecated or internal-only commands

Document the anti-collapse rule:

- important systems need inspect + force + verify coverage

### Acceptance

- future agents can use the manual as a trusted contract
- the manual explains how to keep the game stable, not just how to drive it

## Milestone 7. Regression Gate

### Goal

Define the minimum command set that must stay green before risky work lands.

### Status

Completed.

Primary outputs:

- `scripts/project-cli.mjs`
  - `regression-gate`
  - bundled gate over:
    - menu/stash/raid flow
    - equip/loadout flow
    - intel and extract pressure
    - wave targeting and same-room spawn guard
    - doorway chase reliability
    - legacy-path suppression
  - snapshot contract assertions for:
    - front door overlays
    - stash overlays
    - pending reinforcement summary
    - compact extraction truth
    - legacy-runtime disabled state
- `wiki/project-cli.md`
  - regression gate contract
- `wiki/README.md`
  - milestone note

### Work

Create one stability gate made of:

- critical verify commands
- critical snapshot expectations
- a short manual checklist for route and UI integrity

The gate should cover:

- menu/stash/raid flow
- equip/loadout flow
- intel flow
- extraction flow
- wave targeting
- enemy room chase
- legacy-path suppression

### Acceptance

- there is a known pre-merge or pre-ship command gate
- regression-proofing becomes routine instead of reactive

## Recommended First Implementation Order

1. Milestone 1. Command Surface Audit
2. Milestone 2. Inspect Layer Completion
3. Milestone 4. Core Verify Ladder
4. Milestone 3. Force And Stage Layer
5. Milestone 5. Legacy Path Elimination
6. Milestone 6. Manual As Contract
7. Milestone 7. Regression Gate

This order is intentional:

- first know what exists
- then make state visible
- then lock promises
- then improve reproduction power
- then remove bypasses
- then freeze the contract
- then enforce the gate

## First Target Systems

If only a small amount of work can happen immediately, start with these:

- stash/menu/raid state transitions
- extraction hold and countdown
- wave source/target/timer inspection
- enemy doorway chase reliability
- equip path for every weapon class in the stash
- hard kill switch for legacy pseudo-units

## Success Condition

The plan succeeds when the project stops depending on memory, hand-testing, and luck to stay coherent.

The desired outcome is:

- the product loop is inspectable
- risky states are reproducible
- promises are verified
- legacy paths are suppressed
- future agents can extend the game without collapsing it

That is what keeps a complex tactical extraction project alive long enough to become a stable product instead of a promising but fragile build.
