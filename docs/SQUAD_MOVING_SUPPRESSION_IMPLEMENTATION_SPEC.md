# Squad Moving Suppression Implementation Spec

## Goal

Implement a reusable moving-suppression command for the selected boy on:

- `Ctrl + RMB`

This feature should evolve the current `move-watch` slot into a more explicit covering-fire command rather than introducing a separate conflicting input.

Recommended internal command direction:

- replace or upgrade `move-watch`
- or alias it into a new command id such as `move-suppress`

The player-facing behavior matters more than the final internal name. The important part is that `Ctrl + RMB` becomes a real moving covering-fire verb.

## Current Baseline

The current code already provides most of the needed foundation:

- [src/game/simulation.ts](/C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/topdownextractionshooter/src/game/simulation.ts)
  - per-boy persistent commands already exist
  - `brace-watch` and `move-watch` already exist as directional commands
  - `suppress` already exists as a reusable tactical action
  - squadmates already use the shared real projectile, reload, ammo, LOS, and pressure runtime
- [src/main.ts](/C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/topdownextractionshooter/src/main.ts)
  - modifier mouse input already exists
  - direct-boy DOM surfaces already exist
  - snapshot and agent hooks already expose per-boy command state
- [src/game/scene/RaidScene.ts](/C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/topdownextractionshooter/src/game/scene/RaidScene.ts)
  - world cues already exist for directional lane commands
- [scripts/project-cli.mjs](/C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/topdownextractionshooter/scripts/project-cli.mjs)
  - CLI already supports `squad-order` and `squad-action`

This feature must be built by extending those systems, not by creating a fake moving-fire mode outside the shared combat runtime.

## Design Rules

### Reuse Real Combat

Moving suppression must reuse:

- shared bullet spawning
- real ammo and reloads
- real spread and fire interval
- real line of sight
- real enemy pressure / suppression hooks
- real squadmate movement and command state

It must not create:

- fake suppression auras
- invisible lane-control entities
- a separate "squad-only autofire" combat lane

### Persistent Command, Not Tactical Action

This should be a persistent base order, not a temporary tactical action like frag or static suppress.

Reason:

- it changes how the boy moves
- it should stay active until replaced or broken
- it is part of maneuver, not a one-off utility burst

### Distinct From Existing Static Suppression

Static `suppress` should remain:

- harder pinning
- more anchored
- more committed to one point

Moving suppression should be:

- more mobile
- less wasteful than a mag dump
- less pin-heavy than static suppress
- better at escorting movement and crossings

## Recommended Command Model

Preferred internal command shape:

- `brace-watch`
- `move-suppress`

If maintaining backward compatibility is easier, `move-watch` may remain the stored id temporarily, but its behavior and presentation should be upgraded to the moving-suppression spec.

Recommended command metadata additions or reuse:

- `watchTarget`
- `watchDirection`
- `watchArcDegrees`
- `anchor`
- `holdRadius`
- `issuedAtSeconds`
- `coveringFireCadence`
- `coveringFireBurstSize`
- `coveringFireRangeBias`
- `suppressionTargetRadius`
- `coveringFireBrokenReason`

Only persist what the runtime truly needs. Do not inflate command state with decorative fields.

## Runtime Behavior

While moving suppression is active:

1. the boy preserves his movement/follow anchor
2. he biases facing toward the selected suppression target or watched lane
3. he prefers enemies inside that watched sector
4. he fires controlled short bursts while moving when:
   - the enemy is in-sector
   - LOS is acceptable
   - movement pace is controlled enough
5. he stays weaker against off-sector threats
6. he should avoid turning into chase behavior
7. if the movement becomes too unstable, accuracy and cadence degrade instead of granting the full benefit

## Controlled Fire Rules

The command must not feel like:

- full-auto mag dump
- static suppress while jogging
- attack-chase with a cone

Recommended behavior:

- shorter, rhythmic bursts
- slightly slower cadence than panic spray
- smaller spread benefit only when the actor is moving in control
- reduced or no benefit when sprinting, over-rotated, or dragged off-lane

Suggested first-pass tuning intent:

- better than ordinary moving fire into the selected lane
- worse than planted watch
- more ammo-efficient than static suppress
- enough pressure to buy maneuver time without deleting the whole lane for free

## Targeting Rules

Moving suppression should prioritize:

1. visible enemies inside the selected sector
2. near-visible threats about to cross from that sector
3. very close emergency threats

It should de-prioritize:

- distant off-sector targets
- targets that pull the boy too far away from the movement path
- weak bait targets outside the commanded lane

Emergency fallback should remain narrower than the current generic fallback, because the point of this command is committed attention.

## Movement Rules

While moving suppression is active:

- the boy should keep progressing with the maneuver
- if in-sector contact appears, he can slightly slow or tighten to cover the move
- he should not freeze like planted watch
- he should not fully break into chase

Recommended behavior:

- keep leaning toward anchor / follow path
- temporarily reduce movement pace when firing controlled bursts
- resume full movement when the immediate in-sector contact window passes

## CLI-First Surface

The feature should be testable before UI polish.

Recommended CLI path:

- `select-boy --index <n>`
- `squad-order --id move-suppress --x <world-x> --y <world-y>`

If backward compatibility is needed for existing automation:

- allow `squad-order --id move-watch --x <world-x> --y <world-y>`
- document that it now resolves to moving suppression / covering fire

## Snapshot Changes

Snapshot should expose enough to verify the command:

- active order id
- watch target
- watch direction
- watch arc
- command age
- optionally a lightweight moving-cover state such as:
  - `covering`
  - `crossing`
  - `broken`

Do not add a second snapshot tree for this if the command object can already carry the needed state.

## Input Changes

`Ctrl + RMB` in raid should:

- resolve selected live boy
- resolve the world point
- queue moving suppression for that point
- suppress browser context-menu behavior
- stop propagation when consumed

The direct-boy DOM card should eventually present this with a visible label such as:

- `Move Suppress`
- `Covering Move`

## HUD / World Feedback

Minimum requirements:

- active command title on the selected-boy HUD
- target label
- moving sector or lane cue in-world
- visible distinction from planted watch

Recommended differences from planted watch:

- lighter wedge or lane line
- moving target lead / dashed line instead of planted anchor pulse
- short comms line that clearly says this is movement cover, not a hard hold

## Documentation Changes

Update:

- [src/game/controls.ts](/C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/topdownextractionshooter/src/game/controls.ts)
- [wiki/project-cli.md](/C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/topdownextractionshooter/wiki/project-cli.md)
- [wiki/README.md](/C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/topdownextractionshooter/wiki/README.md)

Also update the directional-brace spec package later so it no longer describes `Ctrl + RMB` as only passive moving sector cover.

## Acceptance Criteria

The feature is complete when:

- `Ctrl + RMB` is a real moving suppression / covering-fire command
- the boy keeps moving instead of planting
- he fires controlled bursts into the selected lane
- off-sector pull is meaningfully weaker
- the behavior is clearly distinct from `brace-watch`, `attack`, and static `suppress`
- the CLI can issue and verify the command
- HUD and world cues explain the state clearly enough for playtesting

## Risks

### Too Close To Attack

If the boy chases or over-rotates too much, the command becomes a dressed-up attack order.

### Too Close To Static Suppress

If the boy mostly stops and hoses the point, this becomes static suppress with extra steps.

### Too Little Payoff

If the command does not buy real maneuver time, the player will not use it.

### Too Much Free Value

If the boy gets strong accuracy and pressure while moving at full pace, the command collapses tactical tradeoffs.
