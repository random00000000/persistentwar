# Blue Casualty Exfil Reliability Implementation Spec

## Goal

Implement a reliable squad-led extraction flow where:

- the boys can carry Blue to extraction while he is downed
- the boys can keep trying to extract Blue even after he bleeds out
- the extraction system is owned by generic helpers instead of one-off Blue exceptions

## Problem

The current casualty exfil feature already allows rescue and carry, but reliability is still too weak in two places:

- extraction hold ownership still reads too much like `Blue must personally be in the ring`
- Blue bleedout can collapse the raid too early instead of transitioning into `body extraction attempt`

That makes the boys feel stuck or unreliable even when carry movement exists.

There is also a fight-shape problem:

- early raid hits can still feel too binary, especially when Blue or a brother crosses straight from `healthy` to `dead-floor logic`
- casualty extraction can fail at the edge of the ring because the carrier anchor is too exact

That weakens the intended first impression of the game. The lane should more often produce `wounded -> downed -> rescue/extract` stories before it produces a hard collapse.

## Design Rules

- Do not build a separate bespoke `dead body extraction` subsystem.
- Reuse the existing `activeRescueTask` as the authoritative casualty movement state.
- Derive extract ownership from the rescuer when Blue is being carried.
- Let Blue transition from `downed` to `dead` without instantly erasing the extraction attempt.
- Failure should happen when the extraction attempt truly collapses, not when Blue merely crosses from conscious casualty to dead weight.

## Generic State Model

Keep the feature queryable through small derived questions:

- `is there a live player rescue task`
- `is that rescue task targeting an extract`
- `who owns the extraction anchor right now`
- `can the squad still attempt player extraction`
- `is Blue still conscious enough to fire`

Minimal derived reads:

- `casualtyExtractActive`
- `casualtyExtractMode`
  - `none`
  - `assist`
  - `carry`
  - `body-carry`
- `casualtyExtractOwner`
- `rescueFireEnabled`

## Required Simulation Helpers

Add and use helpers in [`src/game/simulation.ts`](C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\topdownextractionshooter\src\game\simulation.ts):

- `getNearbyExtractForPoint(point)`
- `hasLivingSquadMateForPlayerExtraction()`
- `getCasualtyExtractTask()`
- `getExtractionHoldAnchorPosition()`
- `continuePlayerBodyExtractionAttempt()`
- `maybeFailCollapsedPlayerExtraction()`

These helpers should stay generic enough for future dialogue, memories, and HUD work.

## Extraction Ownership Rules

When Blue is being moved by a squadmate toward an extract:

- extraction hold should be evaluated from the rescuer position, not Blue's personal locomotion state
- auto-start of the extraction hold should also use the rescuer position
- if Blue is downed or dead and there is no active casualty carry, extraction hold should not progress

This is the core reliability fix.

Reliability polish:

- casualty extraction should get a small ring-forgiveness buffer so carriers do not fail the hold because of pixel-perfect edge checks
- if a casualty carrier drifts just outside the ring, the hold should bleed more slowly than a normal solo extract slip

## Bleedout Transition Rules

When Blue is `downed` and bleedout reaches zero:

- set Blue to `dead`
- do not instantly fail if at least one squadmate is still alive
- preserve or promote the current player rescue task into `carry`
- if no rescue task is active, allow autonomous squad rescue logic to pick up Blue's body
- only fail immediately if no living squadmate remains to keep the attempt alive

## Autonomous Squad Rescue Rules

Friendly auto rescue must now support two player casualty cases:

- `downed player` -> start `stabilize`
- `dead player` -> start `carry`

This should be implemented through the same auto-rescue target selection path, with a desired rescue task attached to the target.

Reliability bias:

- if Blue is downed or dead, the boys may override `attack` posture to prioritize rescue
- if the current carrier dies and other boys are still alive, they should be able to reacquire Blue as a rescue target
- player rescue should tolerate hotter lanes than normal squadmate rescue, especially for body carry

## Opening Fight Reliability

The casualty system should also shape the opening minutes of a raid so the first strong impression is not an instant kill:

- apply a short opening-engagement leniency window to hostile damage against Blue and squadmates
- let combatants enter `downed` from a low-health threshold instead of requiring literal zero
- keep this generic through small helpers instead of bespoke `first raid` scripts

The target feeling is:

- Blue takes a bad trade
- Blue or a boy becomes wounded and then downed
- the boys try to stabilize or carry
- extraction pressure becomes the story instead of a binary fail screen

## Combat Permissions

Conscious casualty fire stays unchanged in spirit:

- `downed + assist/carry while conscious` can still allow degraded fire
- `dead + carry` never allows fire

That means rescue-fire logic must explicitly shut off when Blue is dead even if the rescue task still says `carry`.

## Completion And Failure Outcomes

Success reasons should reflect what actually happened:

- normal extract
- Blue extracted while downed
- Blue extracted dead by the squad

Failure should reflect collapse:

- Blue bled out and nobody was left to carry him
- Blue was dead and the last boy fell before they could finish the pull

## CLI / Snapshot Surface

Expose stable reads in [`src/main.ts`](C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\topdownextractionshooter\src\main.ts):

- `raid.casualtyExtractActive`
- `raid.casualtyExtractMode`
- `raid.casualtyExtractOwner`
- `raid.playerActionMode`
- `raid.rescueFireMode`
- `raid.rescueFireEnabled`

These are the fields future agents should rely on first.

## Verification

Add a deterministic authored showcase and verification path for dead-body extraction:

- showcase id: `blue-body-extract`
- verify id: `blue-body-extract`

The verify path should prove:

- Blue is dead
- squad-led casualty exfil is active
- rescue fire is disabled
- extraction hold is still running under squad ownership

## Acceptance Criteria

- the boys can carry downed Blue into the ring and progress extraction from the carrier position
- if Blue bleeds out mid-rescue, the raid does not instantly hard-fail while a boy is still alive
- dead-body extraction attempts can continue until the squad is wiped or the extract succeeds
- auto rescue can reacquire Blue after a carrier dies
- player rescue starts more often because player-casualty rescue tolerates a slightly hotter lane than generic ally rescue
- Blue and squadmates can enter `downed` from critical low health instead of only literal zero
- the opening minute of a raid is more likely to create a rescue story than an instant wipe
- dead Blue cannot fire even if the carry task remains active
- success/failure summaries reflect the casualty outcome
- snapshot and CLI verification expose the feature cleanly
