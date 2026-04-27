# Building And AI North Star

## Purpose

This document locks the building direction for `Frontline Officer`.

Building is not a side system. Building is the officer's most important way to shape the war.

The player should be able to enter the battlefield, mark a trench system, assign soldiers to build it, watch the line take shape under pressure, lose it, understand why it failed, and come back with a smarter layout.

The target is:

`Foxhole-style field construction, but single-player and NPC-driven first.`

The player should not spend the game hammering one wall forever. The drama should come from command, placement, logistics, exposure, and AI use.

The player places the intent. Soldiers make it real.

## Core Picture

The player opens the map or build overlay near a contested road.

Enemy pressure is building from the west. Friendly soldiers are pinned around camp cover and ruined yards. The officer marks a new trench line in the mud:

- a forward trench segment angled toward the road
- a second segment bent back toward camp
- a sandbag firing lip facing the enemy approach
- wire placed ahead of the trench to slow the assault
- a bunker node tied into the trench as the anchor
- an ammo crate behind the line

The player confirms the order.

Nothing appears for free.

Builders leave camp with supplies. Riflemen and suppressors try to cover the work. The trench starts as marked ground, then shallow dirt, then usable cover, then a proper fighting position. If the enemy pushes early, soldiers may throw themselves into a half-finished trench because half cover is better than open ground.

When the trench is complete, it changes the fight. Friendly AI gravitates into it. Suppressors prefer the sandbag lip. Riflemen occupy the trench bends. Wounded soldiers crawl or get dragged toward the covered side. The bunker begins spawning or rallying AI defenders for that position.

The line holds for a while.

Then the enemy adapts. They suppress the front, probe the wire, shift around the flank, enter the trench mouth, and start fighting down the line. The bunker keeps feeding defenders, but the trench was angled too far forward and has no safe fallback connection. Friendly soldiers get trapped. The enemy captures or neutralizes the position.

The player loses the trench.

That loss should teach a real lesson:

- the wire slowed the frontal push, but the flank was open
- the bunker faced the road, but not the trench mouth
- the ammo crate was too exposed
- the trench was good cover in one direction and bad ground from another
- soldiers used it exactly as built, and the bad layout killed them

The next build is smarter. The player hooks the trench back to camp, offsets the bunker, staggers wire, leaves a retreat lane, and places a second firing lip to cover the first trench mouth.

That is the building loop.

## North Star Sentence

`Build positions that AI soldiers understand, occupy, defend, lose, remember, and use to decide the war.`

If a structure does not change AI movement, survivability, morale, spawning, resupply, suppression, or assault behavior, it is not finished.

## Design Pillars

### 1. Buildings Are Orders, Not Instant Objects

The officer does not magically place war infrastructure.

The officer issues a construction order. Soldiers must:

- receive the task
- move from camp or depot
- carry or consume build supply
- reach the build site
- work while exposed
- pause under pressure
- resume when protected
- finish enough of the structure for other soldiers to use

The player should care about who is building and who is covering them.

### 2. Trenches Are Fighting Machines

Trenches are not decorative cover strips.

They are almost like player-shaped pillboxes spread across the ground. AI soldiers should treat a good trench as a fighting position:

- enter it under fire
- occupy useful firing slots
- prefer covered bends over open ground
- hold longer when the trench faces the threat
- retreat through connected trench paths if possible
- panic or die when trapped in a badly shaped trench

A trench should feel like a machine the player built out of dirt, angles, and risk.

### 3. Direction Matters

Every major fortification should have a front, a side, and a back.

The same trench can be strong from one direction and weak from another. The same bunker can dominate a road while being vulnerable from a trench mouth. The same wire can save a line or trap a retreat.

Directional building is what makes placement skillful.

### 4. AI Must Want The Position

AI should not need hand-authored scripts for every trench.

Soldiers should score fortifications as useful ground. They should prefer them when the position makes sense:

- defenders prefer owned trench and bunker slots facing the threat
- suppressors prefer sandbag lips, bunker ports, and long-lane fire slots
- builders prefer partially complete friendly orders when danger is tolerable
- medics prefer covered access to wounded soldiers
- attackers avoid wire, probe trench mouths, and flank directional cover
- retreating soldiers prefer connected trench paths back to camp

The building system and AI system must be designed together.

### 5. Bunkers Spawn And Anchor AI

Bunkers are not only strong cover.

Bunkers are local AI anchors. A completed friendly bunker should be able to spawn, rally, or reinforce AI defenders for that position.

This gives the player a reason to build forward strongpoints:

- a bunker can keep a trench line manned
- a bunker can restock local defense after casualties
- a bunker can create a small defensive pocket away from camp
- a bunker can become an enemy objective

The risk is that bunkers are expensive, visible, and dangerous to lose. If the enemy captures or destroys the bunker, the player loses more than a wall. They lose a local source of bodies, stability, and control.

### 6. Losing A Position Is Part Of Mastery

The game should not hide why a trench failed.

When a position falls, the player should be able to read the reason from the battlefield:

- enemies entered through an uncovered trench mouth
- wire was too far forward to be protected
- the bunker faced the wrong way
- the trench had no fallback branch
- the ammo crate was not close enough
- builders finished the line but no riflemen occupied it
- the position attracted more pressure than it could sustain

Losing a trench should make the player better at trench design.

## Building Types

### Trench Segment

The basic defensive unit.

Purpose:

- protect soldiers from directional fire
- create preferred AI defensive slots
- provide safer movement along a line
- form the backbone of a trench network

Rules:

- strong against fire from its protected side
- weak to flank, rear, grenades, and trench-mouth assaults
- should support multiple occupancy slots
- should connect to other trench segments
- should be useful while rough, but stronger when complete

AI use:

- suppressed soldiers dive into it
- defenders hold from it
- attackers try to enter from mouths or flanks
- retreating soldiers use connected segments when possible

### Sandbag Lip

A firing upgrade attached to a trench, bunker edge, or fighting position.

Purpose:

- make a slot better for controlled fire
- improve suppression output
- visually communicate the intended firing direction

Rules:

- narrower protection than a full trench
- best when facing an enemy lane
- vulnerable if approached from the wrong side

AI use:

- suppressors and riflemen prefer it when they have ammo
- low-ammo soldiers should not waste the slot
- medics and builders should avoid occupying it unless desperate

### Wire

A terrain-shaping obstacle.

Purpose:

- slow enemy assault paths
- increase exposure while crossing
- channel attackers toward covered kill zones
- punish careless frontal pushes

Rules:

- should slow, not fully stop
- should not block bullets
- should be removable, breachable, or bypassable later
- can hurt friendly retreats if badly placed

AI use:

- attackers avoid it when alternatives exist
- desperate or suppressed attackers may cross anyway
- defenders value positions that cover their own wire
- retreating friendlies may panic if wire blocks the safe route

### Bunker

A hardpoint and AI anchor connected to the trench network.

Purpose:

- spawn or rally AI defenders
- stabilize a defensive pocket
- project strong directional fire
- become a meaningful objective

Rules:

- expensive and slower to build
- strong from the front
- vulnerable from wrong angles, explosives, grenades, trench entry, or isolation
- should attract pressure over time

AI use:

- spawns or rallies defenders
- suppressors prefer firing positions inside or attached to it
- defenders fall back toward it when local trench pressure rises
- attackers prioritize flanking, suppressing, or entering it

### Blindage

A protected shelter inside or near trench systems.

Purpose:

- let soldiers recover morale
- shelter wounded or exhausted soldiers
- protect local supplies
- support a line without being the main firing point

Rules:

- weaker offensive projection than bunker
- valuable because it keeps soldiers alive and recoverable
- dangerous if isolated or overrun

AI use:

- wounded and pressured soldiers seek it
- medics use it as a safer treatment point
- defenders rotate out of firing slots toward it when pressure is high

### Ammo Crate

A local sustainment object.

Purpose:

- keep a trench or bunker firing
- make a position hold longer
- create a valuable overrun target

Rules:

- should sit close enough to matter but far enough to protect
- can be looted, destroyed, or run dry
- should affect whether suppressors can keep lanes pinned

AI use:

- low-ammo soldiers leave positions to resupply
- defenders value fortifications near friendly ammo
- attackers value overrunning crates

## AI Occupation Model

Every usable fortification should expose AI-use data.

Minimum data:

- owner faction
- position
- facing direction
- protected arc
- occupancy slots
- connected fortification ids
- build status
- health or integrity
- nearby supply access
- nearby threat pressure

Every soldier should evaluate usable positions through role and pressure.

Example priorities:

- `builder`: finish assigned construction, avoid hopeless exposure, retreat if suppressed
- `rifleman`: occupy nearest useful trench slot facing threat, hold until flanked or low ammo
- `suppressor`: prefer sandbag or bunker fire slot with long lane
- `defender`: prefer bunker, trench bend, or camp-facing fallback slot
- `medic`: prefer covered access to wounded, blindage, or rear trench segment
- `attacker`: avoid wire, suppress bunker, enter trench mouth, clear connected segments

AI should not always pick the mathematically best position. It should pick believable good positions with some personality, pressure, and command weighting.

## Trench Capture And Loss

A trench system should be contestable.

Ownership is not just who built it. Ownership should emerge from occupation and control:

- friendly soldiers occupy and fire from it
- enemies enter and clear it
- defenders retreat or die
- bunker spawn is destroyed, disabled, or captured
- nearby supply is cut off
- control changes or becomes contested

When enemies enter a trench, the fight should change from open firefight to trench fight:

- shorter sight lines
- higher grenade value
- suppression around trench mouths
- defenders falling back segment by segment
- attackers clearing bends and junctions

This creates the desired loss story: the player built the position, watched AI use it, then saw exactly how the enemy took it away.

## Player Learning Loop

The player should learn trench craft through repeated outcomes.

Good placement teaches:

- face the main threat
- cover wire with guns
- connect trenches to fallback routes
- protect trench mouths
- keep ammo close but not exposed
- use bunkers as anchors, not magic walls
- give soldiers enough depth to retreat and reoccupy

Bad placement teaches:

- open rear approaches get soldiers killed
- straight trenches can become shooting galleries
- wire without overwatch is only delay
- bunkers can be isolated
- builders die if orders are too far forward without cover
- a trench with no supply becomes a grave

The game should surface this through battlefield evidence, short reports, soldier chatter, and post-fight scars.

## Desired Player Stories

- `I ordered a trench before the push and the boys barely finished it before contact.`
- `The sandbags faced the road, so the machine gun held until ammo ran dry.`
- `The bunker kept spawning defenders, but I forgot to protect the trench mouth.`
- `The enemy crossed my wire because no one had line of sight on it.`
- `The trench saved the first squad and trapped the second. That was my layout.`
- `I lost the forward bunker, rebuilt the line behind it, and finally understood the terrain.`
- `The AI did not just stand near my buildings. They used them like soldiers.`

## First Playable Building Slice

The first implementation should prove one complete building-and-AI loop before adding a large catalog.

Recommended first slice:

1. Player orders one directional trench segment.
2. Builder travels to it and creates rough, then complete trench state.
3. Friendly riflemen and suppressors prefer the trench under fire.
4. Directional cover reduces damage or suppression from the front.
5. Enemy AI tries to flank or enter the trench when frontal pressure fails.
6. Player can add wire in front of the trench.
7. Player can add one bunker node that spawns or rallies defenders.
8. Losing the trench creates a readable event explaining why it fell.

This slice is enough if the player can say:

`I built that position, my soldiers used it, it saved them, then I lost it because I placed it wrong.`

## Implementation Direction

Building and AI should share one simulation model.

Avoid:

- decorative trenches that AI ignores
- instant structures without builder drama
- bunkers that are only health bars
- wire that only looks like an obstacle
- AI that receives hidden scripts instead of reading the built environment
- pure RTS control where soldiers become cursor puppets
- hammer-heavy construction that makes the player do labor instead of command

Prefer:

- serializable fortification state
- directional cover arcs
- AI occupancy slots
- connected trench graphs
- role-weighted position scoring
- partial construction states
- visible builder risk
- bunker spawn/rally behavior
- trench capture and loss events
- clear post-fight learning signals

## Relationship To Existing Direction

This document extends `PERSISTENT_WAR_OFFICER_FORK_INTENT.md`.

That document says build orders are the main verb and soldiers are the heart of the simulation. This document makes that concrete for fieldworks:

`A building is only real when AI soldiers can understand it, use it, defend it, lose it, and teach the player something through the outcome.`

## Durable Rule

When evaluating any building feature, ask:

`Does this make the player better at shaping AI soldier survival through terrain?`

If the answer is no, the feature is not core building work yet.
