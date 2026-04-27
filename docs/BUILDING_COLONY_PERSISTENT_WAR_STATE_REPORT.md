# Building, Colony Sim, And Persistent War State Report

Date: 2026-04-26

## Current Slice

`Frontline Officer` now has a playable first-town war slice where the player is the Russian officer on the right-side `camp-a`. The Ukrainian enemy camp is `camp-b` on the left. This side mapping is now locked in runtime and docs for the current slice.

The strongest current loop is:

1. Open officer tools.
2. Place or preview a trench with mouse placement and scroll rotation.
3. A named Russian builder accepts the order.
4. A suppressor can peel off camp defense and cover the work site.
5. The trench completes into real cover slots.
6. Soldiers occupy the trench.
7. Directional trench facing changes protection and combat outcome.
8. The debrief records named build, cover, and occupation stories.

This is no longer just fake construction art. The town-war soldiers are real simulation actors with health, ammo, pressure, skills, priorities, needs, tasks, and memories.

## Building State

Building is currently functional for trenches and ammo crates. Trenches are the better-proven feature.

Trench orders have:

- placement position;
- facing angle;
- build progress;
- build rate;
- assigned builder;
- supporting suppressor;
- exposure/risk tier;
- stalled/covered feedback;
- completed cover slots;
- occupation state;
- directional protection.

The latest important fix is that Russian starter colonists no longer auto-march to the center before the player orders anything. The builder starts at camp waiting for orders. Riflemen and suppressors hold the Russian camp perimeter until an order pulls them forward.

The main weakness is that building variety is still thin. Trenches are meaningful, but bunkers, wire, sandbags, depots, med posts, and bunker-spawn behavior are still future work or design intent, not fully playable systems.

## Colony Sim State

The colony-sim layer exists and is wired into the combat loop, but it is still early.

Current working pieces:

- named soldiers with roles and archetypes;
- skills such as construction, medical, logistics, shooting, suppression, cooking, social, endurance, perception, and leadership;
- RimWorld-like work priorities;
- camp work priorities for `Cook`, `Resupply`, and `Rest`;
- camp sustainment readouts for readiness, food, fatigue, hunger, ammo flow, build supply, medical load, and active workers;
- medics can peel into rescue work;
- suppressors can cover risky construction;
- builders carry fatigue after work;
- named stories explain who built, covered, occupied, rescued, or supplied.

This makes the game start to feel like a frontline colony instead of a pure RTS unit list. The gap is readability and consequence density. The player can inspect priorities and camp state, but the game still needs stronger moment-to-moment feedback when camp preparation changes a fight before the debrief.

Russian-side emergent dialogue now resolves through live `camp-a` soldiers instead of inherited extraction-shooter call signs. Drama chatter for build orders, trench holds, dugout completion, dugout damage, and casualty events should now sound like named Russian soldiers talking to each other, while the enemy remains abstracted as enemy radio traffic.

## Persistent War State

The persistent-war foundation is present but not complete.

Working foundations:

- durable town-war state;
- two camps with health, supply, morale, readiness, spawn positions, and destruction state;
- active match state with camp-destruction win condition;
- live AI-vs-AI town-war combat;
- protected stash remains available as the future operation-banking layer;
- officer deployment is locked to the Russian camp for this slice;
- smoke tests verify building, colony work, trench occupation, real damage, and faction alignment.

Still missing for the full persistent-war fantasy:

- operation-to-operation persistence beyond the current runtime slice;
- tech tree loss on officer death;
- stash resources feeding construction supplies in a durable way;
- long-term camp stockpiles and strategic operation planning;
- broader terrain scars that materially reshape future fights;
- bunker spawn networks;
- both-side player support.

## Current Feel

The game is closest right now to:

`single-town officer construction prototype with colony-sim soldier wiring`

It is not yet fully:

`Foxhole meets RimWorld persistent frontline sim`

The difference is persistence depth and systemic breadth. The current slice proves that named soldiers can build, cover, occupy, take damage, and carry consequences. The next step is making camp life, stockpiles, casualties, supply routes, and bunker/trench networks persist long enough that the player feels they are managing a war machine, not only winning a single trench test.

## Recommended Next Focus

Do not add more UI panels first. The next gameplay value should come from one deeper war loop:

- make supplies from the protected stash feed camp build/ammo stock;
- make casualties and fatigue persist across operations;
- add one bunker or dugout building that spawns/reinforces AI;
- make destroyed or captured trenches change the next fight;
- make the debrief recommend a concrete next build or camp priority based on what happened.

The strongest north-star test remains:

`Did my camp priorities and build orders cause named Russian soldiers to survive, die, hold, retreat, or change the next battle?`
