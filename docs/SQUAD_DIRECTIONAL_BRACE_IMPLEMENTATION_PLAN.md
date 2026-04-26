# Squad Directional Brace Implementation Plan

## Goal

Ship a two-part directional attention family:

- `Alt + RMB` `Brace Lane`
- `Ctrl + RMB` `Moving Sector Cover`

Both should create real lane-control mastery and compose cleanly with existing `Defend`, `Attack`, `Suppress`, and `Frag` commands.

## Why This Order

This should be built as a persistent command first, not as a cosmetic input layer.

The right sequence is:

1. command/state model
2. CLI path
3. simulation behavior
4. live input
5. HUD/world readability
6. tuning

That keeps the feature testable and prevents a fake UI-first implementation.

## Milestone 1: Command Model

### Work

- extend per-boy command state with `brace-watch` and `move-watch`
- add watched-lane metadata
- define planted and moving directional sub-states
- define resume behavior after tactical overlays

### Acceptance

- runtime can store and persist `brace-watch` and `move-watch`
- command survives normal update ticks
- no parallel ad hoc state tree is needed

## Milestone 2: CLI Surface

### Work

- add `squad-command --id brace-watch --x --y`
- add `squad-command --id move-watch --x --y`
- route through the same selected-boy command surface
- expose the new command in snapshot/manual text

### Acceptance

- CLI can place planted or moving watched sectors on the selected boy
- snapshot shows the command, watched target, and readiness state
- manual documents the command

## Milestone 3: Core Simulation Behavior

### Work

- resolve watch direction
- plant the boy near anchor for `brace-watch`
- keep the boy mobile with sector bias for `move-watch`
- bias target acquisition to the watched arc
- suppress off-lane chase
- add break/recover behavior

### Acceptance

- boys visibly hold and watch the selected lane under `brace-watch`
- boys visibly move with directional bias under `move-watch`
- they do not drift into generic defend behavior
- they do not full-chase like attack

## Milestone 4: Braced Fire Reuse

### Work

- connect `brace-watch` to existing/shared braced-shot logic
- add a smaller readiness profile for `move-watch`
- tune per-weapon planted vs moving benefits
- preserve real ammo, reload, and LOS rules

### Acceptance

- rifle planted brace feels strongest on long lanes
- moving sector cover still helps rifles on crossings and field edges
- shotgun planted brace feels best on close thresholds
- SMG moving sector cover feels useful on short crossings
- no fake hit or damage path is introduced

## Milestone 5: Live Input

### Work

- bind `Alt + RMB`
- bind `Ctrl + RMB`
- route through the same reliable browser/raid input path used by current modifier commands
- add duplicate-input protection

### Acceptance

- one `Alt + RMB` issues one reliable planted-watch order
- one `Ctrl + RMB` issues one reliable moving-sector order
- no accidental command leakage from HUD clicks
- existing `RMB` player brace still works cleanly

## Milestone 6: Readability

### Work

- add brace-lane world cue
- add moving-sector cue
- add planted/lining-up/braced/broken HUD read
- add moving/covering/pulled-off-sector HUD read
- add squad barks
- update briefing/control references

### Acceptance

- player can tell which lane is being watched
- player can tell whether the boy is planted or moving-sector-cover
- player can tell whether the boy is truly braced or still settling
- the command reads in-world, not only in a side panel

## Milestone 7: Tactical Interlock Tuning

### Work

- verify `brace-watch` plus `suppress`
- verify `brace-watch` plus `frag`
- verify `move-watch` while crossing or advancing with the player
- verify `brace-watch` in room holds and extraction screens
- tune planted vs moving benefits, break thresholds, and watched arc width

### Acceptance

- the command creates useful combinations
- it adds mastery rather than just another static stance
- it produces stronger room-control stories over repeated play

## Initial Tuning Values

These are starting points, not final balance:

- watch arc: `50-70` degrees depending on weapon
- brace settle time: `0.2-0.45s`
- moving-sector arc: slightly wider than planted watch
- moving-sector bonus: clearly weaker than planted brace
- off-lane reaction penalty: noticeable but not total blindness
- break on grenade danger: immediate
- rifle brace bonus: strongest accuracy / first-shot stability
- SMG brace bonus: modest spread tightening
- shotgun brace bonus: threshold readiness and tighter short spread

## Risks

### Boring Version

If this becomes just a small hidden accuracy buff, it will not deepen the game.

### Watered-Down Version

If `move-watch` turns into generic passive autofire while moving, it will flatten the fantasy instead of deepening it.

### Friction-Heavy Version

If placement or facing requires too much micro, players will avoid it.

### Best-Answer Version

If brace-watch dominates defend in all cases, the command layer gets flatter instead of deeper.

### Visual-Clutter Version

If the world cue is too large or permanent, it will feel like debug UI instead of a real combat read.

## First Build Recommendation

The first implementation slice should be:

1. add `brace-watch` and `move-watch` command state
2. add CLI commands
3. bias lane facing and target acquisition
4. reuse planted braced projectile benefit and add weaker moving readiness profile
5. add minimal world cue
6. bind `Alt + RMB` and `Ctrl + RMB`

That is the smallest slice that can already feel deep and immediately test the fantasy.
