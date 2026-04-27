# NPC Archetypes And Priorities North Star

## Purpose

This document locks the RimWorld-like NPC direction for `Frontline Officer`.

The war should not be fought by generic bodies. Every soldier should have a readable identity, work profile, strengths, weaknesses, relationships, and priorities that affect what happens on the battlefield.

The goal is not to copy RimWorld's colony loop directly. The goal is to borrow the part that matters for this game:

`specific people with specific skills doing dangerous work according to player-set priorities.`

In `Frontline Officer`, those people build trenches, man bunkers, cook in camp, carry ammo, treat wounded, argue, panic, hold, retreat, and die because of the officer's orders and the war around them.

## North Star Sentence

`Every NPC should be different enough that losing, saving, assigning, or trusting them changes the war story.`

If a soldier's stats do not change work choice, build speed, combat behavior, social pressure, survival, dialogue, or player attachment, those stats are not doing enough.

## Core Picture

The player opens the personnel and priority menu before a push.

The roster is not just a list of health bars:

- Sokol is a fast builder with bad nerve.
- Vira is a medic who hates night work but will cross fire for wounded friends.
- Makar is a strong suppressor and loudmouth who keeps nearby recruits steadier.
- Olek is a good cook and mediocre rifleman, but the camp runs worse without him.
- Yara is socially cold but excellent under pressure.
- Rook is slower, disciplined, and trusted by builders.

The player raises building priority for two engineers, puts one rifle squad on construction cover, keeps the medic on rescue priority, and leaves a poor shooter back at camp to cook and haul supplies.

The trench order goes out.

The builders move first because their priorities and skills say this is their job. A nervous builder slows under fire. A brave one keeps digging. A suppressor with high weapons skill chooses the sandbag lip instead of wandering. The medic does not rush the enemy; she waits for casualties and moves through covered trench paths. The cook keeps camp readiness stable, so later bunker spawns arrive fed, rested, and less brittle.

When the line collapses, the player does not only lose "three units." The player loses the good engineer, the medic who kept saving builders, or the cook who quietly made the whole camp function.

That loss should change future decisions.

## Design Pillars

### 1. NPCs Are Workers And Soldiers

Every NPC exists in two worlds:

- the battlefield, where they shoot, suppress, build, rescue, retreat, and hold;
- the camp, where they cook, heal, haul, repair, socialize, rest, and prepare the next operation.

The same stats should matter in both places where possible.

An engineer is not only a faster trench builder. They also inspect damaged bunkers, improve construction quality, and become valuable enough that the player hesitates before sending them into open ground.

### 2. Priorities Are Officer Intent

The priority menu is not a colony-management side panel. It is another form of officer command.

The player should be able to say:

- build first
- rescue first
- defend first
- haul ammo first
- cook before the next push
- keep this medic off assault duty
- let this reckless soldier volunteer for dangerous work
- stop assigning my best engineer to exposed trench orders

Priorities should guide AI behavior without turning soldiers into instant cursor puppets.

### 3. Stats Create Visible Behavior

Stats must be legible in play.

The player should see:

- a high construction soldier finish a trench faster
- a low nerve builder stall under fire
- a high medical soldier stabilize wounded faster
- a high social leader steady nearby soldiers
- a bad cook harm camp readiness
- an excellent logistics worker keep ammo flowing
- a brave but reckless fighter overcommit

If the player cannot notice the stat through outcomes, feedback, or roster reads, the stat should be cut or merged.

### 4. Archetypes Are Starting Shapes, Not Classes

Archetypes should help the player understand a soldier quickly, but they should not hard-lock behavior.

A "medic" can still shoot. A "cook" can still carry ammo. A "builder" can still panic. A "rifleman" can still learn construction after surviving enough build orders.

Archetypes answer:

`What is this person naturally good at, and what does the officer risk when assigning them wrong?`

### 5. Emergence Comes From Interlocking Small Rules

The game should avoid giant bespoke personality simulations at first.

Use compact rules that combine:

- skills
- traits
- work priorities
- relationships
- morale
- memories
- fatigue
- wounds
- hunger/rest
- officer trust
- current orders
- nearby fortifications

The story emerges when those simple facts collide.

## Base Stats

Stats should use a small readable scale, such as `0-10`, with clear gameplay thresholds.

Recommended first-pass stats:

### Shooting

How well the soldier handles rifles, controlled fire, and ordinary firefights.

Gameplay effects:

- accuracy
- time to acquire target
- ammo waste
- confidence while defending
- ability to punish enemies crossing wire or open lanes

### Suppression

How well the soldier pins enemies and holds fire discipline under pressure.

Gameplay effects:

- suppression output
- ability to hold a sandbag lip or bunker port
- reduced panic while firing from strong positions
- better lane denial when supplied

### Construction

How well the soldier builds, repairs, upgrades, and improves fieldworks.

Gameplay effects:

- trench build speed
- bunker build speed
- repair speed
- chance to improve structure quality
- lower stall chance while working under manageable pressure

### Engineering

Technical understanding of fortifications, wire, bunkers, generators, radios, and later drones or vehicles.

Gameplay effects:

- higher-quality bunker placement execution
- faster wire and sandbag upgrades
- better repair outcomes
- ability to unlock advanced build tasks
- better evaluation of damaged structures

Construction is physical fieldwork. Engineering is technical competence.

### Medical

How well the soldier treats wounded and prevents deaths after injury.

Gameplay effects:

- stabilize speed
- casualty survival chance
- drag-and-treat behavior quality
- medical supply efficiency
- recovery time after battle

### Logistics

How well the soldier moves, stocks, counts, and routes supplies.

Gameplay effects:

- ammo hauling speed
- crate stocking
- bunker supply refill
- camp storage organization
- reduced waste during resupply
- better path choice under noncombat pressure

### Cooking

How well the soldier keeps the camp fed and functional.

Gameplay effects:

- camp readiness
- morale recovery
- fatigue recovery
- sickness or bad-meal risk later
- bunker reinforcement quality if the bunker depends on supplied camp readiness

Cooking matters because hungry, exhausted soldiers should fight worse and recover slower.

### Social

How well the soldier influences others.

Gameplay effects:

- nearby morale recovery
- panic resistance aura
- conflict mediation
- recruitment or prisoner interaction later
- squad cohesion
- dialogue weight
- trust repair after bad orders

Social is not cosmetic. A good social soldier can keep a trench from emotionally collapsing.

### Nerve

How well the soldier functions while suppressed, wounded nearby, or under artillery/drone threat.

Gameplay effects:

- panic threshold
- construction stall chance under fire
- retreat timing
- willingness to rescue under fire
- ability to keep firing from a bunker while pressure rises

### Endurance

How much work and movement the soldier can handle before fatigue degrades them.

Gameplay effects:

- hauling efficiency
- long build orders
- casualty dragging
- sprint or movement stamina
- fatigue recovery
- trench assault staying power

### Perception

How well the soldier notices threats, openings, wounded, flanks, and useful cover.

Gameplay effects:

- enemy detection
- flank awareness
- trench-mouth danger recognition
- faster reaction to wire breaches
- medic noticing wounded sooner
- builder recognizing unsafe pathing

## Derived Pressures

These are not base skills, but changing states that turn stats into drama.

### Fatigue

Rises from work, combat, carrying, construction, poor rest, and bad weather.

Effects:

- slower work
- worse shooting
- lower nerve
- more social conflict
- higher medical risk

### Hunger

Driven by time, poor camp cooking, supply failure, or being cut off.

Effects:

- lower morale recovery
- lower endurance
- more camp resentment
- worse long defensive holds

### Morale

Affected by casualties, officer trust, food, rest, social leaders, successful holds, and bad orders.

Effects:

- panic
- retreat
- willingness to build under risk
- willingness to rescue
- combat confidence

### Trust In Officer

Affected by whether the player's orders get people killed or saved.

Effects:

- hesitation on dangerous orders
- dialogue tone
- priority compliance
- willingness to volunteer
- resentment after repeated bad placements

### Attachment

Relationships between soldiers.

Effects:

- rescue willingness
- grief
- rage
- protective behavior
- social conflict
- collapse after witnessing a friend die

## Traits

Traits should be few, readable, and powerful enough to generate stories.

Recommended first trait set:

- `Brave`: higher nerve under fire, more likely to rescue, can overstay danger.
- `Cautious`: retreats earlier, avoids exposed build sites, survives more often.
- `Reckless`: acts quickly, accepts danger, can ruin careful plans.
- `Steady Hands`: better medical and construction under pressure.
- `Fast Learner`: gains skills faster from survival and repeated work.
- `Night Blind`: worse perception at night or in smoke.
- `Field Cook`: better cooking and morale recovery from camp meals.
- `Quartermaster`: better logistics, less supply waste.
- `Natural Leader`: nearby morale and trust recovery improve.
- `Loner`: lower social conflict from isolation, weaker team cohesion.
- `Claustrophobic`: worse bunker/trench nerve, better open movement.
- `Tunnel Rat`: better trench fighting and bunker clearing.
- `Shaken`: temporary or persistent trauma from bad events.
- `Loyal`: more likely to follow dangerous officer orders.
- `Resentful`: more hesitation after bad orders.

Traits should create tension, not only bonuses.

Example:

`Brave` is strong because the soldier keeps working under fire. It is risky because they may not leave soon enough.

## Archetypes

Archetypes are readable roster identities built from stats, traits, and starting priorities.

### Builder

Fantasy:

The person who turns officer intent into dirt, timber, wire, and survival.

Likely stats:

- high Construction
- medium Endurance
- medium Engineering
- variable Nerve

Gameplay role:

- digs trenches
- repairs bunkers
- upgrades sandbags
- works exposed orders

Risk:

Losing a good builder slows every future defensive plan.

### Engineer

Fantasy:

The technical field specialist who understands why the bunker, generator, wire, or radio line works.

Likely stats:

- high Engineering
- medium Construction
- medium Logistics
- lower Shooting

Gameplay role:

- advanced bunker work
- wire upgrades
- repairs
- later generators, radios, drones, vehicles

Risk:

Too valuable to waste, but essential for strong positions.

### Medic

Fantasy:

The person who turns a battlefield casualty into a survivor.

Likely stats:

- high Medical
- medium Nerve
- high Social or Attachment tendency
- lower Suppression

Gameplay role:

- stabilizes wounded
- drags casualties toward cover
- uses blindages and med posts
- improves post-fight recovery

Risk:

If the medic dies, every later wound becomes scarier.

### Rifleman

Fantasy:

The ordinary line soldier who holds ground when the officer gives them a survivable position.

Likely stats:

- medium Shooting
- medium Nerve
- medium Endurance

Gameplay role:

- occupies trenches
- holds roads
- assaults when ordered
- screens builders

Risk:

Riflemen are replaceable on paper, but veterans become precious.

### Suppressor

Fantasy:

The gunner who owns a lane when supplied and positioned correctly.

Likely stats:

- high Suppression
- medium Shooting
- medium Logistics dependency
- variable Endurance

Gameplay role:

- prefers sandbags and bunker firing ports
- pins roads, wire, and trench mouths
- burns ammo quickly

Risk:

Without ammo or a good firing angle, the suppressor becomes expensive dead weight.

### Cook

Fantasy:

The rear-area soldier who makes the frontline last longer.

Likely stats:

- high Cooking
- medium Social
- low combat stats

Gameplay role:

- improves camp readiness
- improves fatigue recovery
- reduces morale decay
- keeps bunker-spawn defenders in better shape

Risk:

Sending the cook into battle may solve a short manpower problem and create a long camp problem.

### Quartermaster

Fantasy:

The person who keeps ammunition, tools, food, and medical supplies moving.

Likely stats:

- high Logistics
- medium Endurance
- medium Perception

Gameplay role:

- stocks ammo crates
- routes supplies to bunkers
- reduces supply waste
- keeps construction fed

Risk:

Bad logistics makes good trenches go quiet.

### Sergeant

Fantasy:

The social anchor who keeps scared people functioning.

Likely stats:

- high Social
- high Nerve
- medium Shooting or Suppression

Gameplay role:

- steadies nearby soldiers
- reduces panic
- improves priority compliance
- repairs officer trust after hard choices

Risk:

Losing a sergeant can make a whole trench line more brittle.

### Scout

Fantasy:

The eyes that keep trenches from being surprised.

Likely stats:

- high Perception
- high Endurance
- medium Shooting
- lower Construction

Gameplay role:

- spots flanks
- identifies wire breach attempts
- warns bunkers
- later supports drone/recon systems

Risk:

Scouts see danger earlier, but often operate near danger.

## Priority Menu

The player needs a RimWorld-like priority surface, but tuned for war.

Priority values should be simple:

- `0`: never do this unless directly ordered
- `1`: emergency only
- `2`: low
- `3`: normal
- `4`: high
- `5`: critical

Recommended work columns:

- `Build`
- `Repair`
- `Haul`
- `Resupply`
- `Medic`
- `Rescue`
- `Cook`
- `Defend`
- `Suppress`
- `Assault`
- `Scout`
- `Rest`

The menu should support:

- per-soldier priority editing
- role presets
- faction/camp defaults
- emergency override
- "protect this specialist" toggle
- "allow dangerous work" toggle

The player should be able to make bad priority choices.

Example:

If every soldier has `Build: 5`, the line may finish faster but nobody covers the builders.

If every soldier has `Defend: 5`, the camp holds but construction stalls.

If the medic has `Assault: 5`, they may die before the casualty wave.

## Priority Resolution

At runtime, a soldier's next task should come from:

1. emergency survival
2. direct officer order
3. current threat and morale state
4. work priorities
5. skill fit
6. distance and path safety
7. relationship or memory pressure
8. fatigue, hunger, wounds, and supply state

This prevents the priority menu from becoming robotic.

A soldier can refuse, delay, or reinterpret a priority when the situation is extreme:

- a shattered builder retreats instead of finishing wire
- a medic ignores cooking to rescue a close friend
- a brave rifleman covers a builder even when `Build` is higher
- a resentful soldier hesitates before another exposed construction order

The player sets doctrine. The soldiers still feel human.

## Emergent Story Hooks

The system should create stories like:

- `The best engineer died because I set Build to critical during a push.`
- `The cook saved the operation because camp readiness kept bunker reinforcements stable.`
- `The medic crossed wire to save her friend and got pinned in the trench mouth.`
- `The quartermaster kept the ammo crate fed, so the sandbag gun never went quiet.`
- `The sergeant held the bunker together after two rookies panicked.`
- `The nervous builder became reliable after surviving three successful trench jobs.`
- `The reckless suppressor won the road and then died because he would not fall back.`

These stories should come from state, not scripted scenes.

## Relationship To Building

This system is required for the building north star.

Trenches, bunkers, wire, sandbags, blindages, and ammo crates only become rich when different NPCs use them differently.

Examples:

- high Construction builders finish trenches faster
- high Engineering soldiers create stronger bunker nodes
- high Suppression soldiers make sandbag lips matter
- high Logistics soldiers keep ammo positions alive
- high Medical soldiers turn blindages into survival centers
- high Social soldiers make bunker defenders hold longer
- high Nerve soldiers keep working when exposed
- low Perception soldiers fail to notice a flank entering the trench mouth

The player should not simply ask, "Where do I build?"

The better question is:

`Who do I trust to build, supply, defend, and survive this position?`

## Relationship To Drama

The existing emergent war drama layer should read these stats and priorities.

Dialogue and memory should react to:

- skilled builder lost
- medic saved or failed a friend
- cook sent into a bad fight
- engineer resented repeated exposed orders
- sergeant restored morale after a collapse
- quartermaster blamed for dry ammo
- low-nerve soldier became steady through experience

This is where RimWorld-style attachment becomes `Frontline Officer` command responsibility.

The player should feel the difference between:

`A soldier died.`

and:

`The only engineer who understood our bunker network died because I ordered a night trench under fire.`

## CLI-First Feature Surface

The first implementation should be testable from the project CLI before UI polish.

Recommended future commands:

- `war-roster`
- `war-roster --camp camp-a`
- `war-soldier --id town-war-soldier-3`
- `war-priority set --soldier town-war-soldier-3 --work Build --priority 5`
- `war-priority preset --soldier town-war-soldier-3 --preset engineer`
- `war-priority list --camp camp-a`
- `war-advance 60`

Snapshot should eventually expose:

- `war.soldiers[*].skills`
- `war.soldiers[*].traits`
- `war.soldiers[*].workPriorities`
- `war.soldiers[*].currentNeed`
- `war.soldiers[*].fatigue`
- `war.soldiers[*].hunger`
- `war.soldiers[*].morale`
- `war.soldiers[*].trustInOfficer`
- `war.soldiers[*].relationships`
- `war.camp.readinessBreakdown`

## UI Direction

The UI should have two surfaces.

### Personnel Cards

A readable soldier card should show:

- name
- archetype
- top skills
- traits
- current task
- fatigue/hunger/morale
- wounds
- trust in officer
- notable relationships or memories

This is where attachment forms.

### Priority Matrix

A compact table should show:

- rows as soldiers
- columns as work types
- priority numbers or icons
- role preset buttons
- warning markers when a soldier is assigned against their strengths

The priority matrix should feel like command doctrine, not spreadsheet homework.

Use warnings sparingly:

- `Best engineer exposed`
- `No medic assigned`
- `No cook scheduled`
- `Ammo hauling uncovered`
- `All builders, no cover`

## First Playable NPC Identity Slice

The first slice should be small but real.

Recommended first implementation:

1. Add soldier names, archetypes, skills, traits, fatigue, hunger, and work priorities to town-war state.
2. Add three starting archetypes: `builder`, `medic`, `rifleman`.
3. Let Construction affect trench build speed or completion time.
4. Let Medical affect casualty stabilization or recovery placeholder.
5. Let Nerve affect build-stall or retreat threshold under suppression.
6. Add CLI roster and priority commands.
7. Add one readable snapshot proof that two soldiers with different stats behave differently on the same build order.

This proves the foundation before adding cooking, quartermasters, sergeants, and deeper camp life.

## Risks

### Too Many Stats Too Early

If every number exists before it changes behavior, the system becomes noise.

Mitigation:

Start with stats that change current first-town gameplay: Construction, Medical, Shooting, Suppression, Logistics, Social, Nerve.

### Priority Menu Becomes Chore Work

If the player must tune every soldier constantly, the game becomes admin instead of command.

Mitigation:

Use presets, good defaults, and emergency overrides. Let priority editing matter most before operations and after losses.

### Archetypes Become Hard Classes

If archetypes prevent flexible wartime improvisation, they fight the fantasy.

Mitigation:

Use archetypes as presets and identity labels, not hard permission gates.

### Stats Hide The Story

If modifiers are invisible, players will not understand why things happened.

Mitigation:

Use battlefield callouts, roster notes, and debrief lines:

- `Vira stabilized him fast.`
- `Sokol stalled under fire.`
- `No cook on duty. Camp readiness fell.`
- `Makar kept the bunker firing.`

### RimWorld Drift

If the game becomes mostly camp chores, it loses the officer-war fantasy.

Mitigation:

Every camp stat should feed the war: trench building, bunker spawning, ammo flow, casualty recovery, morale, readiness, or protected operation preparation.

## Durable Rule

When evaluating an NPC stat, trait, archetype, or priority, ask:

`Does this make me care who receives the order?`

If the answer is no, cut it, merge it, or wait.
