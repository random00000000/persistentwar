# Casualty State Implementation Plan

## Goal

Ship a CLI-first casualty ladder that makes raids produce wounded, downed, rescue, and carry-out stories before polishing the full UI and dialogue follow-through.

## Current Status

Implemented now:

- `healthy -> wounded -> downed -> dead` for Blue, named boys, and enemies
- wounded combat penalties across movement, range, and fire cadence
- player `stabilize` and hostile `finish` CLI actions
- autonomous friendly stabilization of Blue or a downed brother when the lane is not too hot
- autonomous hostile casualty pulls for their own wounded
- post-stabilize `assist` and `carry` behavior in the simulation
- passive AI wound recovery once a wounded unit is clear enough to patch up
- snapshot fields for both `activeRescueTask` and `activeHostileRescueTask`

Still open:

- dedicated drag verb and visuals
- stronger authored showcases for Blue-down carry-out and hostile casualty pull
- dialogue/debrief memory hooks for who rescued or carried whom

## Why This Order

The current project already has combat, squad command, body recovery, and persistent casualty consequence. The safest path is to extend those trusted systems in layers:

1. state and transitions
2. CLI control and snapshot proof
3. squad autonomy and Blue-down command restriction
4. HUD and world feedback
5. dialogue and debrief integration

This keeps the feature testable while avoiding a pretty but fake medical layer.

## Milestone 1: Combat Casualty Ladder

Implement the raw state model in [`src/game/simulation.ts`](C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\topdownextractionshooter\src\game\simulation.ts).

Scope:

- add `healthy | wounded | downed | dead`
- add wound severity
- add bleed-out timers
- split squad `condition` from actual combat casualty state
- make player, squadmates, and enemies transition through the ladder

Acceptance:

- snapshot shows the new state fields
- combatants can become wounded before downed
- downed does not immediately convert to persistent body state

## Milestone 2: Rescue And Finish Interactions

Implement playable rescue verbs.

Scope:

- stabilize
- drag
- carry or assist-walk
- finish downed enemies
- active rescue task state

CLI first:

- extend `action --type ...`
- add at least one authored showcase for friendly rescue and one for enemy finish

Acceptance:

- a squadmate can be stabilized from downed to wounded
- a hostile can be downed and finished
- snapshot exposes active rescue tasks and result state

## Milestone 3: Blue Downed Command Mode

Implement the player-specific degraded-control fantasy.

Scope:

- Blue can become downed without instant hard fail in valid cases
- disable normal gunplay and movement while downed
- preserve reduced squad command access
- allow boys to assist-walk or carry Blue

Acceptance:

- one showcase proves Blue can go down and still reach extraction through squad help
- reduced command mode is readable in CLI and HUD
- this does not behave like a free revive

## Milestone 4: Squad Rescue Autonomy

Make the boys feel like humans, not only order receivers.

Scope:

- rescue heuristics for nearest suitable boy
- refusal under lethal pressure
- rescue barks and short acknowledgment lines
- rescue-aware interpretation of `follow`, `defend`, and `attack`

Acceptance:

- at least one showcase proves a boy begins rescue autonomously
- at least one case shows rescue refusal because the lane is too hot
- the player can still redirect the squad without total puppet control

## Milestone 5: HUD And Playfield Readability

Make the feature legible without reading debug JSON.

Scope:

- wounded/downed markers in squad readouts
- Blue-down restriction banner
- world-space tags for `DOWN`, `DRAGGING`, `CARRYING`, `FINISH`
- posture/rendering differences in `RaidScene`

Acceptance:

- screenshots at `1920 x 1080` clearly show who is wounded, downed, and helping
- no permanent clutter overwhelms the current raid HUD

## Milestone 6: Aftermath And Story Hooks

Tie the combat feature into the existing consequence direction.

Scope:

- debrief summary fields for rescues and carry-out extracts
- memory hooks for who rescued whom
- route/story data to support later dialogue packs
- manual/wiki updates

Acceptance:

- debrief can describe whether Blue or a boy was rescued, carried, or lost
- future story systems have durable data for casualty storytelling

## Initial Tuning Targets

Start conservative.

- `wounded` should happen more often than `downed`
- `downed` windows should be short enough to create pressure
- Blue-down survival should be possible, not routine
- enemy downed rate should be high enough to matter, low enough to avoid cleanup spam

Suggested first-pass tuning goals:

- most serious hits create `wounded` before `downed`
- only a minority of downed cases end in successful rescue without fast action
- stabilizing under direct fire should be risky and usually wrong
- dragging should be faster than carrying, but still clearly exposed

## Verification Plan

Add CLI verification and showcase coverage for:

- wounded-only friendly state
- friendly downed rescue
- Blue-down extract
- hostile downed finish
- partial-autonomy rescue behavior

Minimum evidence set:

- snapshot JSON proving the state transitions
- one screenshot for wounded readability
- one screenshot for Blue-down command mode
- one screenshot for carry or drag readability

## Manual Updates

Before calling the feature complete:

- update [`wiki/project-cli.md`](C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\topdownextractionshooter\wiki\project-cli.md)
- update [`wiki/README.md`](C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\topdownextractionshooter\wiki\README.md)
- add showcase names and example commands

## Main Risks

- If autonomy is too weak, the feature feels like extra babysitting.
- If autonomy is too strong, the player stops feeling like the squad leader.
- If Blue-down has too much agency, it feels gamey.
- If wounded has too little impact, it becomes cosmetic.
- If every enemy goes down too often, finishing becomes repetitive instead of tense.

## First Milestone To Build

Start with `Milestone 1` plus the smallest slice of `Milestone 2`.

That means:

- add the casualty state model
- make squadmates and enemies enter `wounded` and `downed`
- allow a minimal `stabilize` action for friendlies
- allow a minimal `finish` action for hostiles
- expose all of it through `snapshot`

That slice proves the ladder is real before spending time on Blue-down command drama or UI polish.
