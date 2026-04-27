# Emergent AI Skills North Star

## Purpose

This document locks how `Frontline Officer` should use AI skills to create emergence.

The reference infographics point to the same design lesson:

`simple rules + interacting agents + feedback loops + constraints = surprising but understandable play.`

For this project, AI skills are not just stat bonuses. Skills are the simple rules that make soldiers collide with the world in different ways. They determine who builds, who rescues, who cooks, who suppresses, who panics, who notices a flank, who keeps a bunker supplied, and who becomes irreplaceable.

The goal is:

`RimWorld-like personal skill identity inside a Foxhole-like NPC war.`

## North Star Sentence

`AI skills should make every order create different outcomes depending on who receives it, where it happens, what systems are colliding, and what the war remembers afterward.`

If a skill does not create new behavior, new choices, new feedback, or new stories, it is not ready.

## What The Infographics Add

The emergence references establish several rules this project should follow.

### Simple Rules First

Do not start by inventing a giant personality simulator.

Start with small readable rules:

- high Construction builds faster
- low Nerve stalls under fire
- high Medical saves wounded faster
- high Logistics keeps ammo positions alive
- high Social steadies nearby soldiers
- high Perception notices trench-mouth danger sooner

The depth should come from those rules interacting.

### Interaction Is More Important Than Content Quantity

More soldier types, more buildings, and more jobs do not automatically create depth.

Depth comes when:

- skills affect priorities
- priorities affect jobs
- jobs affect battlefield positions
- positions affect survival
- survival affects morale and memory
- memory affects later obedience, dialogue, and trust

One trench, one medic, one bad wire line, and one low-nerve builder can create more story than ten disconnected features.

### Feedback Loops Must Change Future Play

The result of an order should feed back into the war.

Examples:

- a successful trench build increases trust in the officer
- a failed exposed build creates resentment and a location scar
- a cook shortage lowers camp readiness, weakening bunker-spawn defenders
- a dry ammo crate makes suppressors less effective, causing the line to fold
- a medic saving the same builder creates attachment and future rescue risk

Emergence depends on outcomes changing the conditions for later decisions.

### Constraints Create Better Stories Than Freedom Alone

The player should not have perfect labor, perfect information, perfect safety, and perfect specialists.

Useful constraints:

- scarce build supply
- limited medics
- hungry or exhausted soldiers
- dangerous build sites
- partial fog of war
- limited bunker spawn readiness
- bad weather or night reducing perception
- social tension after repeated costly orders

The player should have enough agency to plan and enough limits to make plans interesting.

### Emergence Must Be Understandable After The Fact

Good emergence can surprise the player in the moment, but the player should be able to explain it afterward.

Example:

`The trench fell because the nervous builder stalled, the wire was not covered, the suppressor ran dry, and the enemy entered through the open mouth.`

That is the target. Not random chaos.

## Three Design Layers

### Fantasy Layer

The player should think:

`These are my people. They are not interchangeable. My best engineer, my exhausted cook, my brave medic, and my resentful suppressor all change how the war unfolds.`

### Gameplay Layer

The player:

- checks the roster
- sets priorities
- assigns or authorizes dangerous work
- builds positions around available skills
- watches soldiers interpret orders under pressure
- learns from failures
- protects specialists
- accepts that some people are better kept in camp

### Simulation Layer

The game tracks:

- skills
- traits
- priorities
- needs
- morale
- fatigue
- hunger
- wounds
- relationships
- officer trust
- memories
- location scars
- current battlefield pressure
- available fortifications and supplies

The simulation should stay legible through roster cards, brief battlefield callouts, and debrief truth.

## AI Skill Rules

Each skill should have at least one direct behavior effect, one interaction effect, and one story effect.

### Construction

Direct behavior:

- builds trenches, sandbags, wire, bunkers, blindages, and repairs faster

Interaction effect:

- combines with Nerve to decide whether work continues under fire
- combines with Logistics to decide whether work can continue with supply
- combines with Engineering to improve final structure quality

Story effect:

- losing a skilled builder delays future defensive plans
- a builder surviving repeated exposed orders becomes memorable

### Engineering

Direct behavior:

- handles technical fortifications, bunker upgrades, generators, radios, drones, vehicles, and advanced repairs

Interaction effect:

- improves bunker spawn/rally reliability
- makes wire and sandbag upgrades more effective
- reduces failure chance for damaged structures

Story effect:

- the player may preserve an engineer instead of risking them in a trench assault
- enemy raids on engineers or workshops become meaningful later

### Medical

Direct behavior:

- stabilizes wounded, treats injuries, improves recovery

Interaction effect:

- combines with Social or Attachment to decide who gets rescued first
- uses trenches, blindages, and med posts as safer treatment spaces
- consumes medical supplies and logistics support

Story effect:

- a medic repeatedly saving builders creates attachment
- losing the only medic changes how dangerous every future fight feels

### Logistics

Direct behavior:

- hauls ammo, build supplies, food, medicine, tools, and bunker stock

Interaction effect:

- keeps suppressors firing
- keeps builders working
- keeps medics supplied
- keeps bunkers spawning or rallying defenders

Story effect:

- a quartermaster saving a line by restocking ammo becomes a real war story
- failed logistics can make a good trench collapse without the trench itself being bad

### Cooking

Direct behavior:

- improves camp meals, readiness, fatigue recovery, and long-term morale

Interaction effect:

- feeds bunker spawn quality and camp recovery
- affects how quickly tired soldiers can return to work or battle
- interacts with Social by creating camp cohesion or resentment

Story effect:

- the cook is not glamorous until the camp breaks without them
- sending cooks to fight solves a short problem and creates a long one

### Social

Direct behavior:

- steadies nearby soldiers, repairs trust, reduces conflict, influences surrender or recruitment later

Interaction effect:

- combines with Nerve to hold a bunker under pressure
- combines with Medical to calm wounded soldiers
- combines with bad memories to create resentment, forgiveness, or refusal

Story effect:

- a sergeant can keep rookies from breaking
- losing a trusted social anchor can make the same trench weaker next time

### Shooting

Direct behavior:

- improves rifle accuracy, target acquisition, and ordinary combat

Interaction effect:

- combines with Perception to punish flanks early
- combines with cover and reload timing to create peeking fights
- combines with Nerve to determine whether shots stay controlled under suppression

Story effect:

- a veteran rifleman makes a weak trench viable
- a poor shooter should be valuable elsewhere instead of useless

### Suppression

Direct behavior:

- pins enemies, denies lanes, protects builders, and keeps trench mouths dangerous

Interaction effect:

- depends heavily on Logistics and ammo supply
- gets stronger from sandbag lips, bunker ports, and good facing
- supports Construction by buying work time

Story effect:

- a suppressor can be the reason a trench finishes
- if the ammo crate runs dry, the same position can suddenly fail

### Nerve

Direct behavior:

- determines panic, hesitation, retreat threshold, rescue willingness, and build-stall chance

Interaction effect:

- combines with every dangerous job
- modifies how soldiers react to suppression, wounds, nearby death, night, drones, artillery, and officer trust

Story effect:

- a nervous builder becoming steady through experience is a long-term arc
- a brave soldier may save others or die because they stayed too long

### Endurance

Direct behavior:

- controls fatigue from hauling, building, dragging wounded, fighting, and long movement

Interaction effect:

- combines with Cooking and Rest to determine operational tempo
- affects how long a trench line can stay manned
- affects whether logistics runs can continue under pressure

Story effect:

- exhausted soldiers make worse decisions
- a hard march before a build order can explain why the line failed

### Perception

Direct behavior:

- notices enemies, wounded, flanks, wire breaches, exposed paths, and useful cover sooner

Interaction effect:

- combines with Shooting for early fire
- combines with Medical to notice wounded
- combines with Engineering to identify failing structures
- combines with Scout priority to warn bunkers and trench defenders

Story effect:

- the trench was not bad, but nobody noticed the flank soon enough
- a good scout creates prevention stories instead of rescue stories

### Stealth

Direct behavior:

- moves quietly, avoids detection, performs recon, and later supports raids or sabotage

Interaction effect:

- combines with Perception for scouting
- combines with Engineering for wire cutting, bunker sabotage, and drone/radio work later
- combines with Nerve for close trench infiltration

Story effect:

- stealth gives the war surprise and uncertainty without requiring scripted missions

### Leadership

Leadership can be a derived or explicit skill. It should exist only if Social is not enough.

Direct behavior:

- improves nearby priority compliance, fallback discipline, and hold behavior

Interaction effect:

- combines with Social, Nerve, and officer trust
- makes squads more coherent around bunkers and trench networks

Story effect:

- a leader can turn a group of frightened NPCs into a line that holds

## Rule Combinations For Frontline Officer

The third infographic's key lesson is that emergence appears when rules interact, not when rules stay isolated. These are the project-specific combinations to design around.

### Terrain + Movement + Collision = Positioning

Rules:

- soldiers move through space
- two soldiers cannot occupy the same slot
- trenches, wire, roads, ruins, and bunkers constrain movement

Emergent outcomes:

- chokepoints
- trench-mouth traffic
- blocked retreats
- flanking routes
- ambush positions
- wounded soldiers slowing a fallback

Skills involved:

- Perception
- Endurance
- Nerve
- Medical
- Construction

### Scarcity + Skill + Priority = Labor Drama

Rules:

- build supply is limited
- skilled workers are limited
- priorities decide who responds first

Emergent outcomes:

- risky specialization
- tradeoffs between cover and construction
- camp tasks competing with frontline tasks
- losing one specialist changing the whole plan

Skills involved:

- Construction
- Engineering
- Logistics
- Cooking
- Medical

### Vision + Noise + Threat = Recon And Fear

Rules:

- soldiers see imperfectly
- loud work, gunfire, and vehicles draw attention
- enemies investigate and respond

Emergent outcomes:

- exposed builders spotted
- trench work attracting pressure
- stealth routes
- false safety
- accidental chain reactions

Skills involved:

- Perception
- Stealth
- Nerve
- Shooting
- Suppression

### Health + Cover + Reload Time = Tactical Fights

Rules:

- damage is dangerous
- cover reduces exposure
- weapons need reloads and ammo

Emergent outcomes:

- peeking and timing battles
- suppression behavior
- repositioning under pressure
- risk windows
- bunker and sandbag value

Skills involved:

- Shooting
- Suppression
- Nerve
- Medical
- Logistics

### Social Trust + Shared Resources + Reputation = War Stories

Rules:

- soldiers remember outcomes
- supplies are shared
- reputation spreads through camp and squads

Emergent outcomes:

- loyalty
- resentment
- blame
- informal leadership
- rescue attachments
- refusal or hesitation after repeated bad orders

Skills involved:

- Social
- Leadership
- Cooking
- Medical
- Logistics

## Feedback Loops

AI skills need feedback loops that affect future play.

### Positive Loops

Successful build order:

1. high Construction finishes trench
2. trench saves squad
3. squad gains trust in officer
4. builder gains confidence or pride memory
5. future risky build orders get slightly better compliance

Reliable supply:

1. high Logistics keeps ammo flowing
2. suppressor holds lane
3. builders finish bunker
4. bunker spawns defenders
5. camp control improves

Good camp sustainment:

1. cook keeps readiness high
2. soldiers recover fatigue faster
3. bunker reinforcements arrive steadier
4. front line holds longer

### Negative Loops

Bad exposed build:

1. low Nerve builder stalls
2. cover team runs dry
3. builder dies
4. witnesses lose trust
5. later exposed orders create hesitation

Dry ammo:

1. logistics priority too low
2. ammo crate empties
3. suppressor stops pinning wire
4. enemy crosses
5. trench is overrun

Camp neglect:

1. no cook or rest priority
2. fatigue rises
3. morale recovery drops
4. panic threshold lowers
5. defensive positions collapse faster

## Priority Menu As Emergence Control

The priority menu is how the player changes rule weights without scripting outcomes.

The player does not order every action. The player changes the conditions:

- Build priority makes engineers expose themselves sooner.
- Rescue priority makes medics cross danger.
- Suppress priority burns ammo but protects work.
- Cook priority improves future readiness at the cost of current manpower.
- Rest priority prevents collapse but slows construction.
- Scout priority spots flanks but removes someone from the line.

This is the exact kind of design the infographics point toward:

`small player verbs changing system behavior through feedback.`

## Skill-Driven AI Decision Formula

AI task choice should be understandable:

`task score = priority + skill fit + urgency + safety + relationship pressure + morale state + supply need + distance`

The exact numbers can change, but the player-facing logic should remain readable.

Example:

A medic with high Rescue priority sees a wounded friend near a trench mouth.

- Rescue priority is high.
- Medical skill is high.
- Attachment is high.
- Danger is high.
- Nerve is medium.
- Covered trench path exists.

The medic goes.

If the same medic has low Nerve, no covered route, and no attachment, they may wait for suppression or refuse until the area is safer.

That is not random. That is emergence.

## Player-Facing Feedback

The player needs short readable proof that skills matter.

Use battlefield callouts:

- `Sokol stalled under fire`
- `Vira stabilized Dima`
- `Makar has the road pinned`
- `Olek restored camp meals`
- `No quartermaster: ammo flow slowing`
- `Rook rallied bunker defenders`
- `Scout warning: trench mouth exposed`

Use roster notes:

- `Best skills: Construction 8, Nerve 3`
- `Trait: Brave`
- `Memory: Exposed build survived`
- `Trust: strained`
- `Current priority: Build 5`

Use debrief truth:

- `The trench finished because Sokol kept digging under suppression.`
- `The bunker fell after ammo hauling stopped.`
- `The medic reached the wounded, but the open wire lane pinned her.`

## Common Pitfalls

### Too Much Chaos

If every soldier constantly improvises, players cannot read the system.

Rule:

Soldiers can surprise the player, but their behavior should be explainable by skills, priorities, pressure, or relationships.

### Too Little Interaction

If skills only change isolated numbers, emergence dies.

Rule:

Every skill must touch at least two other systems.

### Dominant Strategy

If the best answer is always "max Build" or "max Suppress," the priority system has failed.

Rule:

Every priority should create an opportunity cost.

### Hidden Rules

If players cannot tell why the medic refused or the builder stalled, the system feels unfair.

Rule:

Important AI choices need battlefield or roster feedback.

### Excess Complexity

If the player must manage twenty stats before the first trench matters, the system becomes work.

Rule:

Start with fewer skills, prove interactions, then expand.

## First Implementation Slice

The first skill-emergence slice should prove interaction density, not breadth.

Required skills:

- Construction
- Medical
- Logistics
- Shooting
- Suppression
- Nerve
- Perception

Required changing states:

- fatigue
- morale
- officer trust

Required priorities:

- Build
- Rescue
- Resupply
- Defend
- Suppress
- Rest

Required proof:

1. Two builders with different Construction and Nerve respond differently to the same trench order.
2. A suppressor with ammo support keeps builders safer.
3. Low Logistics causes ammo to run dry and changes the fight.
4. A medic with high Rescue priority attempts casualty recovery.
5. A high Perception soldier spots or reacts to an exposed flank sooner.
6. The debrief explains the outcome from real tracked causes.

This is enough to validate the emergence model.

## Relationship To Existing North Stars

This document extends:

- `PERSISTENT_WAR_OFFICER_FORK_INTENT.md`
- `BUILDING_AND_AI_NORTH_STAR.md`
- `NPC_ARCHETYPES_AND_PRIORITIES_NORTH_STAR.md`
- `EMERGENT_WAR_DRAMA_LAYER_PLAN.md`

The building north star says structures are only real when AI understands and uses them.

The NPC archetype north star says soldiers are only real when the player cares who receives the order.

This document connects those ideas through emergence:

`skills are the small rules that make soldiers, buildings, priorities, supplies, memory, and combat collide into unscripted war stories.`

## Durable Rule

When evaluating an AI skill or behavior rule, ask:

`What other rule does this collide with, and what story can that collision create?`

If there is no collision, there is no emergence yet.
