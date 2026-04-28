# RimWorld + Foxhole Player-Facing Spec Report

Date: 2026-04-26

## Product Picture

`Frontline Officer` should become a top-down war colony sim: `RimWorld people management` inside a `Foxhole-style frontline war`.

The player is not just a soldier and not just an RTS commander. The player is an officer trying to make a living frontline survive. You manage a Russian-side camp, place fieldworks, prepare supplies, set soldier priorities, and decide when to personally risk entering the fight. The war should feel like named people crossing deadly ground, building positions under pressure, dragging wounded back, running out of ammo, and slowly turning one camp into a wider controlled front.

The target player sentence is:

`I built a trench network, stocked it, assigned the right people, watched four soldiers try to cross the map, and the battle told me exactly why they survived or died.`

## Current Feeling

The game is moving in the right direction, but the pieces still feel isolated. Trenches can be built and occupied, dugouts exist, ammo boxes exist, soldiers have priorities, and camps can fight. The missing player experience is synergy. A trench should not feel like one standalone cover object. It should feel like the start of a line. A dugout should not feel like a nearby building. It should feel like shelter, reinforcement, and recovery for the trench network. An ammo box should not feel like a prop. It should feel like the reason the line keeps firing.

Right now, the player can place buildings but cannot always read the combo. The question `Why did this help me win?` is not answered strongly enough on the battlefield.

## The War Side: What Is Missing

The war side needs a stronger operational journey. Moving from one camp to another should feel like a dangerous expedition, closer to `Left 4 Dead` pacing inside a living war. Four soldiers leave camp. They cross roads, ruins, tree lines, shell holes, and trenches. They may get spotted, pinned, wounded, separated, rescued, or forced to retreat. The walk itself should produce stories before the fight even reaches the enemy camp.

The game also needs clearer ways to end a camp. Destroying the enemy camp should not be abstract. The player needs assault tools and readable camp damage:

- grenades, satchels, or demolition charges that can be found, stocked, and assigned;
- camp weak points such as command core, spawn dugout, ammo dump, radio mast, fuel, and bunker entrance;
- attack orders that tell soldiers to suppress, breach, throw explosives, drag wounded, or fall back;
- visible camp degradation where enemy spawn, morale, ammo, and building ability decline before final destruction.

The war side is also missing map conquest texture. The long-term dream is not only two camps. It is forward camps, captured trenches, supply roads, contested ruins, and a front that changes shape. The player should be able to say: `We took the school ruins, dug in, supplied it, and now it is our forward position.`

## The RimWorld Side: What Is Missing

The RimWorld side needs more emotional and practical consequence. Soldiers have names and skills, but the player should learn them through play:

- the good builder finishes trenches faster but gets exhausted;
- the nervous rifleman breaks under suppression unless placed in a safe trench;
- the medic refuses assault work because recovery priority is high;
- the social soldier keeps morale together after a bad loss;
- the hauler becomes important because the ammo box is too far back.

The priority menu should become the player’s main colony lever, not a debug panel. It should answer:

- Who builds?
- Who hauls ammo?
- Who defends?
- Who rescues?
- Who rests?
- Who is too wounded, tired, hungry, or shaken to trust with a push?

RimWorld works because pawn choice creates stories. `Frontline Officer` needs the same thing: not `a builder built a trench`, but `Vira built the forward trench while Makar covered her, then both were too tired for the next assault.`

## Trench Network North Star

Trenches should snap together into networks. A trench is not one object; it is a segment in a battlefield system.

Player-facing rules:

- trench segments snap end-to-end or branch at junctions;
- connected trenches share movement safety, retreat paths, and occupation logic;
- soldiers spread into firing bays instead of stacking;
- trench direction matters for protection and firing arcs;
- junctions create tactical choices: extend, branch, reinforce, or connect to a dugout;
- bad networks can trap soldiers during retreat;
- enemy grenades, suppression, flanking, and assault teams are the counters.

The player should be able to build:

- a shallow firing trench;
- a support trench back to a dugout;
- an ammo trench branch;
- a fallback trench toward camp;
- a forward assault trench creeping toward the enemy camp.

## Building Combo Language

Buildings should have readable combinations.

`Trench + Dugout`

The dugout becomes a rally, shelter, and spawn/reinforcement point for connected trench segments. Soldiers retreat to it, medics stabilize wounded there, and reinforcements enter the network from it.

`Trench + Ammo Box`

The ammo box feeds nearby trench segments. Soldiers in connected trenches fire longer, suppress better, and show `supplied` feedback. If the box is destroyed or empty, the line visibly slows down.

`Trench + Sandbags`

Sandbags improve one firing side and make a bay stronger from the front, but they do not protect against flanks or grenades.

`Trench + Wire`

Wire slows enemy assaults and protects trench mouths, but it can trap friendly retreat if placed badly.

`Dugout + Medic Priority`

The dugout becomes a casualty destination. Medics prefer wounded inside the network, making rescue feel planned instead of random.

`Forward Camp + Supply Road`

A captured or built forward camp becomes the next staging point. Holding it requires food, ammo, med supplies, builders, and rest cycles.

## Player Loop

1. Prepare the camp: assign builders, haulers, medics, suppressors, and rest.
2. Scout or observe the next dangerous route.
3. Place a trench network plan with snapping previews.
4. Attach support: dugout, ammo, wire, sandbags, med post.
5. Watch four to six named soldiers move out.
6. React when contact happens: suppress, rescue, retreat, finish the trench, or personally intervene.
7. Hold the new line long enough to make it useful.
8. Push from the line toward the enemy camp.
9. Breach or demolish camp systems.
10. Debrief: who lived, who died, what building combo mattered, what should be built next.

## Feedback The Game Needs

The map should explain the system without making the player read spreadsheets.

Needed battlefield feedback:

- `Connected trench network`
- `Ammo-fed firing bay`
- `Dugout shelter linked`
- `Wire blocking assault path`
- `Bad retreat path`
- `Suppressed in trench`
- `Grenade danger`
- `Builder exposed`
- `Medic route covered`
- `Enemy camp spawn damaged`

Needed debrief feedback:

- `The trench held because it was ammo-fed.`
- `The trench failed because wire blocked retreat.`
- `The dugout saved two wounded.`
- `The ammo box was too far back.`
- `The assault stalled because nobody carried explosives.`
- `The enemy camp cannot be destroyed until the command core is breached.`

## Is The Game Missing Something?

Yes, but it is missing connection more than raw features.

War-side missing pieces:

- dangerous expedition pacing between camps;
- demolition tools and clear camp destruction steps;
- forward camps and captured positions;
- supply roads and routes that can be cut;
- observation, artillery/drone pressure, or equivalent battlefield uncertainty;
- clearer attack/counterattack cycles after first contact.

RimWorld-side missing pieces:

- stronger pawn inspection and priority consequence;
- persistent wounds, fatigue, trauma, trust, and skill growth;
- daily camp needs that actually change battle timing;
- visible work queues and job ownership;
- relationship/morale stories after rescues, deaths, bad orders, and heroic holds.

Building-side missing pieces:

- snapping trench networks;
- building combo previews;
- connected supply logic;
- dugout/trench/ammo synergy;
- clear counters and failure reasons;
- readable proof that a good line beats a bad line.

## Success Criteria

This vision works when a player can explain a battle like this:

`I sent four soldiers out from the Russian camp to extend the trench toward the school. Vira and Oleg dug while Makar suppressed from the old bay. The new segment snapped to the dugout, so when Oleg went down the medic could drag him back. The ammo box kept the suppressor firing, but I forgot wire on the south mouth, so the Ukrainians flanked and grenaded the bay. Next run I need wire, a closer ammo box, and demolition charges before I push the enemy camp.`

That is the game: a war story created by building placement, soldier priorities, logistics, and danger.
