# Squad Directional Brace Implementation Spec

## Current Baseline

The current codebase already has the foundations needed for this feature:

- [src/game/scene/RaidScene.ts](/C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/topdownextractionshooter/src/game/scene/RaidScene.ts)
  - player right-click and `Shift` already drive player brace/focus
  - per-boy direct commands already exist on `C / X / V`
- [src/main.ts](/C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/topdownextractionshooter/src/main.ts)
  - modifier tactical inputs already exist for `Alt + G`, `Alt + Click`, and `Alt + V`
  - DOM / agent / snapshot surfaces already expose selected-boy command state
- [src/game/simulation.ts](/C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/topdownextractionshooter/src/game/simulation.ts)
  - squadmates already have base `follow / defend / attack`
  - tactical actions already exist as a generic overlay
  - the player already has real brace/focus behavior and braced-shot projectile effects
  - squadmates already use the shared real weapon, projectile, reload, and line-of-sight runtime

This feature must build on those systems. It must not add a fake brace combat runtime just for boys.

## Design Rules

### Reuse Existing Real Combat Systems

Directional brace must reuse:

- the shared projectile path
- real ammo and reload logic
- real line-of-sight checks
- real weapon stats
- existing or shared braced-shot bonuses where possible

### Stay Separate From Tactical Actions

`Alt + RMB` should not be a one-off tactical action like frag or suppress.

It should be a deeper base command / stance because:

- it is persistent
- it changes how the boy holds a lane
- it should remain active until broken or replaced

### Keep The Model Generic

The command system should be extended generically enough that future agents can add:

- directional watch
- sector hold
- breach stack
- smoke watch
- fallback angle hold

without rewriting the runtime.

## Target Player Verb

Recommended player-facing order:

- `Brace Lane`

Recommended internal command id:

- `brace-watch`

Recommended paired moving order:

- player-facing: `Moving Sector Cover`
- internal id: `move-watch`

## State Additions

Extend the existing per-boy command state to support directional lane holding.

Suggested additions to the selected-boy command model:

- `orderId: "follow" | "defend" | "attack" | "brace-watch" | "move-watch"`
- `anchor`
- `anchorLabel`
- `holdRadius`
- `issuedAtSeconds`
- `watchDirection`
- `watchTarget`
- `watchArcDegrees`
- `braceReadyAtSeconds`
- `braceBrokenReason`
- `movingSectorReadiness`

The important part is that directional brace should live in the same command object as the other persistent orders.

Do not create a separate parallel `overwatchState` tree unless it is purely derived/transient.

## Command Semantics

### Queue Behavior

When `brace-watch` is issued:

1. resolve the selected live boy
2. derive a command origin
3. derive a watch target from the current cursor point
4. compute a normalized watch direction
5. assign a planted anchor
6. store watched lane metadata on the command

When `move-watch` is issued:

1. resolve the selected live boy
2. derive a watch target from the current cursor point
3. compute a normalized watch direction
4. preserve the mobile base state instead of forcing a plant
5. store watched sector metadata on the command

### Runtime Behavior

While `brace-watch` is active:

- the boy prefers to stay planted near anchor
- the boy faces the watched lane
- he primarily acquires enemies inside the watched arc
- he uses a braced firing profile when shooting from stable hold
- he has reduced chase behavior outside the watched lane
- he can break brace under survival pressure, then attempt to restage if still on the same order

While `move-watch` is active:

- the boy keeps his movement/follow behavior
- he biases facing toward the watched sector
- he primarily acquires enemies inside that watched arc
- he gets a smaller ready-fire benefit than `brace-watch`
- he is slower to react to off-sector threats
- he does not receive the full planted brace bonus

### Break Conditions

Brace should break or soften under:

- grenade danger
- severe suppression / panic
- casualty drag or rescue overrides
- forced path correction
- explicit new order

The order itself may stay active even if the braced bonus is temporarily broken. The command should distinguish:

- `moving`
- `planting`
- `braced`
- `broken`

## CLI-First Surface

The feature must be testable before UI polish.

Recommended CLI additions in [scripts/project-cli.mjs](/C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/topdownextractionshooter/scripts/project-cli.mjs):

- `squad-command --id brace-watch --x <world-x> --y <world-y>`
- `squad-command --id move-watch --x <world-x> --y <world-y>`

Recommended semantics:

- target point is the watched lane point
- the command origin is derived from the selected/current squadmate

Optional deeper CLI follow-up if needed:

- `squad-command --id brace-watch --x <target-x> --y <target-y> --anchor-x <anchor-x> --anchor-y <anchor-y>`

The first slice should avoid extra parameters unless needed by implementation reality.

## Manual / Documentation Changes

Update:

- [wiki/project-cli.md](/C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/topdownextractionshooter/wiki/project-cli.md)
- [src/game/controls.ts](/C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/topdownextractionshooter/src/game/controls.ts)
- [wiki/README.md](/C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/topdownextractionshooter/wiki/README.md)

The controls language should present this as:

- `Alt + RMB` `Brace Lane`
- `Ctrl + RMB` `Moving Sector Cover`

## Input / UI Changes

### Input

Recommended live input path:

- `Alt + RMB` in raid
- selected boy receives `brace-watch`
- cursor point becomes watched lane target
- `Ctrl + RMB` in raid
- selected boy receives `move-watch`
- cursor point becomes watched sector target

This should be handled in the same reliable shell/input path currently used for modifier-based boy tactics.

### HUD

Update the `Boys Command` surface to show:

- `Brace Lane` as an active order
- `Moving Sector Cover` as an active order when relevant
- watched lane label
- state like `Planting`, `Braced`, or `Broken`
- or `Moving`, `Covering`, `Pulled Off Sector`

### World Feedback

Add:

- anchor marker
- watched-lane wedge or chevron
- short directional line / sector arc
- visible brace pulse when the order settles

For `move-watch`, use a lighter-weight moving indicator so mobility remains readable.

These should be transient/polished, not debug-heavy.

## Simulation Interactions

### With Weapons

Rifle:

- largest benefit
- strongest long-lane use case

SMG:

- moderate benefit
- strong for short crosses and room-entry lanes

Shotgun:

- strongest at door / stair / corner denial
- little or no gain at long range

### With Existing Orders

`brace-watch` should coexist cleanly with:

- `follow`
- `defend`
- `attack`
- `move-watch`
- `grenade`
- `suppress`

Recommended interaction rule:

- `brace-watch` is the base persistent order
- `move-watch` is also a base persistent order
- tactical actions overlay and then return to the current base order

This mirrors the current tactical-action architecture.

## Acceptance Criteria

The feature is complete when:

- CLI can issue `brace-watch`
- CLI can issue `move-watch`
- live input can issue `Alt + RMB`
- live input can issue `Ctrl + RMB`
- the command persists as a base order
- boys visibly face and hold the watched lane
- boys can visibly move while maintaining watched-sector bias under `move-watch`
- boys use a real braced-fire advantage rather than fake scripted hits
- tactical overlays like frag/suppress return to the brace-watch order
- HUD and world cues clearly communicate watched-lane state
- docs/manual/control references are updated

## Risks

### Too Similar To Defend

If the watched arc is weak or target preference is sloppy, the order will read like `Defend` with extra UI.

### Too Similar To Follow

If `move-watch` does not visibly bias attention and target choice, it will read like normal follow with hidden flavor text.

### Too Sticky

If brace never breaks, it will become a turret cheat instead of a tactical hold.

### Too Fragile

If every small threat breaks brace instantly, players will stop trusting it.

### Too Abstract

If the player cannot read what lane is being watched, the command will feel like hidden logic.
