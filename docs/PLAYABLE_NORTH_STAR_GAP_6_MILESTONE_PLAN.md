# Playable North Star Gap 6 Milestone Plan

## Purpose

This plan turns the current feature push into a playable, readable construction experience. The gap is not that the simulation lacks nouns. The gap is that the real screen still reads like the inherited shooter plus a small `Orders` panel.

The target is:

`building is the main verb, trenches look like terrain, and AI visibly proves why the player’s construction choices matter.`

## Current Baseline

The game already has:

- an `Orders` drawer with Build, Priorities, Camp, and Debrief panes;
- mouse placement for trenches and ammo crates;
- scroll rotation for trench previews;
- town-war soldiers, priorities, skills, orders, ammo crates, cover slots, and debrief data;
- Phaser rendering for ghost trenches, completed trenches, and ammo crates.

The current problem:

- building access is too hidden;
- old raid HUD noise competes with officer-war play;
- trenches are primitive graphics, not terrain-grade fieldworks;
- AI use of trenches is mechanically present but visually weak;
- cause and effect is buried in panels and snapshots.

## Milestone 1 - Construction Mode Owns The Screen

Status: Implemented. Town-war play now has a dedicated `Build` chip beside the playfield HUD. Opening it shows compact construction controls for tool, stock, angle, pending orders, trench placement, ammo placement, fast trench, and queue ammo. Active build mode suppresses inherited raid HUD noise and supports `Esc`, right-click, and toggle cancellation.

### Goal

Make building feel like a first-class mode, not a drawer afterthought.

### Work

- Add a dedicated `Build` mode button/chip that is always visible during town-war play.
- When active, reduce or collapse inherited extraction-era HUD cards that do not support building.
- Keep the center playfield clear.
- Show only essential construction info: selected tool, stock, angle, cost, pending order count.
- Add an obvious cancel path: `Esc`, right-click, and active button toggle.

### Acceptance

- A player can discover building within 5 seconds of entering the town-war view.
- The build mode does not require scrolling through the Orders drawer.
- Screenshots read as a construction/war game, not a raid HUD with a side tool.

## Milestone 2 - Terrain-Grade Trench Visuals

Status: Implemented. Trench preview, active build orders, completed trenches, and occupied trenches now share a terrain-grade renderer with ghost, rough, complete, occupied, and damaged states. Completed trench sections render once per trench group under soldiers with dirt rims, inner shadow, lip/sandbag hints, rotation marks, and separate occupied-slot markers.

### Goal

Replace debug-looking primitive trenches with readable battlefield terrain.

### Work

- Create a reusable trench renderer or sprite set for:
  - planned ghost;
  - rough trench;
  - complete trench;
  - damaged trench;
  - occupied trench.
- Add dirt rims, inner shadow, lip/sandbag hints, facing marks, and depth.
- Use rotation consistently for preview, pending order, and completed trench.
- Make trenches visually sit under soldiers, not float above the map.

### Acceptance

- A completed trench looks like dug ground at 1920x1080.
- Rotation and facing are understandable without reading text.
- Rough vs complete trench state is visible.

## Milestone 3 - Soldier Use Is Visible

Status: Implemented. Trench bays now draw state markers for reserved, occupied, contested, and abandoned slots. Soldiers moving into trenches draw intent lines to their assigned firing bay, occupied slots keep soldier stance markers, and trench labels call out taking, holding, pinned, exposed flank, contested, or empty/no-defender states from live soldier cover intent.

### Goal

Make AI occupation of trenches obvious on the map.

### Work

- Draw occupancy slots or subtle stance markers inside trenches.
- Make soldiers visibly move into trench slots under pressure.
- Add short-lived callouts:
  - `Taking trench`
  - `Holding firing slit`
  - `Pinned in trench`
  - `Leaving exposed flank`
- Show when a trench is reserved, occupied, contested, or abandoned.

### Acceptance

- The player can watch soldiers use a trench without opening a panel.
- Occupied trenches feel alive.
- If a trench is ignored, the game explains why.

## Milestone 4 - Construction Feedback Loop

Status: Implemented. Active construction now draws builder-to-site travel intent, site pings, in-world progress bars, partial rough trench cuts, and live risk labels for no builder, stalled work, exposed work, weak/no cover fire, and ammo-support problems. Completed construction emits a short settling pulse and one completion callout per finished build order, so the before/during/after loop is visible on the battlefield.

### Goal

Make build orders produce dramatic before/during/after feedback.

### Work

- Show builder travel line or intent ping.
- Show build progress in-world near the site.
- Add rough trench partial-cover state while building.
- Add completion burst: dirt settles, marker fades, soldiers react.
- Add failure states: stalled, exposed, no builder, no supply, under fire.

### Acceptance

- The player can tell whether a trench is planned, being built, usable, or complete.
- A builder under risk becomes readable drama.
- Completion feels like a battlefield event.

## Milestone 5 - Cause-And-Effect Combat Proof

Status: Implemented. Occupied trench groups now draw live combat-proof highlights from real cover slots, occupants, enemy angles, pressure, and directional fit: front-facing trenches call out pressure reduction, angled trenches show partial cover, and enfiladed trenches warn that cover is weak. Ammo crates with nearby suppressors now call out when ammo is keeping suppression alive. The officer Debrief pane also includes a latest-build outcome card that summarizes occupancy, facing quality, pressure saved, ammo support, and the build outcome cause.

### Goal

Show that terrain changed the fight.

### Work

- Add visual proof when cover reduces pressure or damage.
- Add simple combat labels sourced from real state:
  - `pressure reduced by trench`
  - `front protected`
  - `flanked, cover weak`
  - `ammo kept suppression alive`
- Highlight the trench that affected a soldier’s survival or fallback.
- Add a small after-action card for the last important build outcome.

### Acceptance

- The player can answer: “What did this trench do?”
- Directional placement matters visibly.
- Bad trench facing or flank exposure is shown, not hidden.

## Milestone 6 - Playable One-Line Build Loop

Status: Implemented. Normal mouse trench placement now queues a real construction order instead of spawning an instant debug trench, while the separate fast-trench test control remains available. A dedicated Playwright proof script (`npm run smoke:town-war-loop`) runs the full 1920x1080 town-war construction story at `http://127.0.0.1:5847/`: preview and scroll-rotate a trench, queue the real trench order, watch construction feedback, advance to AI occupation under pressure, open the Debrief pane, and write screenshots plus a machine-readable debrief to `artifacts/town-war-playable-loop/`.

### Goal

Deliver a complete first playable construction loop.

### Work

- Script or tune one repeatable town-war scenario where:
  - the player places a trench;
  - rotates it;
  - soldiers build it;
  - soldiers occupy it;
  - enemies pressure it;
  - the trench either saves the line or fails for a readable reason.
- Add a debrief that names:
  - builder;
  - trench;
  - angle/facing;
  - ammo support;
  - AI occupation;
  - hold/fail reason.
- Add browser QA screenshots for preview, build, occupation, and debrief.

### Acceptance

- A new player can place one trench and understand why it mattered.
- The loop works at `http://127.0.0.1:5847/` in 1920x1080.
- The screen visibly changes more than the data changes.

## Final Gate

This gap is solved when a player can say:

`I placed that trench there, rotated it that way, watched my soldiers dig and occupy it, saw it reduce pressure, and understood why it held or failed.`

Until that sentence is true, do not add more building types.
