# Town War Readability 3 Milestone North Star

## Purpose

This plan turns `TOWN_WAR_ICON_READABILITY_SPEC.md` into an implementation path. The goal is to make the current first-town operation loop readable in the battlefield itself: trenches, ammo crates, dugouts, and soldiers should explain whether they are working, blocked, dangerous, or missing support without forcing the player to decode panels.

The north-star outcome is:

`A new player can look at a trench line and understand why it is online, why it is firing, why it stopped firing, what the ammo crate is doing, whether the dugout is placed correctly, and which soldier state matters right now.`

## Product Rule

Readability work must support the officer-war loop:

`prepare -> place build order -> soldiers execute -> trench comes online -> ammo/dugout support matters -> soldiers fight or fail -> debrief explains the same truth`.

Do not spend these milestones on broad UI polish, generic legends, new economy, new map scope, or extraction-only surfaces.

## Source Spec

Primary spec:

- `docs/TOWN_WAR_ICON_READABILITY_SPEC.md`

Related active docs:

- `docs/PERSISTENT_WAR_OFFICER_FORK_INTENT.md`
- `docs/RIMWORLD_FOXHOLE_DELIVERY_6_MILESTONE_NORTH_STAR.md`
- `docs/SHIP_READINESS_REPORT.md`

## Milestone 1: Readability Truth Model

### Player Promise

The game knows why every important trench, ammo crate, dugout, and soldier state is readable before it tries to draw icons. Future agents can inspect those reasons from snapshots and smoke tests instead of guessing from screenshots.

### Scope

Add a controller-level read model for battlefield feedback:

- trench state: planned, building, online idle, occupied, firing, suppressing, blocked, overrun, disabled;
- trench blocker reason: no occupant, no ammo, no linked ammo, wrong facing, no target, pinned occupants, wounded occupant, bad retreat, path blocked;
- ammo crate state: planned, building, stocked, feeding, low, empty, unlinked, unreachable, destroyed;
- dugout state: planned, building, linked shelter, shelter active, rally active, unlinked, exposed, full, damaged;
- soldier state: moving, building, occupying, firing, suppressing, resupplying, low ammo, out of ammo, pinned, wounded, rescuing, carrying wounded, retreating, recovering, stalled.

### Implementation Direction

Create one shared read-model shape instead of scattering UI decisions through render code:

```ts
type ReadabilityIconTone = "ok" | "working" | "warn" | "danger" | "disabled" | "info";

interface TownWarReadabilityIcon {
  id: string;
  targetType: "trench" | "ammo-crate" | "dugout" | "soldier" | "camp";
  targetId: string;
  icon: string;
  tone: ReadabilityIconTone;
  priority: number;
  label: string;
  shortReason: string;
  detailLines: string[];
  worldX: number;
  worldY: number;
  visibility: "normal" | "inspect" | "build-preview";
  pulse?: "none" | "slow" | "shot" | "danger";
}
```

Recommended entry point:

- `getTownWarReadabilityOverlay()`

Optional internal helpers:

- `getTownWarTrenchReadabilityIcons()`
- `getTownWarAmmoCrateReadabilityIcons()`
- `getTownWarDugoutReadabilityIcons()`
- `getTownWarSoldierReadabilityIcons()`

### Acceptance

- Snapshot/CLI access exposes the read model.
- A smoke can stage or discover at least these states:
  - wrong-facing trench;
  - correct trench with no occupant;
  - occupied trench without ammo;
  - ammo-linked firing trench;
  - stocked crate;
  - empty crate;
  - unlinked dugout;
  - linked dugout;
  - pinned soldier;
  - wounded or rescuing soldier.
- Each blocker has one top-priority `shortReason`.
- Icon labels use player-facing language, not raw enum names.

### Proof

Add:

- `npm run smoke:town-war-readability-model`

The smoke should assert read-model data, not pixels.

### Non-Goals

- No new art pass.
- No full DOM overlay yet.
- No permanent legend.
- No balance changes unless required to stage readable states.

### Agent Handoff

- Owner: Codex
- Date: 2026-04-27
- Files changed: `src/game/townWar/controller.ts`, `src/main.ts`, `package.json`, `scripts/town-war-readability-model-smoke.mjs`, `docs/TOWN_WAR_READABILITY_3_MILESTONE_NORTH_STAR.md`, `docs/README.md`, `wiki/README.md`
- API/CLI proof: `townWarController.getReadabilityOverlay()` now returns a snapshot-friendly icon read model with `icons`, `totals`, and `readable`; `window.__topdownExtractionAgentApi.getTownWarReadabilityOverlay()` exposes the same data; `getSnapshot().war.readability` carries the overlay for agents. The model covers trench blockers, ammo crate stock/link state, dugout link/shelter state, and urgent soldier states.
- Smoke proof: `npm run build`, `npm run smoke:town-war-readability-model`, and `npm run smoke:town-war-operation-loop` passed. The new smoke stages wrong-facing trench, no-occupant trench, empty ammo crate, unlinked dugout, linked/shelter dugout, pinned soldier, wounded soldier, and rescue state, then asserts player-facing icon reasons from the read model.
- Open risks: this is data-only readability. No world-space icons are rendered yet, no build-preview warnings exist yet, and the debug staging helpers used by the smoke are not player-facing tools.

## Milestone 2: World-Space Icon Layer

### Player Promise

The player can look at the battlefield and immediately tell which trench line is working, which support object is missing something, and which soldier states require attention.

### Scope

Render the Milestone 1 read model as restrained world-space icons:

- normal mode badges for selected/hovered objects and warnings;
- always-visible urgent states for wounded, rescuing, pinned, empty ammo, blocked trench, and misplaced dugout;
- firing/suppression pulses that appear only when the state is live;
- hover or inspect tooltip text for `shortReason` and `detailLines`;
- icon stacking rules from `TOWN_WAR_ICON_READABILITY_SPEC.md`.

### UI Direction

The icon layer should feel like field notation, not a strategy-game spreadsheet:

- small symbols with strong silhouettes;
- muted military palette with green/amber/red/blue-gray tones;
- no large center-screen overlay during normal play;
- no more than one primary badge plus one urgent secondary badge per object in normal mode;
- inspect mode can reveal full support stacks.

### Acceptance

At 1920 x 1080:

- icon badges do not cover the central fight or lower-middle playfield;
- selected/hovered trench explains online/firing/blocker state;
- a non-firing trench shows the top missing condition;
- ammo crate icon shows stocked, feeding, low, empty, or unlinked state;
- dugout icon shows linked or misplaced state;
- soldier badges distinguish building, firing, pinned, wounded, rescuing, resupplying, and retreating;
- tooltip text matches the read-model `shortReason`.

### Proof

Add or extend:

- `npm run smoke:town-war-readability-icons`

Browser artifacts should capture:

- online/firing trench;
- blocked trench with missing reason;
- stocked or feeding crate;
- empty crate;
- linked dugout;
- misplaced dugout;
- soldier state cluster.

Suggested artifact folder:

- `artifacts/town-war-readability-icons/`

### Non-Goals

- No full tutorial.
- No redesign of the whole officer pane.
- No high-density always-on tactical overlay.
- No new building types.

### Agent Handoff

- Owner: Codex
- Date: 2026-04-27
- Files changed:
  - `src/game/scene/RaidScene.ts`
  - `package.json`
  - `scripts/town-war-readability-icons-smoke.mjs`
  - `docs/TOWN_WAR_READABILITY_3_MILESTONE_NORTH_STAR.md`
  - `docs/README.md`
  - `wiki/README.md`
- Browser proof:
  - `artifacts/town-war-readability-icons/readability-icons-1920x1080.png`
  - `artifacts/town-war-readability-icons/readability-icons-report.json`
- Smoke proof:
  - `npm run build`
  - `npm run smoke:town-war-readability-icons`
- Open risks:
  - The marker layer is intentionally compact and normal-mode only; full inspect-mode surfacing and build-preview explanations remain Milestone 3.
  - Existing trench/fieldwork labels can still create local text density around staged stress scenarios. The new icon layer avoids adding full reasons unless hovered or selected, but the older labels should be rationalized during the inspect-mode pass.

## Milestone 3: Build Preview, Inspect Mode, And Operation Loop Proof

### Player Promise

The player learns the system before paying the cost. While placing battlefield infrastructure, the game predicts whether the order will be useful, linked, exposed, or blocked. After the fight, the debrief and battlefield icons agree about what happened.

### Scope

Complete the player-facing readability loop:

- build-preview icons for trench facing, expected firing arc, path from camp, ammo link, dugout link, exposed builder risk, and bad retreat/wire risk;
- officer inspect mode that reveals all read-model icons and support links;
- debrief alignment so operation-loop consequences use the same reason language as world-space icons;
- screenshot/smoke proof through a complete operation segment.

### Build Preview Requirements

Trench preview should answer:

- Does this face the enemy?
- What arc will it cover?
- Can soldiers reach it?
- Will it connect to ammo or dugout support?
- Is the builder exposed?
- Is retreat likely blocked?

Ammo crate preview should answer:

- Which trench slots will it feed?
- Is it close enough or network-linked?
- Can haulers reach it?
- Is it too exposed?

Dugout preview should answer:

- Is it behind or beside the line?
- Which trench network will it support?
- Can wounded/suppressed soldiers shelter there?
- Is it too far, too forward, or path-blocked?

### Inspect Mode Requirements

Inspect mode should reveal:

- all trench online/offline badges;
- all ammo and dugout links;
- occupied slot counts;
- firing arcs;
- top blocker reasons;
- soldier task badges;
- support chain from camp to crate to trench to dugout.

### Acceptance

The complete loop is readable:

1. Preview shows a bad trench placement before placement.
2. Preview shows a useful trench placement before placement.
3. Preview shows whether an ammo crate will feed the line.
4. Preview shows whether a dugout is linked correctly.
5. After construction, normal mode shows the most urgent states without clutter.
6. Inspect mode reveals full support truth.
7. A trench that stops firing reports the same reason in icon tooltip, inspect mode, and debrief/report data.
8. Operation-loop smoke still passes.

### Proof

Add or extend:

- `npm run smoke:town-war-readability-loop`

Run alongside:

- `npm run smoke:town-war-operation-loop`
- `npm run smoke:town-war-shipping`

Browser artifacts should capture:

- build preview bad placement;
- build preview valid support;
- inspect mode with links;
- live firing/blocked trench;
- debrief matching the same reasons.

Suggested artifact folder:

- `artifacts/town-war-readability-loop/`

### Non-Goals

- No onboarding campaign.
- No new operation economy.
- No multiplayer command UI.
- No giant map readability layer.
- No replacing the existing debrief, only aligning its reason language.

### Agent Handoff

- Owner: Codex
- Date: 2026-04-27
- Files changed:
  - `src/game/townWar/controller.ts`
  - `src/game/scene/RaidScene.ts`
  - `src/main.ts`
  - `package.json`
  - `scripts/town-war-readability-loop-smoke.mjs`
  - `docs/TOWN_WAR_READABILITY_3_MILESTONE_NORTH_STAR.md`
  - `docs/TOWN_WAR_ICON_READABILITY_SPEC.md`
  - `docs/README.md`
  - `wiki/README.md`
- API/CLI proof:
  - `getTownWarReadabilityOverlay()` now includes `build-preview` icons and `totals.buildPreview`.
  - Agent API now exposes `stageTownWarBuildPreview(...)` and `setTownWarOfficerPane(...)` for deterministic preview/inspect smoke staging.
- Browser proof:
  - `artifacts/town-war-readability-loop/01-preview-bad-trench.png`
  - `artifacts/town-war-readability-loop/02-preview-valid-support.png`
  - `artifacts/town-war-readability-loop/03-inspect-mode-links.png`
  - `artifacts/town-war-readability-loop/04-live-blocker.png`
  - `artifacts/town-war-readability-loop/05-debrief-readability-reason.png`
  - `artifacts/town-war-readability-loop/readability-loop-report.json`
- Smoke proof:
  - `npm run build`
  - `npm run smoke:town-war-readability-loop`
  - `npm run smoke:town-war-readability-model`
  - `npm run smoke:town-war-readability-icons`
  - `npm run smoke:town-war-operation-loop`
  - `npm run smoke:town-war-shipping`
- Open risks:
  - Inspect mode is currently bound to the officer `Priorities` pane rather than a dedicated standalone inspect toggle.
  - Preview predictions cover facing, ammo/dugout link, route length, exposure, and retreat warning; they do not yet visualize full pathfinding breadcrumbs from camp to build site.
  - Existing legacy trench/network text still contributes some clutter in dense stress screenshots; the new read-model badges are compact, but a future polish pass should consolidate older labels into inspect-only detail.

## Final North Star Gate

The three milestones are complete when a new player can watch one first-town operation and correctly answer:

- Which trench is online?
- Which trench is firing?
- Why did a trench stop firing?
- Which ammo crate is feeding the line?
- Which ammo crate is empty or unlinked?
- Is the dugout helping the trench network?
- Which soldiers are building, pinned, wounded, rescuing, resupplying, or retreating?
- What one action would most likely fix the line?

Final proof should include:

- one read-model smoke;
- one browser icon screenshot pass;
- one build-preview/inspect/debrief loop smoke;
- operation-loop and shipping smokes still passing.

## Documentation Updates Required

Each milestone should update:

- this document's relevant `Agent Handoff` block;
- `docs/TOWN_WAR_ICON_READABILITY_SPEC.md` only if the icon grammar changes;
- `docs/FRONTLINE_OFFICER_PLAYER_QUICKSTART.md` if controls or player-facing inspect behavior changes;
- `docs/SHIP_READINESS_REPORT.md` if readability meaningfully changes demo readiness;
- `docs/README.md` and `wiki/README.md` when a new smoke or proof surface is added.
