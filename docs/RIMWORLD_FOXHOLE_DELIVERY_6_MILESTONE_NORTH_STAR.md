# RimWorld + Foxhole Delivery North Star

Date: 2026-04-27

## Purpose

This is the handoff plan for delivering the player-facing vision in `RIMWORLD_FOXHOLE_PLAYER_FACING_SPEC_REPORT.md`.

The current game already has useful pieces: Russian-side officer play, two camps, named soldiers, priorities, trench build orders, ammo crates, dugouts, real trench occupation, firing, suppression, rescue, and reset/performance smokes. The next problem is connection. Buildings, soldiers, logistics, and camp destruction must become one readable operation instead of isolated proofs.

Target player sentence:

`I built a connected trench network, stocked it, assigned the right people, watched a small team cross deadly ground, and the battle told me exactly why they survived, failed, or broke the enemy camp.`

## Active Direction

- Player side for this dev slice: Russian `camp-a`, right side.
- Enemy side for this dev slice: Ukrainian `camp-b`, left side.
- Runtime: 2D Phaser browser game.
- Product center: officer-led NPC war, not extraction-first play.
- First-town target: one replayable town where construction, priorities, logistics, and small assault groups decide which camp falls.

## Current Baseline

Use these as the starting proof surfaces:

- `src/game/townWar/controller.ts`: town-war state, build orders, soldiers, priorities, trenches, dugouts, ammo crates, camp damage, advance/reset.
- `src/main.ts`: browser agent API for `resetTownWar`, `orderTownWarTrench`, `orderTownWarAmmoCrate`, `orderTownWarDugout`, `focusTownWarLane`, `setTownWarPriority`, `advanceTownWar`, `damageTownWarCamp`, and operation stockpiles.
- `src/game/scene/RaidScene.ts`: map rendering for camps, soldiers, trench reads, occupation, firing feedback, and camp-art toggle.
- `scripts/town-war-shipping-hardening-smoke.mjs`: broad faction/trench/ammo/rescue/spawn regression gate.
- `scripts/town-war-playable-loop.mjs`: browser proof that a player can place, build, occupy, and debrief a trench.
- `scripts/town-war-performance-reset-smoke.mjs`: reset/performance/stale-state gate.

Required verification floor after each milestone:

```powershell
npm run build
npm run smoke:town-war-shipping
```

Add or extend a milestone-specific smoke whenever a new system can regress.

## Non-Goals

- No multiplayer.
- No giant world map.
- No tanks-first implementation.
- No deep tech tree until the first-town operation arc is legible.
- No broad lore expansion without simulation payoff.
- No UI-only implementation without a state/API proof.

## Delivery Principle

Each milestone should be one focused coding pass. If an agent cannot finish the milestone with proof, it should land the smallest complete vertical slice and update the handoff notes with the exact remaining work.

Implementation order inside each milestone:

1. State model and simulation behavior.
2. Browser agent API or project CLI proof.
3. Smoke test.
4. Map feedback and UI.
5. Docs/manual update.

## Milestone 1: Connected Trench Network

### Player Promise

A trench is no longer a standalone object. It is a segment in a growing battlefield line. The player can place a new segment near an existing segment and see it snap, extend, or branch into a connected network.

### Build Scope

- Add trench segment connection metadata: `networkId`, `segmentId`, `nodeA`, `nodeB`, `connectedSegmentIds`, and optional `junctionKind`.
- Snap new trench placement to nearby trench endpoints within a readable range.
- Keep free placement when no endpoint is close.
- Mark networks by faction. Russian `camp-a` networks must never merge with Ukrainian `camp-b` networks.
- Let connected trenches share occupation scoring, safer movement lanes, and retreat path hints.
- Add battlefield feedback: `Connected trench network`, `New branch`, `Fallback path`, `Bad retreat path`.

### API And Smoke Proof

- Add `getTownWarTrenchNetworkReport()`.
- Add or extend order proof so `orderTownWarTrench(...)` can report whether it snapped, extended, or branched.
- Add `npm run smoke:town-war-network` or extend an existing trench smoke.

Acceptance:

- Two nearby Russian trenches become one network.
- A branch creates a junction, not overlapping fake slots.
- Soldiers spread into connected firing bays without stacking.
- Reset clears all network metadata.

### Agent Handoff

- Owner: Codex
- Date: 2026-04-27
- Files changed: `src/game/townWar/state.ts`, `src/game/townWar/controller.ts`, `src/game/scene/RaidScene.ts`, `src/main.ts`, `package.json`, `scripts/town-war-trench-network-smoke.mjs`
- API/CLI proof: `getTownWarTrenchNetworkReport()` reports faction-safe networks, segments, junctions, occupation, retreat hints, and reset-cleared totals. `orderTownWarTrench(...)` now returns `trenchNetwork.placementKind` as `free`, `extend`, or `branch`.
- Browser proof: trench placement preview snaps to the resolved network position and labels `SNAP: EXTEND`, `SNAP: BRANCH`, `NEW NETWORK`, `FALLBACK PATH`, or `BAD RETREAT`.
- Smoke proof: `npm run build` passed. `npm run smoke:town-war-network` covers Russian extension, branch/junction creation, no Ukrainian merge, unique occupants, and reset clearing metadata.
- Open risks: branch snapping is intentionally simple endpoint-to-segment logic. It proves connected networks, but future milestones should add richer trench editing rules, visual trench mouths, and network-level ammo/dugout support.

## Milestone 2: Building Combo Language

### Player Promise

The player can understand why a line works: trenches protect bodies, ammo keeps them firing, dugouts shelter and recover them, sandbags strengthen the firing side, and wire slows assault paths but can trap bad retreats.

### Build Scope

- Make `Trench + Ammo Box` operate through connected network support, not only local distance.
- Make `Trench + Dugout` clearly act as rally, shelter, reinforcement, and casualty destination for connected segments.
- Add lightweight `sandbag` upgrade for a trench side.
- Add lightweight `wire` obstacle near trench mouths.
- Add failure/counter reads: `Ammo too far`, `Dugout not linked`, `Wire blocks retreat`, `Flank open`, `Grenade danger`.
- Keep the first implementation simple: sandbags and wire can be authored as small fieldwork states with clear effects before they need full art complexity.

### API And Smoke Proof

- Add `orderTownWarSandbags(...)` and `orderTownWarWire(...)`, or implement them as trench upgrades if that better fits current code.
- Add `getTownWarBuildingComboReport()`.
- Add smoke that builds `trench + ammo + dugout + wire/sandbags` and proves the combo changes firing, retreat, shelter, or casualty behavior.

Acceptance:

- A connected ammo-fed trench fires longer than an unsupported trench.
- A linked dugout receives at least one sheltering or wounded soldier.
- Wire slows enemies but can create a bad retreat warning.
- Sandbags improve the intended firing side without protecting all directions.

### Agent Handoff

- Owner: Codex
- Date: 2026-04-27
- Files changed: `src/game/townWar/state.ts`, `src/game/townWar/controller.ts`, `src/game/scene/RaidScene.ts`, `src/main.ts`, `package.json`, `scripts/town-war-building-combo-smoke.mjs`, `docs/FRONTLINE_OFFICER_PLAYER_QUICKSTART.md`, `docs/README.md`, `wiki/README.md`
- API/CLI proof: browser agent API now exposes `orderTownWarSandbags(...)`, `orderTownWarWire(...)`, and `getTownWarBuildingComboReport()`. The combo report names network-linked ammo, linked dugouts, sheltering soldiers, sandbag side bonuses, wire slowdown, and warnings like `Ammo too far`, `Dugout not linked`, `Wire blocks retreat`, `Flank open`, and `Grenade danger`.
- Browser proof: fieldwork upgrades render on the map as subtle sandbags/wire, trench labels now include `SANDBAGS FRONT` and `WIRE SET`, and ammo-fed reads account for connected trench networks rather than only local crate distance.
- Smoke proof: `npm run build` passed. `npm run smoke:town-war-combos` passed with 5 Russian trench segments, 15 network-fed slots vs 10 local-fed slots, one linked-dugout sheltering soldier, one sandbag upgrade, one wire upgrade, and reset-cleared combo state. `npm run smoke:town-war-shipping` also passed.
- Open risks: sandbags and wire are currently lightweight fieldwork upgrades, not full soldier-built construction orders. Combo UI is still map-label driven; the next pass should turn this into a cleaner player-facing build panel and stronger route/expedition consequences.

## Milestone 3: Colony Work Ownership And Priority Consequence

### Player Promise

The player learns soldiers through work. It is not `a builder built a trench`; it is `Vira built the forward segment while Makar covered her, then both were too tired for the next assault`.

### Build Scope

- Strengthen job ownership records for build, haul, defend, suppress, rescue, rest, and assault.
- Add visible work queue entries tied to named soldiers.
- Make skill and need differences matter in small but readable ways:
  - builders finish faster but fatigue;
  - haulers keep ammo moving;
  - medics prefer casualties when rescue priority is high;
  - suppressors cover dangerous builds;
  - exhausted soldiers are less reliable for pushes.
- Make the priority panel feel like a colony tool, not a debug panel: fewer permanent numbers, more job ownership and consequence language.
- Add debrief lines that name who did the work and what it cost.

### API And Smoke Proof

- Add `getTownWarWorkQueueReport()`.
- Extend priority smoke to prove changing a soldier priority changes assignment.
- Add story/debrief proof that named soldiers produce build, haul, rescue, rest, or suppression consequences.

Acceptance:

- A high-build soldier is chosen for a build more reliably than low-build peers.
- A high-rescue medic responds to a staged casualty.
- An exhausted soldier receives a visible warning or becomes a worse assignment.
- The debrief names at least two soldiers and links action to consequence.

### Agent Handoff

- Owner: Codex
- Date: 2026-04-27
- Files changed: `src/game/townWar/controller.ts`, `src/main.ts`, `src/styles.css`, `package.json`, `scripts/town-war-work-queue-smoke.mjs`, `docs/FRONTLINE_OFFICER_PLAYER_QUICKSTART.md`, `docs/README.md`, `wiki/README.md`
- API/CLI proof: browser agent API now exposes `getTownWarWorkQueueReport({ campId })`. The report returns named entries for build, cover/suppress, rescue/medic, resupply/haul, defend, rest, assault, and stalled/recovering work with priority, skill, fatigue, warning, owner read, consequence read, and debrief lines.
- Browser proof: the `Priorities` pane now includes a subtle `Work queue` bridge that names active Russian workers and shows consequence language instead of only priority numbers.
- Smoke proof: `npm run build`, `npm run smoke:town-war-work-queue`, and `npm run smoke:town-war-colony` passed. The new smoke proves priority can redirect build assignment, the high-construction soldier can own the build, the high-rescue medic owns a staged casualty job, exhaustion creates a visible warning/worse push read, and the debrief names multiple soldiers.
- Open risks: the queue is still a computed read over current tasks rather than a full persistent RimWorld job table. Stalled medic ownership is visible, but future passes should add clearer player controls for covering rescue paths and intentionally creating safer casualty routes.

## Milestone 4: Four-Soldier Expedition Arc

### Player Promise

Moving from camp to objective feels like a dangerous expedition. Four to six named soldiers leave the Russian camp, cross roads, ruins, tree lines, and trenches, and contact can happen before the final assault.

### Build Scope

- Add an officer order for a small expedition or push group.
- Let the player pick or auto-fill roles: builder, suppressor, rifleman, medic, hauler.
- Stage an objective such as `extend trench toward school ruins`, `stock forward line`, or `probe enemy approach`.
- Add route danger beats: spotted, pinned, separated, wounded, low ammo, retreating, reached line.
- Add simple route scar memory after the expedition: `road crossing hot`, `tree line safe`, `school ruins contested`.
- Keep the first version focused on the current town, not a bigger map.

### API And Smoke Proof

- Add `orderTownWarExpedition(...)` or `focusTownWarObjective(...)`.
- Add `getTownWarExpeditionReport()`.
- Add a smoke that sends a Russian group toward a forward objective and proves at least two route events can occur.

Acceptance:

- Four to six soldiers can be assigned to one objective.
- They move as a readable group without becoming RTS puppets.
- The route creates at least one readable story before or during contact.
- The player can order retreat or the sim can retreat when pressure gets too high.

### Agent Handoff

- Owner: Codex
- Date: 2026-04-27
- Files changed: `src/game/townWar/state.ts`, `src/game/townWar/controller.ts`, `src/main.ts`, `package.json`, `scripts/town-war-expedition-smoke.mjs`, `docs/FRONTLINE_OFFICER_PLAYER_QUICKSTART.md`, `docs/README.md`, `wiki/README.md`
- API/CLI proof: browser agent API now exposes `orderTownWarExpedition({ campId, objective, soldierIds? })`, `requestTownWarExpeditionRetreat({ expeditionId })`, and `getTownWarExpeditionReport({ expeditionId? })`. Expedition state tracks objective, assigned Russian soldiers, roles, progress, danger, route beats, retreat state, and route scars.
- Browser proof: the `Orders` panel now has a subtle `Push` tab. It can order `Extend trench`, `Stock line`, or `Probe approach`, shows active push groups, names assigned soldiers, lists route beats, exposes route scars, and has a retreat button.
- Smoke proof: `npm run build`, `npm run smoke:town-war-expedition`, and `npm run smoke:town-war-shipping` passed. The expedition smoke assigned five Russian `camp-a` soldiers, produced `ordered > spotted > pinned > separated > low-ammo > wounded`, then created a `retreating` beat and route scars. Screenshot proof: `artifacts/town-war-expedition/01-push-pane.png`.
- Open risks: expedition beats are deterministic threshold reads over the current first-town route, not a full terrain graph yet. Soldier role selection is auto-filled by priority/skill and not manually picked in UI. Future work should connect expedition outcomes to trench-network expansion, demolition/breach tools, and operation debrief scoring.

## Milestone 5: Enemy Camp Breach And Demolition

### Player Promise

Destroying the enemy camp becomes a real operation, not abstract damage. The player must prepare, suppress, breach, throw or plant explosives, survive counterfire, and watch camp systems degrade.

### Build Scope

- Add camp weak points for each camp:
  - command core;
  - spawn dugout;
  - ammo dump;
  - radio mast or command post;
  - bunker entrance.
- Add demolition stock or assault tools: grenades, satchels, or demo charges.
- Add an assault order that assigns soldiers to suppress, breach, carry explosives, rescue, or fall back.
- Camp damage should degrade spawn, morale, ammo, or build ability before final destruction.
- Keep fictional sides and avoid real-world propaganda framing.

### API And Smoke Proof

- Add `prepareTownWarDemolition(...)` or extend operation prep to stock explosives.
- Add `orderTownWarCampBreach(...)`.
- Add `getTownWarCampDamageReport()`.
- Add smoke that proves a prepared assault damages a weak point and changes camp sustainment.

Acceptance:

- The Ukrainian camp cannot be cleanly destroyed by unexplained passive attrition.
- A prepared Russian assault can damage at least one visible weak point.
- Damaging a weak point changes enemy behavior or capacity.
- The debrief can explain why the assault stalled or succeeded.

### Agent Handoff

- Owner: Codex
- Date: 2026-04-27
- Files changed: `src/game/townWar/state.ts`, `src/game/townWar/controller.ts`, `src/main.ts`, `package.json`, `scripts/town-war-camp-breach-smoke.mjs`, `docs/FRONTLINE_OFFICER_PLAYER_QUICKSTART.md`, `docs/README.md`, `wiki/README.md`
- API/CLI proof: browser agent API now exposes `prepareTownWarDemolition({ campId, grenades?, satchels?, demoCharges? })`, `orderTownWarCampBreach({ attackerCampId, targetCampId, weakPointId?, weakPointKind?, soldierIds? })`, and `getTownWarCampDamageReport({ campId? })`. State now tracks camp weak points, demolition stock, active breach teams, tool use, progress, suppression, damage, and debrief lines.
- Browser proof: the `Push` tab now includes a subtle demolition-stock card, enemy weak-point rows for Ukrainian `camp-b`, breach buttons, and active breach reads showing route progress, tool, suppression, assigned soldiers, and damage.
- Smoke proof: `npm run build`, `npm run smoke:town-war-breach`, `npm run smoke:town-war-shipping`, and `npm run smoke:town-war-expedition` passed. The breach smoke proves Russian `camp-a` can prepare stock and damage the Ukrainian ammo dump, reducing weak-point health/status, camp health, and camp supply/sustainment with debrief lines. Screenshot proof: `artifacts/town-war-camp-breach/01-breach-pane.png`.
- Open risks: weak-point art is currently strongest in the UI/report rather than a full world-space camp layout. Breach movement is still a deterministic small-team path, not a full terrain graph or manual soldier picker. Demolition stock is camp-supply based, not yet tied to protected stash banking or scavenged grenades.

## Milestone 6: Complete Operation Loop And Debrief

### Player Promise

The first-town slice becomes one complete operation:

`prepare camp -> build connected line -> support it -> send expedition -> breach enemy camp -> debrief -> bank or prepare next operation`.

### Build Scope

- Connect protected operation stockpiles to the town-war loop.
- Add a simple operation start/end wrapper around the first-town push.
- Let operation outcome bank or lose supplies.
- Add a final debrief that explains:
  - which building combo mattered;
  - who built, hauled, rescued, suppressed, or died;
  - which route was dangerous;
  - what camp weak point was damaged;
  - what to build or bring next.
- Add a player-facing quickstart update that describes the complete loop.
- Add a ship-readiness update that honestly marks the slice as `Ready for demo`, `Playable with known issues`, or `Not ready`.

### API And Smoke Proof

- Extend `prepareTownWarOperation`, `startNextTownWarOperation`, `endTownWarOperation`, and `getTownWarOperationReport`.
- Add `npm run smoke:town-war-operation-loop`.
- Browser proof should capture: prep, network, expedition, camp damage, debrief.

Acceptance:

- A player can complete one coherent first-town operation without reading source docs.
- The operation creates a named soldier/building/logistics story.
- The debrief gives an actionable next plan.
- Reset/restart still clears active operation runtime without corrupting protected stockpiles.

### Agent Handoff

- Owner: Codex
- Date: 2026-04-27
- Files changed: `src/game/townWar/state.ts`, `src/game/townWar/controller.ts`, `src/main.ts`, `package.json`, `scripts/town-war-operation-loop-smoke.mjs`, `docs/FRONTLINE_OFFICER_PLAYER_QUICKSTART.md`, `docs/SHIP_READINESS_REPORT.md`, `docs/CURRENT_GAME_STATE_AFTER_LATEST_PASSES.md`, `docs/README.md`, `wiki/README.md`, `wiki/project-cli.md`
- API/CLI proof: `prepareTownWarOperation(...)`, `startNextTownWarOperation()`, `endTownWarOperation()`, and `getTownWarOperationReport()` now complete a first-town cycle. The operation debrief carries supply remaining, supply banked back to protected reserves, supply lost/spent, carried soldier records, named soldier lines, building combo lines, work lines, route lines, camp weak-point damage lines, warnings, and next recommendations.
- Browser proof: the officer `Debrief` tab now exposes banked/lost supply, building combo impact, named work/soldier carryover, expedition route reads, camp damage reads, and next-operation recommendations. The smoke captures `artifacts/town-war-operation-loop/01-operation-debrief-pane.png`.
- Smoke proof: `npm run build`, `npm run smoke:town-war-operation-loop`, `npm run smoke:town-war-shipping`, `npm run smoke:town-war-breach`, and `npm run smoke:town-war-expedition` passed. The new operation-loop smoke proves prep -> launch -> connected trench support -> expedition -> camp breach -> operation debrief -> next-operation carryover.
- Open risks: the complete loop is now testable, but still needs stronger world-space debrief feedback, fuller protected-stash UI integration, clearer tutorialization for new players, and richer terrain-route logic beyond the current first-town threshold model.

## Cross-Milestone UI Language

Permanent UI should stay subtle:

- `Build`
- `Orders`
- `Network`
- `Supplies`
- `Push`
- `Debrief`

Transient map feedback should carry the story:

- `Connected trench network`
- `Ammo-fed firing bay`
- `Dugout shelter linked`
- `Wire blocking assault path`
- `Bad retreat path`
- `Builder exposed`
- `Medic route covered`
- `Expedition pinned`
- `Demo charge planted`
- `Enemy spawn dugout damaged`

Avoid burying important outcomes only in panels. The battlefield must say what happened where it happened.

## Documentation Updates Required

Each milestone should update:

- this handoff doc's `Agent Handoff` block;
- `docs/FRONTLINE_OFFICER_PLAYER_QUICKSTART.md` when player controls or loop change;
- `docs/SHIP_READINESS_REPORT.md` when readiness changes;
- `wiki/project-cli.md` if project CLI surfaces are added;
- `docs/README.md` or `wiki/README.md` if a new major doc or smoke surface is added.

## Final Success Gate

The six-milestone delivery is successful when this story can happen in the live game and be proven by smoke/browser artifacts:

`I sent four soldiers out from the Russian camp to extend the trench toward the school. Vira and Oleg dug while Makar suppressed from the old bay. The new segment snapped to the dugout, so when Oleg went down the medic dragged him back. The ammo box kept the suppressor firing, but I forgot wire on the south mouth, so the Ukrainians flanked and grenaded the bay. Next run I need wire, a closer ammo box, and demolition charges before I push the enemy camp.`
