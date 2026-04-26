# Blue Assisted Fire And Casualty Exfil Implementation Spec

## Goal

Implement the full feature where:

- Blue can still fire in the right conscious rescue states while the boys move him
- the boys commit to a real extraction flow once casualty movement begins
- the system stays generic and simple enough to integrate with existing combat, rescue, and extraction code

## Current Baseline

Current code already has:

- casualty ladder support in [`src/game/simulation.ts`](C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\topdownextractionshooter\src\game\simulation.ts)
- active friendly rescue state with `stabilize`, `assist`, and `carry`
- active hostile rescue state
- basic player movement lock while being rescued
- extraction hold logic that currently assumes the player explicitly starts the uplink

Current gap:

- Blue cannot fire while being assisted or carried
- extraction commitment is still too tied to normal player interaction flow
- rescue and exfil handoff is not explicit enough, so the squad can feel stuck or indecisive

## Design Rules

- Do not invent a one-off carry combat mode disconnected from rescue state.
- Derive Blue's fire permissions from the existing rescue task whenever possible.
- Keep rescue handling and extraction handling distinct, but interoperable.
- Prefer helper functions over scattered conditionals.
- Keep the first implementation generic enough that future systems can query:
  - is Blue being rescued
  - can Blue fire while rescued
  - is casualty extraction active

## Generic State Model

Do not add a giant new bespoke state machine.

Instead, build on the existing `activeRescueTask` and derive:

- `player rescue task`
  - active if `activeRescueTask.targetKind === "player"` and task is not `stabilize`
- `player rescue fire mode`
  - `none`
  - `assisted`
  - `carried`
- `casualty extract active`
  - active if Blue is being moved by the squad toward an extract destination

Minimal new state is acceptable only if it improves integration. Preferred additions:

- `movementPenaltyTimer` on `ActiveRescueTaskState`
  - generic timer for slowing a rescue move when Blue fires

## Simulation Additions

Implement helper functions in [`src/game/simulation.ts`](C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\topdownextractionshooter\src\game\simulation.ts):

- `getActivePlayerRescueTask()`
- `getPlayerRescueFireMode()`
- `getPlayerRescueFireProfile()`
- `isCasualtyExtractActive()`
- `getExtractAtPoint()`
- `tryStartExtractionHold(extract, startedByCasualtyMode)`
- `maybeAutoStartCasualtyExtractionHold()`

### Rescue Fire Profile

The rescue fire profile should control:

- whether Blue can fire
- spread multiplier
- fire-interval multiplier
- optional damage multiplier
- rescue movement penalty when Blue fires
- whether reload is allowed

First-pass profile:

- `none`
  - existing behavior
- `assisted`
  - primary fire allowed
  - heavy spread penalty
  - slower cadence
  - reload blocked
  - grenades blocked
  - medium movement penalty on the rescuer
- `carried`
  - current weapon still allowed for the first pass, but much worse
  - very heavy spread penalty
  - slower cadence
  - reload blocked
  - grenades blocked
  - stronger movement penalty on the rescuer

This keeps the implementation simple and avoids requiring a new sidearm system.

## Extraction Handoff

When a player rescue task has transitioned to `assist` or `carry` and its destination is an extract:

- do not clear the rescue task as soon as the rescuer reaches the destination
- keep the rescue task active while the team is inside the ring
- automatically start the extraction hold if the team reaches a valid extract zone
- then let the existing extraction hold timer run

This prevents the old failure mode where the boys haul Blue to the ring but never behave like a real exfil team.

## Movement Logic

Rescuer movement should already own the casualty pull. Extend it with:

- movement slowdown when Blue fires while rescued
- no slowdown when Blue is not firing
- keep normal AI movement ownership on the rescuer instead of giving Blue fake movement control

This preserves the fantasy:

- Blue fights
- the boys move

## Player Combat Changes

Update the player combat loop so that:

- normal firing is still blocked while `downed on the floor`
- rescue-fire is allowed when the rescue fire profile says so
- reload is blocked while rescue-fire mode is active
- grenades remain blocked while rescue-fire mode is active
- focus mode remains disabled while rescue-fire mode is active

Update `tryFirePlayerWeapon` so rescue-fire applies its own:

- spread multiplier
- cadence multiplier
- movement penalty to the rescue task
- distinct combat message for assisted/carried fire

## CLI And Snapshot Changes

Expose the feature through `snapshot` first.

Add derived raid fields in [`src/main.ts`](C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\topdownextractionshooter\src\main.ts):

- `raid.rescueFireMode`
- `raid.rescueFireEnabled`
- `raid.casualtyExtractActive`
- `raid.activeRescueTask.movementPenaltyTimer`

This gives future agents a stable inspection surface without reading raw simulation branches.

## UI / Phaser Changes

In [`src/game/scene/RaidScene.ts`](C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\topdownextractionshooter\src\game\scene\RaidScene.ts):

- add player-state readability for assisted fire when Blue is being moved
- keep roster rescue tags for `PATCH`, `ASSIST`, `CARRY`
- when Blue is in rescue-fire mode, surface a short readable state like:
  - `ASSISTED FIRE`
  - `CARRIED FIRE`
  - `NO FIRE`

This should be a readable combat-state hint, not a permanent debug panel.

## Documentation Changes

Update:

- [`docs/BLUE_ASSISTED_FIRE_SPEC.md`](C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\topdownextractionshooter\docs\BLUE_ASSISTED_FIRE_SPEC.md)
- [`docs/CASUALTY_EXTRACTION_BEHAVIOR_SPEC.md`](C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\topdownextractionshooter\docs\CASUALTY_EXTRACTION_BEHAVIOR_SPEC.md)
- [`wiki/project-cli.md`](C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\topdownextractionshooter\wiki\project-cli.md)
- [`wiki/README.md`](C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\topdownextractionshooter\wiki\README.md)

## Acceptance Criteria

- Blue can fire while being assisted or carried in the allowed rescue states
- firing while rescued clearly degrades combat quality
- firing while rescued slows the casualty pull
- the boys can auto-commit the extraction hold when hauling Blue into the ring
- the rescue task no longer drops too early when the destination is the extract
- snapshot exposes rescue-fire and casualty-exfil state cleanly
- `npm run build` passes
- CLI showcase/capture still works

## Main Risks

- If the penalties are too soft, rescue-fire becomes an exploit.
- If the penalties are too harsh, the player fantasy disappears.
- If casualty exfil is too implicit, the squad will still feel stuck.
- If too much state is added, the feature will become hard to integrate with future systems.
