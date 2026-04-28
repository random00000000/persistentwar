# Codepath Division And Intent

Date: 2026-04-27

## Why This Note Exists

This project currently has more than one valid runtime/control path.

That is intentional for now, but it is easy for future agents to misunderstand:

- one path exists to keep automation and regression work stable;
- one path exists to let a human play the game live;
- one path exists to let the CLI inject orders into that live play session;
- much older extraction-first paths still exist because this fork inherited the codebase.

This note explains the split plainly and records what the human wants so future work does not blur the paths back together in the wrong way.

## The Human Intent

The desired product behavior is:

- `Frontline Officer` should be an officer-war game first, not an extraction-first game.
- The player should be able to play the live town-war slice in a normal browser tab.
- The CLI should be able to place officer orders into that same live session while the player keeps playing.
- The CLI must not silently reset the live war state when the human is using it as a live companion tool.
- Automation still needs a separate reproducible path that can stage, reset, and verify state safely.

In short:

`Keep shared game logic, but allow different control transports for automation versus live play.`

## The Current Split

There are four important layers to keep separate in your head.

### 1. Shared gameplay logic

This is the real product logic and should remain the single source of truth:

- `src/game/townWar/controller.ts`
- `src/game/townWar/state.ts`
- `src/main.ts`

Examples:

- `orderTownWarTrench(...)`
- `orderTownWarAmmoCrate(...)`
- `orderTownWarDugout(...)`
- `advanceTownWar(...)`

This layer should decide what a trench order means.

It should not care whether the request came from:

- a live mouse click;
- a staged automation script;
- a headless CLI browser;
- a live-session CLI relay.

### 2. Isolated automation path

This is the safe regression path.

Primary files:

- `scripts/project-cli.mjs`
- `window.__topdownExtractionAgentApi` exposed from `src/main.ts`

How it works:

- the CLI opens its own Playwright-controlled browser page;
- it can call the agent API directly;
- many commands intentionally call `stageState("town-war")` first;
- this path is allowed to reset or stage state because repeatability matters more than preserving the current session.

This is the correct path for:

- smoke tests;
- verification;
- reproducible screenshots;
- staged bug repro;
- anti-regression gates.

This path is not the same thing as "control the tab the human is currently playing."

### 3. Live-session relay path

This is the companion-play path.

Primary files:

- `scripts/project-cli.mjs`
- `vite.config.ts`
- `src/main.ts`

How it works:

- the human opens a normal browser tab on the game origin;
- that tab registers itself with the live-agent bridge;
- the CLI still opens its own helper page, but instead of mutating its own runtime, it sends a request through the dev-server relay;
- the live game tab receives the request and executes the same shared gameplay method locally;
- the result is returned to the CLI.

Current intended use:

- `war-order-trench --live-session`

Important rule:

`--live-session` is an active-play transport, not a regression transport.

That means it should avoid hidden staging/reset behavior unless the command explicitly says otherwise.

### 4. Inherited extraction-first paths

These still exist because the fork inherited them.

Primary files:

- `src/game/simulation.ts`
- `src/game/scene/RaidScene.ts`
- extraction and stash surfaces across `src/main.ts`

These systems still provide valuable reusable pieces:

- gun feel;
- projectile behavior;
- suppression texture;
- dialogue/story packs;
- stash and banking substrate;
- verification surfaces.

But they are not the product center anymore.

They should be treated as inherited substrate, not as the truth that the officer-war loop must orbit forever.

## The Important Architectural Rule

The system is allowed to have multiple transports.

It is not allowed to have multiple meanings for the same order.

Good split:

- live click calls shared trench-order logic;
- isolated CLI calls shared trench-order logic;
- live-session CLI relay calls shared trench-order logic.

Bad split:

- live click creates trenches one way;
- automation creates trenches a different way;
- live-session CLI bypasses supply, assignment, or risk logic.

Future agents should preserve this rule:

`Different entry paths are acceptable. Divergent gameplay semantics are not.`

## What Must Stay Different

These differences are intentional and should remain explicit.

### Automation path expectations

- can auto-stage state;
- can reset freely;
- can run headless;
- can make reproducibility-first assumptions;
- should optimize for inspectability and verification.

### Live-session path expectations

- must target the player's actual session;
- must avoid surprise resets;
- should preserve the current battle state;
- should behave like a companion command tool;
- should prioritize "do the requested order in the current war" over "create a fresh test scene."

## What Should Converge Later

The current split is acceptable, but it should converge in a cleaner shape over time.

The desired long-term structure is:

1. One shared officer-war command surface.
2. Multiple thin transports into that surface.
3. Clear docs about which transport is for automation versus live play.

The clean target looks like this:

- shared gameplay command: `order trench at X,Y`
- transport A: live UI click
- transport B: isolated automation CLI
- transport C: live-session CLI relay

The transport should vary.
The game meaning should not.

## Rules For Future Agents

If you touch this area, do not guess. Follow these rules:

1. If the task is automation, preserve the isolated Playwright path.
2. If the task is "while I play," preserve the live-session path and avoid resets.
3. If you add a new live-session command, route it to existing shared gameplay logic instead of inventing a new game-only shortcut.
4. If you add a new automation command, document whether it stages state automatically.
5. If a command can operate in both modes, document the difference plainly.
6. Do not let inherited extraction terminology redefine the product direction.

## Current File Ownership

Use these files as the practical map:

- `src/game/townWar/controller.ts`
  - shared officer-war order meaning
- `src/main.ts`
  - browser agent API and live-tab bridge polling
- `scripts/project-cli.mjs`
  - CLI command grammar, isolated control path, and live-session relay client
- `vite.config.ts`
  - dev-server relay that lets the CLI reach the human's live browser tab
- `wiki/project-cli.md`
  - operational manual for what the CLI promises

## Immediate Product Reading

When making decisions, read these together:

- `docs/PERSISTENT_WAR_OFFICER_FORK_INTENT.md`
- `docs/OFFICER_WAR_CUTOVER_SEAMS.md`
- `docs/CODEPATH_DIVISION_AND_INTENT.md`

Those three documents together explain:

- what the game is trying to become;
- where the inherited seams still are;
- why the runtime/control paths are currently divided;
- what the human expects from that division.
