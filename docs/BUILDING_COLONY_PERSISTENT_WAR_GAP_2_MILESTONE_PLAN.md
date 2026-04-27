# Building, Colony Sim, And Persistent War Gap Plan

Date: 2026-04-26

## Purpose

This is the next two-pass implementation handoff for closing the gap between the current playable slice and the north star:

`Foxhole field construction + RimWorld colony priorities + persistent frontline war.`

Current player side remains fixed:

- `camp-a`: Russian player camp on the right.
- `camp-b`: Ukrainian enemy camp on the left.

Do not add both-side play yet.

## Current Baseline

The game already supports:

- officer tools with build, priority, camp, and debrief panes;
- trench placement with mouse preview and scroll rotation;
- named Russian soldiers with skills, needs, work priorities, health, ammo, pressure, and memory;
- soldiers building, covering, occupying, and taking real damage;
- camp sustainment readouts and camp work priorities;
- town-war camp health, supply, morale, readiness, and win/loss state;
- smoke tests for trench building, occupation, colony work, damage, and faction alignment.

The main gaps are:

- protected stash does not yet feed the frontline camp in a durable way;
- casualties, fatigue, stockpiles, and terrain consequences do not persist strongly enough between operations;
- building variety is too thin;
- trenches matter, but there is not yet a bunker/dugout/spawn network that makes the game feel like Foxhole;
- debriefs explain outcomes, but they do not yet drive the next operation plan.

## Milestone 1 - Operation Stockpile And Persistent Camp Consequences

### Goal

Turn the current camp from a single-match status panel into a persistent frontline colony that remembers shortages, fatigue, casualties, and supplies across operation cycles.

### Player Picture

The player enters the operation stash before deploying. They decide what to send to the Russian camp:

- construction supply;
- ammo;
- med supplies;
- food;
- reserve rifles or support kits.

In the battle, those choices visibly affect the camp:

- low construction supply slows or blocks trench orders;
- low ammo makes suppressors weaker and raises ammo-run urgency;
- low med supply causes wounded soldiers to stay out longer or be lost;
- poor food/rest lowers readiness and makes builders brittle;
- surviving soldiers come back tired, proud, wounded, resentful, or more trusted.

After the fight, the debrief does not only say what happened. It recommends the next preparation:

`Send more build supply before another forward trench. Rest Vira. Keep Olek on suppression. Medic load is high.`

### One-Pass Implementation Scope

- Add a durable operation stockpile state for the current first-town slice.
- Wire a minimal protected-stash-to-camp transfer path into town-war camp supply.
- Persist at least these across reset/operation cycle within the running app:
  - camp supply deltas;
  - soldier fatigue;
  - wounded/recovering/lost state;
  - named soldier memory tags;
  - camp readiness/morale consequences.
- Add one operation-cycle API/CLI flow:
  - prepare stockpile;
  - launch/stage town war;
  - advance fight;
  - end operation/debrief;
  - start next operation with carried consequences.
- Add map/UI feedback for stockpile consequences:
  - `Build supply low`;
  - `Medic load high`;
  - `Rest cycle weak`;
  - `Ammo runners needed`.
- Update project CLI/manual docs for the new operation-cycle proof.

### Acceptance

- A smoke test proves that changing supplies before launch changes construction speed, suppression support, or rescue outcome.
- A named Russian soldier can carry fatigue/wound/memory into the next operation cycle.
- A camp shortage from one operation is visible before the next operation.
- Debrief produces at least two concrete next-operation recommendations based on actual state.
- The player can understand why the next operation starts stronger or weaker than the last.

### Files Likely Touched

- `src/game/townWar/state.ts`
- `src/game/townWar/controller.ts`
- `src/main.ts`
- `src/styles.css`
- `scripts/project-cli.mjs`
- new or updated smoke script under `scripts/`
- `docs/project_cli.md`
- `wiki/project-cli.md`

### Agent Work Log

Agent:
Codex

Date:
2026-04-26

Files changed:
`src/game/townWar/state.ts`, `src/game/townWar/controller.ts`, `src/main.ts`, `scripts/project-cli.mjs`, `scripts/town-war-operation-cycle-smoke.mjs`, `package.json`, `docs/project_cli.md`, `wiki/project-cli.md`

Verification:
`npm run build` passed.

`npm run smoke:town-war-operation` passed. The smoke proves low stockpile construction reached 91.99 progress at 14.11/s while high stockpile construction completed at 18.16/s; it also proved Makar Rus-2 carried `wounded`, 0.78 fatigue, 42 health, and memory tags into the next operation with two debrief recommendations.

Notes for next agent:
Milestone 1 now has a runtime operation state, protected/committed stockpile, next-operation launch, debrief capture, carried Russian soldier records, officer UI controls in the Camp/Debrief panes, agent API methods, CLI commands, and a smoke proof. Milestone 2 should build on `war.operation` rather than adding a separate persistence model.

## Milestone 2 - Bunker/Dugout Network And Trench-System Payoff

### Goal

Make building feel less like placing one useful trench and more like constructing a small Foxhole-style defensive position that spawns, shelters, supplies, and organizes AI.

### Player Picture

The player places a trench line, then adds a dugout/bunker node behind it. Soldiers treat the position as a real frontline home:

- builders dig the trench;
- suppressors cover the work;
- defenders occupy firing bays;
- wounded fall back to the dugout;
- reinforcements spawn or rally from the bunker;
- ammo runners feed the line;
- a bad bunker facing or exposed approach gets punished.

Losing the position should teach the player something:

`The trench faced correctly, but the dugout was too close to the enemy angle and the ammo crate was too far back.`

### One-Pass Implementation Scope

- Add one new build order: `dugout` or `bunker`.
- Give it a clear role:
  - rally/spawn point for Russian AI;
  - fallback shelter for wounded or suppressed soldiers;
  - local command radius that improves nearby trench occupation;
  - optional small supply cache if camp stockpile allows.
- Connect bunker/dugout to trenches:
  - nearby trench slots get stronger occupation priority;
  - defenders prefer trench slots connected to the dugout;
  - fallback paths prefer dugout over open retreat when safe;
  - enemy pressure can damage or contest the node.
- Add directional or placement weakness:
  - exposed/front-facing side matters;
  - bad placement can be flanked or suppressed;
  - destroyed/contested dugout weakens the line.
- Add map feedback:
  - `Rally active`;
  - `Dugout contested`;
  - `Wounded sheltering`;
  - `Line supplied`;
  - `Position collapsing`.
- Add debrief logic explaining why the position held or failed.

### Acceptance

- A smoke test proves a dugout/bunker changes soldier behavior near a trench.
- Russian soldiers prefer a trench system connected to a dugout over open terrain.
- The dugout/bunker can be damaged, contested, or lose effectiveness.
- At least one reinforcement/rally/fallback behavior uses the dugout instead of camp.
- Debrief names the position as a cause:
  - `held because dugout rallied defenders`;
  - `failed because dugout was exposed/contested`;
  - `wounded survived because they reached shelter`.
- The feature reads on the map without needing a debug panel.

### Files Likely Touched

- `src/game/townWar/types.ts`
- `src/game/townWar/state.ts`
- `src/game/townWar/controller.ts`
- `src/game/scene/RaidScene.ts`
- `src/main.ts`
- `src/styles.css`
- new or updated smoke script under `scripts/`
- `docs/FRONTLINE_ART_ASSETS.md` if new art roles are added

### Agent Work Log

Agent:
Codex

Date:
2026-04-26

Files changed:
`src/game/townWar/state.ts`, `src/game/townWar/controller.ts`, `src/game/scene/RaidScene.ts`, `src/main.ts`, `scripts/project-cli.mjs`, `scripts/town-war-dugout-network-smoke.mjs`, `package.json`, `docs/project_cli.md`, `wiki/project-cli.md`

Verification:
`npm run build` passed.

`npm run smoke:town-war-dugout` passed. The smoke builds a Russian dugout and connected trench, verifies 3 connected trench slots with Russian occupants, verifies a defender reinforcement rallies through the dugout, stages a wounded shelter case, damages the dugout, and confirms the debrief names dugout causes.

Notes for next agent:
Milestone 2 now has a `dugout` build order, runtime dugout state, map preview/drawing, officer UI buttons, CLI/API commands, connected-trench AI scoring, dugout rally reinforcement, wounded/suppressed shelter tracking, damage status, and debrief recommendations. Next work should tune how dugout placement weakness is taught visually and make connected trench labels even clearer in live fights.

## Final Gate

These two milestones are complete when the player can say:

`I prepared my Russian camp from the stash, sent named soldiers to build a trench-and-dugout position, watched the line hold or fail for readable reasons, and carried the consequences into the next operation.`

Do not broaden into both-side play, large world persistence, tanks, or multiplayer until this first-town loop creates that sentence reliably.
