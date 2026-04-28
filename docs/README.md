# Project Docs

Use this folder for persistent project artifacts such as:

- design notes
- decision-making docs
- decision records
- feature plans
- playtest findings
- technical notes

## Active Product Direction

Read this first for the fork:

- `PERSISTENT_WAR_OFFICER_FORK_INTENT.md`
- `CODEPATH_DIVISION_AND_INTENT.md`
- `FRONTLINE_OFFICER_PLAYER_QUICKSTART.md`
- `SHIP_READINESS_REPORT.md`
- `SHIPPING_HARDENING_6_MILESTONE_PLAN.md`
- `RIMWORLD_FOXHOLE_DELIVERY_6_MILESTONE_NORTH_STAR.md`
- `TOWN_WAR_ICON_READABILITY_SPEC.md`
- `TOWN_WAR_READABILITY_3_MILESTONE_NORTH_STAR.md`
- `TOWN_WAR_RESET_AND_PERFORMANCE.md`
- `BUILDING_AND_AI_NORTH_STAR.md`
- `NPC_ARCHETYPES_AND_PRIORITIES_NORTH_STAR.md`
- `RUSSIAN_NPC_SHOOTING_CONSOLIDATION_HANDOFF.md`
- `EMERGENT_AI_SKILLS_NORTH_STAR.md`
- `AI_BUILDING_SKILLS_6_MILESTONE_PLAN.md`
- `AUTOMATION_AND_AGENT_LOOP.md`

This is the active north star for `frontline-officer`. It supersedes the inherited extraction-shooter direction for future product work.

`CODEPATH_DIVISION_AND_INTENT.md` is the companion architecture note for agent work. Read it when changing CLI/runtime control paths so automation, live play, and inherited extraction seams do not get mixed together.

The older extraction documents remain useful as inherited context and reusable system references, especially for gun feel, squad dialogue, stash/extraction banking, suppression, casualty recovery, and territorial memory. They should not pull the fork back into extraction-first development.

## Current Playable Slice

The current hardening target is one Russian-side playable town-war slice. Use the quickstart to run and understand it:

- `FRONTLINE_OFFICER_PLAYER_QUICKSTART.md`: player-facing first-five-minutes guide, controls, reset, and test commands.
- `CURRENT_GAME_STATE_AFTER_LATEST_PASSES.md`: current high-level state after the latest trench, colony, expedition, camp-breach, and operation-loop passes.
- `SHIP_READINESS_REPORT.md`: current demo verdict, known gaps, and next priorities.
- `RIMWORLD_FOXHOLE_DELIVERY_6_MILESTONE_NORTH_STAR.md`: six-milestone handoff for turning the current slice into a connected RimWorld + Foxhole operation loop.
- `TOWN_WAR_ICON_READABILITY_SPEC.md`: cohesive world-space icon/readability spec for trench online/firing blockers, ammo crate stock/link state, dugout placement, and soldier task/combat states.
- `TOWN_WAR_READABILITY_3_MILESTONE_NORTH_STAR.md`: three-milestone implementation plan for the icon readability pass: read-model truth, world-space icons, then build-preview/inspect/debrief alignment.
- `TOWN_WAR_READABILITY_DELIVERY_SUMMARY.md`: concise handoff of what shipped across the three readability milestones, proof commands, artifacts, and remaining risks.
- `TOWN_WAR_RESET_AND_PERFORMANCE.md`: reset API, dedicated port, and performance smoke notes.
- `SHIPPING_HARDENING_6_MILESTONE_PLAN.md`: sprint record for tutorialization, balance, smoke tests, browser QA, reset safety, and final readiness.

Current combo proof:

- Milestone 2 of `RIMWORLD_FOXHOLE_DELIVERY_6_MILESTONE_NORTH_STAR.md` is implemented. Connected trench networks can now receive network ammo support, linked dugout shelter, sandbag side bonuses, and wire slowdown/warnings.
- `npm run smoke:town-war-combos` proves the combo surface and reset safety.

Current colony-work proof:

- Milestone 3 of `RIMWORLD_FOXHOLE_DELIVERY_6_MILESTONE_NORTH_STAR.md` is implemented. The priority pane now has a named work queue, `getTownWarWorkQueueReport()` exposes job ownership/consequence language, exhausted soldiers warn against pushes, and stalled rescues stay attached to the medic who owns them.
- `npm run smoke:town-war-work-queue` proves priority-driven build assignment, high-skill builder assignment, named rescue ownership, fatigue warnings, and browser UI visibility.
- `RUSSIAN_NPC_SHOOTING_CONSOLIDATION_HANDOFF.md` records the current Russian NPC shooting consolidation problem: colony-style town-war soldiers and inherited commandable combat NPCs still have different runtime ownership, and the final model should make real town-war soldiers own RimWorld-like work plus the granular projectile/command combat layer.

Current expedition proof:

- Milestone 4 of `RIMWORLD_FOXHOLE_DELIVERY_6_MILESTONE_NORTH_STAR.md` is implemented. The `Push` tab can order a four-to-five soldier Russian expedition to extend a trench, stock the line, or probe the enemy approach; `getTownWarExpeditionReport()` exposes route progress, assigned roles, route beats, retreat state, and route scars.
- `npm run smoke:town-war-expedition` proves Russian-only assignment, route beats before contact, retreat order behavior, route scar creation, and browser UI visibility.

Current camp-breach proof:

- Milestone 5 of `RIMWORLD_FOXHOLE_DELIVERY_6_MILESTONE_NORTH_STAR.md` is implemented. Camps now expose weak points, Russian `camp-a` can prepare demolition stock, the `Push` tab can order a named breach against Ukrainian `camp-b`, and `getTownWarCampDamageReport()` explains weak-point health, active breach teams, stock, and camp capacity changes.
- `npm run smoke:town-war-breach` proves a prepared Russian assault damages the Ukrainian ammo dump, changes enemy camp sustainment/supply, creates debrief lines, and captures browser UI proof.

Current operation-loop proof:

- Milestone 6 of `RIMWORLD_FOXHOLE_DELIVERY_6_MILESTONE_NORTH_STAR.md` is implemented. Protected stockpiles now feed a first-town operation cycle, `endTownWarOperation()` banks surviving supplies, records lost/spent supplies, carries named soldier records forward, and explains trench combo, work, route, and camp weak-point consequences in the officer `Debrief` tab.
- `npm run smoke:town-war-operation-loop` proves prep, launch, connected trench support, expedition route beats, Ukrainian weak-point breach damage, operation debrief, next-operation carryover, and browser UI proof.

Current readability proof:

- Milestone 1 of `TOWN_WAR_READABILITY_3_MILESTONE_NORTH_STAR.md` is implemented. `getTownWarReadabilityOverlay()` and `war.readability` expose a snapshot-friendly icon read model for trench blockers, ammo crate stock/link state, dugout link/shelter state, and urgent soldier states.
- `npm run smoke:town-war-readability-model` proves wrong-facing trench, no-occupant trench, empty ammo crate, unlinked dugout, linked/shelter dugout, pinned soldier, wounded soldier, and rescue readability reasons.
- Milestone 2 of `TOWN_WAR_READABILITY_3_MILESTONE_NORTH_STAR.md` is implemented. `RaidScene` now renders the read model as compact world-space markers for urgent trench, ammo crate, dugout, and soldier states, with hover/selection expanding to the read-model reason text.
- `npm run smoke:town-war-readability-icons` stages a 1920 x 1080 browser proof and writes `artifacts/town-war-readability-icons/readability-icons-1920x1080.png` plus `readability-icons-report.json`.
- Milestone 3 of `TOWN_WAR_READABILITY_3_MILESTONE_NORTH_STAR.md` is implemented. Build placement previews now emit read-model icons for trench facing, ammo/dugout links, route risk, exposure, and bad-retreat risk; the officer `Priorities` pane enables inspect-mode world badges; operation debrief building lines reuse top live readability reasons.
- `npm run smoke:town-war-readability-loop` proves bad and useful previews, ammo/dugout support preview, inspect-mode links, a live empty-crate blocker, and debrief reason reuse. Browser artifacts write to `artifacts/town-war-readability-loop/`.

Current menu planning docs:

- `STASH_MENU_REQUIREMENTS.md`
- `STASH_MENU_PLAYER_SPEC.md`
- `STASH_MENU_IMPLEMENTATION_SPEC.md`
- `STASH_MENU_IMPLEMENTATION_PLAN.md`
- `SQUAD_COMMAND_PLAYER_SPEC.md`
- `SQUAD_COMMAND_IMPLEMENTATION_PLAN.md`
- `SQUAD_TACTICAL_ACTIONS_FEATURE_SPEC.md`
- `SQUAD_TACTICAL_ACTIONS_IMPLEMENTATION_SPEC.md`
- `SQUAD_TACTICAL_ACTIONS_IMPLEMENTATION_PLAN.md`
- `SQUAD_SUPPRESSION_IMPLEMENTATION_SPEC.md`
- `SQUAD_SUPPRESSION_IMPLEMENTATION_PLAN.md`
- `SQUAD_DIRECTIONAL_BRACE_PLAYER_SPEC.md`
- `SQUAD_DIRECTIONAL_BRACE_IMPLEMENTATION_SPEC.md`
- `SQUAD_DIRECTIONAL_BRACE_IMPLEMENTATION_PLAN.md`
- `SQUAD_MOVING_SUPPRESSION_PLAYER_SPEC.md`
- `SQUAD_MOVING_SUPPRESSION_IMPLEMENTATION_SPEC.md`
- `SQUAD_MOVING_SUPPRESSION_IMPLEMENTATION_PLAN.md`

Project wiki:

- `../wiki/README.md`
- `../wiki/project-cli.md`
