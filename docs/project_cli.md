# Project CLI Manual

The project CLI is the stable agent-facing control surface for top-down game state and playtesting.  
It talks to the browser game through the runtime agent API exposed on `window.__topdownExtractionAgentApi`.

## Frontline Officer Fork Note

This manual describes the inherited extraction-shooter CLI surface. For
`frontline-officer`, use it as migration tooling while building the first-town
officer-war loop. The API name remains inherited until the runtime is renamed.

Use the fork's dedicated dev server when possible:

```bash
npm run game:cli -- status --url http://127.0.0.1:5847
```

## Prerequisites

- Node.js and dependencies installed (`npm install`)
- Game CLI entrypoint available at `scripts/project-cli.mjs`
- Dedicated fork dev port is `5847` (`http://127.0.0.1:5847`)

## Command usage

All commands are executed as:

```bash
npm run game:cli -- <command> [options]
```

Global options:

- `--url <http://host:port>` to reuse an existing dev server.
- `--timeout <ms>` server startup timeout when auto-launching (default: 15000).
- `--route <route-id>` staged route
- `--weapon <weapon-id>` staged weapon
- `--support <service-id>` staged tactical service
- `--contract <contract-id>` staged contract
- `--medkits <count>` staged medkits
- `--ammo-packs <count>` staged ammo packs
- `--top-tab <tab-id>` stash top tab
- `--command-tab <tab-id>` planning/command tab
- `--output <path>` screenshot output for commands that support capture

## Town war / officer orders

These commands drive the first-town officer-war slice. They stage `town-war` automatically, mutate town war state, and return JSON with an `ok` flag plus a short `summary` string intended for quick agent feedback (supply impact, assigned soldier, lane assignments, or applied ticks).

The town-war snapshot also exposes the first emergent war drama inspect surface:

- `war.dialogue.lastDramaEvent`
- `war.dialogue.recentDramaEvents`
- `war.dialogue.activeOfficerWarTags`
- `war.dialogue.activeScarTags`
- `war.dramaMemories`
- `war.aiThreats.playerThreatShare`
- `war.aiThreats.frontlineFocus`
- `war.townWar.soldiers[*].targetIntent`
- `war.aiTactics.coverSlots`
- `war.aiTactics.suppressionFields`
- `war.townWar.soldiers[*].tacticalIntent`
- `war.townWar.soldiers[*].coverIntent`
- `war.aiTactics.tacticalPairs`
- `war.aiTactics.completedConstructionImpact`
- `war.locationScars`
- `war.focusedLocationScar`
- `war.dramaBeat.current`
- `war.dramaBeat.chain`
- `war.dramaBeat.lastPayoff`
- `war.debriefEchoes`
- `war.storyPackAudit`
- `war.soldiers[*].dramaMemoryTags`
- `war.soldiers[*].witnessedEventCount`
- `war.soldiers[*].dramaArc`
- `war.soldiers[*].trustInOfficer`
- `war.soldiers[*].relationshipPressure`

Build orders, risky builder movement, construction completion, ammo crate depletion/destruction, casualty pressure, and camp damage can update these fields.
Cause/witness/responsibility memory is also inspectable: repeated risky orders can now produce a later line with `referencedMemoryTag` pointing at the earlier officer-caused event.
Long-haul character arc pressure is inspectable too: repeated officer-cost or officer-helped memories can shift trust, resentment, guilt, confidence, and relationship pressure, then bias later dialogue toward arc-specific callbacks.
Location-scar memory is inspectable as a battlefield ledger: repeat orders or fights near the same lane can activate scar tags like `builder-hit-here`, `trench-saved-line`, `ammo-ran-dry`, or `camp-shelled` and bias the next line toward scarred-town callbacks.
The cinematic beat director is inspectable through `war.dramaBeat` and `war.debriefEchoes`: setup, complication, cost, payoff, aftermath, reversal, and echo beats are derived from real drama events and can tune dialogue pacing without scripting the outcome.
Story-pack authoring health is inspectable through `war.storyPackAudit`, including duplicate-id errors, missing-speaker warnings, memory-tag validation, line-length warnings, and content totals grouped by story family.

### `war-quickstart`

Seeds a demo town-war and prints camp health.

```bash
npm run game:cli -- war-quickstart
npm run game:cli -- war-quickstart --side camp-b
```

### `war-deploy-officer`

Deploy the officer to a camp spawn point (useful for verifying side selection and camp-based entry).

```bash
npm run game:cli -- war-deploy-officer --id camp-a
```

### `war-reinforce`

Spawn reinforcements for a camp at its spawn point. Use `--damage-before` to prove that camp destruction blocks spawning.

```bash
npm run game:cli -- war-reinforce --id camp-a --role rifleman --count 2
npm run game:cli -- war-reinforce --id camp-a --role rifleman --count 1 --damage-before 2000
```

### `war-order-trench`

Place a trench build order for a camp. Optionally pass `--x/--y` world coordinates.

```bash
npm run game:cli -- war-order-trench --id camp-a
npm run game:cli -- war-order-trench --id camp-b --x 520 --y 340
```

### `war-order-ammo-crate`

Place an ammo crate build order for a camp. Optionally pass `--x/--y` world coordinates.

```bash
npm run game:cli -- war-order-ammo-crate --id camp-a
npm run game:cli -- war-order-ammo-crate --id camp-b --x 610 --y 312
```

### `war-order-dugout`

Place a dugout rally/shelter build order for a camp. Dugouts connect nearby trench slots, pull defenders toward the line, give wounded or pinned soldiers a fallback shelter, and can be damaged.

```bash
npm run game:cli -- war-order-dugout --id camp-a
npm run game:cli -- war-order-dugout --id camp-a --x 6027 --y 3213 --facing 3.14159 --advance-seconds 60
npm run game:cli -- war-dugout-report
npm run game:cli -- war-damage-dugout --id town-war-dugout-1 --amount 55
```

### `war-focus-lane`

Order a camp to focus a lane (`north|mid|south`).

```bash
npm run game:cli -- war-focus-lane --id camp-a --lane mid
```

### `war-advance`

Advance the town war simulation for a short window so soldiers can react.

```bash
npm run game:cli -- war-advance --seconds 12
npm run game:cli -- war-advance --seconds 8 --tick-seconds 0.2
```

### `war-operation`

Prepare and inspect the first persistent operation cycle for the Russian player camp. These commands expose the protected stockpile, committed camp supplies, carried soldier records, and debrief recommendations.

```bash
npm run game:cli -- war-operation prepare --ammo 220 --build 220 --food 180 --med 90
npm run game:cli -- war-operation start
npm run game:cli -- war-operation end
npm run game:cli -- war-operation report
```

The snapshot exposes `war.operation` and `war.townWar.operation`. A debrief carries named Russian soldier fatigue, wounds, memory tags, and camp supply shortages into the next operation. Build supply now also contributes to construction speed, so low stockpile operations build worse even when the order itself is accepted.

### `status`

Read a live snapshot of current game state (phase, stash, route, player health, ammo, frontline, and options).

```bash
 npm run game:cli -- status
npm run game:cli -- status --url http://127.0.0.1:5847
```

### `list`

Print the option sets only (`routes`, `weapons`, `tacticalServices`, `contracts`, tabs, and showcases).

```bash
npm run game:cli -- list
```

### `telemetry`

Get dedicated runtime telemetry focused on combat performance, actor counts, and live position sampling. Useful for optimization workflows and regression drift checks.

```bash
npm run game:cli -- telemetry
npm run game:cli -- metrics
```

Returned keys:

- `metrics.fps` sampled runtime frame rate
- `metrics.frameTimeMs` frame timing average
- `metrics.actorTotals` enemy/incident/support totals
- `metrics.noise` pressure metrics used to trigger reinforcement tiers
- `ukrainianCombatants` and `russianCombatants` sections with counts, health aggregates, combat strength, and sampled positions
- `actorPositions.player` plus sampled Russian/Ukrainian positions for quick route-space checks
- `combatBalance` aggregate friendly and hostile combat strength
- `battlefieldSummary` quick counts and nearest-threat distances for live raid inspection
- `battlefieldSummary.nearestDoorwayDistance` and `battlefieldSummary.nearestDoorwayLabel` for doorway-lane inspection during raid debugging
- `playerJitter` derived from recent player-path samples; useful for spotting route wobble or movement instability during a live raid

### `verify`

Run one of the authored raid drills and evaluate it against a fixed regression surface. This is the preferred command when a doorway or room-clear pass needs an explicit pass/fail result instead of raw JSON inspection.

Supported verification drills:

- `doorway-regression` checks that the staged breach push remains in raid, finishes near a doorway, keeps a live breach lane, avoids obvious fireteam stalling at the breach mouth, and leaves the active support order on `breach-push`.
- `room-clear-drill` checks that the authored chained room-clear slice keeps the full three-room stack live, preserves interior resistance, maintains foothold fireteams, keeps the player inside the opened room chain, preserves room-linked momentum, and exposes caches across the stack without obvious stall buildup.
- `room-clear-chain` checks that the chain-verification showcase now performs a live doorway walk through the authored room stack, settles back into the deeper interior, keeps the full room stack active, and avoids obvious support-team stall buildup.

```bash
npm run game:cli -- verify --id doorway-regression
npm run game:cli -- verify --id room-clear-drill --path automation-artifacts/room-clear-verify.png
npm run game:cli -- verify --id room-clear-chain --path automation-artifacts/room-clear-chain-verify.png
npm run game:cli -- verify --id war-drama-responsibility
npm run game:cli -- verify --id war-drama-relationships
npm run game:cli -- verify --id war-drama-location-scars
npm run game:cli -- verify --id war-drama-beat-chain
npm run game:cli -- verify --id emergent-war-drama
npm run game:cli -- verify --id frontline-ai-player-decenter
npm run game:cli -- verify --id frontline-ai-cover-suppression
```

Returned keys:

- `passed` overall drill result
- `checks[]` per-assertion labels, pass state, and observed values
- `snapshot` full post-drill snapshot for deeper inspection when a check fails

### `configure`

Configure the next raid without starting it.

```bash
npm run game:cli -- configure --route harbor-approach --weapon 7.62-assault-rifle --support ammo-runner --contract nox
npm run game:cli -- configure --medkits 3 --ammo-packs 5 --top-tab operator --command-tab operations
```

### `start-raid`

Configure and immediately enter raid.

```bash
npm run game:cli -- start-raid --route rail-spur --weapon shotgun --wait 5000
```

### `raid-action`

Run one or more control actions against the current (or staged) raid and return a fresh snapshot.

Supported action flags:

- `--move up|down|left|right|upleft|upright|downleft|downright`
- `--duration <ms>` hold the movement vector for this long
- `--aim <x,y>` set world aim target
- `--fire <ms>` hold trigger for ms
- `--focus <ms>` hold focus/ADS for ms
- `--reload`, `--interact`, `--heal`
- `--support-order <order-id>`
- `--focus-incident <id|index:N|clear>`
- `--start-raid` (auto-boot into raid before applying action if not already in raid phase)

```bash
npm run game:cli -- raid-action --start-raid --fire 350 --aim 480,360
npm run game:cli -- raid-action --move up --duration 300 --reload
npm run game:cli -- raid-action --focus-incident index:0 --support-order breachPush
```

`reload`, `interact`, and `heal` are intentionally modeled as button/command inputs, so they map directly to raid interaction verbs.

### `capture`

Open a snapshot and write a screenshot in the requested location.

```bash
npm run game:cli -- capture --path automation-artifacts/raid-preview.png
npm run game:cli -- capture --path automation-artifacts/frontline-supply-showcase.png --showcase frontline-supply --wait 0.8
npm run game:cli -- capture --path automation-artifacts/live-raid.png --start-raid --wait 1.2
```

Capture options:

- `--showcase <id>` (`carried-storage|squad-roster|frontline-aftermath|breach|breach-push|room-clear|room-clear-chain|frontline-supply|expanded-frontline|territory-claims`)
- `--start-raid`
- `--wait <seconds>` settle time after the staged showcase or raid boot before the screenshot is taken

### `macro`

Run a reusable scripted raid scenario and optionally capture it. This is the recommended path for automation when you need a stable higher-level drill instead of chaining several one-off commands.

Supported macros:

- `breach-drill` stages the breach showcase, enters raid, focuses the first incident, queues `breach-push`, then fires and advances into the doorway lane.
- `extract-drill` enters raid, queues `secure-exfil`, pushes toward the route, and simulates a short covering burst.
- `frontline-pressure` stages the expanded-frontline showcase, enters raid, then alternates focused incidents and support orders to stress the living-frontline layer.
- `doorway-regression` stages the breach showcase, drives a focused push through the staged doorway, and is intended to catch entrance-mouth stalls after navigation changes.
- `room-clear-drill` stages the new `room-clear` showcase, opens the outer mouth, pressures the interior hold room, and gives automation one stable authored breach-to-room-clear slice.
- `room-clear-chain` stages the dedicated `room-clear-chain` showcase at the second-room transition, then walks the player forward through the authored room targets, backtracks through the doorway lane, and settles inside the deeper interior so doorway-chain regressions are caught on the live movement path instead of only static staging.

```bash
npm run game:cli -- macro --id breach-drill
npm run game:cli -- macro --id frontline-pressure --path automation-artifacts/frontline-pressure-macro.png
npm run game:cli -- macro --id doorway-regression --path automation-artifacts/doorway-regression-macro.png
npm run game:cli -- macro --id room-clear-drill --path automation-artifacts/room-clear-drill.png
npm run game:cli -- macro --id room-clear-chain --path automation-artifacts/room-clear-chain.png
```

## Output

All commands print JSON snapshots. Useful keys while playtesting:

- `phase` current phase (`stash`, `raid`, `story-finale`, etc.)
- `stash` credits, supplies, selected loadout, and can-start flag
- `route` active route identity and insertion/threat labels
- `raid.health`, `raid.ammoInMag`, `raid.reserveAmmo`
- `raid.position`, extraction status, carried value/supplies
- `raid.doorway` counts active breachable doorways, live breach lanes, room-stack depth, first-room captures, follow-through-room captures, deep-room captures, active foothold fireteams and labels, player room depth, room-linked cache counts, layered room-defender counts, contested captured rooms, fireteam stall counts, and nearest doorway distance for doorway-regression checks
- `raid.doorway.roomTraversalTargets` exposes authored room-chain centers and doorway centers so automation can walk the staged breach path instead of guessing movement vectors
- `passed` and `checks` on `verify` runs for assertion-driven doorway and room-clear automation
- `frontline` incidents and active support order/cooldowns
- `options` commandable IDs for safe payload configuration
- `frontline.ukrainianCombatants` and `frontline.russianCombatants` fighter summaries
- `frontline.metrics` fps/actor totals/noise/position summaries and player telemetry

## Screenshot default profile

The CLI and smoke scripts use a `1920x1080` desktop viewport and keep tests/playthrough captures in `automation-artifacts/`.
