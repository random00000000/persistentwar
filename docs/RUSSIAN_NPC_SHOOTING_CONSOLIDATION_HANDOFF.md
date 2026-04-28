# Russian NPC Shooting Consolidation Handoff

## Purpose

This document captures the current NPC shooting problem and the desired consolidation direction for `Frontline Officer`.

The player is currently playing the Russian side. Russian NPCs exist in two different runtime shapes:

- colony-style town-war soldiers with RimWorld-like work priorities, build/rescue/resupply behavior, names, roles, and persistent town-war state;
- inherited raid squadmate or combatant NPCs with deep granular combat commands and proven projectile shooting behavior.

The bug-level symptom is simple:

`The colony-sim Russian NPCs do useful war work, but they do not consistently shoot like the combat NPCs.`

The design goal is not to delete the good command work. The goal is to make the RimWorld-like soldiers become the one real NPC type while inheriting the combat depth from the older commandable NPCs.

## Product Direction

The unified NPC should be:

`A soldier first, with jobs second.`

Every Russian NPC is a soldier. A medic, builder, cook, hauler, or quartermaster can still shoot if threatened. Their current work should influence when they shoot, how well they shoot, how fast they resume work, and how much danger they tolerate, but their job must not make them helpless.

This is especially important for the officer-war fantasy:

- a medic should treat wounded, but shoot if enemies close in;
- a builder should keep digging when protected, but defend themselves if attacked;
- a cook should usually stay behind the line, but still carry a weapon;
- a hauler should resupply the line, but not ignore enemies inside lethal range;
- a rifleman or suppressor should be better at combat, but not be the only class allowed to fire.

Future bunkers, blindages, trenches, kitchens, and med posts should reduce work interruption by giving soldiers safer places to do noncombat jobs near the battlefield. Work can slow under fire, but nearby enemies should always be treated as a combat emergency.

## Current Runtime Split

### Town-War Soldiers

Town-war soldiers are the colony/RimWorld-like side of the system.

They carry the persistent war identity:

- `town-war-soldier-*` IDs;
- names and archetypes;
- camp ownership such as `camp-a` for the Russian/player side;
- work priorities;
- tasks such as build, resupply, suppress, defend, rescue, medic work, rest, and movement;
- skills and role direction;
- ammo state and morale/fatigue-style war state.

This is the correct long-term owner for Russian NPC identity.

### Squadmate Combatants

Squadmates are the inherited granular combat-command side of the system.

They own the stronger live combat command language:

- selected-soldier commands;
- direct movement or defense orders;
- attack posture;
- grenades;
- suppression;
- sector watch;
- covering movement;
- real projectile fire through the inherited weapon runtime.

This is the correct source of combat behavior to preserve.

### Temporary Projection Bridge

The current bridge projects live Russian town-war soldiers into raid friendly combat bodies so selected colony soldiers can use the inherited projectile path.

The important idea is good:

`The real Russian soldier identity should own the combat body instead of spawning anonymous helper garrison NPCs.`

The bridge should be treated as a migration seam, not as the final architecture. The final architecture should make a `TownWarSoldierState` capable of owning work state and combat command state directly.

## Current Command Surface To Preserve

These controls are already valuable and should be carried into the unified soldier model.

### Selection

- `8`, `9`, `0`: select one current commandable squadmate slot.

Future direction:

- selection should target real soldier IDs;
- the first version can keep a small assigned combat squad or escort if that is simpler;
- the final version should allow the player to command important selected soldiers without creating a second NPC type.

### Base Orders

- `C`: follow the player/officer.
- `X`: defend at cursor.
- `V`: attack aggressively.
- `Alt + RMB`: brace and watch a sector from the current position.
- `Ctrl + RMB`: covering move / move-watch toward the selected lane.

These are persistent combat orders. They change what the soldier is trying to do after the immediate tactical action ends.

### Tactical Actions

- `Alt + G`: throw grenade at cursor.
- `Alt + LMB`: quick suppress.
- `Alt + V`: quick suppress.
- `Ctrl + LMB`: committed suppress.

These are temporary overlays. They should interrupt or layer over the soldier's current job, then return to the prior work or combat order if still valid.

### Support Orders

- `Z`: shift fire.
- `B`: hold position.
- `N`: drop ammo crate.

These are broader battlefield support controls and should remain compatible with the unified soldier model.

## Shooting Behavior Requirement

The consolidated Russian NPC should use one shooting model:

1. Every soldier has a weapon and ammo state.
2. Every soldier can acquire nearby enemies.
3. Every soldier can fire projectiles using the same player/squadmate projectile runtime.
4. Shooting quality is modified by soldier skill, weapon, suppression, cover, fatigue, morale, wounds, and current order.
5. Noncombat jobs can reduce readiness, reaction speed, or willingness to chase, but cannot disable self-defense.
6. Soldiers should return to their prior job when the immediate threat is handled, if the job still matters.

The minimum acceptable version is:

- colony workers shoot enemies that enter close threat range;
- medics/builders/cooks/haulers do not become passive targets;
- high Shooting soldiers acquire and hit better than low Shooting soldiers;
- suppressors generate better lane pressure than ordinary workers;
- work under fire slows or stalls based on Nerve, cover, and suppression protection.

## RimWorld-Like Skills

The desired skill model should use numeric skills like RimWorld.

Current player direction:

- use numbers;
- use a RimWorld-like scale;
- skills can evolve later through use;
- soldiers should be analogs to RimWorld pawns, adapted to a Foxhole-like modern war.

Recommended consolidated skill set:

- `Medical`
- `Construction`
- `Cooking`
- `Hauling`
- `Shooting`
- `Endurance`
- `Nerve`

Existing docs also mention broader possible stats such as Suppression, Logistics, Social, Perception, and Engineering. Those can still exist later, but the immediate consolidation should focus on the player-requested core skills above.

Recommended scale:

- `0-20`, RimWorld-like.

First-pass meanings:

- `0-3`: poor, unreliable, slow, or panicky.
- `4-7`: basic militia competence.
- `8-11`: normal trained soldier.
- `12-15`: strong specialist.
- `16-20`: elite or veteran.

Skills should eventually improve through use:

- shooting improves from firing and surviving combat;
- medical improves from treating wounded;
- construction improves from building and repairing;
- cooking improves from camp food work;
- hauling improves from logistics runs;
- endurance improves from repeated movement/carry work;
- nerve improves from surviving pressure, but can also be harmed by trauma.

## Work Priorities

The priority model should remain RimWorld-like:

- every soldier has priorities;
- jobs are not hard classes;
- a medic can shoot;
- a cook can haul;
- a builder can defend;
- specialists are better at their work but not the only ones allowed to do it.

Important priority rule:

`Emergency combat beats normal work.`

Suggested resolution order:

1. survival and immediate self-defense;
2. direct officer combat command;
3. emergency rescue or medical danger;
4. active build/order obligation;
5. work priorities;
6. skill fit;
7. distance, path safety, cover, fatigue, morale, and supply.

This keeps the priority system from making soldiers act foolishly when enemies are close.

## Consolidation Target

The target architecture should have one Russian NPC state owner:

`TownWarSoldierState`

That soldier should own or reference:

- persistent identity;
- skills;
- work priorities;
- role/archetype label;
- current work task;
- current combat order;
- temporary tactical action;
- weapon and ammo state;
- cover/trench/bunker occupancy;
- morale, fatigue, wounds, and suppression state;
- runtime combat body or render body.

The old split should collapse like this:

| Current concept | Keep? | Final owner |
| --- | --- | --- |
| Town-war soldier identity | Yes | `TownWarSoldierState` |
| Town-war priorities | Yes | `TownWarSoldierState` |
| Town-war build/rescue/resupply work | Yes | `TownWarSoldierState` task system |
| Squadmate command ids | Yes | Soldier combat order state |
| Squadmate tactical actions | Yes | Soldier tactical action overlay |
| Squadmate projectile runtime | Yes | Shared weapon/projectile service used by soldiers |
| Anonymous camp-garrison bodies | No | Replace with real soldier projections or direct soldier bodies |

## Root Cause Hypothesis

The practical root cause of the shooting failure is not that colony soldiers are bad soldiers.

It is architectural:

`Russian NPCs are represented by two different systems, and only the inherited squadmate/combatant system fully owns the command and projectile shooting runtime.`

When the game displays or simulates a colony worker without connecting that worker to the combatant shooting path, the worker can build, haul, rescue, or follow town-war tasks but cannot behave like the projectile-firing NPCs.

The successful bridge is to project live `camp-a` town-war soldiers into friendly combatants with `ownerKind: "town-war-soldier"` so they use the inherited projectile path while keeping their real soldier ID and name.

The final fix is to remove the need for two Russian NPC categories at all.

## Implementation Direction

### Phase 1: Stabilize The Bridge

Make sure every Russian soldier that should be visible in active combat has exactly one live combat body.

Requirements:

- no duplicate visuals for the same soldier;
- no anonymous Russian garrison standing in for real soldiers;
- projected combatants preserve the town-war soldier ID, name, weapon, role, ammo, and task;
- regression checks prove projected soldiers fire real projectiles.

### Phase 2: Move Command Ownership To Soldiers

Change command APIs so they target soldier IDs instead of only `squadmate` owner kinds.

Requirements:

- `follow`, `defend`, `attack`, `brace-watch`, and `move-watch` can be stored on the selected soldier;
- `grenade` and `suppress` can be stored as temporary tactical actions on the selected soldier;
- the selected soldier may be a town-war soldier;
- the existing controls can remain the same while the target identity changes.

### Phase 3: Merge Work And Combat Arbitration

Add an explicit decision layer that chooses between work and combat moment by moment.

Rules:

- nearby enemy threat triggers self-defense;
- direct attack/suppress/watch commands override ordinary work;
- building/medical/cooking/hauling can continue under lower pressure;
- Nerve, cover, and suppression support decide whether work slows, stalls, or cancels;
- after the threat passes, the soldier returns to useful work.

### Phase 4: Retire The Old Russian NPC Type

Once town-war soldiers own work and combat, remove or narrow the old `squadmate`-only assumption for Russian-side NPCs.

The older squadmate code can remain as a compatibility path until every required command has moved over, but the product truth should be:

`Russian NPCs are town-war soldiers. Some are currently selected for direct combat command.`

## Verification Needed

A useful regression suite should prove:

- a builder shoots when an enemy enters close range;
- a medic shoots when attacked, then resumes medical work if safe;
- a cook or hauler can defend themselves but performs worse than a rifleman;
- a high Shooting soldier outperforms a low Shooting soldier in the same lane;
- `Alt + G` grenade works on a selected real soldier;
- `Alt + LMB` or `Alt + V` suppress works on a selected real soldier;
- `Alt + RMB` sector watch works on a selected real soldier;
- `Ctrl + RMB` covering move works on a selected real soldier;
- no separate anonymous Russian combat NPC is required for those behaviors.

## Player-Facing Design Rule

The player should not have to know which internal NPC system a Russian soldier belongs to.

If a Russian soldier has a name, a job, and a gun, the player expectation is:

`I can rely on him as a soldier, assign him work like a RimWorld pawn, and command him in combat when I need precision.`

That is the consolidation target.
