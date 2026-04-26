# Regression Command Surface Audit

## Purpose

This is the Milestone 1 output for [REGRESSION_PROOFING_PLAN.md](./REGRESSION_PROOFING_PLAN.md).

It audits the current CLI and manual as the anti-collapse layer for the project.

It answers three questions:

1. what command surfaces already exist
2. which product-critical systems they cover
3. where the current stability gaps and stale paths still are

## Sources Audited

- [wiki/project-cli.md](../wiki/project-cli.md)
- [scripts/project-cli.mjs](../scripts/project-cli.mjs)

Dispatcher-confirmed top-level commands currently implemented in `scripts/project-cli.mjs`:

- `help`
- `story-pack list`
- `story-pack scaffold`
- `status`
- `snapshot`
- `list`
- `telemetry`
- `metrics`
- `verify`
- `configure`
- `start-raid`
- `move`
- `raid-action`
- `macro`
- `aim`
- `trigger`
- `focus`
- `action`
- `support-order`
- `select-boy`
- `squad-order`
- `squad-action`
- `focus-incident`
- `focus-extract`
- `showcase`
- `click`
- `wait`
- `screenshot`
- `capture`

## Command Surface Matrix

## Inspect

Stable inspect surfaces already present:

- `snapshot`
  - authoritative live game state surface
  - covers stash, raid, route, frontline, extraction, dialogue, and many product reads
- `status`
  - alias for `snapshot`
- `list`
  - available options surface
- `telemetry`
  - compact battlefield diagnostics
- `metrics`
  - alias for `telemetry`

Coverage assessment:

- `route configuration`: covered
- `raid phase`: covered
- `stash summary`: covered
- `weapon doctrine`: covered
- `squad doctrine`: covered
- `extraction hold read`: partially covered
- `wave target/source/timer`: partially covered
- `enemy doorway state`: covered through `raid.doorway`
- `legacy path visibility`: weak
- `overlay visibility state`: weak

## Configure

Stable configure surfaces already present:

- `configure --route --weapon --service --contract --medkits --ammo-packs --top-tab --command-tab`
- `focus-incident --id`
- `focus-extract --id`

Coverage assessment:

- `next raid package`: covered
- `route and loadout selection`: covered
- `focused extract`: covered
- `focused incident`: covered
- `overlay defaults`: partial via stash tabs only

## Force And Stage

Stable state-driving surfaces already present:

- `start-raid`
- `move`
- `aim`
- `trigger`
- `focus`
- `action --type interact|reload|heal|stabilize|finish`
- `raid-action`
- `support-order --id`
- `select-boy --index`
- `squad-order --id`
- `squad-action --id`
- `showcase --id`
- `macro --id`
- `click --selector`
- `wait`

Coverage assessment:

- `raid start`: covered
- `core player movement/combat inputs`: covered
- `squad command surface`: covered
- `authored state staging`: covered through showcases/macros
- `generic force-state control without authored slices`: partial

## Verify

Stable verify surface already present:

- `verify --id <...>`

Major verify families already present in the current help output:

- doorway and room-clear reliability
- casualty carry/body extract
- extraction clean/collapse
- intel alarm
- pressure and combat presentation
- AI fireteam and occupied-building proofs
- route identity and must-clear structure pass
- stash consequence and weapon doctrine
- finale and endgame slices

Coverage assessment:

- `core player loop`: partially covered
- `high-risk AI behavior`: covered better than most systems
- `stash and progression`: partially covered
- `menu/front-door flow`: weak
- `generic runtime reliability outside authored slices`: still weaker than showcase coverage

## Capture

Stable capture surfaces already present:

- `capture --path`
- `capture --showcase`
- `capture --showcase --selector`
- `screenshot --path`

This surface is strong for evidence and review, but capture is not itself stability protection unless tied to inspect or verify.

## Coverage By Product-Critical System

## Menu, Stash, Briefing, Raid Flow

- Inspect: partial
- Configure: partial
- Force/stage: partial
- Verify: weak

Current command support:

- `snapshot`
- `configure`
- `start-raid`
- `click`
- `showcase --id briefing`
- `verify --id first-session-hook`

Main gap:

- no first-class command to force `front door`, `stash`, `briefing`, or `debrief` state directly
- no dedicated verify for `main menu -> stash -> raid -> stash return`

## Loadout And Equip Flow

- Inspect: partial
- Configure: good
- Force/stage: partial
- Verify: partial

Current command support:

- `configure`
- `snapshot`
- authored verifies like `knife-extreme`, `weapon-doctrine`, `handgun-recovery`

Main gap:

- no direct CLI command to equip or swap a specific stash item in live state
- no single verify ladder for all weapon classes appearing in stash and equipping cleanly

## Intel Flow

- Inspect: partial
- Configure: weak
- Force/stage: authored only
- Verify: good

Current command support:

- `showcase --id intel-alarm`
- `verify --id intel-alarm`
- `snapshot`

Main gap:

- no direct generic `force intel live` or `start intel hold` command outside showcase staging

## Extraction Flow

- Inspect: partial
- Configure: partial
- Force/stage: partial
- Verify: decent

Current command support:

- `focus-extract`
- `showcase --id extract-clean|extract-collapse`
- `verify --id extract-clean|extract-collapse`
- `snapshot`

Main gap:

- no direct generic `force extraction ready` or `start extraction hold` command
- extraction timing is inspectable indirectly, but not yet as a clearly documented dedicated inspect field set in the manual

## Wave Triggering And Spawn Targeting

- Inspect: partial
- Configure: weak
- Force/stage: weak
- Verify: partial

Current command support:

- `verify --id intel-alarm`
- `verify --id extract-clean|extract-collapse`
- `snapshot`

Main gap:

- no generic CLI stage command for `intel-wave`, `extraction-wave`, `body-wave`, or `noise-wave`
- no explicit manual section that says where wave source/target/timer live in snapshot

## Enemy Room Chase And Doorway Traversal

- Inspect: good
- Configure: weak
- Force/stage: authored only
- Verify: good

Current command support:

- `telemetry`
- `snapshot.raid.doorway`
- `verify --id doorway-regression`
- `verify --id room-clear-drill`
- `verify --id room-clear-chain`

Main gap:

- the best coverage is still authored drills, not a generic forceable chase setup

## Squadmate Survivability And Recovery

- Inspect: partial
- Configure: weak
- Force/stage: authored only
- Verify: decent

Current command support:

- casualty showcases/verifies
- `snapshot`
- `verify --id body-recovery`
- `verify --id blue-carried-fire`
- `verify --id blue-body-extract`

Main gap:

- no generic command to force a casualty state or recovery corridor without a showcase

## UI Overlay Visibility And State Transitions

- Inspect: weak
- Configure: weak
- Force/stage: weak
- Verify: very weak

Current command support:

- `click`
- `capture`
- `showcase`

Main gap:

- no inspect-level truth for front-door, stash, briefing, or hidden HUD state
- no dedicated verify for overlay bleed-through, hidden cards, or surface exclusivity

## Route Identity And Must-Clear Structure Reads

- Inspect: good
- Configure: partial
- Force/stage: authored only
- Verify: good

Current command support:

- `snapshot`
- `configure --route`
- `verify --id route-identity-pass`
- `verify --id must-clear-structure-pass`

Main gap:

- little generic staging outside authored slices

## Missing Coverage List

These are the most important missing or underpowered command surfaces today.

1. No first-class phase forcing for `front-door`, `stash`, `briefing`, `debrief`, and `raid`.
2. No dedicated inspect summary for UI overlay visibility and exclusivity.
3. No direct equip command that stages a weapon class from stash into the active slot through the same path the player uses.
4. No generic force commands for `intel live`, `extract ready`, `extract hold active`, `body alarm pending`, or `wave pending`.
5. No dedicated verify for `main menu -> stash -> raid -> stash return`.
6. No dedicated verify for `all stash weapon classes appear and equip cleanly`.
7. No explicit regression command for `no legacy pseudo-units active`.
8. No generic wave audit verify that covers source, target, timer, and same-room spawn exclusion across all wave types.
9. No forceable generic casualty/recovery setup outside authored showcase slices.
10. No explicit manual contract for which snapshot fields are the trusted inspect surface for:
   - extraction countdown
   - pending waves
   - overlays
   - selected weapon/equip state
   - legacy toggles

## Stale And Debt List

These are not necessarily broken, but they are anti-stability debt.

1. The manual is command-rich but contract-light.
   - it lists many examples
   - it does not yet clearly separate inspect/configure/force/verify/deprecated surfaces

2. Showcase coverage is stronger than generic force coverage.
   - many product states are easiest to reach through authored showcase ids
   - that is useful, but it is not the same as a stable generic stage layer

3. `status` and `metrics` are aliases, not distinct surfaces.
   - acceptable, but they should be documented explicitly as aliases

4. UI-regression protection is weak.
   - recent work hid multiple live panels
   - there is still no dedicated verify ladder for overlay cleanliness and surface exclusivity

5. Manual examples are large and somewhat duplicate-heavy.
   - useful for discovery
   - weak for fast trust and maintenance

6. Some important player promises are only indirectly verified.
   - menu/stash continuity
   - stash equip completeness
   - legacy path suppression
   - generic wave discipline

## Audit Read

The CLI is already strong enough to serve as the anti-collapse backbone.

Current strengths:

- strong inspect baseline through `snapshot`
- strong authored verify library
- strong raid input driving
- strong capture/evidence surfaces

Current weaknesses:

- weak generic stage/force layer for risky runtime states
- weak UI overlay inspection and verification
- weak direct equip-path commands
- manual is still more of a rich usage guide than a strict stability contract

## Milestone 1 Result

Milestone 1 should be considered completed with these outputs:

- command-surface matrix
- missing-coverage list
- stale/debt list

Recommended next move:

- Milestone 2. Inspect Layer Completion

That is the highest-leverage next step, because it will turn several current guess-and-click regressions into terminal-visible state before adding more force commands or more verifies.
