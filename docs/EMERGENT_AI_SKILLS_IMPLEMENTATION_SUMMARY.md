# Emergent AI Skills Implementation Summary

## Purpose

This document summarizes the six implemented milestones for the `Frontline Officer` emergent AI skills slice.

The implemented package turns the town-war prototype toward the north star:

`RimWorld-like personal skill identity inside a Foxhole-like NPC war.`

The player can now inspect soldiers as different people, set doctrine through work priorities, place risky build orders, watch soldiers build/rescue/resupply under pressure, and read a debrief that explains why a line held or failed from real tracked state.

## What Changed At A High Level

The town-war simulation now has a complete first pass of:

- named soldiers with archetypes, skills, traits, needs, work priorities, experience, and trust/readiness summaries;
- priority-weighted task choice for building, rescue, resupply, defense, suppression, rest, scouting, cooking, hauling, and camp work;
- trench and ammo-crate construction that is executed over time by soldiers instead of appearing instantly;
- suppression, ammo support, fatigue, Nerve, Construction, Engineering, and Logistics affecting exposed builds;
- casualty staging, rescue scoring, medic decisions, stabilization, loss, and relationship/memory effects;
- camp sustainment for readiness, ammo flow, cooking, rest cycle, fatigue, hunger, morale, and bottlenecks;
- flank pressure resolution through Scout priority, Perception, Shooting, Nerve, ammo flow, and readiness;
- debrief cause chains, soldier memory tags, trust shifts, relationship pressure, location scars, and drama echoes tied to systemic outcomes.

The important design result is that the player can identify a better next order from the game state, not from hidden scripting.

## Milestone 1 - Roster Truth And Skill Identity

Implemented the soldier identity foundation.

Soldiers now expose:

- `displayName`
- `archetype`
- `skills`
- `traits`
- `needs`
- `workPriorities`
- `currentNeed`
- `experience`
- `identitySummary`
- trust and risk readouts

Player-facing result:

The roster can show that one soldier is a skilled but nervous builder, another is better suited to suppression, another is a medic, scout, cook, or quartermaster. Soldiers are no longer interchangeable bodies.

CLI and inspect surfaces:

- `war-roster`
- `war-roster --camp <camp-a|camp-b>`
- `war-soldier --id <soldier-id>`
- `war.soldiers[*]`
- `war.townWar.soldiers[*]`

Verification:

```powershell
npm run game:cli -- verify --id war-roster-skills
```

## Milestone 2 - Priority Matrix And Skill-Weighted Task Choice

Implemented doctrine-style work priorities and task scoring.

Task choice now combines:

`priority + skill fit + urgency + safety + morale/fatigue + supply need + distance`

Implemented work priorities include:

- `Build`
- `Rescue`
- `Resupply`
- `Defend`
- `Suppress`
- `Rest`
- `Repair`
- `Haul`
- `Medic`
- `Cook`
- `Assault`
- `Scout`

Player-facing result:

The player can shape doctrine without directly puppeteering every soldier. A high-Build soldier tends to take build work, a suppressor covers exposed builders, a tired soldier can prefer Rest, and a scout can be pulled away from direct line strength to create prevention value.

CLI and inspect surfaces:

- `war-priority list [--camp <camp-a|camp-b>]`
- `war-priority set --soldier <id> --work <work> --priority <0-5>`
- `war-priority preset --soldier <id> --preset <builder|medic|quartermaster|suppressor|rifleman|scout|rest-cycle>`
- `war-task-candidates --soldier <id>`
- `war.townWar.soldiers[*].taskDecision`

Verification:

```powershell
npm run game:cli -- verify --id war-priority-skill-choice
```

## Milestone 3 - Construction, Nerve, And Suppression Under Fire

Implemented skill-driven build execution for exposed construction.

Build orders now track:

- assigned builder;
- progress and required progress;
- build rate;
- stall state and stall reason;
- supporting suppressor;
- cover-fire support;
- support ammo state;
- exposure;
- outcome cause;
- cause chain.

Skills and state now matter:

- Construction and Engineering improve build speed.
- Nerve reduces exposed-build stalls.
- Fatigue slows work and increases risk.
- Friendly suppression lowers exposure pressure.
- Logistics and ammo availability keep suppression useful.
- Dry support ammo can cause the build plan to fail even if the trench placement was sound.

Player-facing result:

The same trench order can play differently depending on who builds it and who covers it. A good trench can still fail if the builder is tired, low nerve, or unsupported.

CLI and inspect surfaces:

- `war-order-trench --id <camp-a|camp-b> [--x <n> --y <n>]`
- `war-build-test --builder <id> [--covered-by <id>] [--x <n> --y <n>] [--advance-seconds <n>]`
- `war-build-report --order <order-id>`
- `war.orders[*].build`
- `war.townWar.orders[*].build`

Verification:

```powershell
npm run game:cli -- verify --id war-build-skill-under-fire
```

## Milestone 4 - Medical Rescue, Attachment, And Wound Recovery

Implemented casualty and rescue emergence.

Casualties now support:

- `wounded`
- `downed`
- `stabilized`
- `recovering`
- `lost`

Rescue decisions now consider:

- Rescue priority;
- Medical skill;
- Social skill;
- Nerve;
- fatigue;
- path exposure;
- covered path;
- suppressive support;
- attachment/protective relationship pressure.

Player-facing result:

The player can stage a wounded soldier and see why a medic moves, waits, stalls, or succeeds. A successful rescue creates memory and trust. A failed rescue creates debrief truth and local scars.

CLI and inspect surfaces:

- `war-stage-casualty --soldier <id> [--x <n> --y <n>] [--severity <light|serious|critical>]`
- `war-medic-order --medic <id> --target <id> [--covered-by <id>]`
- `war-rescue-report`
- `war.casualties`
- `war.townWar.casualties`

Verification:

```powershell
npm run game:cli -- verify --id war-medical-rescue-emergence
```

## Milestone 5 - Logistics, Cooking, Fatigue, And Camp Readiness

Implemented the first compact camp sustainment loop.

Camps now expose:

- readiness;
- fatigue average;
- hunger average;
- morale average;
- ammo flow;
- cook effect;
- rest cycle;
- logistics score;
- cooking score;
- endurance score;
- manpower available;
- bottleneck reason;
- warnings;
- camp work priorities.

Specialists were seeded into the town-war roster so sustainment is attached to visible people:

- cooks;
- quartermasters;
- high-Endurance workers;
- logistics-focused soldiers.

Player-facing result:

The player can now understand that a trench did not only fail because of placement. It may have failed because ammo flow dried out, the camp was exhausted, Cooking was neglected, or Rest was deprioritized.

CLI and inspect surfaces:

- `war-sustainment`
- `war-set-camp-work --camp <camp-a|camp-b> --work <Cook|Resupply|Rest> --priority <0-5>`
- `war-stage-ammo-pressure --camp <camp-a|camp-b>`
- `war-stage-fatigue --camp <camp-a|camp-b> --level <0-1>`
- `war.camps[*].sustainment`
- `war.townWar.camps[*].sustainment`

Verification:

```powershell
npm run game:cli -- verify --id war-logistics-camp-readiness
```

## Milestone 6 - Perception, Flanks, Memory, And Full Debrief Truth

Implemented the full skill-emergence loop.

The new flank pressure system resolves outcomes through:

- Scout priority;
- Perception;
- Shooting;
- Nerve;
- ammo flow;
- camp readiness;
- active casualties;
- rescue coverage;
- sustainment pressure.

Tracked outcome classifications include:

- `held-by-suppression`
- `failed-low-nerve`
- `failed-ammo-dry`
- `failed-no-rescue`
- `failed-flank-unseen`
- `held-scout-warning`
- `held-good-sustainment`

Player-facing result:

The player can stage a flank and see whether the line held because a scout warned early, suppression covered the trench mouth, and sustainment was good, or failed because the flank was unseen, nerve broke, ammo dried out, or rescue support was missing.

The system writes the result into:

- flank pressure state;
- skill debrief state;
- drama events;
- soldier memory tags;
- trust and confidence shifts;
- location scars;
- debrief echoes;
- recommended next plan.

CLI and inspect surfaces:

- `war-stage-flank --lane <north|mid|south> --pressure <low|medium|high> [--camp <camp-a|camp-b>]`
- `war-skill-emergence-demo`
- `war-skill-debrief`
- `war.flankPressures`
- `war.townWar.flankPressures`
- `war.skillDebrief`
- `war.townWar.skillDebrief`

Verification:

```powershell
npm run game:cli -- verify --id war-skill-emergence-loop
```

Latest observed proof:

- hold outcome: `held-scout-warning`
- failure outcome: `failed-ammo-dry`
- debrief recommendation: raise Resupply and stage ammo before holding the failed flank again.

## Cross-Milestone Systems Now Connected

The six milestones now connect these loops:

1. Soldier identity affects work scores.
2. Work scores affect who accepts tasks.
3. Tasks move soldiers into danger.
4. Danger interacts with cover, suppression, ammo, fatigue, and Nerve.
5. Casualties create rescue pressure.
6. Camp sustainment affects frontline reliability.
7. Scout/Perception affects flank prevention.
8. Outcomes write memory, trust, relationship pressure, scars, and debrief truth.
9. Debrief truth gives the player a better next plan.

This is the first complete version of:

`skills + priorities + terrain + supplies + pressure + memory = understandable war story`

## Primary Review Commands

Use these commands to review the slice manually:

```powershell
npm run game:cli -- war-roster
npm run game:cli -- war-priority list --camp camp-a
npm run game:cli -- war-build-test --builder town-war-soldier-1 --covered-by town-war-soldier-3 --advance-seconds 24
npm run game:cli -- war-stage-casualty --soldier town-war-soldier-1 --severity critical
npm run game:cli -- war-sustainment
npm run game:cli -- war-skill-emergence-demo
npm run game:cli -- war-skill-debrief
```

Use these commands to verify the milestones:

```powershell
npm run game:cli -- verify --id war-roster-skills
npm run game:cli -- verify --id war-priority-skill-choice
npm run game:cli -- verify --id war-build-skill-under-fire
npm run game:cli -- verify --id war-medical-rescue-emergence
npm run game:cli -- verify --id war-logistics-camp-readiness
npm run game:cli -- verify --id war-skill-emergence-loop
```

The most recent milestone-6 implementation was additionally checked with:

```powershell
npm run build
npm run game:cli -- war-skill-emergence-demo
npm run game:cli -- verify --id war-skill-emergence-loop
```

## Important Files To Review

- `src/game/townWar/state.ts`
  - soldier identity state;
  - build execution state;
  - casualty state;
  - camp sustainment state;
  - flank pressure state;
  - skill debrief state.

- `src/game/townWar/controller.ts`
  - soldier spawning and archetype seeding;
  - task scoring and priority decisions;
  - build execution;
  - casualty rescue;
  - camp sustainment;
  - flank pressure resolution;
  - drama events, memories, scars, and debrief echoes.

- `src/main.ts`
  - browser agent API bridge for CLI commands and snapshot surfaces.

- `scripts/project-cli.mjs`
  - CLI commands;
  - milestone verifiers;
  - town-war brief output.

- `wiki/project-cli.md`
  - current command manual.

- `docs/EMERGENT_AI_SKILLS_6_MILESTONE_PLAN.md`
  - original six-milestone plan with implemented status notes.

## Review Checklist

When reviewing the work, check whether the system answers these questions from state:

- Who is good at the job?
- Why did that soldier take or avoid the job?
- Was the build slow because of skill, fatigue, exposure, or bad support?
- Did suppression actually protect the worker?
- Did ammo flow keep suppression alive?
- Did the medic have a safe enough rescue path?
- Did camp readiness help or hurt the line?
- Did a scout see the flank early enough?
- Did Nerve turn warning into action or panic?
- Did the debrief name the real cause?
- Did memories, trust, and location scars change afterward?
- Can the player name a better next order?

If those answers are visible, the milestone package is doing its job.

## Current Limitations

This is still a first playable simulation layer, not the finished war game.

Known limits:

- The priority UI is not yet a full RimWorld-style menu; the control surface is currently CLI-first.
- Flank pressure is staged and resolved as an inspectable system event, not yet a fully spatial enemy maneuver with rendered units breaching wire.
- Cooking and sustainment are compact readiness systems, not full inventories or meal production.
- Bunkers, blindages, wire, and trench attachments still need the next building-content pass.
- The system proves one-town NPC war emergence before multiplayer, tanks, drones, artillery, or a wider campaign economy.

These limits are intentional. The implemented package proves that soldier skills, priorities, construction, logistics, rescue, perception, memory, and debrief can work together before adding more battlefield objects.

## Bottom Line

All six milestones are implemented as a CLI-verifiable foundation for the officer-war fantasy.

The player can now care who gets the order, who covers them, who hauls ammo, who rescues the wounded, who notices the flank, who keeps the camp functioning, and why the line held or fell.
