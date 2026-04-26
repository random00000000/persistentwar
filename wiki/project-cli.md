# Project CLI Manual

The project CLI gives agents a stable terminal surface for inspecting and driving the game without editing code each time.

## Frontline Officer Fork Note

This CLI is inherited from the extraction-shooter runtime. For this fork, use it
as a migration and verification surface while reshaping the game into the
officer-war loop. Prefer commands that reveal or protect reusable systems:
snapshot state, soldier/squad behavior, suppression, stash banking, authored
showcases, and regression gates.

The fork's dedicated dev server is `http://127.0.0.1:5847/`. Use
`--url http://127.0.0.1:5847` when reusing a running server.

The default agent API is still `window.__topdownExtractionAgentApi` until the
runtime is renamed. Do not treat that name as product direction.

## Manual As Contract

This manual is the authoritative contract for the supported CLI surface.

The anti-collapse rule for this project is:

- important systems need inspect coverage
- important systems need force or stage coverage
- important systems need verify coverage

If a product-critical behavior cannot be inspected, staged, and verified through the supported command surface below, it is not stable enough yet.

Use the categories in this manual as trust boundaries:

- `Inspect`: authoritative runtime truth. Start here when diagnosing state.
- `Configure`: supported product-state setup before raid start.
- `Force/Stage`: supported reproduction surfaces for risky or time-sensitive states.
- `Verify`: anti-regression contract. These are the commands that should fail when the game drifts.
- `Showcase/Authored Review`: valid for authored slice review, screenshots, and presentation checks, but not the primary stability contract for generic runtime behavior.
- `Internal/Debug-Only`: not a supported stability surface. Do not build future regression expectations on these.

## Supported Command Surface

### Inspect

Start with:

```powershell
npm run game:cli -- snapshot
```

Treat `snapshot` as the authoritative inspect surface for regression work.

Critical inspect truths include:

- `ui.overlays`
- `ui.frontDoorPanel`
- `raid.extraction`
- `raid.pendingReinforcementSummary`
- `raid.player.containingObstacleId`
- `raid.pendingReinforcements[*].containingObstacleId`
- `regression.legacyToggles`
- `regression.overlayTruth`
- `regression.legacyRuntime`

### Configure

Supported pre-raid setup commands:

- `configure`
- `start-raid`

Use `configure` to set route, weapon, service, meds, and ammo package before deployment.

### Force Or Stage

Supported reproduction surface:

- `stage-state --id front-door`
- `stage-state --id stash`
- `stage-state --id briefing`
- `stage-state --id raid`
- `stage-state --id extract-ready`
- `stage-state --id extract-hold-active`
- `stage-state --id intel-live`
- `stage-state --id intel-crash-pending`
- `stage-state --id body-alarm-pending`
- `stage-state --id room-clear-pocket`

Use `stage-state` instead of browser choreography or code edits when reproducing regression states.

### Verify

Current anti-collapse verify ladder:

- `regression-gate`
- `verify --id main-menu-to-stash`
- `verify --id stash-to-raid`
- `verify --id equip-major-weapons`
- `verify --id equip-low-tier-guns`
- `verify --id wave-target-discipline`
- `verify --id same-room-reinforcement-guard`
- `verify --id no-immortal-runtime`
- `verify --id legacy-crossfire-disabled`
- `verify --id legacy-runtime-clean-states`

Supporting authored checks that still matter for tactical runtime stability:

- `verify --id intel-alarm`
- `verify --id doorway-regression`
- `verify --id room-clear-drill`
- `verify --id knife-extreme`

`regression-gate` is the supported pre-risk command. It runs the core verify ladder plus snapshot-contract checks for:

- front-door overlay truth
- stash overlay truth
- pending reinforcement summary
- compact extraction truth
- legacy-runtime disabled state

Run it through:

```powershell
npm run game:cli -- regression-gate
```

### Showcase Or Authored Review

Supported for authored slice review, screenshots, and presentation QA:

- `showcase --id <slice>`
- `capture --showcase <slice> ...`
- authored `verify --id <slice>` commands tied to a named scenario

These are valid review surfaces, but they do not replace the generic inspect/stage/verify contract above.

### Internal Or Debug-Only

Do not treat these as primary stability guarantees:

- browser-only DOM inspection without `snapshot`
- one-off debug parameters added for a single investigation
- internal agent API helpers that do not have a documented CLI command

If a future feature depends on one of these surfaces, promote it into `snapshot`, `configure`, `stage-state`, or `verify` first.

## Stability Workflow

Use this order when protecting the game from regression:

1. `snapshot` to inspect truth
2. `configure` or `stage-state` to reach the state
3. `verify --id ...` to prove the promise

If you cannot complete that loop from the CLI, the feature is not stable enough yet.

## Regression Gate

Use this before risky AI, runtime, stash, overlay, or extraction work lands:

```powershell
npm run game:cli -- regression-gate
```

The gate currently covers:

- menu to stash continuity
- stash to raid continuity
- major and low-tier equip flow
- intel pressure path
- extraction pressure path
- wave target discipline
- same-room reinforcement guard
- doorway chase reliability
- no immortal runtime actors
- legacy crossfire suppression
- legacy runtime cleanup across normal states

This is the minimum supported anti-collapse gate for the product loop.

## Entry Point

Run commands through:

```powershell
npm run game:cli -- <command> [options]
```

By default the CLI can start a local Vite server and talks to `window.__topdownExtractionAgentApi`. In this fork, prefer the dedicated dev URL `http://127.0.0.1:5847/`.

Use `--url <url>` when you want to reuse an already running server.

Raid-only showcase capture now enforces a live raid phase before the screenshot is written. This keeps authored review shots like `white-van-ambush`, `armored-drop`, `territory-claims`, and the other raid slices from silently falling back to stash when the showcase transition settles a beat later than the first poll.

## High-Value Commands

```powershell
npm run game:cli -- snapshot
npm run game:cli -- regression-gate
npm run game:cli -- configure --route crosswind-docks --weapon smg --service cut-rig --medkits 2 --ammo-packs 2
npm run game:cli -- stage-state --id stash
npm run game:cli -- stage-state --id briefing
npm run game:cli -- stage-state --id extract-hold-active
npm run game:cli -- start-raid
npm run game:cli -- move --x 1 --y 0 --seconds 1.5
npm run game:cli -- action --type interact
npm run game:cli -- action --type stabilize
npm run game:cli -- action --type finish
npm run game:cli -- support-order --id breach-push
npm run game:cli -- support-order --id hold-position
npm run game:cli -- select-boy --index 0
npm run game:cli -- squad-order --id defend --x 980 --y 540
npm run game:cli -- squad-order --id brace-watch --x 1040 --y 500
npm run game:cli -- squad-order --id move-watch --x 1080 --y 520
npm run game:cli -- squad-order --id attack
npm run game:cli -- squad-order --id follow
npm run game:cli -- squad-action --id grenade --x 980 --y 540
npm run game:cli -- squad-action --id suppress --x 980 --y 540
npm run game:cli -- focus-extract --id far-relay-spur
npm run game:cli -- focus-incident --id index:1
npm run game:cli -- story-pack list
npm run game:cli -- story-pack scaffold --id trench-echoes --title "Trench Echoes" --summary "Stories about returning to scarred trench lanes"
npm run game:cli -- showcase --id briefing
npm run game:cli -- showcase --id breach
npm run game:cli -- showcase --id boys-command
npm run game:cli -- showcase --id war-beat-focus
npm run game:cli -- showcase --id civilian-window
npm run game:cli -- showcase --id hunter-search
npm run game:cli -- showcase --id blue-carried-fire
npm run game:cli -- showcase --id blue-body-extract
npm run game:cli -- showcase --id wounded-soldier
npm run game:cli -- showcase --id memorial-wall
npm run game:cli -- showcase --id dialogue-aftermath
npm run game:cli -- verify --id dialogue-aftermath --path automation-artifacts/dialogue-aftermath-verify-2026-04-20.png
npm run game:cli -- capture --showcase memorial-wall --selector "[data-stash-tab-handoff-board]" --path automation-artifacts/chair-handoff-board-2026-04-19.png
npm run game:cli -- showcase --id next-push-gear
npm run game:cli -- showcase --id field-coffee
npm run game:cli -- showcase --id burner-coffee
npm run game:cli -- verify --id field-coffee --path automation-artifacts/field-coffee-verify-2026-04-20.png
npm run game:cli -- verify --id burner-coffee --path automation-artifacts/burner-coffee-verify-2026-04-20.png
npm run game:cli -- showcase --id drone-sweep
npm run game:cli -- verify --id drone-sweep --path automation-artifacts/drone-sweep-verify-2026-04-20.png
npm run game:cli -- capture --showcase drone-sweep --path automation-artifacts/drone-sweep-2026-04-20.png
npm run game:cli -- showcase --id hostile-lane-chatter
npm run game:cli -- showcase --id body-recovery
npm run game:cli -- showcase --id armored-evac
npm run game:cli -- showcase --id surrender-window
npm run game:cli -- showcase --id persistent-body-return
npm run game:cli -- capture --showcase persistent-body-return --path automation-artifacts/persistent-body-return-2026-04-20.png
npm run game:cli -- verify --id persistent-body-return --path automation-artifacts/persistent-body-return-verify-2026-04-20.png
npm run game:cli -- showcase --id caravan-trap
npm run game:cli -- showcase --id territory-claims
npm run game:cli -- showcase --id territory-retake
npm run game:cli -- showcase --id relay-counterpush
npm run game:cli -- showcase --id ambulance-counterhold
npm run game:cli -- showcase --id mortar-bracket
npm run game:cli -- showcase --id retake-peel
npm run game:cli -- showcase --id armored-drop
npm run game:cli -- showcase --id armored-evac
npm run game:cli -- showcase --id trench-assault
npm run game:cli -- showcase --id bunker-foothold
npm run game:cli -- showcase --id cellar-counterhold
npm run game:cli -- showcase --id shed-hide
npm run game:cli -- showcase --id grenade-pocket
npm run game:cli -- showcase --id boys-frag-runtime
npm run game:cli -- showcase --id suppression-runtime
npm run game:cli -- showcase --id pinned-pressure
npm run game:cli -- verify --id territory-claims --path automation-artifacts/territory-claims-verify-2026-04-20.png
npm run game:cli -- verify --id territory-retake --path automation-artifacts/territory-retake-verify-2026-04-20.png
npm run game:cli -- verify --id relay-counterpush --path automation-artifacts/relay-counterpush-verify-2026-04-20.png
npm run game:cli -- verify --id ambulance-counterhold --path automation-artifacts/ambulance-counterhold-verify-2026-04-20.png
npm run game:cli -- verify --id mortar-bracket --path automation-artifacts/mortar-bracket-verify-2026-04-20.png
npm run game:cli -- verify --id retake-peel --path automation-artifacts/retake-peel-verify-2026-04-20.png
npm run game:cli -- showcase --id combat-audio
npm run game:cli -- showcase --id combat-presentation
npm run game:cli -- verify --id combat-presentation --path automation-artifacts/combat-presentation-verify-2026-04-20.png
npm run game:cli -- verify --id boys-frag-runtime --path automation-artifacts/boys-frag-runtime-verify-2026-04-20.png
npm run game:cli -- verify --id suppression-runtime --path automation-artifacts/suppression-runtime-verify-2026-04-20.png
npm run game:cli -- verify --id pinned-pressure --path automation-artifacts/pinned-pressure-verify-2026-04-20.png
npm run game:cli -- verify --id combat-audio --path automation-artifacts/combat-audio-verify-2026-04-20.png
npm run game:cli -- verify --id armored-evac --path automation-artifacts/armored-evac-verify-2026-04-20.png
npm run game:cli -- verify --id surrender-window --path automation-artifacts/surrender-window-verify-2026-04-20.png
npm run game:cli -- verify --id trench-assault --path automation-artifacts/trench-assault-verify-2026-04-20.png
npm run game:cli -- verify --id bunker-foothold --path automation-artifacts/bunker-foothold-verify-2026-04-20.png
npm run game:cli -- verify --id cellar-counterhold --path automation-artifacts/cellar-counterhold-verify-2026-04-20.png
npm run game:cli -- capture --showcase boys-frag-runtime --path automation-artifacts/boys-frag-runtime-2026-04-20.png
npm run game:cli -- capture --showcase suppression-runtime --path automation-artifacts/suppression-runtime-2026-04-20.png
npm run game:cli -- capture --showcase combat-audio --path automation-artifacts/combat-audio-pass-2026-04-20.png
npm run game:cli -- capture --showcase combat-presentation --path automation-artifacts/combat-audio-pass-2026-04-20.png
npm run game:cli -- showcase --id hardcore-start
npm run game:cli -- showcase --id weapon-doctrine
npm run game:cli -- showcase --id field-capture
npm run game:cli -- showcase --id field-pivot
npm run game:cli -- showcase --id broker-cashout
npm run game:cli -- showcase --id chair-handoff
npm run game:cli -- verify --id hardcore-start --path automation-artifacts/hardcore-start-verify-2026-04-20.png
npm run game:cli -- verify --id weapon-doctrine --path automation-artifacts/weapon-doctrine-verify-2026-04-20.png
npm run game:cli -- verify --id field-capture --path automation-artifacts/field-capture-verify-2026-04-20.png
npm run game:cli -- verify --id field-pivot --path automation-artifacts/field-pivot-verify-2026-04-20.png
npm run game:cli -- verify --id broker-cashout --path automation-artifacts/broker-cashout-verify-2026-04-20.png
npm run game:cli -- verify --id chair-handoff --path automation-artifacts/chair-handoff-verify-2026-04-20.png
npm run game:cli -- verify --id endgame-amr --path automation-artifacts/endgame-amr-verify-2026-04-20.png
npm run game:cli -- verify --id amr-counter-lane --path automation-artifacts/amr-counter-lane-verify-2026-04-20.png
npm run game:cli -- verify --id final-stronghold-launch --path automation-artifacts/final-stronghold-launch-verify-2026-04-20.png
npm run game:cli -- verify --id final-stronghold-setback --path automation-artifacts/final-stronghold-setback-verify-2026-04-20.png
npm run game:cli -- verify --id true-escape --path automation-artifacts/true-escape-verify-2026-04-20.png
npm run game:cli -- verify --id dialogue-aftermath --path automation-artifacts/dialogue-aftermath-verify-2026-04-20.png
npm run game:cli -- showcase --id handgun-recovery
npm run game:cli -- verify --id handgun-recovery --path automation-artifacts/handgun-recovery-verify-2026-04-20.png
npm run game:cli -- showcase --id final-stronghold
npm run game:cli -- showcase --id recovery-corridor-payoff
npm run game:cli -- showcase --id endgame-amr
npm run game:cli -- showcase --id amr-counter-lane
npm run game:cli -- capture --showcase weapon-doctrine --selector "[data-weapon-doctrine-card]" --path automation-artifacts/pkm-weapon-doctrine-card-2026-04-20.png
npm run game:cli -- capture --showcase field-capture --path automation-artifacts/field-capture-rack-2026-04-20.png
npm run game:cli -- capture --showcase field-pivot --path automation-artifacts/field-pivot-2026-04-20.png
npm run game:cli -- capture --showcase broker-cashout --path automation-artifacts/broker-cashout-2026-04-20.png
npm run game:cli -- capture --showcase chair-handoff --path automation-artifacts/chair-handoff-2026-04-20.png
npm run game:cli -- capture --showcase chair-handoff --selector "[data-stash-tab-handoff-card]" --path automation-artifacts/chair-handoff-board-2026-04-20.png
npm run game:cli -- capture --showcase handgun-recovery --selector "[data-weapon-doctrine-card]" --path automation-artifacts/handgun-recovery-card-2026-04-20.png
npm run game:cli -- capture --showcase final-stronghold --path automation-artifacts/final-stronghold-operations-2026-04-20.png
npm run game:cli -- capture --showcase final-stronghold-launch --path automation-artifacts/final-stronghold-launch-2026-04-20.png
npm run game:cli -- capture --showcase final-stronghold-setback --path automation-artifacts/final-stronghold-setback-2026-04-20.png
npm run game:cli -- capture --showcase true-escape --path automation-artifacts/true-escape-2026-04-20.png
npm run game:cli -- capture --showcase true-escape --selector "[data-debrief-campaign-closure]" --path automation-artifacts/true-escape-closure-2026-04-20.png
npm run game:cli -- capture --showcase endgame-amr --selector "[data-weapon-doctrine-card]" --path automation-artifacts/endgame-amr-doctrine-card-2026-04-20.png
npm run game:cli -- capture --showcase boys-command --selector "[data-squad-grid]" --path automation-artifacts/squad-doctrine-grid-2026-04-20.png
npm run game:cli -- showcase --id extract-clean
npm run game:cli -- showcase --id extract-collapse
npm run game:cli -- verify --id extract-clean --path automation-artifacts/extract-clean-verify-2026-04-20.png
npm run game:cli -- verify --id extract-collapse --path automation-artifacts/extract-collapse-verify-2026-04-20.png
npm run game:cli -- showcase --id noise-discipline
npm run game:cli -- capture --showcase extract-clean --selector "[data-decision-card]" --path automation-artifacts/extract-choice-comparison-2026-04-19.png
npm run game:cli -- capture --showcase extract-clean --path automation-artifacts/extract-clean-2026-04-19.png
npm run game:cli -- capture --showcase extract-collapse --path automation-artifacts/extract-collapse-2026-04-19.png
npm run game:cli -- capture --showcase extract-pressure --selector "[data-operation-flow-panel]" --path automation-artifacts/operation-flow-panel-2026-04-19.png
npm run game:cli -- capture --showcase debrief --selector "[data-debrief-operation-summary]" --path automation-artifacts/debrief-operation-summary-2026-04-19.png
npm run game:cli -- capture --showcase debrief --selector "[data-debrief-manifest-board]" --path automation-artifacts/debrief-manifest-routing-panel-2026-04-19.png
npm run game:cli -- capture --showcase debrief --selector "[data-debrief-handoff-card]" --path automation-artifacts/debrief-chair-handoff-2026-04-19.png
npm run game:cli -- capture --showcase debrief --selector "[data-debrief-operational-card]" --path automation-artifacts/debrief-operational-wall-2026-04-20.png
npm run game:cli -- capture --showcase boys-command --path automation-artifacts/boys-command-command-surface-2026-04-19.png
npm run game:cli -- capture --showcase boys-command --path automation-artifacts/boys-command-contextual-orders-2026-04-19.png
npm run game:cli -- capture --showcase boys-command --path automation-artifacts/boys-command-loadout-wedge-2026-04-19.png
npm run game:cli -- capture --showcase briefing --path automation-artifacts/briefing-tactical-slate-2026-04-19.png
npm run game:cli -- capture --showcase briefing --path automation-artifacts/briefing-sector-order-2026-04-19.png
npm run game:cli -- capture --showcase hardcore-start --selector "[data-hardcore-start-card]" --path automation-artifacts/hardcore-start-board-2026-04-19.png
npm run game:cli -- capture --showcase weapon-doctrine --selector "[data-weapon-doctrine-card]" --path automation-artifacts/weapon-doctrine-card-2026-04-19.png
npm run game:cli -- capture --showcase combat-presentation --selector "[data-weapon-doctrine-panel]" --path automation-artifacts/weapon-doctrine-panel-2026-04-19.png
npm run game:cli -- capture --showcase noise-discipline --selector "[data-noise-discipline-panel]" --path automation-artifacts/noise-discipline-card-2026-04-19.png
npm run game:cli -- capture --showcase next-push-gear --selector "[data-gear-push-card]" --path automation-artifacts/gear-next-push-card-2026-04-19.png
npm run game:cli -- capture --showcase extract-pressure --focus-extract far-relay-spur --path automation-artifacts/extract-choice-focus-2026-04-19.png
npm run game:cli -- capture --showcase extract-pressure --focus-extract far-relay-spur --selector "[data-decision-card]" --path automation-artifacts/extract-choice-card-2026-04-19.png
npm run game:cli -- capture --showcase extract-pressure --focus-extract far-relay-spur --path automation-artifacts/extract-pressure-convoy-peel-2026-04-19.png
npm run game:cli -- capture --showcase war-beat-focus --selector "[data-frontline-focus-card]" --path automation-artifacts/war-beat-focus-card-2026-04-19.png
npm run game:cli -- capture --showcase civilian-window --path automation-artifacts/civilian-window-2026-04-19.png
npm run game:cli -- capture --showcase hunter-search --path automation-artifacts/hunter-search-showcase-2026-04-19.png
npm run game:cli -- capture --showcase blue-carried-fire --path automation-artifacts/blue-carried-fire-showcase-2026-04-19.png
npm run game:cli -- verify --id blue-carried-fire --path automation-artifacts/blue-carried-fire-verify-2026-04-19.png
npm run game:cli -- verify --id blue-body-extract --path automation-artifacts/blue-body-extract-verify-2026-04-19.png
npm run game:cli -- capture --showcase wounded-soldier --path automation-artifacts/wounded-soldier-showcase-2026-04-19.png
npm run game:cli -- verify --id wounded-soldier --path automation-artifacts/wounded-soldier-verify-2026-04-20.png
npm run game:cli -- capture --showcase field-coffee --path automation-artifacts/field-coffee-showcase-2026-04-19.png
npm run game:cli -- capture --showcase burner-coffee --path automation-artifacts/burner-coffee-showcase-2026-04-19.png
npm run game:cli -- capture --showcase burner-coffee --path automation-artifacts/frontline-operation-live-2026-04-19.png
npm run game:cli -- capture --showcase burner-coffee --selector "[data-frontline-operation-panel]" --path automation-artifacts/frontline-operation-panel-2026-04-19.png
npm run game:cli -- capture --showcase drone-sweep --path automation-artifacts/drone-sweep-showcase-2026-04-19.png
npm run game:cli -- capture --showcase frontline-supply --path automation-artifacts/frontline-supply-convoy-ambush-2026-04-19.png
npm run game:cli -- capture --showcase surrender-window --path automation-artifacts/surrender-window-showcase-2026-04-19.png
npm run game:cli -- capture --showcase hostile-lane-chatter --path automation-artifacts/hostile-lane-chatter-scene-2026-04-19.png
npm run game:cli -- capture --showcase body-recovery --path automation-artifacts/body-recovery-showcase-2026-04-19.png
npm run game:cli -- capture --showcase caravan-trap --path automation-artifacts/caravan-trap-showcase-2026-04-19.png
npm run game:cli -- capture --showcase territory-claims --path automation-artifacts/territory-claims-showcase-2026-04-19.png
npm run game:cli -- capture --showcase territory-retake --path automation-artifacts/territory-retake-2026-04-20.png
npm run game:cli -- capture --showcase retake-peel --path automation-artifacts/retake-peel-2026-04-20.png
npm run game:cli -- verify --id territory-claims --path automation-artifacts/territory-claims-verify-2026-04-20.png
npm run game:cli -- capture --showcase white-van-ambush --path automation-artifacts/white-van-ambush-2026-04-20.png
npm run game:cli -- verify --id armored-drop --path automation-artifacts/armored-drop-verify-2026-04-20.png
npm run game:cli -- capture --showcase armored-drop --path automation-artifacts/armored-drop-2026-04-20.png
npm run game:cli -- capture --showcase armored-evac --path automation-artifacts/armored-evac-showcase-2026-04-19.png
npm run game:cli -- capture --showcase bunker-foothold --path automation-artifacts/bunker-foothold-movie-hold-2026-04-19.png
npm run game:cli -- capture --showcase cellar-counterhold --path automation-artifacts/cellar-counterhold-2026-04-20.png
npm run game:cli -- capture --showcase shed-hide --path automation-artifacts/shed-hide-showcase-2026-04-19.png
npm run game:cli -- capture --showcase grenade-pocket --path automation-artifacts/grenade-pocket-shared-autonomy-2026-04-19.png
npm run game:cli -- click --selector "[data-support-order='breach-push']"
npm run game:cli -- screenshot --path automation-artifacts/cli-capture.png
npm run game:cli -- capture --showcase debrief --path automation-artifacts/debrief-consequence-board.png
npm run game:cli -- verify --id room-clear-drill --path automation-artifacts/room-clear-verify.png
```

## Force And Stage Contract

`stage-state` is the stable reproduction surface for risky regression states. Use it when the goal is to reach a known game condition without relying on manual browser choreography or ad hoc code edits.

```powershell
npm run game:cli -- stage-state --id <state-id>
```

Supported ids:

- `front-door`
  - return to the main menu/front door from stash state
- `stash`
  - close front-door and briefing overlays and land on the stash board
- `briefing`
  - open the pre-raid mission briefing from stash
- `raid`
  - start a generic live raid from the current stash package
- `extract-ready`
  - stage a live raid with a focused extract available but no active hold yet
- `extract-hold-active`
  - stage a live raid with the extraction hold already running
- `intel-live`
  - stage the intel-defense slice with the terminal objective live
- `intel-crash-pending`
  - stage the same intel-defense slice with the inbound intel crash pending
- `body-alarm-pending`
  - stage a live body-alarm call window with a hostile caller and pending response
- `room-clear-pocket`
  - stage the live room-clear pocket slice

Notes:

- `stage-state` reuses the actual authored runtime slices where they already model the product truth, rather than duplicating those conditions in the CLI.
- `configure` remains the authoritative loadout/package command. Use it before `stage-state` when the regression needs a specific weapon, route, service, or stash-side package.

## Snapshot Contract

- `snapshot` is the trusted inspect surface for regression work. Prefer it over DOM text or inferred UI state.
- Overlay truth now lives in:
  - `ui.overlays.frontDoorOpen`
  - `ui.overlays.stashOpen`
  - `ui.overlays.briefingOpen`
  - `ui.overlays.storyFinalePending`
  - `ui.frontDoorPanel`
- Loadout truth remains in:
  - `stash.selectedWeapon`
  - `stash.selectedTacticalService`
- Active extract truth now has an explicit compact read in:
  - `raid.extraction.active`
  - `raid.extraction.ready`
  - `raid.extraction.contested`
  - `raid.extraction.holdTimer`
  - `raid.extraction.holdDuration`
  - `raid.extraction.focusedExtractId`
  - `raid.extraction.focusedExtractLabel`
- Wave pressure is inspectable through:
  - `raid.pendingReinforcements[*]`
  - `raid.pendingReinforcementSummary`
- Enemy building-pressure and room traversal remain inspectable through:
  - `raid.enemySquads[*].doctrineLabels`
  - `raid.enemySquads[*].sectorCoverageLabel`
  - `raid.enemySquads[*].ownershipLabel`
  - `raid.enemySquads[*].compressionLabel`
  - `raid.doorway`
- Legacy-path truth now has an explicit inspect read in:
- `regression.legacyToggles.frontlineIncidentsEnabled`
- `regression.legacyToggles.playerSideSupportsEnabled`
- `regression.legacyRuntime.active`
- `regression.legacyRuntime.supportCount`
- `regression.legacyRuntime.incidentCount`
  - `regression.overlayTruth`

## Core Verify Ladder

Milestone 4 of the regression-proofing plan adds a direct verify ladder for the main product loop. These verifies are intended to fail on real runtime drift before agents fall back to browser guesswork.

Direct regression verifies:

```powershell
npm run game:cli -- verify --id main-menu-to-stash
npm run game:cli -- verify --id stash-to-raid
npm run game:cli -- verify --id equip-major-weapons
npm run game:cli -- verify --id equip-low-tier-guns
npm run game:cli -- verify --id wave-target-discipline
npm run game:cli -- verify --id same-room-reinforcement-guard
npm run game:cli -- verify --id no-immortal-runtime
npm run game:cli -- verify --id legacy-crossfire-disabled
npm run game:cli -- verify --id legacy-runtime-clean-states
```

Supporting authored verifies that remain part of the stability ladder:

```powershell
npm run game:cli -- verify --id knife-extreme
npm run game:cli -- verify --id intel-alarm
npm run game:cli -- verify --id doorway-regression
```

Notes:

- `equip-major-weapons` and `equip-low-tier-guns` now prove the real stash authority path, not just `selectedWeapon` state. `configureNextRaid()` stages the same loadout truth as a real stash equip by syncing the actual equipped slot before deployment.
- `same-room-reinforcement-guard` now uses snapshot containment truth instead of a fake long-distance guess. Inspect this through:
  - `raid.player.containingObstacleId`
  - `raid.pendingReinforcements[*].containingObstacleId`
- `doorway-regression` now treats doorway stall/path validity as the product truth. It no longer fails just because an old support-order tag is absent while the real doorway traversal remains healthy.
- `legacy-runtime-clean-states` is the Milestone 5 guard. It stages `front-door`, `stash`, `briefing`, and `raid`, then proves those normal transitions purge legacy frontline runtime instead of carrying showcase support/incident arrays forward.

## Command Reference

The command reference below includes both supported product commands and authored review helpers. When there is a conflict, the contract sections above win.

- `snapshot`
  - Returns current phase, stash state, route info, raid runtime data, frontline state, and available options as JSON.
- `stage-state --id <state-id>`
  - Forces a supported regression state directly from the terminal without manual UI choreography. Use it to reproduce front-door, stash, briefing, raid, extract, intel, body-alarm, and room-clear conditions on demand.
- `stash` now also exposes normalized stash classification through `items[*].category`, `items[*].actions`, `items[*].deployable`, and `items[*].origin`, plus package-level reads at `readyWeapons`, `readySupplies`, `recoveredHaulSummary`, `squadReadiness`, `replacementSeats`, `memorialDebt`, and `operationalWall`.
- `stash.recoveredHaulSummary.fieldWeapon` now exposes the latest successful off-body gun capture with source label, carried ammo, and rough sell value so agents can verify the looted-weapon keep-or-sell slice without parsing the DOM.
- `stash.recoveredHaulSummary.fieldWeaponDecision` now exposes the stash-side recommendation for that recovered gun, including whether to pivot now, hold it as doctrine, or broker it, plus the best pivot route and sell-value label.
- `stash.recoveredHaulSummary.realizedBrokerCredits` and `realizedBrokerItems` now expose how much hot haul or captured-kit value has already been converted back into live stash money during the current stash cycle.
  - `campaign.finale` now also exposes `prepSummary` plus `prepOutputs[*]`, so automations can inspect which reusable finale modifiers are already live from real campaign work instead of inferring them from counters alone.
  - The first combat-center pass adds `combat.commandDepthSummary`, `combat.selectedBoyAction`, `combat.activeTracerCount`, `combat.activeImpactCount`, `combat.activeGrenadeCount`, `combat.nearbySuppressedEnemies`, `combat.nearbyFriendlySuppressors`, `combat.activeTacticalActionCount`, and `combat.startingHardship`.
  - The snapshot now also exposes `combat.squadDoctrine`, summarizing the current package title, payoff, tags, and per-boy role reads so loadout coordination can be inspected without parsing the whole HUD.
  - `combat.squadDoctrine` is now live-state aware instead of only loadout-aware, so authored raids can flip the boys package into `Recovery corridor package`, `Trench shove package`, `Retake hold package`, or `Settlement peel package` as the route changes from reclaim to trench shove to hot peel.
  - The snapshot now also exposes `combat.weaponDoctrine`, mirroring the shared doctrine board with route fit, best space, failure space, boys package, and the current route call.
  - The snapshot now also exposes `combat.presentationRead`, summarizing the live VFX lane through dominant tracer ownership, suppression count, blast count, concrete-vs-dust material breaks, hostile grenade danger, and compact review lines.
- The main-map and AI baseline now also exposes `map.district`, `map.settlement`, `map.activeSubzone`, and `map.pressurePosture`, plus the live raid mirrors those same reads through `raid.districtRead`, `raid.settlementRead`, `raid.activeSubzone`, and `raid.pressurePosture`.
- `map.pressurePosture` now also includes `actionLabel`, `windowLabel`, `threatLabel`, `windowSeconds`, `reserveSeconds`, `pinnedCount`, and `suppressedCount`, so agents can inspect whether a lane is truly in a shove-now window instead of only reading a posture name.
  - `route.persistentBodies` now reports the stored squad and hostile remains on the active route, while `raid.fallenSquadBodies` and `raid.fallenEnemyBodies` report the actual bodies currently loaded into the live raid.
  - `frontline.supportOrderPayoff` now exposes the live boys-command payoff summary used by both the DOM `Boys Wedge` card and the Phaser `Boys Net` panel, so automations can inspect what the current order is actually buying in the lane.
  - The raid snapshot now includes `raid.coffeePocketRead` when a nearby burner or thermos pocket is relevant, matching the shared `Warm Reset` read shown in the DOM `Boys Wedge` card and the Phaser `Boys Net` panel.
- The raid snapshot now includes `raid.plannedExtractPosture` when a focused exfil has been staged but the beacon has not started burning yet, matching the shared `Pre-Beacon Posture` surface in the DOM `Extract Decision` board and the Phaser `Extract Pressure` panel. That read now includes staged hold-relief, softened ring-threat counts, and any banked sweep slack from the planned pull.
  - The raid snapshot now includes `raid.selectedSquadMateId` plus `raid.squadMates[*].command`, exposing which boy is currently selected and whether each boy is on `follow`, `defend`, `attack`, `brace-watch`, or `move-watch`, including anchor data, sector target/direction/arc metadata, the command issue timestamp, and the current command age in seconds. `move-watch` is now the live moving suppression / covering-fire command behind `Ctrl + RMB`.
  - The raid snapshot now also includes `raid.squadMates[*].tacticalAction`, exposing the reusable tactical-action overlay for each boy. Shipped actions now include `grenade` and `suppress`, with target position, lifecycle status, target radius, burst state, resume order, failure read, and action age in seconds.
  - The raid snapshot now includes `raid.squadMates`, exposing each live squadmate's name, role, assignment, assignment tag, `doctrine`, readiness, condition, and direct command state so automation can inspect the boys as individuals instead of only via aggregate comms.
  - The raid snapshot now also includes player and squad casualty reads for the first casualty-state slice: `raid.casualtyState`, `raid.woundSeverity`, `raid.bleedoutTimer`, `raid.commandRestrictionMode`, `raid.squadMates[*].casualtyState`, `raid.squadMates[*].woundSeverity`, `raid.squadMates[*].bleedoutTimer`, `raid.downedHostilesNearby`, and `raid.activeRescueTask`.
  - Rescue state now exposes movement follow-through as well: `raid.activeRescueTask.task` can be `stabilize`, `assist`, or `carry`, and both `raid.activeRescueTask` plus `raid.activeHostileRescueTask` include destination data when friendlies or hostiles are pulling wounded off the lane.
  - The raid snapshot now also exposes the carried-fire and casualty-exfil surface directly: `raid.playerActionMode`, `raid.rescueFireMode`, `raid.rescueFireEnabled`, `raid.casualtyExtractActive`, `raid.casualtyExtractMode`, `raid.casualtyExtractOwner`, and `raid.activeRescueTask.movementPenaltyTimer`.
  - The raid snapshot now also carries `frontline.metrics.combat.playerJitter` so agents can spot movement wobble from recent player-path samples.
  - The raid snapshot also includes `raid.doorway.nearestDoorwayLabel` and `raid.doorway.nearestDoorwayDistance` for doorway-lane health checks.
  - The raid snapshot now includes a consolidated `battlefield` object with friendly/hostile counts, aggregate combat strength, player position, sample actor positions, span bounds, and jitter so the CLI can inspect the live frontline without rebuilding those metrics on every run.
- `showcase --id boys-frag-runtime`
  - Stages a dedicated delegated-frag runtime slice with one selected boy committed to a live grenade task inside the trench pocket, so `combat.selectedBoyAction`, `combat.activeTacticalActionCount`, and `combat.activeGrenadeCount` can be reviewed together.
- `showcase --id suppression-runtime`
  - Stages a dedicated suppression-runtime slice with one selected boy holding a live suppress task, nearby Blue pinned into the lane, and the boys-command order still active behind the same crossing-control problem.
- `showcase --id pinned-pressure`
  - Stages a dedicated AI-pressure proof slice where the lane posture flips to `pinned`, two defenders are visibly suppressed into cover, and one reserve file is already leaning in so humans can judge whether the crossing window reads clearly enough.
- `showcase --id territory-retake`
  - Stages Customs Quay as mostly lost ground with one fragile reclaimed foothold, so the same district can be reviewed as a foothold-first retake instead of a mixed-control follow-up.
- `showcase --id relay-counterpush`
  - Stages Relay Hamlet as a reclaiming compound where one routed dish-house pocket still needs to be locked before the reserve lane pushes back through the antenna ditch.
- `showcase --id final-stronghold-launch`
  - Stages the campaign in a committed finale-launch state where `campaign.finale.assaultPlan` exposes the live `Entry Belt`, `Relay Mouth`, `Casualty Strip`, and `Escape Cut` beats instead of only a readiness headline.
- `showcase --id ambulance-counterhold`
  - Stages Ambulance Mile as a fragile trench-line return where the med-lane lip is still barely held, the shell-yard reserve file is feeding back toward the strip, and the underpass strongpoint is the only settled reset pocket behind it.
- `verify --id territory-retake`
  - Confirms the retake slice is still a reclaiming `Customs Quay` return with a planted foothold, a live raising claim, reserve-lane pressure, and the live `Retake hold package` squad read.
- `verify --id relay-counterpush`
  - Confirms Relay Hamlet stays reclaiming, the focused dish-house pocket is still routed reclaimed ground, `Pressure Posture` carries a live reserve warning, and the boys stay in a real `Retake hold package`.
- `verify --id final-stronghold-launch`
  - Confirms the finale has actually moved into `launched`, the launch state exposes all four assault-plan beats, and the launch-only titles read like a live wall instead of more prep theory.
- `verify --id ambulance-counterhold`
  - Confirms Ambulance Mile stays fragile, the active sub-zone is `Med Lane Trench`, `Pressure Posture` calls for `Brace the trench reserve lane`, the `Underpass strongpoint` remains settled, and the boys still read the fight as a shared `Trench shove package`.
- `verify --id body-recovery`
  - Confirms the recovery slice stays recovery-driven in operation flow and flips the boys package into a real `Recovery corridor package` with corridor-lid and drag-runner roles.
- `verify --id persistent-body-return`
  - Confirms Crosswind Docks stays framed as Yara's remembered return debt: the live raid still carries his unrecovered body, `Route Echo` comms explicitly name him, recent squad dialogue keeps the `mate-left-behind` scar live, and both raid-side plus roster-side dialogue memories still remember the same loss.
- `verify --id hunter-search`
  - Confirms the old-hunter treeline beat stays on a live guide lane: `Pressure Posture` calls `Guide the hunter off the reeds`, operation flow treats the rescue as the commitment problem, and the boys flip into a real `Hunter screen package`.
- `verify --id wounded-soldier`
  - Confirms the wounded-shoulder beat stays a live medical hold: `Pressure Posture` calls `Keep Yara on the line`, operation flow treats the split as a survival-minded medic problem, and the boys flip into a `Medical hold package` while Yara remains stabilized but wounded.
- `verify --id surrender-window`
  - Confirms the routed pocket still reads as a real surrender-secure reclaim: `Pressure Posture` stays on `surrendering`, the focused firefight is a routed `secure` pocket with route-intel payoff, settlement memory keeps the `surrender-pocket` scar live, and the convoy-plus-casualty pressure behind the lane stops the slice from flattening into a clean wipe.
- `verify --id armored-evac`
  - Confirms the medevac slice stays one shared recovery problem: the casualty strip is focused, the Blue evac wagon is still live, operation flow calls out the wagon fight, and pressure posture tells the player to break the wagon lane.
- `verify --id trench-assault`
  - Confirms the lower-pier shove keeps the mixed PKM/shotgun/SMG package and now reads as a dedicated `Trench shove package` with `Lip lid`, `Bend breaker`, and `Rear cut` roles.
- `verify --id retake-peel`
  - Confirms the hotter Customs Quay peel carries the settlement-specific extract warning and flips the boys package into a real peel-screen read instead of generic route-fit copy.
- `showcase --id combat-audio`
  - Stages a dedicated hot sound-picture slice with PKM-led friendly pressure, close hostile snap-bys, a blast shock, and an urgent grenade warning so the Phaser `Combat Audio` panel and `combat.audioRead` snapshot block can be reviewed on their own.
- `showcase --id combat-presentation`
  - Stages the combat-center VFX proof slice with mixed material breaks, suppression, blast shock, and hostile grenade danger so the raid render and `combat.presentationRead` can be reviewed together.
- `showcase --id hardcore-start`
  - Stages the stash into a harsh low-start baseline with no primary selected, zero staged supplies, and a reduced stash cushion for conscript-start review.
- `verify --id hardcore-start`
  - Confirms the harsh-start proof is actually poor: no primary staged, no med/ammo prep left, and not enough credits to cover deployment.
- `showcase --id weapon-doctrine`
  - Stages the stash-side doctrine pass on a PKM-led `Broken Signal` support plan so humans can review lane-denial route fit, failure space, and the boys package before deployment.
- `verify --id weapon-doctrine`
  - Confirms the PKM doctrine board is truly route-owned on `Broken Signal`, the squad package stays `Belt-led crossing package`, and the showcase copy still frames the gun as lane-denial support rather than a generic damage upgrade.
- `showcase --id field-capture`
  - Stages a successful rifle run that came home with a looted PKM on the rack, proving found enemy guns now read as a real keep-or-sell doctrine decision for the next run.
- `showcase --id broker-cashout`
  - Stages the same recovered PKM after it has already been brokered, so the wall, stash chip, and `Operational Wall` board can prove that broker-facing haul converts into real deploy money instead of sitting as decorative clutter.
- `showcase --id chair-handoff`
  - Stages the operator stash with one settled chair that can turn to the best reserve immediately and one missing-boy chair that is still blocked by the family call, so replacement pressure and memorial debt can be reviewed in one board.
- `verify --id field-capture`
  - Confirms the recovered PKM is surfaced in `stash.recoveredHaulSummary.fieldWeapon` with real ammo and salvage value, and that `stash.recoveredHaulSummary.fieldWeaponDecision` exposes a route-aware hold-or-sell call instead of generic loot text.
- `verify --id broker-cashout`
  - Confirms the recovered PKM is no longer sitting on the wall, realized broker credits are booked, and the `Operational Wall` board has flipped that trophy into funded stash money.
- `verify --id chair-handoff`
  - Confirms stash readiness shows a pending replacement, the handoff board carries both a grief-blocked chair and a seat that can turn now, and memorial debt still exposes the missing body behind the blocked swap.
- `showcase --id final-stronghold`
  - Stages the operations-board `Black Orchard Redoubt` reveal so humans can review campaign readiness, prep tracks, reusable prep outputs, and the current launch gate in one surface.
- `verify --id final-stronghold`
  - Confirms the reveal is still in `campaign.finale.state = revealed`, keeps `Black Orchard Redoubt` and `Hinge-9 Brigade` on the board, and proves all four reusable prep outputs are already readable from snapshot.
- `showcase --id recovery-corridor-payoff`
  - Stages a stash-side operations board where one recovered-body raid has already cleared the chair debt, so `campaign.finale.prepOutputs.recovery-path` can be reviewed as a real payoff instead of only a pending recovery-order promise.
- `verify --id recovery-corridor-payoff`
  - Confirms the recovery-path output is live as `Casualty corridor steadied`, chair debt is cleared on the stash side, and the staged raid history still carries a recovered-body proof.
- `showcase --id endgame-amr`
  - Stages the stash-side endgame doctrine pass on a `Bastion AMR` `Broken Signal` plan so humans can review late-war plate-break fit, failure space, and the squad opening around the first anchor kill.
- `showcase --id amr-counter-lane`
  - Stages the live `Broken Signal` plate-break lane where the `Bastion AMR` has to break a plated repeek owner before the Dish Houses crossing hardens.
- `verify --id handgun-recovery`
  - Confirms the sidearm showcase is still a survival-only insert: the bench weapon reads as a deployable sidearm, the doctrine board marks it as the `Wrong tool`, and the boys keep the heavier-lane burden under `Emergency recovery package`.
- `verify --id amr-counter-lane`
  - Confirms the live AMR slice stays focused on `Relay counter lane`, keeps the `Anchor-break package` squad doctrine, and surfaces the explicit `Break the plated anchor first` pressure read.
- `verify --id true-escape`
  - Confirms the campaign is actually won, the closure panel exposes multiple ending beats, and normal deployment is locked so the stash behaves like aftermath instead of another prep cycle.
- `capture --showcase boys-command --selector "[data-squad-grid]"`
  - Captures the focused live squad-card stack so humans can review the per-boy doctrine blocks in one crop.
- `capture --showcase combat-presentation --selector "[data-combat-pulse-panel]"`
  - Captures the focused tactical-drawer `Combat Pulse` board for human review.
- `capture --showcase hardcore-start --selector "[data-hardcore-start-card]"`
  - Captures the focused stash-side `Hard Start` board so humans can review whether the conscript baseline is reading clearly enough.
- `verify --id trench-assault`
  - Confirms the trench shove still has a live `shift-fire` order, one suppress task, one queued frag, and the authored `Pier trench lip` opportunity.
- `verify --id bunker-foothold`
  - Confirms the bunker reset pocket still has a live `settle` action, a `hold-position` boys screen on the concrete mouth, and calmer noise pressure than the open freight lane.
- `verify --id cellar-counterhold`
  - Confirms Broken Signal is still reading as a relay-cellar counterhold: `Relay Cellar` is the active subzone, `Pressure Posture` says `Hold the cellar mouth`, and the boys stay on a `Cellar hold package` while reserve pressure leans on the dish lane.
- `verify --id shed-hide`
  - Confirms Broken Signal is still reading as a live hide-pocket infiltration beat: `Tin shed hide` stays focused, `Pressure Posture` says `Stay dark in the shed`, and the boys flip into a `Hide pocket package` instead of generic reclaim doctrine.
- `capture --showcase weapon-doctrine --selector "[data-weapon-doctrine-card]"`
  - Captures the focused stash-side `Weapon Doctrine` board for human review.
- `capture --showcase field-capture`
  - Captures the full stash loadout wall with the recovered field weapon visible on the rack.
- `capture --showcase field-capture --selector "[data-field-weapon-card]"`
  - Captures the focused stash-side `Field Weapon` doctrine board so humans can review the recovered-gun recommendation without the rest of the wall.
- `capture --showcase broker-cashout`
  - Captures the stash after the recovered PKM has been sold, proving the realized-credit loop on the same north-star wall.
- `capture --showcase final-stronghold`
  - Captures the operations-board `Black Orchard Redoubt` reveal so humans can review whether the endgame gate and current prep outputs are reading clearly enough.
- `capture --showcase recovery-corridor-payoff`
  - Captures the focused operations-board payoff where one memorial return is enough to stage `Casualty corridor steadied` for the finale.
- `capture --showcase endgame-amr --selector "[data-weapon-doctrine-card]"`
  - Captures the focused stash-side `Bastion AMR` doctrine board for human review.
- `capture --showcase amr-counter-lane`
  - Captures the live `Relay counter lane` raid slice so humans can review the plated repeek problem in-context instead of only through stash doctrine.
- `capture --showcase combat-presentation --selector "[data-weapon-doctrine-panel]"`
  - Captures the raid-side `Weapon Doctrine` panel so the same doctrine read can be checked against a live pocket.
- `capture --showcase debrief --selector "[data-debrief-manifest-board]"`
  - Captures the focused stash-side `Manifest Routing` board so the intake wall can be reviewed without the rest of the shell.
- `capture --showcase debrief --selector "[data-debrief-operational-card]"`
  - Captures the focused stash-side `Operational Wall` board so normalized deployable/support/broker/memorial state can be reviewed in one crop.
- `configure`
  - Stash-phase configuration surface.
  - Options: `--route`, `--weapon`, `--service`, `--contract`, `--medkits`, `--ammo-packs`, `--top-tab`, `--command-tab`.
- `start-raid`
  - Starts the next raid with the currently configured stash loadout.
- `move`
  - Holds movement input for a duration, then clears it.
  - Options: `--x`, `--y`, optional `--seconds`.
- `aim`
  - Sets the current aim target in world coordinates.
  - Options: `--x`, `--y`.
- `trigger`
  - Sets or briefly holds the fire trigger.
  - Options: `--held true|false`, optional `--seconds`.
- `focus`
  - Sets or briefly holds the focus input.
  - Options: `--held true|false`, optional `--seconds`.
- `action`
  - Queues one raid action.
  - Option: `--type interact|reload|grenade|heal|stabilize|finish`.
- `support-order`
  - Queues a frontline support order.
  - Option: `--id shift-fire|draw-heat|secure-exfil|hold-position|breach-push`.
- `select-boy`
  - Selects a specific live boy by zero-based slot index.
  - Option: `--index 0|1|2`.
- `squad-order`
  - Queues an individual-boy order for the currently selected boy.
  - Option: `--id follow|defend|attack|brace-watch|move-watch`, plus `--x` and `--y` for `defend`, `brace-watch`, and `move-watch`.
  - `move-watch` is the current CLI id for the `Ctrl + RMB` moving suppression / covering-fire order.
- `squad-action`
  - Queues a reusable tactical action for the currently selected boy.
  - Option: `--id grenade|suppress`, plus required `--x` and `--y`.
- `focus-incident`
  - Changes the focused frontline incident by numeric id, by `index:N`, or clears focus with `--id clear`.
- `focus-extract`
  - Changes the planned exfil focus by extract id, or clears to the route default with `--id clear`.
- `story-pack list`
  - Lists the current offline dialogue story packs under `src/game/dialogue/story-packs`.
- Current north-star packs are `after-action-voices`, `core`, `deadzone-breaths`, and `route-echoes`; the newer packs exist specifically to prove remembered-route, quiet-life contrast, hot-extract, and memorial-carryover chatter can keep growing through authored packs instead of resolver edits.
- `story-pack scaffold`
  - Creates a new offline story-pack file under `src/game/dialogue/story-packs` so agents can add a new story family without editing resolver code.
  - Options: `--id`, optional `--title`, `--summary`, `--story-types`, `--delivery-notes`, `--guardrails`.
- `showcase`
  - Jumps to one of the authored debug showcases.
- Option: `--id briefing|carried-storage|squad-roster|debrief|memorial-wall|dialogue-aftermath|next-push-gear|frontline-aftermath|breach|breach-push|boys-command|grenade-pocket|boys-frag-runtime|suppression-runtime|combat-audio|combat-presentation|extract-clean|extract-collapse|extract-pressure|room-clear|frontline-supply|field-coffee|burner-coffee|expanded-frontline|hostile-lane-chatter|noise-discipline|drone-sweep|war-beat-focus|body-recovery|persistent-body-return|dish-house-breach|recovery-corridor-payoff|caravan-trap|armored-drop|armored-evac|bunker-foothold|cellar-counterhold|shed-hide|civilian-window|hunter-search|blue-carried-fire|blue-carried-extract-success|blue-body-extract|wounded-soldier|surrender-window|territory-claims|territory-retake|relay-counterpush|ambulance-counterhold|weapon-doctrine|field-capture|broker-cashout|handgun-recovery|final-stronghold|final-stronghold-launch|final-stronghold-setback|true-escape|endgame-amr|amr-counter-lane`.
- `verify`
  - Runs an authored doorway or room-clear drill and returns pass/fail assertions plus the full post-drill snapshot.
- Option: `--id doorway-regression|room-clear-drill|room-clear-chain|expanded-frontline|blue-carried-fire|blue-carried-extract-success|blue-body-extract|extract-clean|extract-collapse|body-recovery|combat-presentation|combat-audio|boys-frag-runtime|suppression-runtime|pinned-pressure|territory-claims|hardcore-start|weapon-doctrine|field-capture|broker-cashout|chair-handoff|handgun-recovery|final-stronghold|recovery-corridor-payoff|endgame-amr|amr-counter-lane|final-stronghold-launch|final-stronghold-setback|true-escape|trench-assault|bunker-foothold|cellar-counterhold|shed-hide|territory-retake|relay-counterpush|ambulance-counterhold|retake-peel|civilian-window|hunter-search|wounded-soldier|dialogue-aftermath|field-coffee|burner-coffee|drone-sweep|hostile-lane-chatter|dish-house-breach|caravan-trap|armored-evac|armored-drop|white-van-ambush`, optional `--path`.
- `telemetry`
  - Returns a compact live battlefield metrics payload built from the snapshot, including the consolidated battlefield summary, a battlefield status line, actor positions, and combat balance values.
- `click`
  - Presses a real DOM button using a CSS selector.
  - Option: `--selector`.
- `wait`
  - Lets the simulation run without changing inputs.
  - Option: `--seconds`.
- `screenshot`
  - Saves a viewport screenshot for review.
  - Option: `--path`, optional `--selector` for element-only capture.

## Common Workflows

### Configure and launch a raid

```powershell
npm run game:cli -- configure --route broken-signal --weapon rifle --service signal-jammer --medkits 2 --ammo-packs 3
npm run game:cli -- start-raid
npm run game:cli -- snapshot
```

### Review the tactical briefing overlay

```powershell
npm run game:cli -- showcase --id briefing
npm run game:cli -- capture --showcase briefing --path automation-artifacts/briefing-tactical-slate-2026-04-19.png
npm run game:cli -- capture --showcase briefing --path automation-artifacts/briefing-sector-order-2026-04-19.png
```

### Review the shared sector-order handoff

```powershell
npm run game:cli -- showcase --id burner-coffee
npm run game:cli -- capture --showcase burner-coffee --path automation-artifacts/frontline-operation-live-2026-04-19.png
npm run game:cli -- capture --showcase burner-coffee --selector "[data-frontline-operation-panel]" --path automation-artifacts/frontline-operation-panel-2026-04-19.png
```

### Work a breach lane

```powershell
npm run game:cli -- showcase --id breach
npm run game:cli -- action --type interact
npm run game:cli -- support-order --id breach-push
npm run game:cli -- snapshot
```

### Command one boy onto a lane

```powershell
npm run game:cli -- showcase --id boys-command
npm run game:cli -- select-boy --index 0
npm run game:cli -- squad-order --id defend --x 980 --y 540
npm run game:cli -- squad-order --id brace-watch --x 1040 --y 500
npm run game:cli -- squad-order --id move-watch --x 1080 --y 520
npm run game:cli -- squad-action --id suppress --x 1020 --y 520
npm run game:cli -- squad-action --id grenade --x 1060 --y 520
npm run game:cli -- snapshot
```

### Review a different extract plan inside a staged raid

```powershell
npm run game:cli -- showcase --id extract-pressure
npm run game:cli -- capture --showcase extract-pressure --focus-extract far-relay-spur --path automation-artifacts/extract-pressure-convoy-peel-2026-04-19.png
npm run game:cli -- focus-extract --id far-relay-spur
npm run game:cli -- snapshot
```

### Review the clean-vs-collapse extract comparison board

```powershell
npm run game:cli -- showcase --id extract-clean
npm run game:cli -- verify --id extract-clean --path automation-artifacts/extract-clean-verify-2026-04-20.png
npm run game:cli -- verify --id extract-collapse --path automation-artifacts/extract-collapse-verify-2026-04-20.png
npm run game:cli -- capture --showcase extract-clean --selector "[data-decision-card]" --path automation-artifacts/extract-choice-comparison-2026-04-19.png
npm run game:cli -- capture --showcase extract-clean --path automation-artifacts/extract-clean-2026-04-19.png
npm run game:cli -- capture --showcase extract-collapse --path automation-artifacts/extract-collapse-2026-04-19.png
```

### Review a staged war-beat focus card

```powershell
npm run game:cli -- showcase --id war-beat-focus
npm run game:cli -- focus-incident --id index:2
npm run game:cli -- capture --showcase war-beat-focus --selector "[data-frontline-focus-card]" --path automation-artifacts/war-beat-focus-card-2026-04-19.png
```

### Scaffold a new dialogue story family

```powershell
npm run game:cli -- story-pack scaffold --id trench-echoes --title "Trench Echoes" --summary "Stories about returning to scarred trench lanes" --story-types "returning to bad ground,old losses,new push courage"
npm run game:cli -- story-pack list
```

### Review the current remembered-route dialogue pack

```powershell
npm run game:cli -- story-pack list
npm run game:cli -- showcase --id persistent-body-return
npm run game:cli -- capture --showcase persistent-body-return --path automation-artifacts/route-echoes-persistent-body-return-2026-04-20.png
```

### Review the aftermath dialogue pass

```powershell
npm run game:cli -- story-pack list
npm run game:cli -- showcase --id dialogue-aftermath
npm run game:cli -- capture --showcase dialogue-aftermath --path automation-artifacts/dialogue-aftermath-2026-04-20.png
npm run game:cli -- verify --id dialogue-aftermath --path automation-artifacts/dialogue-aftermath-verify-2026-04-20.png
```

### Review the body-recovery pass

```powershell
npm run game:cli -- showcase --id body-recovery
npm run game:cli -- capture --showcase body-recovery --path automation-artifacts/body-recovery-showcase-2026-04-19.png
```

### Verify the surrender-secure reclaim slice

```powershell
npm run game:cli -- showcase --id surrender-window
npm run game:cli -- verify --id surrender-window --path automation-artifacts/surrender-window-verify-2026-04-20.png
```

The resulting snapshot should keep `map.pressurePosture.posture` on `surrendering`, the focused frontline incident on a routed `secure` pocket with route-intel payoff, and `map.settlement.memoryTags` carrying `surrender-pocket` while convoy and casualty incidents stay live behind the lane.

### Verify a second-raid body return

```powershell
npm run game:cli -- showcase --id persistent-body-return
npm run game:cli -- snapshot
```

The resulting snapshot should show `route.persistentBodies.squad` containing `Yara` and `raid.fallenSquadBodies` containing the same unrecovered body in the live second raid.

### Verify the recovery-driven corridor slice

```powershell
npm run game:cli -- verify --id body-recovery --path automation-artifacts/body-recovery-verify-2026-04-20.png
```

The resulting snapshot should keep `raid.operationExitIntent` on `recovery`, `map.pressurePosture.posture` on `recovering`, and the focused frontline incident on a live casualty-recovery beat.

### Review the mixed boys-loadout wedge

```powershell
npm run game:cli -- showcase --id boys-command
npm run game:cli -- capture --showcase boys-command --path automation-artifacts/boys-command-loadout-wedge-2026-04-19.png
```

### Review the live squad-doctrine stack

```powershell
npm run game:cli -- showcase --id boys-command
npm run game:cli -- capture --showcase boys-command --selector "[data-squad-grid]" --path automation-artifacts/squad-doctrine-grid-2026-04-20.png
```

### Review the hardcore-start stash board

```powershell
npm run game:cli -- showcase --id hardcore-start
npm run game:cli -- capture --showcase hardcore-start --selector "[data-hardcore-start-card]" --path automation-artifacts/hardcore-start-board-2026-04-19.png
```

### Review the weapon-doctrine board

```powershell
npm run game:cli -- showcase --id weapon-doctrine
npm run game:cli -- verify --id weapon-doctrine --path automation-artifacts/weapon-doctrine-verify-2026-04-20.png
npm run game:cli -- capture --showcase weapon-doctrine --selector "[data-weapon-doctrine-card]" --path automation-artifacts/pkm-weapon-doctrine-card-2026-04-20.png
npm run game:cli -- capture --showcase weapon-doctrine --selector "[data-weapon-doctrine-card]" --path automation-artifacts/weapon-doctrine-card-2026-04-19.png
npm run game:cli -- capture --showcase combat-presentation --selector "[data-weapon-doctrine-panel]" --path automation-artifacts/weapon-doctrine-panel-2026-04-19.png
```

The resulting snapshot should keep `route.id` on `broken-signal`, `combat.weaponDoctrine.fitLabel` on `Route-owned`, and `combat.squadDoctrine.title` on `Belt-led crossing package`.

### Review the dish-house CQB slice

```powershell
npm run game:cli -- showcase --id dish-house-breach
npm run game:cli -- verify --id dish-house-breach --path automation-artifacts/dish-house-breach-verify-2026-04-20.png
npm run game:cli -- capture --showcase dish-house-breach --path automation-artifacts/dish-house-breach-2026-04-20.png
```

The resulting snapshot should keep `route.id` on `broken-signal`, `map.activeSubzone.label` on `Dish Houses`, `raid.player.weaponId` on `smg`, and `combat.squadDoctrine.title` on `Room flood package`.

### Review the looted field-weapon rack pass

```powershell
npm run game:cli -- showcase --id field-capture
npm run game:cli -- capture --showcase field-capture --path automation-artifacts/field-capture-rack-2026-04-20.png
```

### Review the broker cash-out pass

```powershell
npm run game:cli -- showcase --id broker-cashout
npm run game:cli -- verify --id broker-cashout --path automation-artifacts/broker-cashout-verify-2026-04-20.png
npm run game:cli -- capture --showcase broker-cashout --path automation-artifacts/broker-cashout-2026-04-20.png
```

### Review the chair-handoff pressure board

```powershell
npm run game:cli -- showcase --id chair-handoff
npm run game:cli -- verify --id chair-handoff --path automation-artifacts/chair-handoff-verify-2026-04-20.png
npm run game:cli -- capture --showcase chair-handoff --path automation-artifacts/chair-handoff-2026-04-20.png
npm run game:cli -- capture --showcase chair-handoff --selector "[data-stash-tab-handoff-card]" --path automation-artifacts/chair-handoff-board-2026-04-20.png
```

### Review the sidearm-only recovery board

```powershell
npm run game:cli -- showcase --id handgun-recovery
npm run game:cli -- verify --id handgun-recovery --path automation-artifacts/handgun-recovery-verify-2026-04-20.png
npm run game:cli -- capture --showcase handgun-recovery --selector "[data-weapon-doctrine-card]" --path automation-artifacts/handgun-recovery-card-2026-04-20.png
```

The resulting snapshot should keep `stash.selectedWeapon` on `pistol`, `combat.weaponDoctrine.fitLabel` on `Wrong tool`, and `combat.squadDoctrine.title` on `Emergency recovery package`.

### Review the final-stronghold readiness board

```powershell
npm run game:cli -- showcase --id final-stronghold
npm run game:cli -- capture --showcase final-stronghold --path automation-artifacts/final-stronghold-operations-2026-04-20.png
npm run game:cli -- capture --showcase final-stronghold --selector "[data-operations-beats]" --path automation-artifacts/final-stronghold-prep-outputs-board-2026-04-20.png
```

### Review the recovery-corridor payoff board

```powershell
npm run game:cli -- showcase --id recovery-corridor-payoff
npm run game:cli -- capture --showcase recovery-corridor-payoff --path automation-artifacts/recovery-corridor-payoff-2026-04-20.png
```

### Review the endgame AMR doctrine board

```powershell
npm run game:cli -- showcase --id endgame-amr
npm run game:cli -- capture --showcase endgame-amr --selector "[data-weapon-doctrine-card]" --path automation-artifacts/endgame-amr-doctrine-card-2026-04-20.png
npm run game:cli -- capture --showcase endgame-amr --path automation-artifacts/endgame-amr-doctrine-full-2026-04-20.png
```

### Review the live AMR counter-lane

```powershell
npm run game:cli -- showcase --id amr-counter-lane
npm run game:cli -- verify --id amr-counter-lane --path automation-artifacts/amr-counter-lane-verify-2026-04-20.png
npm run game:cli -- capture --showcase amr-counter-lane --path automation-artifacts/amr-counter-lane-2026-04-20.png
```

The resulting snapshot should keep `route.id` on `broken-signal`, `frontline.focusedIncident.presentationVariant` on `amr-counter-lane`, `map.pressurePosture.actionLabel` on `Break the plated anchor first`, and `combat.squadDoctrine.title` on `Anchor-break package`.

### Review the debrief manifest-routing board

```powershell
npm run game:cli -- showcase --id debrief
npm run game:cli -- capture --showcase debrief --selector "[data-debrief-manifest-board]" --path automation-artifacts/debrief-manifest-routing-panel-2026-04-19.png
```

### Review the debrief chair-handoff board

```powershell
npm run game:cli -- showcase --id debrief
npm run game:cli -- capture --showcase debrief --selector "[data-debrief-handoff-card]" --path automation-artifacts/debrief-chair-handoff-2026-04-19.png
```

### Review the Deadzone Breaths quiet-life pass

```powershell
npm run game:cli -- story-pack list
npm run game:cli -- showcase --id field-coffee
npm run game:cli -- verify --id field-coffee --path automation-artifacts/field-coffee-verify-2026-04-20.png
npm run game:cli -- showcase --id burner-coffee
npm run game:cli -- verify --id burner-coffee --path automation-artifacts/burner-coffee-verify-2026-04-20.png
npm run game:cli -- capture --showcase burner-coffee --path automation-artifacts/deadzone-breaths-burner-coffee-2026-04-20.png
```

### Review the debrief operational-wall board

```powershell
npm run game:cli -- showcase --id debrief
npm run game:cli -- capture --showcase debrief --selector "[data-debrief-operational-card]" --path automation-artifacts/debrief-operational-wall-2026-04-20.png
```

### Review finale launch, setback, and escape states

```powershell
npm run game:cli -- showcase --id final-stronghold-launch
npm run game:cli -- capture --showcase final-stronghold-launch --path automation-artifacts/final-stronghold-launch-2026-04-20.png
npm run game:cli -- showcase --id final-stronghold-setback
npm run game:cli -- capture --showcase final-stronghold-setback --path automation-artifacts/final-stronghold-setback-2026-04-20.png
npm run game:cli -- showcase --id true-escape
npm run game:cli -- verify --id true-escape --path automation-artifacts/true-escape-verify-2026-04-20.png
npm run game:cli -- capture --showcase true-escape --path automation-artifacts/true-escape-2026-04-20.png
npm run game:cli -- capture --showcase true-escape --selector "[data-debrief-campaign-closure]" --path automation-artifacts/true-escape-closure-2026-04-20.png
```

### Review the combat-pulse readability pass

```powershell
npm run game:cli -- showcase --id combat-presentation
npm run game:cli -- verify --id combat-presentation --path automation-artifacts/combat-presentation-verify-2026-04-20.png
npm run game:cli -- capture --showcase combat-presentation --path automation-artifacts/combat-audio-pass-2026-04-20.png
npm run game:cli -- capture --showcase combat-presentation --selector "[data-combat-pulse-panel]" --path automation-artifacts/combat-pulse-panel-2026-04-19.png
npm run game:cli -- capture --showcase combat-presentation --path automation-artifacts/combat-vfx-pass-2026-04-20.png
npm run game:cli -- capture --showcase combat-presentation --selector "[data-combat-pulse-panel]" --path automation-artifacts/combat-vfx-panel-2026-04-20.png
```

### Review the pinned-pressure crossing window

```powershell
npm run game:cli -- showcase --id pinned-pressure
npm run game:cli -- verify --id pinned-pressure --path automation-artifacts/pinned-pressure-verify-2026-04-20.png
npm run game:cli -- capture --showcase pinned-pressure --path automation-artifacts/pinned-pressure-2026-04-20b.png
```

### Verify the endgame AMR doctrine slice

```powershell
npm run game:cli -- verify --id endgame-amr --path automation-artifacts/endgame-amr-verify-2026-04-20.png
npm run game:cli -- capture --showcase endgame-amr --selector "[data-weapon-doctrine-card]" --path automation-artifacts/endgame-amr-doctrine-card-2026-04-20.png
```

### Verify the raid-side AMR plate-break slice

```powershell
npm run game:cli -- verify --id amr-counter-lane --path automation-artifacts/amr-counter-lane-verify-2026-04-20.png
npm run game:cli -- capture --showcase amr-counter-lane --path automation-artifacts/amr-counter-lane-2026-04-20.png
```

### Verify the final-stronghold setback retry state

```powershell
npm run game:cli -- verify --id final-stronghold-setback --path automation-artifacts/final-stronghold-setback-verify-2026-04-20.png
npm run game:cli -- capture --showcase final-stronghold-setback --path automation-artifacts/final-stronghold-setback-retry-2026-04-20.png
```

### Verify the final-stronghold launch assault plan

```powershell
npm run game:cli -- verify --id final-stronghold-launch --path automation-artifacts/final-stronghold-launch-verify-2026-04-20.png
npm run game:cli -- capture --showcase final-stronghold-launch --selector "[data-operations-beats]" --path automation-artifacts/final-stronghold-launch-assault-plan-2026-04-20.png
```

The resulting snapshot should keep `campaign.finale.state` on `launched`, expose all four assault-plan beats, and show launch-only titles like `First relay belt entered`, `Drag lane under load`, and `Finish the wall or die on the peel`.

### Review the caravan trap kill zone

```powershell
npm run game:cli -- showcase --id caravan-trap
npm run game:cli -- capture --showcase caravan-trap --path automation-artifacts/caravan-trap-showcase-2026-04-19.png
```

### Review the territory-claims scar belt

```powershell
npm run game:cli -- showcase --id territory-claims
npm run game:cli -- capture --showcase territory-claims --path automation-artifacts/territory-claims-showcase-2026-04-19.png
npm run game:cli -- capture --showcase territory-claims --path automation-artifacts/territory-return-district-state-2026-04-20.png
```

### Review the lost-ground settlement retake

```powershell
npm run game:cli -- showcase --id territory-retake
npm run game:cli -- capture --showcase territory-retake --path automation-artifacts/territory-retake-2026-04-20.png
```

### Review the Relay Hamlet counterpush

```powershell
npm run game:cli -- showcase --id relay-counterpush
npm run game:cli -- capture --showcase relay-counterpush --path automation-artifacts/relay-counterpush-2026-04-20.png
npm run game:cli -- verify --id relay-counterpush --path automation-artifacts/relay-counterpush-verify-2026-04-20.png
```

### Review the Ambulance Mile trench counterhold

```powershell
npm run game:cli -- showcase --id ambulance-counterhold
npm run game:cli -- capture --showcase ambulance-counterhold --path automation-artifacts/ambulance-counterhold-2026-04-20.png
npm run game:cli -- verify --id ambulance-counterhold --path automation-artifacts/ambulance-counterhold-verify-2026-04-20.png
```

### Review the Ambulance Mile mortar bracket

```powershell
npm run game:cli -- showcase --id mortar-bracket
npm run game:cli -- capture --showcase mortar-bracket --path automation-artifacts/mortar-bracket-2026-04-20.png
npm run game:cli -- verify --id mortar-bracket --path automation-artifacts/mortar-bracket-verify-2026-04-20.png
```

The resulting snapshot should keep `map.settlement.label` on `Ambulance Mile`, keep the focused incident on `Clinic bracket crew` with `presentationVariant` set to `mortar-bracket`, keep `map.pressurePosture.actionLabel` on `Break the tube before next bracket`, and flip `combat.squadDoctrine.title` to `Mortar break package`.

### Review the settlement-aware retake peel

```powershell
npm run game:cli -- showcase --id retake-peel
npm run game:cli -- capture --showcase retake-peel --path automation-artifacts/retake-peel-2026-04-20.png
npm run game:cli -- verify --id retake-peel --path automation-artifacts/retake-peel-verify-2026-04-20.png
```

### Review the white van comms ambush

```powershell
npm run game:cli -- showcase --id white-van-ambush
npm run game:cli -- capture --showcase white-van-ambush --path automation-artifacts/white-van-ambush-2026-04-20.png
npm run game:cli -- verify --id white-van-ambush --path automation-artifacts/white-van-ambush-verify-2026-04-20.png
```

### Review the drone sweep route-board cut

```powershell
npm run game:cli -- showcase --id drone-sweep
npm run game:cli -- capture --showcase drone-sweep --path automation-artifacts/drone-sweep-2026-04-20.png
npm run game:cli -- verify --id drone-sweep --path automation-artifacts/drone-sweep-verify-2026-04-20.png
```

The resulting snapshot should keep `raid.phase` on `commitment`, `map.settlement.label` on `Relay Hamlet`, the focused incident label on `Relay cut sweep`, `map.pressurePosture.actionLabel` on `Stay low until the board is bagged`, and `combat.squadDoctrine.title` on `Drone slip package`.

### Review the hostile tape-cut dock lane

```powershell
npm run game:cli -- showcase --id hostile-lane-chatter
npm run game:cli -- capture --showcase hostile-lane-chatter --path automation-artifacts/hostile-lane-chatter-2026-04-20.png
npm run game:cli -- verify --id hostile-lane-chatter --path automation-artifacts/hostile-lane-chatter-verify-2026-04-20.png
```

The resulting snapshot should keep `map.pressurePosture.actionLabel` on `Cut the loudest tape first`, keep the focused incident on the `hostile-lane-chatter` variant, and flip `combat.squadDoctrine.title` to `Tape-cut package`.

### Review the burning caravan kill zone

```powershell
npm run game:cli -- showcase --id caravan-trap
npm run game:cli -- capture --showcase caravan-trap --path automation-artifacts/caravan-trap-2026-04-20.png
npm run game:cli -- verify --id caravan-trap --path automation-artifacts/caravan-trap-verify-2026-04-20.png
```

The resulting snapshot should keep `map.pressurePosture.actionLabel` on `Strip the kill zone fast`, keep the focused incident on the `caravan-trap` variant, and flip `combat.squadDoctrine.title` to `Kill zone strip package`.

### Review the civilian evacuation lane

```powershell
npm run game:cli -- showcase --id civilian-window
npm run game:cli -- capture --showcase civilian-window --path automation-artifacts/civilian-window-2026-04-20.png
npm run game:cli -- verify --id civilian-window --path automation-artifacts/civilian-window-verify-2026-04-20.png
```

### Review the stash memorial wall

```powershell
npm run game:cli -- showcase --id memorial-wall
npm run game:cli -- capture --showcase memorial-wall --selector "[data-stash-tab-memorial-wall]" --path automation-artifacts/memorial-wall-panel-2026-04-19.png
npm run game:cli -- capture --showcase memorial-wall --selector "[data-stash-tab-handoff-board]" --path automation-artifacts/chair-handoff-board-2026-04-19.png
```

### Review the armored evac pass

```powershell
npm run game:cli -- showcase --id armored-evac
npm run game:cli -- verify --id armored-evac --path automation-artifacts/armored-evac-verify-2026-04-20.png
npm run game:cli -- capture --showcase armored-evac --path automation-artifacts/armored-evac-showcase-2026-04-19.png
```

### Review the armored troop-drop beat

```powershell
npm run game:cli -- showcase --id armored-drop
npm run game:cli -- verify --id armored-drop --path automation-artifacts/armored-drop-verify-2026-04-20.png
npm run game:cli -- capture --showcase armored-drop --path automation-artifacts/armored-drop-2026-04-20.png
```

### Review the trench-assault authored slice

```powershell
npm run game:cli -- showcase --id trench-assault
npm run game:cli -- capture --showcase trench-assault --path automation-artifacts/trench-assault-showcase-2026-04-20.png
```

### Review the bunker foothold beat

```powershell
npm run game:cli -- showcase --id bunker-foothold
npm run game:cli -- verify --id bunker-foothold --path automation-artifacts/bunker-foothold-verify-2026-04-20.png
npm run game:cli -- capture --showcase bunker-foothold --path automation-artifacts/bunker-foothold-2026-04-20.png
```

### Review the relay cellar counterhold

```powershell
npm run game:cli -- showcase --id cellar-counterhold
npm run game:cli -- verify --id cellar-counterhold --path automation-artifacts/cellar-counterhold-verify-2026-04-20.png
npm run game:cli -- capture --showcase cellar-counterhold --path automation-artifacts/cellar-counterhold-2026-04-20.png
```

### Verify the scar-control territory return

```powershell
npm run game:cli -- verify --id territory-claims --path automation-artifacts/territory-claims-verify-2026-04-20.png
```

### Review the shed-hide infiltration beat

```powershell
npm run game:cli -- showcase --id shed-hide
npm run game:cli -- verify --id shed-hide --path automation-artifacts/shed-hide-verify-2026-04-20.png
npm run game:cli -- capture --showcase shed-hide --path automation-artifacts/shed-hide-2026-04-20.png
```

### Review the frag-grenade pocket

```powershell
npm run game:cli -- showcase --id grenade-pocket
npm run game:cli -- capture --showcase grenade-pocket --path automation-artifacts/grenade-pocket-shared-autonomy-2026-04-19.png
```

### Review the civilian evacuation beat

```powershell
npm run game:cli -- showcase --id civilian-window
npm run game:cli -- capture --showcase civilian-window --path automation-artifacts/civilian-window-escort-column-2026-04-19.png
```

### Review the old-hunter search beat

```powershell
npm run game:cli -- showcase --id hunter-search
npm run game:cli -- capture --showcase hunter-search --path automation-artifacts/hunter-search-2026-04-20.png
npm run game:cli -- verify --id hunter-search --path automation-artifacts/hunter-search-verify-2026-04-20.png
```

### Review the wounded-soldier medical hold

```powershell
npm run game:cli -- showcase --id wounded-soldier
npm run game:cli -- capture --showcase wounded-soldier --path automation-artifacts/wounded-soldier-medical-read-2026-04-20.png
npm run game:cli -- verify --id wounded-soldier --path automation-artifacts/wounded-soldier-verify-2026-04-20-medical-read.png
```

The resulting raid view should surface the dedicated `WOUNDED SOLDIER` / `MEDICAL HOLD LIVE` aftermath board, retitle the boys net around the med lane, and keep the casualty, medic, satchel, and hold-line dressing readable around Yara's split while `Pressure Posture` still says `Keep Yara on the line`.

### Review the surrender lock beat

```powershell
npm run game:cli -- showcase --id surrender-window
npm run game:cli -- capture --showcase surrender-window --path automation-artifacts/surrender-window-showcase-2026-04-19.png
```

### Review the convoy ambush beat

```powershell
npm run game:cli -- showcase --id frontline-supply
npm run game:cli -- capture --showcase frontline-supply --path automation-artifacts/frontline-supply-convoy-ambush-2026-04-19.png
```

### Review the live noise discipline read

```powershell
npm run game:cli -- showcase --id noise-discipline
npm run game:cli -- capture --showcase noise-discipline --path automation-artifacts/noise-discipline-full-2026-04-19.png
npm run game:cli -- capture --showcase noise-discipline --selector "[data-noise-discipline-panel]" --path automation-artifacts/noise-discipline-card-2026-04-19.png
```

### Review the hostile lane chatter scene pass

```powershell
npm run game:cli -- showcase --id hostile-lane-chatter
npm run game:cli -- capture --showcase hostile-lane-chatter --path automation-artifacts/hostile-lane-chatter-scene-2026-04-19.png
```

### Verify the authored building drills

```powershell
npm run game:cli -- verify --id doorway-regression
npm run game:cli -- verify --id room-clear-drill --path automation-artifacts/room-clear-verify.png
npm run game:cli -- verify --id room-clear-chain --path automation-artifacts/room-clear-chain-verify.png
```

### Verify casualty exfil reliability

```powershell
npm run game:cli -- verify --id blue-carried-fire --path automation-artifacts/blue-carried-fire-verify-2026-04-19b.png
npm run game:cli -- verify --id blue-carried-extract-success --path automation-artifacts/blue-carried-extract-success-verify-2026-04-19.png
npm run game:cli -- verify --id blue-body-extract --path automation-artifacts/blue-body-extract-verify-2026-04-19b.png
```

These authored verifies now cover the softer casualty curve too: Blue can be pushed into a longer downed window, the boys can keep a casualty pull alive inside a slightly more forgiving extract ring, the boys can finish a full downed extract back to stash, and body extraction still stays valid after bleedout.

## Doorway Regression Surface

- `room-clear-chain` now walks the authored room targets forward and backward before settling, so repeated doorway crossings are part of the regression surface.
- The `room-clear-chain` verification now checks for deeper room commitment and follow-through room presence, which helps catch doorway wobble that only appears after the first crossing.
- The room-clear showcase now widens the doorway nearest the player on each chained room instead of assuming the first authored exit, so the visible breach lane stays aligned with the active traversal path when rooms have multiple exits.

### Drive from the command line and inspect the result

```powershell
npm run game:cli -- move --x 1 --y 0 --seconds 1.2
npm run game:cli -- trigger --held true --seconds 0.5
npm run game:cli -- action --type reload
npm run game:cli -- snapshot
```

## Notes

- The CLI is intended for agentic playtesting, repeatable inspection, and stable automation hooks.
- `snapshot` is the safest first command before mutating anything.
- `click` exists for UI coverage when a real button path matters more than the API call.
- `snapshot` now exposes a shared operation-arc read during raids through `raid.operationPhase`, `raid.operationPressure`, `raid.operationExitIntent`, `raid.focusedExtractHeat`, `raid.extractRiskRead`, `raid.extractCleanliness`, `raid.crashWaveReadiness`, and `raid.debriefPreview`.
- `snapshot` now also exposes the shared sector-order handoff through `raid.frontlineOperationRead`, `raid.frontlineOperationTitle`, `raid.frontlineOperationEffect`, and `raid.frontlineOperationDeployRead`.
- `snapshot` now also exposes the first district and settlement replayability pass through `map.district`, `map.settlement`, `map.activeSubzone`, `map.pressurePosture`, and their mirrored live-raid copies under `raid`.
- `lastRaidSummary` now also carries `deployedWeaponId`, `deployedWeaponName`, and `capturedWeapon` so the looted-weapon keep-or-sell slice can be verified from CLI output.
### Review the covered crossing command-runtime slice

```powershell
npm run game:cli -- showcase --id covering-crossing
npm run game:cli -- verify --id covering-crossing --path automation-artifacts/covering-crossing-verify-2026-04-20.png
npm run game:cli -- capture --showcase covering-crossing --path automation-artifacts/covering-crossing-2026-04-20.png
```

The resulting raid view should keep Broken Signal on a live antenna-ditch crossing where `Pressure Posture` says `Cross under moving cover`, one boy is planted on `Brace Lane`, one selected boy is on `Covering Move`, and the squad doctrine reads `Covered crossing package`.
