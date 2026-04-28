# Town War Readability Delivery Summary

Date: 2026-04-27

## What Was Built

The town-war readability pass turned trench, ammo crate, dugout, and soldier state from scattered visual clues into a shared read model that can be rendered, inspected, and regression-tested.

The work shipped in three milestones:

1. Read-model truth
2. World-space icon layer
3. Build-preview, inspect-mode, and debrief alignment

## Milestone 1: Read-Model Truth

Added `getTownWarReadabilityOverlay()` in the town-war controller.

The overlay emits snapshot-friendly icon records for:

- trench state: firing, suppressing, idle, no occupant, wrong-facing, no ammo, pinned, casualty;
- ammo crate state: stocked, feeding, low, empty, unlinked, destroyed;
- dugout state: linked, unlinked, shelter active, exposed, damaged, destroyed;
- soldier state: building, firing, suppressing, pinned, retreating, wounded, rescuing, resupplying, low ammo, out of ammo.

The agent snapshot now exposes this under `war.readability`, so tests and future tools can assert actual reason language instead of relying on screenshots only.

Proof:

- `npm run smoke:town-war-readability-model`
- Artifact: `artifacts/town-war-readability-model/readability-model-report.json`

## Milestone 2: World-Space Icon Layer

Rendered the read model in `RaidScene` as compact world-space badges.

Normal play now shows urgent/high-signal states without turning the battlefield into a dense UI overlay. Hover or selected soldier context expands the badge into the same read-model reason text.

The scene runtime debug report now exposes:

- rendered readability icon count;
- normal icon count;
- inspect icon count;
- build-preview icon count;
- inspect-mode active state.

Proof:

- `npm run smoke:town-war-readability-icons`
- Artifacts:
  - `artifacts/town-war-readability-icons/readability-icons-1920x1080.png`
  - `artifacts/town-war-readability-icons/readability-icons-report.json`

## Milestone 3: Preview, Inspect, Debrief Loop

Build placement previews now emit `build-preview` read-model icons before the player pays the cost of placing an order.

Preview reads now cover:

- trench facing and firing arc usefulness;
- ammo crate link or missing link;
- dugout link or too-far placement;
- route length from camp;
- forward exposure;
- bad-retreat risk for trench placement.

Officer inspect mode is currently bound to the `Priorities` pane. Opening that pane reveals inspect-only world badges for support truth that normal mode hides.

Operation debrief building lines now reuse live readability reasons. Example:

```text
Readability Ammo crate empty: No ammo left to support firing.
```

This keeps live icons, inspect/report data, and debrief language aligned.

Proof:

- `npm run smoke:town-war-readability-loop`
- Artifacts:
  - `artifacts/town-war-readability-loop/01-preview-bad-trench.png`
  - `artifacts/town-war-readability-loop/02-preview-valid-support.png`
  - `artifacts/town-war-readability-loop/03-inspect-mode-links.png`
  - `artifacts/town-war-readability-loop/04-live-blocker.png`
  - `artifacts/town-war-readability-loop/05-debrief-readability-reason.png`
  - `artifacts/town-war-readability-loop/readability-loop-report.json`

## Files Changed

Core implementation:

- `src/game/townWar/controller.ts`
- `src/game/scene/RaidScene.ts`
- `src/main.ts`

Smoke coverage:

- `scripts/town-war-readability-model-smoke.mjs`
- `scripts/town-war-readability-icons-smoke.mjs`
- `scripts/town-war-readability-loop-smoke.mjs`
- `package.json`

Documentation:

- `docs/TOWN_WAR_ICON_READABILITY_SPEC.md`
- `docs/TOWN_WAR_READABILITY_3_MILESTONE_NORTH_STAR.md`
- `docs/README.md`
- `wiki/README.md`

## Verification Run

Passed:

- `npm run build`
- `npm run smoke:town-war-readability-model`
- `npm run smoke:town-war-readability-icons`
- `npm run smoke:town-war-readability-loop`
- `npm run smoke:town-war-operation-loop`
- `npm run smoke:town-war-shipping`

## Current Player-Facing Result

A player should now be able to answer:

- Which trench is online?
- Which trench is firing or suppressing?
- Why did a trench stop firing?
- Which ammo crate is feeding the line?
- Which crate is empty or unlinked?
- Is a dugout helping the trench network?
- Which soldiers are wounded, pinned, rescuing, building, firing, resupplying, or retreating?
- Whether a planned build placement is useful before placing it.

## Follow-Up Combat Rule Fix

After the readability pass, a trench could show as occupied while a soldier with ammo stayed on a non-combat `hold` style task and did not fire. That was incorrect for the frontline-officer fantasy.

The current rule is:

- if a soldier is physically occupying a trench slot;
- and has ammo in the magazine or reserve;
- and is not actively moving, building, resupplying, or healing;
- then the trench gives them a defensive fire profile.

This means `hold`/`idle` trench occupants with ammo can acquire targets, spend ammo, damage enemies, and show as `Soldier firing` in the readability overlay.

The follow-up fix also covers normal lane/order-marker behavior: if an armed soldier is already physically occupying a trench, a `defend`/`suppress`/`attack` target marker no longer pulls them out of the slot before they can shoot. Active non-combat jobs still win; builders, resuppliers, medics, and explicit movers continue to travel instead of firing from cover.

Ammo is soldier-carried for firing permission. A linked ammo crate can refill and sustain the trench network, but it is not treated as ammo currently inside the weapon. Readability now warns `Trench needs ammo` only when the occupants have no personal magazine/reserve ammo.

Proof:

- `npm run smoke:town-war-trench-fire`
- Artifacts:
  - `artifacts/town-war-trench-fire/hold-task-trench-firing.png`
  - `artifacts/town-war-trench-fire/trench-fire-report.json`

## Known Remaining Risks

- Inspect mode is bound to the `Priorities` pane, not a dedicated inspect toggle.
- Build-preview route/exposure reads are heuristic and do not yet draw full pathfinding breadcrumbs.
- Older trench/network labels can still add text density in stress scenarios; the new badge layer is compact, but a future polish pass should fold more legacy labels into inspect-only detail.
- The icon glyph system is intentionally ASCII/text-token based for now; later art pass can replace tokens with bespoke bitmap or sprite icons without changing the read model.
