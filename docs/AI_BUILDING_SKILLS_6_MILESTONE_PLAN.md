# AI Building Skills 6 Milestone Plan

## Purpose

This document defines the six implementation milestones needed to reach the current building, AI, and skill-emergence north star for `Frontline Officer`.

The target is not a generic colony sim and not a pure RTS. The target is:

`an officer-led NPC war where skilled soldiers build, occupy, supply, defend, lose, remember, and learn from player-shaped terrain.`

This plan is intentionally CLI-first. Every milestone should be inspectable and verifiable through `npm run game:cli -- <command>` before UI polish is treated as complete.

## Source Direction

Read these docs before implementing:

- `PERSISTENT_WAR_OFFICER_FORK_INTENT.md`
- `BUILDING_AND_AI_NORTH_STAR.md`
- `NPC_ARCHETYPES_AND_PRIORITIES_NORTH_STAR.md`
- `EMERGENT_AI_SKILLS_NORTH_STAR.md`
- `EMERGENT_WAR_DRAMA_LAYER_PLAN.md`
- `wiki/project-cli.md`

## Current Baseline

The town-war runtime already has useful foundations:

- `TownWarState` with camps, soldiers, orders, ammo crates, match state, drama memories, location scars, debrief echoes, `aiThreats`, and `aiTactics`.
- Officer commands for `war-order-trench`, `war-order-ammo-crate`, `war-focus-lane`, `war-reinforce`, and `war-advance`.
- Soldier roles such as `builder`, `rifleman`, `suppressor`, `medic`, and `defender`.
- Tactical state such as `seek-cover`, `hold-cover`, `suppress-area`, `fallback`, `cover-builder`, and `recover-wounded`.
- Cover slots and completed construction impact records.
- Drama events, memories, relationship pressure, location scars, and beat/debrief chains.
- CLI verification patterns such as `verify --id emergent-war-drama`, `verify --id frontline-ai-player-decenter`, and `verify --id frontline-ai-cover-suppression`.

The gap is that soldiers are still too role-generic, trenches are not yet a full directional network, bunkers are not yet AI-spawning anchors, and priorities/skills do not yet drive enough visible behavior.

## North Star Proof

The six milestones are complete when a player can stage this loop:

1. Inspect a roster and see meaningfully different soldiers.
2. Set priorities for building, rescue, supply, defense, suppression, and rest.
3. Place a directional trench/bunker/wire build plan.
4. Watch specific skilled soldiers execute it under risk.
5. Watch AI occupy, supply, defend, and lose the position for understandable reasons.
6. Read the debrief and understand which skills, priorities, terrain choices, supplies, and memories caused the outcome.

The player sentence should be:

`I lost that trench because I sent a low-nerve builder too far forward, failed to cover the wire, let ammo run dry, and had no scout watching the trench mouth. Next time I know who to assign and how to build it.`

## Milestone 1 - Soldier Identity, Skills, And Roster Truth

Status: Implemented in the town-war runtime and CLI. Verify with `npm run game:cli -- verify --id war-roster-skills`.

### Goal

Make every town-war soldier inspectable as a distinct person with skills, traits, needs, and officer-trust state.

This is the foundation for every later emergence pass. Do not build a priority menu or deep bunker logic until the game can answer: `Who is this soldier, and why do I care?`

### Player Promise

The player opens the roster and sees people, not bodies:

- a fast but nervous builder;
- a steady medic;
- a poor shooter who is valuable as a cook;
- a suppressor who burns ammo but owns lanes;
- a scout who spots danger before others.

### Simulation Work

Add compact state to town-war soldiers:

- `displayName`
- `archetype`
- `skills`
- `traits`
- `needs`
- `workPriorities`
- `currentNeed`
- `experience`

First required skills:

- `construction`
- `medical`
- `logistics`
- `shooting`
- `suppression`
- `nerve`
- `perception`

Optional but allowed in the data model:

- `engineering`
- `cooking`
- `social`
- `endurance`
- `stealth`
- `leadership`

First needs:

- `fatigue`
- `hunger`
- `morale`

Keep values readable. A `0-10` skill scale and `0-1` pressure scale are enough.

### CLI Work

Add or extend:

- `war-roster`
- `war-roster --camp <camp-a|camp-b>`
- `war-soldier --id <soldier-id>`
- `snapshot` fields for `war.soldiers[*].skills`, `traits`, `archetype`, `needs`, and `workPriorities`

### Feedback Work

Add short roster-readable summaries:

- `Best skills: Construction 8, Nerve 3`
- `Trait: Brave`
- `Current need: tired`
- `Trust: strained`

### Acceptance

- Two spawned builders can have different `construction` and `nerve` values.
- `snapshot` exposes those values.
- `war-roster` explains at least one soldier's useful skill and one risk.
- Existing war commands still work.

### Verification

Add:

```powershell
npm run game:cli -- verify --id war-roster-skills
```

The verify should fail if soldiers do not expose skill identity in the CLI snapshot.

## Milestone 2 - Priority Matrix And Skill-Weighted Task Choice

### Goal

Make player-set priorities influence who takes jobs without turning soldiers into instant RTS puppets.

The priority system should become the officer's doctrine layer:

`I want these people to build, those people to cover, the medic to rescue, and tired soldiers to rest unless the line is collapsing.`

### Player Promise

The player can raise `Build` on an engineer, lower `Assault` on a medic, set a suppressor to `Suppress`, and see the war respond through task choices.

### Simulation Work

Add priority values:

- `0`: never unless directly ordered
- `1`: emergency only
- `2`: low
- `3`: normal
- `4`: high
- `5`: critical

Required priority columns:

- `Build`
- `Rescue`
- `Resupply`
- `Defend`
- `Suppress`
- `Rest`

Planned later columns:

- `Repair`
- `Haul`
- `Medic`
- `Cook`
- `Assault`
- `Scout`

Implement a first task scoring function:

`task score = priority + skill fit + urgency + safety + morale + distance`

Do not include every future factor yet. Leave room for relationship pressure and memory pressure in later milestones.

### CLI Work

Add:

- `war-priority list --camp <camp-a|camp-b>`
- `war-priority set --soldier <id> --work <work> --priority <0-5>`
- `war-priority preset --soldier <id> --preset <builder|medic|rifleman|suppressor>`

Snapshot should expose:

- soldier priorities
- selected current task reason
- current task score summary where useful

### Feedback Work

Add concise warnings:

- `All builders, no cover`
- `No medic assigned`
- `Ammo hauling uncovered`
- `Best engineer exposed`
- `Rest ignored: fatigue rising`

### Acceptance

- A high-`Build` soldier is more likely to take construction work.
- A high-`Suppress` soldier is more likely to cover a builder.
- A high-`Rescue` medic attempts recovery when a casualty state exists or is staged.
- A tired soldier with high `Rest` avoids noncritical work unless an emergency overrides it.
- The player can intentionally make a bad priority setup and see a readable warning.

### Verification

Add:

```powershell
npm run game:cli -- verify --id war-priority-task-choice
```

The verify should stage at least two soldiers with different priorities and prove they pick different jobs from the same battlefield state.

## Milestone 3 - Directional Trench Entities And AI Occupation

### Goal

Turn trenches from order completion/payoff records into real directional fortification entities with AI occupancy slots.

This milestone proves:

`I built that trench, soldiers wanted it, and it changed who survived.`

### Player Promise

The player orders a trench. A builder travels to it, creates rough cover, completes it, and nearby soldiers occupy it under pressure.

The trench is strong from the front and weak from the flank or rear.

### Simulation Work

Add fortification state:

- `id`
- `kind`
- `faction`
- `position`
- `facingAngle`
- `coverArcDegrees`
- `status`
- `health`
- `buildProgress`
- `occupancySlots`
- `connectedFortificationIds`
- `builtFromOrderId`

First required kind:

- `trench-segment`

Statuses:

- `planned`
- `building`
- `rough`
- `complete`
- `damaged`
- `contested`
- `lost`

Trench behavior:

- rough trench gives partial cover;
- complete trench gives stronger directional cover;
- occupied trench reduces incoming damage or suppression from the protected arc;
- flanked trench gives little or no protection;
- soldiers reserve and occupy trench slots;
- suppressed soldiers value trenches more highly.

### CLI Work

Extend:

- `war-order-trench --id <camp> --x <n> --y <n> --facing <degrees>`
- `snapshot` with `war.fortifications`
- `snapshot` with soldier `coverIntent` and occupied fortification slot

Add:

- `war-fortifications --camp <camp-a|camp-b>`

### Feedback Work

Add battlefield/debrief callouts:

- `Rough trench usable`
- `Trench occupied`
- `Flank angle exposed`
- `Trench saved line`
- `Trench failed from rear`

### Acceptance

- Completed trenches create fortification records, not only drama events.
- Friendly soldiers prefer friendly trench slots under fire.
- Directional cover changes suppression or damage outcomes.
- Flank/rear attacks reduce or bypass the trench benefit.
- Debrief can explain a trench hold or trench failure from tracked state.

### Verification

Add:

```powershell
npm run game:cli -- verify --id war-directional-trench-occupation
```

The verify should prove one trench has slots, one soldier occupies it, and the protected arc matters.

## Milestone 4 - Wire, Sandbags, Ammo Sustainment, And Labor Tradeoffs

### Goal

Add the first interacting building modifiers that make trench design skillful.

This milestone makes a trench line more than cover:

- wire shapes enemy movement;
- sandbags improve firing from chosen direction;
- ammo sustainment keeps suppression alive;
- logistics priority determines whether the line keeps fighting.

### Player Promise

The player can build a trench, put wire in front of it, add a sandbag firing lip, and keep an ammo crate behind it. The position works only if the layout and logistics make sense.

### Simulation Work

Add fortification kinds:

- `wire-belt`
- `sandbag-lip`

Use existing ammo crates but integrate them with fortification scoring.

Wire behavior:

- slows enemy crossing;
- increases exposure while crossing;
- does not block bullets;
- can trap friendly retreats if badly placed;
- is valuable only when covered by fire.

Sandbag behavior:

- attaches to trench or bunker slot;
- improves suppression or fire stability from a facing direction;
- narrows the best firing angle;
- attracts suppressors or riflemen with ammo.

Ammo sustainment:

- soldiers in fortified slots consume ammo;
- suppressors burn ammo faster;
- low logistics priority increases dry-line risk;
- nearby crates improve hold duration.

Labor tradeoffs:

- `Build` priority competes with `Suppress`, `Resupply`, and `Rest`;
- a line built without cover is risky;
- a line defended without supply is temporary.

### CLI Work

Add:

- `war-order-wire --id <camp> --x <n> --y <n> --facing <degrees>`
- `war-order-sandbag --id <camp> --x <n> --y <n> --facing <degrees>`

Extend snapshot with:

- fortification modifiers;
- wire exposure reads;
- sandbag occupied slot reads;
- ammo support read per fortified position.

### Feedback Work

Add callouts:

- `Wire covered`
- `Wire uncovered`
- `Sandbag lane active`
- `Ammo flow slowing`
- `Suppressor dry`
- `Retreat lane blocked`

### Acceptance

- Wire can slow or expose enemies.
- Sandbags make suppressors or riflemen more effective from a direction.
- Ammo crate proximity and logistics priority affect whether a fortified line keeps firing.
- A bad wire placement can create a friendly retreat penalty or warning.
- Player can explain why the line held or failed from layout and supply.

### Verification

Add:

```powershell
npm run game:cli -- verify --id war-wire-sandbag-sustainment
```

The verify should prove wire, sandbag, and ammo sustainment all affect one staged trench fight.

## Milestone 5 - Bunker And Blindage Anchors With AI Spawn/Rally

### Goal

Make bunkers and blindages into meaningful AI anchors tied to the trench network.

This is where building starts to feel like Foxhole-style forward position creation, but NPC-driven.

### Player Promise

The player builds a bunker tied into a trench. It becomes a local defensive anchor that can spawn, rally, or reinforce AI defenders. A blindage gives pressured soldiers and medics a safer recovery node.

The player can lose that anchor, and losing it changes the local war.

### Simulation Work

Add fortification kinds:

- `bunker`
- `blindage`

Bunker behavior:

- has directional firing slots;
- can spawn, rally, or reinforce defenders if supplied;
- depends on camp readiness, local supply, and health;
- attracts enemy pressure;
- becomes contested or disabled when enemies enter or destroy it;
- can change local control.

Blindage behavior:

- helps fatigue/morale recovery;
- provides a safer medic treatment point;
- gives non-firing shelter;
- becomes dangerous if isolated or overrun.

Skill interactions:

- `engineering` improves bunker quality or repair;
- `construction` controls build/repair speed;
- `logistics` stocks bunker readiness;
- `medical` uses blindage for casualty recovery;
- `social` or `leadership` steadies bunker defenders;
- `nerve` determines hold/fallback behavior under bunker pressure.

### CLI Work

Add:

- `war-order-bunker --id <camp> --x <n> --y <n> --facing <degrees>`
- `war-order-blindage --id <camp> --x <n> --y <n>`
- `war-bunker-status --id <bunker-id>`

Snapshot should expose:

- bunker health;
- bunker supply;
- bunker spawn/rally readiness;
- bunker defender list;
- connected trenches;
- blindage occupants and recovery effect.

### Feedback Work

Add callouts:

- `Bunker rally ready`
- `Bunker undersupplied`
- `Bunker spawning defenders`
- `Blindage treating wounded`
- `Anchor isolated`
- `Bunker lost`

### Acceptance

- A bunker can create or rally defenders in a local area.
- Bunker behavior depends on supply/readiness, not magic.
- AI defenders prefer bunker and connected trench slots.
- Enemies value flanking, suppressing, entering, or destroying the bunker.
- Blindages affect morale/fatigue/medical recovery.
- Losing a bunker creates a readable local-control and drama event.

### Verification

Add:

```powershell
npm run game:cli -- verify --id war-bunker-anchor
```

The verify should prove a bunker anchors defenders, depends on supply/readiness, and can be disabled or lost.

## Milestone 6 - Full Emergent Loop, Debrief, UI, And Regression Gate

### Goal

Connect skills, priorities, trench networks, sustainment, bunkers, drama memory, and player feedback into one playable first-town loop.

This milestone is not about adding more building types. It is about proving the north star end to end.

### Player Promise

The player can:

1. inspect the roster;
2. set priorities;
3. place a trench/bunker/wire/sandbag plan;
4. watch skilled soldiers build and defend it;
5. watch the enemy adapt;
6. lose or hold the line for understandable reasons;
7. read a truthful debrief;
8. make a better plan next time.

### Simulation Work

Integrate:

- skill-driven task choice;
- priority matrix;
- directional fortifications;
- connected trench graph;
- wire and sandbag modifiers;
- ammo sustainment;
- bunker spawn/rally;
- blindage recovery;
- morale/fatigue/hunger pressure;
- officer trust;
- relationship/memory effects;
- location scars;
- debrief cause chains.

Add an outcome classifier for fortified positions:

- `held`
- `overrun`
- `abandoned`
- `undersupplied`
- `flanked`
- `builder-lost`
- `ammo-dry`
- `bunker-disabled`
- `retreat-blocked`

### CLI Work

Add one high-value scripted proof flow:

- `war-build-line-demo`

It should stage a compact scenario with:

- named skilled soldiers;
- priority setup;
- trench order;
- wire/sandbag/ammo support;
- bunker or blindage;
- enemy pressure;
- outcome and debrief.

Add final verify:

```powershell
npm run game:cli -- verify --id war-building-skills-emergence
```

Update `wiki/project-cli.md` with every new command and verify id.

### UI Work

Add the first player-facing surfaces after CLI proof exists:

- compact roster cards;
- priority matrix;
- build ghost facing/readability;
- fortification status callouts;
- debrief cause chain.

Keep permanent UI restrained. Use transient battlefield callouts for moment-to-moment proof.

### Feedback Work

Debrief should be able to say things like:

- `Sokol finished the trench under fire because Makar kept the road suppressed.`
- `The wire delayed the assault but nobody covered the flank.`
- `The bunker ran dry after logistics priority stayed low.`
- `Vira reached the wounded through the trench, but the blindage was isolated.`
- `The line fell from the open trench mouth, not from the front.`

### Acceptance

- The full loop works from CLI.
- The full loop is readable in the browser at `1920 x 1080`.
- The player can inspect cause and effect after the fight.
- At least one outcome is surprising in motion but understandable after the debrief.
- The feature does not require multiplayer, a giant map, tanks, or broad economy expansion.
- Regression gate includes the new milestone verifies.

### Verification

Required:

```powershell
npm run game:cli -- verify --id war-building-skills-emergence
npm run game:cli -- regression-gate
```

Browser proof:

- run the dev server on `http://127.0.0.1:5847/`;
- capture or screenshot the first-town loop at `1920 x 1080`;
- verify roster, priorities, build order, active fortification status, and debrief are visible or inspectable.

## Recommended Build Order

Build the milestones in this exact order:

1. Soldier Identity, Skills, And Roster Truth
2. Priority Matrix And Skill-Weighted Task Choice
3. Directional Trench Entities And AI Occupation
4. Wire, Sandbags, Ammo Sustainment, And Labor Tradeoffs
5. Bunker And Blindage Anchors With AI Spawn/Rally
6. Full Emergent Loop, Debrief, UI, And Regression Gate

Do not start with the priority UI. Do not start with a huge building catalog. Do not start with bunker visuals. The first durable proof is that named soldiers with different skills make different choices and outcomes.

## Definition Of Done Per Milestone

Each milestone must leave:

- one runtime behavior changed;
- one CLI inspect or command surface;
- one verify id;
- one snapshot field or compact proof read;
- one player-readable feedback line or debrief truth;
- docs/manual updated when command surfaces change;
- no broad unrelated refactor.

## Risks

### Skill Spreadsheet Without Behavior

Stats that do not affect runtime decisions will make the feature feel fake.

Mitigation:

Every skill added in Milestone 1 must be used by Milestone 2, 3, or 4.

### Priority Chore Spiral

If the player has to micromanage every soldier every minute, the system becomes admin work.

Mitigation:

Use presets, defaults, emergency overrides, and warnings. Priorities should be doctrine, not constant babysitting.

### Building Catalog Before Building Meaning

Adding many objects before AI understands trenches will dilute the work.

Mitigation:

Prove trench occupation and directional payoff before bunker/blindage expansion.

### Hidden Emergence

If the player cannot explain why a trench failed, the system feels random.

Mitigation:

Every milestone needs callouts and debrief summaries sourced from tracked state.

### Dominant Strategy

If one setup always wins, replayability dies.

Mitigation:

Every strong priority or structure must create a cost: exposure, supply drain, fatigue, scarcity, flank risk, or camp readiness cost.

## Final North Star Gate

The six-milestone package is done only when this statement is true:

`The player cares which soldier gets the order, where the trench faces, whether the wire is covered, whether the bunker is supplied, whether the medic can reach the wounded, and why the line held or fell.`

If any part of that sentence is false, continue the current milestone before expanding scope.
