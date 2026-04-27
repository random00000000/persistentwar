# Downed Soldier Second Chance North Star

Date: 2026-04-26

## Product Promise

When the officer or any soldier goes down, the battle should not pause, bug out, or become a hidden dice roll. It should become a visible Kenshi/RimWorld second-chance scene where control breaks, squad agency takes over, and the player watches simple rules collide under pressure.

The fantasy:

`Someone is down. The whole local fight bends around whether the squad can get him breathing and drag him out.`

## Current Baseline

The game now has downed states, bleedout timers, squad rescue tasks, rescue story beats, casualty extraction holds, and locked player controls while the officer is downed or carried. The next polish target is making this feel less like a debug state and more like one of the game's strongest emergent story machines.

## Design Pillars

1. Loss of control is the point.
   A downed officer cannot steer, aim, shoot, or press extraction. If the squad carries him, the carrier owns movement and extraction interaction.

2. Any downed body is a tactical object.
   A casualty creates local gravity: allies peel, medics reprioritize, suppressors cover, enemies investigate, and the officer must decide whether another life is worth risking.

3. Rescue is not guaranteed.
   Soldiers weigh distance, fire pressure, suppression, medic skill, morale, loyalty, cover, extraction distance, and the value of the current order.

4. Stories must come from truth.
   Dialogue should name who fell, who moved, who carried, who covered, and who failed. No fake flavor if the simulation did not cause it.

## Simple Rule Stack

- Downed bodies bleed out.
- Nearby allies notice casualties.
- Medics prefer stabilization.
- Brave or loyal soldiers accept higher rescue risk.
- Suppressed soldiers hesitate or ask for cover.
- Carrying slows the rescuer and reduces combat output.
- Trenches, dugouts, med posts, camps, and extraction zones change destination value.
- Enemies hear casualty noise and may push the body.
- A squadmate can start extraction for a downed officer.
- Rescue success or failure feeds memory, trust, fear, dialogue, and future priorities.

## Player Experience

When downed, the player becomes a witness and commander with limited desperate intent, not a body pilot. Good temporary commands are `Extract me`, `Save wounded first`, `Cover the carrier`, and `Hold the camp`. These should be requests that influence AI scoring, not direct movement orders.

The UI should be minimal and clear:

- `Downed: squad control`
- `Makar carrying Blue to East Dock Uplink`
- `Yara stabilizing Olek`
- `Extraction pressed by squadmate`
- `Rescue failed: carrier suppressed`

Map feedback should be short-lived: casualty marker, carrier line, extraction pulse, and small dialogue callouts.

## Emergent Examples

- A builder is downed beside an unfinished trench, so construction stalls and a medic risks the open ground.
- The officer goes down after overextending, and a loyal rifleman carries him through a trench while a suppressor pins the lane.
- A medic is lost near extraction, making later rescues slower and scarier.
- A squad abandons a casualty because the camp is collapsing, creating a memory that hurts trust later.

## Near-Term Build Order

1. Rescue HUD and map readability pass.
   Show the downed state, carrier, destination, extraction ownership, and failure reason without opening a large panel. The player should understand who is carrying whom and where they are going in under two seconds.

2. AI rescue scoring pass.
   Make medics, loyal soldiers, brave soldiers, suppressed soldiers, and nearby cover change rescue decisions. The first target is readable variety: one soldier stabilizes, one covers, one refuses because the route is too hot.

3. Verification pass.
   Add dedicated smoke coverage for officer down, squadmate down, ally-started extraction, failed rescue, and cursor-lock while carried. The feature is not hardened until the mouse cannot alter carried movement in an automated test.

## Implementation Handoff

Future work should deepen the existing system rather than replace it:

- add rescue intent buttons that bias AI scoring;
- expose carrier/destination state in the HUD;
- give medics/builders/socially loyal soldiers different rescue weights;
- add persistent rescue memories to soldier trust;
- let trenches, dugouts, med posts, and camps compete as rescue destinations;
- add smoke/suppression as rescue enablers;
- add CLI or smoke coverage for officer down, squadmate down, ally extraction press, and failed rescue.

## Success Criteria

The feature works when the player thinks, `I survived because Makar got to me`, or `I lost Olek because I ordered the trench too exposed.` Downed states should be terrifying, readable, and fair. The mouse must never steer a carried officer, and every rescue should leave a battlefield story that the player can explain afterward.
