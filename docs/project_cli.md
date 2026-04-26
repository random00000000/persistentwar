# Project CLI Manual

The project CLI is the stable agent-facing control surface for top-down game state and playtesting.  
It talks to the browser game through the runtime agent API exposed on `window.__topdownExtractionAgentApi`.

## Prerequisites

- Node.js and dependencies installed (`npm install`)
- Game CLI entrypoint available at `scripts/project-cli.mjs`
- Default local port is `4173` (`http://127.0.0.1:4173`)

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

### `status`

Read a live snapshot of current game state (phase, stash, route, player health, ammo, frontline, and options).

```bash
 npm run game:cli -- status
npm run game:cli -- status --url http://127.0.0.1:4173
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
