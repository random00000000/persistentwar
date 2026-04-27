# Emergent AI Skills 6 Milestone Plan

## Purpose

This plan turns `EMERGENT_AI_SKILLS_NORTH_STAR.md` into six implementation milestones for `Frontline Officer`.

The target is:

`RimWorld-like personal skill identity inside a Foxhole-like NPC war.`

The implementation goal is not to create a large personality spreadsheet. The goal is to make small readable rules collide:

- skills affect task choice;
- task choice affects where soldiers move;
- position affects survival;
- survival affects morale, memory, and officer trust;
- memory affects later obedience, dialogue, and debrief truth.

Every milestone should leave a CLI proof before UI polish is treated as complete.

## Source Documents

Read these before implementation:

- `PERSISTENT_WAR_OFFICER_FORK_INTENT.md`
- `EMERGENT_AI_SKILLS_NORTH_STAR.md`
- `BUILDING_AND_AI_NORTH_STAR.md`
- `NPC_ARCHETYPES_AND_PRIORITIES_NORTH_STAR.md`
- `EMERGENT_WAR_DRAMA_LAYER_PLAN.md`
- `wiki/project-cli.md`

## Current Baseline

The town-war runtime already has:

- one replayable town state;
- two camps;
- autonomous soldiers;
- trench and ammo-crate officer orders;
- cover slots, suppression fields, and tactical intents;
- drama events, memories, location scars, debrief echoes, and story-pack audit;
- soldier identity fields from the first roster slice:
  - `displayName`
  - `archetype`
  - `skills`
  - `traits`
  - `needs`
  - `workPriorities`
  - `currentNeed`
  - `experience`
  - `identitySummary`
- CLI commands:
  - `war-roster`
  - `war-roster --camp <camp-a|camp-b>`
  - `war-soldier --id <soldier-id>`
- verification:
  - `npm run game:cli -- verify --id war-roster-skills`

That means Milestone 1 is already implemented as the foundation, but it is included here so the roadmap stays complete.

## North Star Proof

The six milestones are complete when the player can stage this sentence from CLI, then later from UI:

`I lost that trench because I sent a low-nerve builder too far forward, failed to keep suppression supplied, the medic would not cross the open trench mouth, and nobody with enough perception spotted the flank until the wire was already breached.`

The player should be surprised in the moment, but able to explain the result afterward.

## Milestone 1 - Roster Truth And Skill Identity

Status: Implemented.

### Goal

Make every town-war soldier inspectable as a distinct person with skills, traits, needs, priorities, experience, and trust-readable summary.

### Player Promise

The player opens the roster and sees people, not interchangeable bodies:

- a fast but nervous builder;
- a reckless suppressor who burns ammo;
- a rifleman with good perception;
- a medic who is valuable before anyone fires;
- a cook or quartermaster who matters because camp readiness matters later.

### Simulation Work

Soldiers expose:

- identity: `displayName`, `archetype`, `traits`;
- skills: `construction`, `medical`, `logistics`, `shooting`, `suppression`, `nerve`, `perception`, plus optional future skills;
- needs: `fatigue`, `hunger`, `morale`;
- work priorities: `Build`, `Rescue`, `Resupply`, `Defend`, `Suppress`, `Rest`, plus planned columns;
- current need;
- experience;
- identity summary.

### CLI Work

Implemented commands:

- `war-roster`
- `war-roster --camp <camp-a|camp-b>`
- `war-soldier --id <soldier-id>`

Snapshot exposes identity fields under:

- `war.soldiers[*]`
- `war.townWar.soldiers[*]`

### Acceptance

- Two builders can have different Construction and Nerve.
- Roster output explains useful skill and risk.
- Existing trench order flow still works.

### Verification

```powershell
npm run game:cli -- verify --id war-roster-skills
```

## Milestone 2 - Priority Matrix And Skill-Weighted Task Choice

Status: Implemented.

### Goal

Make priorities and skills influence who takes jobs without turning the game into instant RTS puppeteering.

The player changes doctrine; soldiers still execute through their own risk, skill, need, and battlefield state.

### Player Promise

The player can say:

`Vira is my builder, Olek keeps roads pinned, Makar scouts the trench mouth, and tired soldiers rest unless the line is collapsing.`

### Simulation Work

Implement a first task scoring function:

`task score = priority + skill fit + urgency + safety + morale state + supply need + distance`

Required priority columns:

- `Build`
- `Rescue`
- `Resupply`
- `Defend`
- `Suppress`
- `Rest`

First skill interactions:

- high Construction increases build-task score;
- high Medical increases rescue score;
- high Logistics increases resupply score;
- high Suppression increases cover-fire score;
- high Perception increases scout/flank-watch score;
- low Nerve reduces willingness to take exposed tasks;
- fatigue and morale reduce noncritical task score.

### CLI Work

Add:

- `war-priority list [--camp <camp-a|camp-b>]`
- `war-priority set --soldier <id> --work <Build|Rescue|Resupply|Defend|Suppress|Rest> --priority <0-5>`
- `war-priority preset --soldier <id> --preset <builder|medic|quartermaster|suppressor|rifleman|scout|rest-cycle>`
- `war-task-candidates --soldier <id>`

Snapshot should expose:

- selected task reason;
- top candidate task scores;
- any blocked task reason, such as `too exposed`, `too tired`, `no supplies`, or `low nerve`.

### Feedback Work

Add readable warnings:

- `All builders, no cover`
- `No medic assigned`
- `Ammo hauling uncovered`
- `Best builder exposed`
- `Rest ignored: fatigue rising`

### Acceptance

- A high-Build soldier prefers construction over defense when a build order exists.
- A high-Suppress soldier covers builders when a build is exposed.
- A high-Resupply soldier runs ammo when suppressors are drying out.
- A tired soldier with high Rest avoids noncritical work.
- Changing priorities changes task selection in a staged scenario.

### Verification

```powershell
npm run game:cli -- verify --id war-priority-skill-choice
```

Implemented surface:

- soldiers carry `taskDecision` with selected work, selected reason, selected score, blocked reason, and sorted top candidates;
- build orders choose a worker through `Build` score instead of fixed role lookup;
- lane focus uses priority-scored `Suppress`, `Resupply`, `Rest`, `Scout`, and `Defend` decisions;
- CLI priority commands can inspect, set, and preset work priorities;
- warning strings expose missing medic/cover/rest/builder exposure risks in `war-priority list`.

## Milestone 3 - Construction, Nerve, And Suppression Under Fire

Status: Implemented.

### Goal

Make the first real skill-emergence collision:

`Construction + Nerve + Suppression + Logistics = whether a risky trench gets finished.`

### Player Promise

The player orders the same trench twice and sees different outcomes because different people execute the order.

A skilled but nervous builder may work fast until fire lands. A steady builder may finish slowly but hold under pressure. A suppressor with ammo support can buy the build enough time.

### Simulation Work

Implement skill-driven build execution:

- Construction controls build speed.
- Nerve controls stall chance under suppression, nearby wounds, or high exposure.
- Suppression from friendly soldiers reduces builder danger and stall pressure.
- Logistics and ammo support keep suppression alive.
- Fatigue slows building and raises stall chance.
- Successful build completion can increase confidence/trust.
- failed exposed build can create resentment, scar pressure, and hesitation next time.

Trench orders should track:

- assigned builder;
- build progress rate;
- stall reason;
- cover-fire support;
- ammo support state;
- exposure rating;
- outcome cause.

### CLI Work

Extend:

- `war-order-trench --id <camp-a|camp-b> [--x <n> --y <n>]`
- `war-advance --seconds <n>`

Add:

- `war-build-test --builder <id> [--covered-by <id>] [--x <n> --y <n>]`
- `war-build-report --order <order-id>`

Snapshot should expose:

- build rate;
- stall state;
- supporting suppressor id;
- support ammo state;
- tracked cause chain.

### Feedback Work

Add battlefield callouts:

- `Vira stalled under fire`
- `Olek has the road pinned`
- `Build slowed: tired worker`
- `Ammo support failing`
- `Trench finished under suppression`

### Acceptance

- Two builders with different Construction and Nerve progress differently on equivalent trench orders.
- Friendly suppression reduces exposed-build stall pressure.
- Low ammo or low Logistics can remove that protection.
- The debrief can explain why the trench finished or failed.

### Verification

```powershell
npm run game:cli -- verify --id war-build-skill-under-fire
```

Implemented surface:

- trench and ammo-crate orders now carry `build` execution state with progress, required progress, build rate, stall state, support state, exposure, outcome cause, and cause chain;
- build completion is no longer instant on arrival for trench build tasks; assigned builders must finish work over time;
- Construction, Engineering, Nerve, fatigue, exposure, suppressive cover, support ammo, and suppressor Logistics affect trench build rate and stalls;
- explicit cover builders can be staged with `war-build-test --builder <id> --covered-by <id>`;
- dry or low support ammo is visible in build reports and weakens suppressive protection;
- successful builds can increase builder confidence/trust while stalled exposed work adds resentment pressure;
- `war-build-report --order <order-id>` explains the current or completed order from real tracked state.

## Milestone 4 - Medical Rescue, Attachment, And Wound Recovery

Status: Implemented.

### Goal

Make Medical, Nerve, Social, relationship pressure, and cover paths create rescue drama.

### Player Promise

The player sees a wounded builder near a trench mouth and understands why the medic goes, waits, or refuses:

- high Medical wants to rescue;
- high Rescue priority authorizes it;
- attachment increases urgency;
- low Nerve or no covered path can delay the attempt;
- suppression can make the rescue possible.

### Simulation Work

Add or extend casualty states:

- wounded;
- downed;
- stabilized;
- recovering;
- lost.

Implement rescue scoring:

`rescue score = Rescue priority + Medical + attachment + urgency + covered path - exposure - low nerve - fatigue`

Medical should interact with:

- trenches and blindages as safer treatment spaces;
- med supplies/logistics;
- Social to calm wounded;
- relationship memory after repeated saves or failed rescues.

### CLI Work

Add:

- `war-stage-casualty --soldier <id> [--x <n> --y <n>] [--severity <light|serious|critical>]`
- `war-rescue-report`
- `war-medic-order --medic <id> --target <id>`

Snapshot should expose:

- casualty state;
- rescue candidate scores;
- medic chosen;
- rescue path risk;
- treatment outcome.

### Feedback Work

Add callouts:

- `Vira stabilized Dima`
- `Medic waiting for suppression`
- `No covered rescue path`
- `Attachment override: medic moving anyway`
- `Wounded left in open`

### Acceptance

- A high-Medical, high-Rescue medic attempts recovery in a staged casualty scenario.
- Low Nerve or high exposure can delay the rescue.
- Suppression or trench cover can flip the decision.
- A successful rescue creates memory/trust changes.
- A failed rescue creates readable debrief truth.

### Verification

```powershell
npm run game:cli -- verify --id war-medical-rescue-emergence
```

Implemented surface:

- casualties now have explicit state: `wounded`, `downed`, `stabilized`, `recovering`, and `lost`;
- `war-stage-casualty` can stage a named wounded soldier with severity and position;
- `war-medic-order` scores rescue orders from Medical, Rescue/Medic priority, Social, Nerve, attachment, fatigue, exposure, cover, and suppressive support;
- `war-rescue-report` exposes casualty state, rescue candidates, medic assignment, path risk, covered path, treatment progress, outcome cause, and cause chain;
- ignored critical casualties can become `lost` and create debrief truth;
- successful stabilization updates medic experience, protective relationship pressure, memory, location scars, and debrief echoes.

## Milestone 5 - Logistics, Cooking, Fatigue, And Camp Readiness

Status: Implemented.

### Goal

Make camp sustainment matter without turning the game into spreadsheet chores.

The line should be able to fail because ammo, food, fatigue, or readiness was neglected.

### Player Promise

The player learns:

`The trench was good. The men were not. Ammo dried out, meals were bad, fatigue rose, and the bunker defenders arrived shaky.`

### Simulation Work

Implement a first sustainment loop:

- Logistics keeps ammo crates, build supply, med supply, and bunker stock moving.
- Cooking improves fatigue recovery, morale recovery, and camp readiness.
- Endurance controls fatigue gain from hauling, dragging wounded, building, and long movement.
- Rest priority reduces collapse risk but slows labor.
- Camp readiness affects reinforcement quality and later bunker/rally behavior.

Keep it compact:

- no giant economy;
- no meal inventory UI yet;
- only enough state to prove readiness, fatigue, and supply pressure.

### CLI Work

Add:

- `war-sustainment`
- `war-set-camp-work --camp <camp-a|camp-b> --work <Cook|Resupply|Rest> --priority <0-5>`
- `war-stage-ammo-pressure --camp <camp-a|camp-b>`
- `war-stage-fatigue --camp <camp-a|camp-b> --level <0-1>`

Snapshot should expose:

- camp readiness;
- fatigue average;
- hunger average;
- ammo-flow state;
- cook effect;
- logistics bottleneck reason.

### Feedback Work

Add warnings and callouts:

- `No quartermaster: ammo flow slowing`
- `Cook shortage: readiness falling`
- `Rest cycle active`
- `Suppressor dry`
- `Exhausted line: panic threshold lower`

### Acceptance

- Low Logistics causes ammo support to degrade in a staged fight.
- Cooking or lack of Cooking affects morale/fatigue recovery.
- Rest priority creates an opportunity cost between manpower and recovery.
- Sustainment state affects trench or bunker hold behavior.
- Debrief can distinguish bad trench design from bad sustainment.

### Verification

```powershell
npm run game:cli -- verify --id war-logistics-camp-readiness
```

Implemented surface:

- camps now expose compact sustainment state: readiness, fatigue average, hunger average, morale average, ammo flow, cook effect, rest cycle, bottleneck reason, warnings, and camp work priorities;
- cook and quartermaster specialists are seeded into the town-war roster so Cooking and Logistics are visible people, not abstract camp bonuses;
- `war-sustainment` reports camp readiness and bottlenecks;
- `war-set-camp-work --camp <camp-a|camp-b> --work <Cook|Resupply|Rest> --priority <0-5>` changes camp doctrine and soldier work priorities for sustainment;
- `war-stage-ammo-pressure` can force ammo-flow failure so suppressive build support degrades;
- `war-stage-fatigue` can force exhaustion/hunger pressure so Cooking and Rest recovery can be compared;
- build execution now reads camp readiness and ammo flow, so a good trench plan can still suffer from bad sustainment;
- build cause chains can distinguish dry ammo support and bad sustainment from bad trench placement.

## Milestone 6 - Perception, Flanks, Memory, And Full Debrief Truth

Status: Implemented.

### Goal

Connect the skill systems into a complete emergent outcome:

`skills + priorities + terrain + supplies + pressure + memory = understandable war story.`

This milestone should prove the north star end to end.

### Player Promise

The player can stage a trench fight, lose or hold it, then read exactly why:

- the builder stalled or held;
- the suppressor kept the road pinned or ran dry;
- the medic rescued or waited;
- the scout noticed or missed the flank;
- camp sustainment helped or failed;
- trust and memory changed afterward.

### Simulation Work

Implement Perception and flank response:

- high Perception notices trench-mouth danger, wounded, exposed paths, flank routes, wire breaches, or failing structures sooner;
- low Perception delays response;
- Scout priority removes a soldier from direct line strength but creates prevention value;
- Shooting + Perception improves early fire against flanks;
- Nerve determines whether the warning becomes action or panic.

Tie outcomes into:

- officer trust;
- soldier memories;
- relationship pressure;
- location scars;
- debrief echo cause chain.

Add outcome classifications:

- `held-by-suppression`
- `failed-low-nerve`
- `failed-ammo-dry`
- `failed-no-rescue`
- `failed-flank-unseen`
- `held-scout-warning`
- `held-good-sustainment`

### CLI Work

Add:

- `war-skill-emergence-demo`
- `war-skill-debrief`
- `war-stage-flank --lane <north|mid|south> --pressure <low|medium|high>`

The demo should stage:

1. named soldiers with visible skill differences;
2. priority setup;
3. trench order;
4. suppression support;
5. ammo/fatigue pressure;
6. casualty or flank pressure;
7. debrief cause chain.

### Feedback Work

Use short battlefield callouts:

- `Scout warning: trench mouth exposed`
- `Flank unseen`
- `Makar has the road pinned`
- `Vira finished under fire`
- `Medic held for cover`
- `Debrief: ammo failed before courage did`

Use debrief truth:

- `The trench finished because Vira kept digging while Olek suppressed the road.`
- `The line fell after ammo hauling stopped.`
- `The flank warning came late because no high-Perception soldier was scouting.`
- `The medic could not cross the open mouth until suppression returned.`

### Acceptance

- The full skill-emergence loop works from CLI.
- At least one staged scenario produces a hold and one produces a failure for different tracked reasons.
- Debrief explains the outcome from real state, not scripted flavor.
- Memory/trust/location scars change future conditions.
- The player can identify a better next plan.

### Verification

```powershell
npm run game:cli -- verify --id war-skill-emergence-loop
```

Implemented proof surface:

- `war-stage-flank --lane <north|mid|south> --pressure <low|medium|high>` stages a flank pressure event against a camp and resolves it through Scout priority, Perception, Shooting, Nerve, ammo flow, and readiness.
- `war-skill-emergence-demo` stages one held flank and one failed flank; current proof produces `held-scout-warning` and `failed-ammo-dry`.
- `war-skill-debrief` exposes `war.skillDebrief` and `war.townWar.skillDebrief` with cause chain, outcome history, and recommended next plan.
- `war.flankPressures`, `war.townWar.flankPressures`, `war.skillDebrief`, location scars, drama memories, and soldier memory tags now carry the flank-emergence result.
- Verified with `npm run build` and `npm run game:cli -- verify --id war-skill-emergence-loop`.

Optional broader gate after this milestone:

```powershell
npm run game:cli -- regression-gate
```

## Recommended Build Order

Build in this order:

1. Keep Milestone 1 as the identity foundation.
2. Implement priority and task scoring before adding more building content.
3. Prove Construction/Nerve/Suppression/Logistics on trench building.
4. Add Medical rescue after the dangerous-build loop exists.
5. Add sustainment pressure so Logistics, Cooking, Endurance, and Rest matter.
6. Add Perception/flank/debrief integration to prove the full emergent loop.

Do not build the priority UI first. Do not add many new buildings first. Do not expand to tanks, multiplayer, giant economy, or a large map before the one-town skill loop produces readable stories.

## Definition Of Done Per Milestone

Each milestone must leave:

- one runtime behavior changed;
- one CLI command or inspect surface;
- one verification id;
- one snapshot field or cause-chain proof;
- one player-readable callout or debrief truth;
- docs/manual updated when commands change;
- no unrelated extraction-only polish.

## Design Risks

### Stats Without Behavior

If skills only sit on the roster, the game has fake depth.

Mitigation:

Every skill in the first slice must affect a task score, battlefield behavior, feedback line, or debrief cause.

### Priority Chore Spiral

If players must micromanage every soldier, the officer fantasy becomes admin work.

Mitigation:

Use presets, defaults, emergency overrides, and warnings. Priorities should be doctrine, not minute-by-minute puppeteering.

### Hidden Emergence

If the player cannot explain why a soldier refused or a trench failed, the system feels random.

Mitigation:

Important decisions need `reason` fields, battlefield callouts, and debrief cause chains.

### Dominant Strategy

If the best answer is always max Build or max Suppress, the system collapses.

Mitigation:

Every high priority creates a cost: exposure, ammo burn, fatigue, slower recovery, fewer scouts, or weaker camp sustainment.

### Too Much Simulation Too Soon

If Cooking, Social, Leadership, Stealth, Engineering, and drones all arrive before the first trench story works, the core loop becomes unreadable.

Mitigation:

Start with the required skills and expand only when each new skill collides with at least two existing systems.

## Final North Star Gate

The six-milestone package is done when this is true:

`The player cares who gets the order, who covers them, who hauls ammo, who rescues the wounded, who notices the flank, who keeps the camp functioning, and why the line held or fell.`

If that sentence is false, continue the current milestone before expanding scope.
