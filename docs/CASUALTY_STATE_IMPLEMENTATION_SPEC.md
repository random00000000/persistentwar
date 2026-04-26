# Casualty State Implementation Spec

## Purpose

This spec extends the existing squad condition, casualty recovery, persistent body, and dialogue baseline into a full `wounded -> downed -> dead` combat ladder.

The implementation must stay aligned with the current project direction:

- top-down readability first
- squad-led combat, not solo arcade flow
- extraction consequence as the main payoff
- CLI-first validation before UI completion

## Current Code Baseline

The current codebase already has several useful anchors:

- [`src/game/simulation.ts`](C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\topdownextractionshooter\src\game\simulation.ts): owns raid state, squadmate state, enemy state, body persistence, casualty records, frontline incidents, and dialogue packet triggers.
- [`src/game/scene/RaidScene.ts`](C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\topdownextractionshooter\src\game\scene\RaidScene.ts): owns live raid rendering, transient playfield feedback, and command/readability surfaces.
- [`src/main.ts`](C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\topdownextractionshooter\src\main.ts): owns DOM-side HUD and stash/debrief reads that already expose squad conditions, casualties, and next-push recommendations.
- [`scripts/project-cli.mjs`](C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\topdownextractionshooter\scripts\project-cli.mjs) and [`wiki/project-cli.md`](C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\topdownextractionshooter\wiki\project-cli.md): already expose `snapshot`, `select-boy`, `squad-order`, `showcase`, and body-recovery workflows.

Current relevant baseline details:

- `SquadMateState.condition` currently uses `steady | heated | critical`.
- Fallen squad and enemy body state already exist.
- Active squad body recovery already exists.
- Dialogue already has `mate-down`, `body-sighted`, and `body-recovery` event kinds.
- Roster aftermath already tracks `woundedRaids`, casualty records, memorial debt, and body recovery debt.

This means the new feature should extend existing combat/consequence surfaces instead of replacing them.

## Design Rules

- `Condition` and `casualty state` are different concepts.
- `Condition` remains a squad strain/comms read if useful, but `wounded/downed/dead` becomes the authoritative combat state.
- Every combatant type needs the same broad ladder, but not identical behavior.
- Blue and the boys should have richer rescue/extraction logic than enemies.
- Rescue decisions must remain readable from the playfield and the CLI.
- Downed Blue must reduce control, not silently preserve full power.

## State Additions

Add a shared combat casualty model for player, squadmates, and enemies.

## New Types

Add a combatant casualty state layer, for example:

```ts
type CombatCasualtyState = "healthy" | "wounded" | "downed" | "dead";
type DownedMobility = "none" | "crawl" | "assist-walk" | "carry-only";
type RescueTaskKind = "stabilize" | "drag" | "assist-walk" | "carry" | "finish";
```

Add a wound severity read, for example:

```ts
type WoundSeverity = "light" | "moderate" | "severe";
```

## Player State

Extend player raid state with:

- `casualtyState`
- `woundSeverity`
- `bleedoutTimer`
- `stabilized`
- `canIssueCommands`
- `commandRestrictionMode`
- `assistedBySquadMateId | null`
- `carriedBySquadMateId | null`
- `extractedAliveWhileDowned`
- `bodyExtracted`

## SquadMateState Additions

Extend `SquadMateState` with:

- `casualtyState`
- `woundSeverity`
- `downedMobility`
- `bleedoutTimer`
- `stabilized`
- `needsAssist`
- `beingHelpedById | null`
- `helpingTargetId | "player" | null`
- `autoRescueIntent`
- `lastRescuerId | "player" | null`
- `lastDownedByEnemyId | null`

Do not overload `condition` with these meanings.

## EnemyState Additions

Extend enemy state with:

- `casualtyState`
- `woundSeverity`
- `bleedoutTimer`
- `stabilized`
- `recoverableByAllies`
- `beingRecovered`
- `finished`

## Recovery Task State

Generalize the current body recovery action into a live casualty interaction task system.

Add an active rescue task structure, for example:

```ts
interface ActiveRescueTaskState {
  actorKind: "player" | "squad";
  actorId: string;
  targetKind: "player" | "squad" | "enemy";
  targetId: string | number;
  task: RescueTaskKind;
  duration: number;
  timer: number;
}
```

This can coexist with current `ActiveSquadBodyRecoveryState` during migration, then replace it once stable.

## Command State Additions

Extend squad command surfaces with rescue-aware intent:

- `follow`
- `defend`
- `attack`
- future contextual overlays for `help`, `drag`, `carry`, `finish`

The first implementation does not need to expose all of those as permanent top-level command IDs. It can begin with contextual rescue decisions layered on top of the existing three-command system.

## AI / Simulation Behavior

## Wounded Transition Rules

Combatants should enter `wounded` before `downed` when damage is serious but not fully incapacitating.

Wounded should affect:

- movement speed
- aim quality or target lock stability
- aggression confidence
- willingness to cross open ground
- command obedience sharpness

For squadmates, wounded should also bias autonomy:

- prefer shorter cover hops
- resist suicidal pushes
- speak up when the command is bad

## Downed Transition Rules

A downed combatant:

- stops normal weapon use
- may crawl within a small radius if allowed
- starts bleed-out pressure
- advertises rescue or finish opportunity

Blue and squadmates should support:

- transition from `downed` to `wounded` if stabilized
- transition from `downed` to `dead` if bleed-out completes or they are finished

Enemies should support:

- transition from `downed` to `dead` by bleed-out, finish, or later enemy recovery resolution

## Squad Rescue Autonomy

Squad autonomy should be rule-based, not fully random.

Good rescue triggers:

- nearest boy is on `follow` and lane pressure is low enough
- downed target is Blue
- downed squadmate is within a defend pocket the squad is already contesting
- no immediate grenade or point-blank hostile threat blocks the rescue

Good rescue blockers:

- lane is too hot
- rescuer is already `wounded severe` or near collapse
- player has explicitly ordered `hold` on a critical firing lane

The AI should feel human:

- sometimes a boy starts the rescue before being asked
- sometimes he barks refusal because the lane is suicidal
- sometimes he drags first and stabilizes second because the ground is too hot

## Downed Blue Command Restrictions

When Blue is downed:

- disable normal movement and gunplay
- keep a reduced command layer
- preserve squad selection if possible
- allow high-value battlefield calls only

Recommended first reduced commands:

- select boy
- `follow`
- `defend`
- `attack`
- contextual `help Blue`
- contextual `extract`

The first version can reuse the existing squad command surface while Blue is downed, as long as direct shooting control is clearly removed.

## Enemy Finish / Recovery Rules

Downed enemies should:

- remain visible as alive or unresolved
- allow player or squad finishing at close range
- optionally allow hostile recovery in future expansions

MVP behavior can be:

- downed enemy bleeds out on a timer unless finished
- player or squad can finish instantly at close range

Follow-up behavior can add:

- ally recovery drags
- enemy evac vehicles
- surrender crossover

## CLI Changes

The feature must be testable from the CLI before UI completion.

## Snapshot Additions

Extend `snapshot` with:

- `raid.player.casualtyState`
- `raid.player.woundSeverity`
- `raid.player.bleedoutTimer`
- `raid.player.commandRestrictionMode`
- `raid.player.helpStatus`
- `raid.squadMates[*].casualtyState`
- `raid.squadMates[*].woundSeverity`
- `raid.squadMates[*].bleedoutTimer`
- `raid.squadMates[*].helpStatus`
- `raid.enemies[*].casualtyState` for sampled or nearby enemies
- `raid.activeRescueTasks`
- `raid.downedHostilesNearby`
- `raid.downedFriendliesNearby`

## New CLI Commands

Add at least these commands or equivalents:

- `raid-action --type stabilize`
- `raid-action --type finish`
- `raid-action --type drag`
- `raid-action --type carry`

If a generic `action --type` path is preferred, extend the existing surface there instead of adding a parallel CLI family.

Add showcase and verification support for:

- `showcase --id casualty-ladder`
- `showcase --id blue-downed-extract`
- `showcase --id hostile-finish-window`

## CLI Acceptance Surface

Agents must be able to prove:

- a squadmate can become wounded without immediately dying
- a squadmate can become downed and be stabilized
- Blue can go down and still issue reduced squad orders
- a hostile can become downed and then be finished

## Manual / Documentation Changes

Update [`wiki/project-cli.md`](C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\topdownextractionshooter\wiki\project-cli.md) with:

- new snapshot fields
- new raid actions
- new showcases
- one end-to-end casualty workflow example

Update [`wiki/README.md`](C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\topdownextractionshooter\wiki\README.md) to index the new casualty-state docs.

## UI Changes

## Raid HUD

Add readable casualty state on existing squad readouts:

- wounded marker
- downed marker
- bleed-out urgency
- who is helping whom
- Blue downed command restriction banner

Keep permanent UI minimal. Do not turn the HUD into a medical spreadsheet.

## World-Space Feedback

Add transient battlefield feedback:

- short collapse flash when someone goes down
- brief state tag over combatants: `WOUNDED`, `DOWN`, `DRAGGING`, `CARRYING`
- rescue progress ring or bar near the actor pair
- special Blue-down cue that is readable without consuming the whole screen

## Scene Rendering

Update [`src/game/scene/RaidScene.ts`](C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\topdownextractionshooter\src\game\scene\RaidScene.ts) to render:

- wounded versus downed posture differences
- drag/carry offsets between rescuer and casualty
- enemy downed readability distinct from a fully dead body

## Dialogue / Storytelling System Interactions

The existing dialogue system already supports `mate-down` and `body-recovery`. Extend the packet/memory model later with casualty-story events such as:

- `mate-wounded`
- `player-downed`
- `rescued-mate`
- `rescued-blue`
- `enemy-finished`
- `carry-extract`
- `left-downed-behind`

This does not need to ship in the first playable implementation, but the state model should preserve enough facts to support it later.

Minimum stored hooks:

- rescuer
- casualty
- location
- alive/dead at extract
- body extracted yes/no
- enemy finished yes/no

## System Interactions

This feature must interact cleanly with:

- body recovery persistence
- stash casualty consequence
- extract decision pressure
- squad commands
- dialogue memories
- future surrender and evac beats

Important rule:

`downed` should flow into the existing persistent-body system only when death is actually confirmed.

## Acceptance Criteria

- The raid simulation supports `healthy -> wounded -> downed -> dead` for player, squadmates, and enemies.
- `Wounded` changes combat behavior in a readable way.
- `Downed` creates a rescue or finish window.
- Blue can enter a reduced-command state instead of always hard-failing instantly.
- Squadmates can autonomously attempt rescue when conditions are credible.
- Downed enemies can be finished.
- Snapshot and CLI flows expose the new state clearly.
- The playfield communicates casualty transitions without requiring debug-only panels.

## Risks

- Too much friction: if every casualty requires too many clicks, the feature becomes a chore.
- Fake depth: if wounded only means smaller numbers, the player will not feel the difference.
- No tension: if Blue downed is too forgiving, the feature becomes a free extra life.
- Too punishing: if rescue is rarely viable, the system collapses into delayed death.
- Debug feel: if the state is only legible in JSON and side cards, the feature fails on the battlefield.
