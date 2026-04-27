# Frontline Colony Sim North Star

## Purpose

This document is the next handoff for pushing `Frontline Officer` toward:

`Foxhole field construction + RimWorld worker priorities + an NPC-driven frontline colony sim.`

The player is currently assumed to play the Russian-side camp (`camp-a`) only. `camp-a` is the right-side player camp. `camp-b` is the left-side Ukrainian enemy camp. Later, the game should support both sides, but that is not part of these milestones.

## North Star

The game should feel like the player manages a living frontline colony, not a squad of disposable units.

The player does not only place trenches. The player runs a camp that feeds, arms, heals, assigns, and exhausts specific people who then fight over a trench line. Every order should connect three things:

- camp life;
- soldier priorities and skills;
- visible frontline survival.

The target sentence is:

`I changed the camp priorities, sent named soldiers to build and hold a line, watched their needs and skills affect the work, and understood why the frontline held or broke.`

## Current Baseline

The project already has:

- a town-war state with two camps;
- Russian-side player/officer flow via `camp-a`;
- build mode, trench placement, scroll rotation, and builder execution;
- NPC skills, priorities, work choices, ammo crates, camp work, and debrief surfaces;
- trench occupation and combat proof;
- Playwright smoke coverage for the trench construction loop.

The remaining gap is that this does not yet feel enough like a colony sim. Soldiers can have stats, but the player needs to see a frontline camp economy of work, rest, supplies, wounds, and priority choices changing the battle.

## Design Rules

- Keep the current player side as Russian/camp-a.
- Do not build faction switching yet.
- Do not add a huge world map.
- Do not add many new building types before the existing camp/frontline loop feels alive.
- Make every new stat or priority visibly change behavior.
- Make the map tell the story first, then panels explain it.
- CLI/debug API proof comes before UI polish.

## Milestone 1 - Camp Work Becomes The Colony Loop

Status:
Implemented 2026-04-26

### Goal

Make camp-a feel like a small frontline colony whose daily work affects the trench fight.

### Player Picture

The player opens the officer tools and sees the Russian camp as a work colony:

- builders are tired after digging;
- cooks improve readiness;
- haulers move ammo forward;
- medics recover wounded;
- riflemen cover workers;
- low rest or food makes soldiers brittle under pressure.

The player changes priorities before placing a trench:

- two engineers are set to build;
- one soldier is kept on hauling ammo;
- one medic is kept out of assault work;
- camp cooking/rest priority is raised before the next push.

Then the trench order plays differently because the camp was prepared differently.

### One-Pass Implementation Scope

- Add or tighten camp-a readable needs:
  - food/readiness;
  - rest/fatigue;
  - medical load;
  - ammo/build supply pressure.
- Make at least three work priorities visibly affect assignment:
  - Build;
  - Haul/Resupply;
  - Medic/Recover.
- Add one compact camp status panel under officer tools.
- Add one map-facing feedback layer:
  - `Hungry camp: slower build`;
  - `Rested builders: faster dig`;
  - `Medic recovering wounded`;
  - `Ammo runner supplying trench`.
- Add CLI/debug API proof for setting camp priorities and advancing the war.

### Acceptance

- A player can change camp-a priorities and see different soldiers take different work.
- A trench build changes speed, safety, or support based on camp readiness.
- At least one wounded/recovery or fatigue/readiness state is visible without reading raw debug data.
- The UI makes the camp feel like a living work site, not only a health bar.
- Browser QA at `1920x1080` captures before priority, work in motion, and after-effect screenshots.

### Agent Work Log

Agent:
Codex

Date:
2026-04-26

Files changed:
`src/game/townWar/controller.ts`, `src/main.ts`, `src/styles.css`, `src/game/scene/RaidScene.ts`, `scripts/town-war-colony-wiring-smoke.mjs`, `package.json`

CLI/API proof:
`npm run build` passes. `npm run smoke:town-war-colony` proves camp-a combatants are the same soldier objects used by colony work, priority changes drive selected work, a fighting soldier auto-covers or moves into cover for a high-risk trench build, and a medic auto-peels into rescue when a reachable casualty appears.

Browser proof:
`npm run smoke:town-war-colony` captures the required `1920x1080` before/work/after screenshots. `npm run smoke:town-war-loop` still passes at `1920x1080` after the colony UI and camp-map feedback pass, proving the trench placement/build/occupation loop still works.

Screenshots/artifacts:
Milestone screenshots are under `artifacts/town-war-colony-loop/`: `01-before-priority.png`, `02-work-in-motion.png`, `03-after-effect-camp-panel.png`, plus `colony-wiring.json`. The existing playable loop screenshots are refreshed under `artifacts/town-war-playable-loop/`.

Notes for next agent:
Milestone 1 now has the full loop: fighting soldiers are colony workers, the officer camp tab shows readiness, food, build supply, med load, ammo need, fatigue, hunger, and active worker counts, and camp map callouts summarize readiness/ammo/workers/wounded near camp-a. The officer UI now labels camp-a as the current Russian/player camp while camp-b remains the Ukrainian enemy side for this slice. The next useful step is Milestone 2: make named soldier identity and consequences carry this loop emotionally.

Open questions:
None for the current slice. `camp-a` is the Russian player side and `camp-b` is the Ukrainian enemy side.

## Milestone 2 - Named Soldier Stories Tie Camp To Frontline

Status:
Implemented 2026-04-26

### Goal

Make individual soldiers feel like RimWorld-style people whose skills, needs, traits, and memories create frontline stories.

### Player Picture

The player knows why a line held:

- Nika built the trench fast but became exhausted;
- Lev hauled ammo to the firing slit;
- Yara held the occupied bay under suppression;
- a medic saved a wounded builder because recovery priority was high;
- a bad camp setup left the next defense hungry, tired, and ammo-poor.

The debrief should not say only `trench held`. It should say who mattered, what they did, and what consequence follows.

### One-Pass Implementation Scope

- Add a small soldier story/debrief layer that records:
  - builder contribution;
  - ammo runner contribution;
  - medic/recovery contribution;
  - defender occupation;
  - fatigue/wound consequence.
- Surface two to four named soldiers in the officer UI with:
  - role/archetype;
  - top priority;
  - current work;
  - one need or stress;
  - one recent memory.
- Add short map callouts for named actions:
  - `Nika digging under fire`;
  - `Lev running ammo`;
  - `Yara holding trench`;
  - `Medic stabilizing builder`.
- Add debrief output that connects camp work to fight result.
- Add smoke proof that one named soldier's skill/priority changes the outcome of a build or hold.

### Acceptance

- The player can identify at least three named camp-a soldiers by role and current work.
- The debrief explains the trench outcome through named soldier actions, not generic totals.
- At least one soldier carries a consequence into the next loop: fatigue, wound, morale, memory, or improved trust.
- The UI and map make this feel like a frontline colony sim, not an RTS unit list.
- Browser QA at `1920x1080` captures roster/work state, named map action, occupied trench, and named debrief screenshots.

### Agent Work Log

Agent:
Codex

Date:
2026-04-26

Files changed:
`src/game/townWar/state.ts`, `src/game/townWar/controller.ts`, `src/main.ts`, `src/styles.css`, `src/game/scene/RaidScene.ts`, `scripts/town-war-playable-loop.mjs`

CLI/API proof:
`npm run build` passes. `npm run smoke:town-war-loop` now asserts named `build`, `cover`, and `occupy` stories for camp-a, checks that at least one named soldier carries a consequence, and still proves the trench hold through occupation, facing, and cover value. `npm run smoke:town-war-colony` still passes after the named-story layer.

Browser proof:
`npm run smoke:town-war-loop` captures the required `1920x1080` proof set with a named roster/work screenshot, build preview, named map action/occupied trench screenshot, and named debrief screenshot.

Screenshots/artifacts:
Milestone screenshots are under `artifacts/town-war-playable-loop/`: `00-roster-work-state.png`, `01-preview-rotate.png`, `02-builder-at-work.png`, `03-trench-occupied.png`, `04-debrief.png`, plus `debrief.json`.

Notes for next agent:
Milestone 2 adds `frontlineStories` to town-war state. The controller records named build, cover, resupply, medic, and occupation contributions, attaches memory tags to soldiers, and applies fatigue/trench-hold consequences. The officer priorities panel now shows role/archetype, top priority, current work, need/stress, and recent memory. The debrief panel now leads with named frontline stories. The map shows short name/action callouts near the trench so the world tells the story before the panel explains it.

Open questions:
The map callouts are intentionally compact now. A later pass should decide whether to collapse repeated occupation callouts into one trench-team label when the line gets crowded.

## Final Gate

These two milestones are complete when the player can say:

`I prepared my camp, changed named soldiers' priorities, watched them build, haul, heal, and defend, and the frontline result made sense because those people and camp conditions mattered.`

Until that is true, do not broaden into both-side play, a giant campaign map, or more building types.
