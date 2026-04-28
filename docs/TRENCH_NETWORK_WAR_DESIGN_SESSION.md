# Trench Network War Design Session

This is a handheld design session for the next scale of the town war.

Read it out loud. Pause at the questions. The goal is to design connected trenches, fallback behavior, and upgradeable fighting positions without turning the game into a pure RTS console.

## One Sentence

Trenches should become a living defensive network where soldiers build, occupy, shoot, get pressured, fall back, and re-form in stronger positions that the officer prepared earlier.

## Current Baseline

The current game already has the important first pieces.

Soldiers can build trenches. Trenches create cover slots. Named town-war soldiers can occupy those slots. A soldier in a trench now gets real combat advantages: longer fire range and heavy damage reduction. The raid-side shooting body is synced to the real town-war soldier, so the person in the trench is now the person doing the fighting.

The CLI already has useful entry points for this direction:

- `war-order-trench`
- `war-order-dugout`
- `war-dugout-report`
- `war-priority`
- `war-build-test`
- `war-build-report`
- `npcs`

The next design step is not "add more trench art." The next design step is making trenches form a readable tactical system.

## The Fantasy

The player should be able to say:

"I built the first trench too far forward. Olek held it for two minutes, then the pressure broke him. He fell back through the communication trench to the MG bay, and the line stabilized because I had stocked ammo there earlier."

That is the fantasy.

Not a tower defense lane.

Not a spreadsheet.

A war story that came from terrain, preparation, fear, ammunition, and named soldiers trying to live.

## Design Pillars

### 1. Trenches Are Positions, Not Buildings

A trench is not just a placed object. It is a fighting position with:

- firing direction
- cover value
- occupancy slots
- fallback links
- ammo access
- upgrade state
- morale effect
- exposure risk

The player should think about where a trench faces, what it connects to, and whether soldiers can survive leaving it.

### 2. Fallback Is A Core Behavior

Soldiers should not only die in place.

When pressure rises, ammo runs low, or the trench becomes exposed, a soldier should evaluate fallback. A good fallback feels like discipline. A bad fallback feels like panic.

The best version is not "soldier instantly teleports to safety." The best version is:

1. Soldier is holding.
2. Soldier gets pinned or wounded.
3. Soldier decides the trench is failing.
4. Soldier runs or crawls through a connected route.
5. Nearby soldiers cover the movement if they can.
6. Soldier reaches the next trench and resumes fighting.
7. The map remembers that the first trench was lost.

### 3. Upgrades Create Doctrine

A trench upgrade should change how the position is used.

It should not be a generic plus ten percent modifier unless the player can feel it.

Good upgrades create roles:

- "This is the MG trench."
- "This is the fallback trench."
- "This is the ammo-fed trench."
- "This is the dugout rest trench."
- "This is the observation trench."
- "This is the exposed forward trench that buys time and probably kills somebody."

### 4. The Officer Wins Before Contact

The player should feel that the battle was partly decided by preparation.

If the officer prepared a fallback line, stocked ammo, and assigned defenders, soldiers should survive pressure better.

If the officer only built one heroic forward trench, soldiers may shoot well for a while, then get trapped.

### 5. The Map Must Tell The Story

The player must understand what happened without opening a giant panel.

Use map feedback:

- `Holding`
- `Pinned`
- `Falling back`
- `Covering fallback`
- `Reached second line`
- `Forward trench lost`
- `MG bay firing`
- `Ammo-fed`
- `No fallback route`

Permanent UI should stay small. Important events should appear near the trench and fade.

## The Trench Network Model

A trench network is a graph.

Each trench segment has slots. Each slot can hold one soldier. Segments can connect to other segments, dugouts, ammo crates, and upgrade modules.

### Trench Segment State

Each segment should track:

- `id`
- `faction`
- `position`
- `facingAngle`
- `networkId`
- `connectedSegmentIds`
- `connectedDugoutIds`
- `connectedAmmoCrateIds`
- `slots`
- `upgradeIds`
- `pressure`
- `suppression`
- `integrity`
- `lastContactAt`
- `lostAt`

### Cover Slot State

Each cover slot should track:

- `slotId`
- `segmentId`
- `position`
- `facingAngle`
- `occupiedBySoldierId`
- `fireArcDegrees`
- `exposure`
- `fallbackScore`

### Soldier Trench Intent

Each soldier should have a simple trench intent:

- `none`
- `occupy`
- `hold`
- `fallback`
- `coverFallback`
- `resupplyTrench`
- `repairTrench`
- `manEmplacement`

This is easier for other agents to work with than scattering trench behavior across task labels and marker logic.

## Fallback Behavior

Fallback should be a decision, not a random flee.

### Fallback Triggers

A soldier considers fallback when any of these are true:

- health is low
- morale pressure is high
- ammo is low
- nearby enemies are too close
- trench integrity is damaged
- the trench has no friendly neighbor
- the soldier is suppressed and not supported
- an officer order marks the trench as a delaying position

### Fallback Blockers

A soldier may refuse or delay fallback when:

- no connected fallback slot exists
- the next trench is full
- the route is exposed
- the soldier is assigned to an MG or tripod
- the soldier is covering another fallback
- the officer ordered "hold at all cost"
- the soldier has high nerve and the position still has ammo

### Fallback Target Scoring

A fallback trench should be scored by:

- distance from current trench
- connection safety
- cover value
- upgrade value
- available slot
- ammo access
- enemy pressure
- friendly support nearby
- whether it faces the current threat

Example scoring language:

```text
fallbackScore =
  coverValue
  + upgradeValue
  + ammoSupport
  + friendlySupport
  + facingThreatBonus
  - routeExposure
  - enemyPressure
  - distanceCost
```

The player should never see this formula. The player should see:

`Best fallback: MG bay, ammo-fed, covered route.`

### Fallback Outcomes

Fallback can produce different stories:

- clean fallback
- covered fallback
- panicked fallback
- wounded during fallback
- blocked fallback
- refused fallback
- fallback trench overrun
- second line stabilized

This is where the game becomes cinematic.

## Upgrade Families

The upgrades should be organized by what they do in the battle.

### Basic Survival Upgrades

These make a trench safer.

#### Sandbags

Purpose: cheap front cover.

Effect:

- better frontal protection
- small range or accuracy support
- faster to build than heavy upgrades

Tradeoff:

- visible
- not enough against grenades or flank fire

Player read:

`Sandbagged front. Good against rifle fire. Weak if flanked.`

#### Duckboards

Purpose: movement and fatigue.

Effect:

- faster movement through connected trenches
- lower fatigue while holding
- better fallback speed

Tradeoff:

- no direct firepower increase

Player read:

`Duckboards. Faster fallback. Less fatigue.`

#### Overhead Cover

Purpose: artillery and grenade survival.

Effect:

- reduces blast damage
- reduces suppression from indirect fire
- improves morale under bombardment

Tradeoff:

- expensive
- can reduce firing visibility unless paired with firing slits

Player read:

`Overhead cover. Safer under blasts. Worse sightlines until improved.`

### Firepower Upgrades

These make a trench dangerous.

#### Tripod Rifle Rest

Purpose: subtle accuracy and range improvement.

Effect:

- better aimed fire
- small range increase
- lower fatigue while firing

Tradeoff:

- only helps one slot
- modest effect

Player read:

`Tripod rest. One rifleman shoots steadier.`

#### Machine Gun Emplacement

Purpose: lane denial.

Effect:

- high suppression
- longer fire range
- wider morale effect
- can cover fallback routes

Tradeoff:

- needs ammo
- slow to rotate
- vulnerable to grenades, flanks, and focused fire
- may pin a soldier to the role and delay fallback

Player read:

`MG bay. Holds a lane if fed. Dangerous if isolated.`

#### Firing Slits

Purpose: safer direct fire.

Effect:

- improves protection while firing
- improves frontal arc
- reduces exposure during sustained fire

Tradeoff:

- narrower arc
- worse if enemy approaches from side

Player read:

`Firing slits. Strong front. Bad side angle.`

### Logistics Upgrades

These let trenches keep fighting.

#### Ammo Shelf

Purpose: local reload buffer.

Effect:

- soldiers in this segment reload from local stock
- delays ammo panic
- supports MG bay

Tradeoff:

- can run dry
- can explode or be lost if trench is captured later

Player read:

`Ammo shelf. This trench can keep firing longer.`

#### Communication Trench

Purpose: safe connection.

Effect:

- improves fallback safety between two segments
- improves resupply movement
- improves medic access

Tradeoff:

- takes build time
- creates a predictable route enemy pressure can target

Player read:

`Comms trench. Safer fallback and resupply route.`

#### Dugout Link

Purpose: rest and casualty shelter.

Effect:

- soldiers can recover fatigue nearby
- wounded can be stabilized faster
- fallback can end in shelter if firing slots are full

Tradeoff:

- does not directly shoot
- if overrun, consequences are severe

Player read:

`Dugout link. A place to breathe or drag wounded.`

### Information Upgrades

These make the network smarter.

#### Observation Post

Purpose: threat detection.

Effect:

- sees enemy pushes earlier
- improves fallback timing
- helps MG pick the right lane

Tradeoff:

- lightly protected
- needs a soldier with perception or nerve to matter most

Player read:

`Observation post. Earlier warning. Better fallback calls.`

#### Field Telephone Wire

Purpose: coordination.

Effect:

- faster order response
- better group fallback
- better cover-fire coordination

Tradeoff:

- can be cut
- does not help isolated positions

Player read:

`Phone wire. The line reacts faster until cut.`

## Soldier Roles Inside The Network

Different soldiers should naturally prefer different trench work.

### Rifleman

Best at holding normal firing slots and covering fallback.

Good behaviors:

- holds sandbagged or firing-slit slots
- covers another soldier falling back
- shifts to second line when pressure rises

### Suppressor

Best at MG bays, long lanes, and suppression.

Good behaviors:

- mans MG emplacement
- burns ammo to cover fallback
- needs resupply priority

### Builder

Best at upgrades, repair, and emergency trench work.

Good behaviors:

- improves forward trenches before contact
- repairs damaged segments
- builds communication trenches
- should avoid staying in exposed front slots unless desperate

### Medic

Best at dugout links and casualty lanes.

Good behaviors:

- moves along safer trench connections
- pulls wounded toward dugout
- avoids exposed forward slots unless morale or order forces it

### Defender

Best at holding key slots longer than others.

Good behaviors:

- delays fallback
- anchors second line
- benefits heavily from firing slits and ammo shelf

## Officer Commands

The player should not micro every step.

The player gives intent. Soldiers execute.

### Suggested Commands

#### Build Trench

Current command, expanded over time.

Player meaning:

"Put a fighting position here."

#### Upgrade Trench

New command.

Player meaning:

"Turn this position into a specific kind of position."

Examples:

- upgrade to sandbags
- upgrade to MG bay
- upgrade to ammo shelf
- upgrade to communication trench
- upgrade to overhead cover

#### Mark Fallback Line

New command.

Player meaning:

"If the front trench breaks, fall back here."

This should not force an instant retreat. It should influence the soldier decision model.

#### Hold At All Cost

New command, dangerous.

Player meaning:

"This trench must buy time, even if soldiers die."

This should be powerful but morally expensive.

#### Elastic Defense

New command.

Player meaning:

"Trade ground for lives. Fall back before the line collapses."

This should preserve soldiers but can lose forward trenches.

#### Prepare Counterpush

New command.

Player meaning:

"Let the front trench absorb pressure, then push from the second line when the enemy is exposed."

This should be a later feature, after fallback works.

## The Core Loop

### Preparation

The officer places trenches and chooses upgrades.

Questions:

- Where is the first contact line?
- Where is the fallback line?
- Which trench gets ammo?
- Which trench gets the MG?
- Which route lets wounded survive?

### Contact

Enemy pressure hits the forward trench.

The player watches:

- who is holding
- who is pinned
- who is low on ammo
- which trench is becoming untenable

### Decision

The officer chooses:

- reinforce
- resupply
- upgrade
- order fallback
- hold at all cost
- personally intervene

### Consequence

Soldiers survive, die, retreat, stabilize, or lose the line.

The map changes because of that.

## First Playable Target

Do not build the whole war at once.

The first playable target should be one connected trench chain:

1. Forward trench.
2. Communication trench.
3. Second-line trench.
4. Optional ammo shelf.
5. Optional MG bay.
6. One fallback decision under pressure.

This is enough to prove the fantasy.

The player should be able to create this story:

"The first trench got pinned. Vira covered the fallback with the MG. Olek reached the second line wounded but alive. The forward trench was lost, but the camp did not collapse."

## CLI First Spec

The CLI should prove the system before the UI is polished.

### Proposed Commands

```text
war-trench-network report [--camp camp-a]
war-trench-upgrade --slot <slot-id> --upgrade <sandbags|duckboards|overhead-cover|tripod|mg-bay|firing-slits|ammo-shelf|observation-post|phone-wire>
war-trench-link --from <segment-id> --to <segment-id> --kind <communication|fallback|resupply>
war-trench-doctrine --segment <segment-id> --doctrine <hold|elastic|fallback|mg-anchor|delay>
war-trench-fallback-test --soldier <soldier-id> --from <slot-id> --pressure <0-1>
war-trench-pressure-test --segment <segment-id> --seconds <n>
```

### Reports Should Show

The report should answer:

- Which soldiers are in which trench?
- Which trench is strongest?
- Which trench is most exposed?
- Which route is the fallback route?
- Which soldier will fall back first?
- Which soldier is covering fallback?
- Which upgrade is missing for the current pressure?

Example output:

```text
Network Alpha
Forward trench: occupied by Olek, pinned, ammo-fed, fallback route open.
Second line: Vira in MG bay, ready, good frontal lane.
Dugout: empty, can receive wounded.
Risk: forward trench likely to break in 42 seconds if not resupplied.
Recommendation: order elastic defense or feed ammo shelf.
```

## UI And Map Readability

The map should show the network without clutter.

### Permanent UI

Keep permanent UI small:

- selected trench panel
- upgrade icons
- ammo state
- occupied slots
- fallback link
- doctrine

### Transient Feedback

Use short-lived battlefield callouts:

- `Fallback route open`
- `MG bay feeding fire`
- `Olek falling back`
- `Vira covering fallback`
- `Second line occupied`
- `Forward trench lost`
- `Ammo shelf dry`
- `Phone wire cut`
- `Dugout receiving wounded`

### Visual Language

Use simple map lines:

- green line for safe fallback
- yellow line for exposed fallback
- red broken line for blocked fallback
- pulsing icon for MG firing
- small crate icon for ammo-fed trench
- small shelter icon for dugout link

The player should understand the battle at a glance.

## Tuning Values To Start

These are starting points, not final balance.

### Existing Trench Combat

- fire range multiplier: `1.2`
- damage taken multiplier: `0.1`

### Proposed Upgrade Values

- sandbags: additional `0.85` damage multiplier from front only
- firing slits: additional `0.75` damage multiplier from front, but narrower arc
- overhead cover: `0.45` blast damage multiplier
- duckboards: `1.25` movement speed inside network
- communication trench: `0.55` fallback route exposure
- ammo shelf: local stock of `90` to `180` rounds
- tripod rest: `1.08` range and `0.9` spread
- MG bay: `1.35` range, high suppression, high ammo drain
- observation post: fallback decision happens `20%` earlier under threat
- phone wire: group fallback delay reduced by `35%`

These values should be easy to inspect and tune.

## Failure Modes

### Too Abstract

If the player only sees scores and modifiers, the system will feel like a debug panel.

Fix:

Show named soldiers moving, holding, and falling back.

### Too Safe

If upgraded trenches are always correct, the player will spam trench upgrades.

Fix:

Use flanks, ammo drain, grenades, build exposure, and artillery pressure.

### Too Much Micro

If the player must order every soldier step, the game becomes a small RTS.

Fix:

Let the player set doctrine and fallback lines. Soldiers choose execution.

### Too Random

If fallback feels unpredictable, the player will stop trusting the system.

Fix:

Expose readable causes:

- `no fallback slot`
- `ammo dry`
- `route exposed`
- `MG covering`
- `nerve held`

### Too Static

If trenches only create stronger camping, battles will stop moving.

Fix:

Make trenches consume ammo, require repair, become flanked, and sometimes need abandonment.

## Implementation Milestones

### Milestone 1: Network Report

Goal:

Make existing trenches readable as a network.

Work:

- expose trench segments
- expose connected slots
- expose occupants
- expose ammo and dugout links
- add `war-trench-network report`

Acceptance:

CLI can tell which soldier is in which trench, what it connects to, and whether fallback is possible.

### Milestone 2: Fallback Intent

Goal:

Soldiers can choose to leave a bad trench for a better connected trench.

Work:

- add fallback scoring
- add soldier trench intent
- add fallback target selection
- add movement from slot to slot
- add transient map callouts

Acceptance:

A pressured soldier can leave a forward trench and occupy a second trench without becoming a ghost marker or disconnected body.

### Milestone 3: First Upgrade Family

Goal:

Add a small set of upgrades that create different trench roles.

Start with:

- sandbags
- ammo shelf
- MG bay
- duckboards

Acceptance:

Each upgrade changes soldier behavior or battle outcome in a visible way.

### Milestone 4: Doctrine Commands

Goal:

The officer can shape how the network behaves without micromanaging every soldier.

Commands:

- hold
- elastic defense
- fallback line
- MG anchor

Acceptance:

Two identical trench networks behave differently because the officer set different doctrine.

### Milestone 5: UI Pass

Goal:

Make the feature playable without CLI.

Work:

- trench selection panel
- upgrade buttons
- fallback link preview
- doctrine selector
- transient battlefield callouts

Acceptance:

The player can understand and operate the trench network in a live battle at 1920 by 1080 without opening debug tools.

## Design Questions For The Session

Pause here and answer these out loud.

1. Should fallback be mostly automatic, or should the officer explicitly draw fallback lines?

Recommended answer:

Both. Soldiers can fallback automatically, but officer-marked fallback lines make it safer and more predictable.

2. Should MG bays be built directly, or should they upgrade an existing trench slot?

Recommended answer:

Upgrade an existing trench slot. That keeps trenches as the base language and avoids separate building sprawl.

3. Should a soldier abandon an MG bay when wounded?

Recommended answer:

Yes, but later than a normal rifleman. The MG bay is powerful, so leaving it should feel like a major line event.

4. Should second-line trenches be weaker or stronger than forward trenches?

Recommended answer:

They should often be stronger but less aggressive. Forward trenches buy time. Second-line trenches stabilize.

5. Should trenches be capturable?

Recommended answer:

Eventually yes, but not in the first implementation. First prove fallback and loss. Capture comes after.

6. Should upgrades require specific soldier skills?

Recommended answer:

Yes for build speed and quality, not for basic access. A bad builder can still build an MG bay, but it takes longer and may be more fragile.

7. Should ammo be the main limiter?

Recommended answer:

Ammo should be one of the main limiters. The others are exposure, fatigue, morale, and route safety.

## The 10 Star Version

The 10 star version is not just trenches with buffs.

The 10 star version is a battlefield where the player remembers people and places:

- "That forward trench is cursed."
- "The MG bay saved the camp."
- "The second line only held because the ammo shelf was stocked."
- "I ordered hold at all cost and lost two good soldiers."
- "The fallback route worked exactly like I planned."

That is the target.

## Immediate Next Build Recommendation

Build Milestone 1 first.

Do not add five upgrades yet.

First, make the current trench network inspectable and trustworthy:

- segment ids
- slot ids
- occupants
- links
- fallback candidates
- source soldier ids
- current advantages

Once the network can explain itself, fallback and upgrades will be much safer for other agents to implement.
