# Persistent Multiplayer War Product Pivot

This doc captures the product direction shift.

The most exciting version is not only a single-player officer sim.

The most exciting version is a persistent war where real players join both sides, grow their own squads, build personal camps, run operations, and push the shared war toward victory.

## Core Product Feeling

The player should feel:

"My camp matters to the faction war."

"My squad has a name and a reputation."

"Other players are fighting the same war while I am offline."

"When I run an operation, I am not just clearing a level. I am helping my side take ground."

"The world has social stories I did not script."

That is the thing to protect.

## The Big Verb

Contribute to the war.

The player does not need to personally control the whole front.

They need to feel that their actions change the front for their side.

## The Player Identity

Each player is an officer with a personal camp and squad.

The personal camp is their home base.

The squad is their named group of soldiers.

The faction war is the shared context.

This creates three layers:

- personal survival and progression
- squad and camp growth
- faction-level war contribution

## What Players Do

Players can:

- run solo or squad operations
- loot contested supplies
- haul supplies back to their personal camp
- donate supplies to faction goals
- recruit and train soldiers
- build and upgrade their camp
- build forward camps or trench lines
- defend faction positions
- attack enemy positions
- rescue wounded soldiers
- contribute to final assaults

The important part is that every action should answer:

"How did this help my squad, my camp, or my side?"

## Personal Camps

Personal camps are player-owned bases inside the faction war.

They should not replace the faction front.

They should give each player a reason to return.

A personal camp stores:

- squad soldiers
- weapons
- ammo
- food
- medical stock
- build materials
- trophies and history
- current operation plans

A personal camp upgrades:

- soldier capacity
- recovery speed
- supply storage
- recruit quality
- operation staging
- defensive readiness

## Faction War

The faction war is the shared persistent layer.

It has:

- two sides
- contested regions
- faction camps
- supply objectives
- trench networks
- front pressure
- war goals
- final enemy camp or headquarters

Players should be able to join either side.

The war should progress even if one player is not online, but personal camps should not be erased casually while offline.

## Operations

Operations are the bridge between personal play and the persistent war.

An operation is a contained mission that affects the shared war.

Examples:

- supply raid
- wounded rescue
- trench build operation
- forward camp setup
- enemy camp harassment
- defensive hold
- final assault contribution

An operation should have:

- objective
- risk
- expected reward
- faction impact
- personal camp impact
- clear end

## Social Emergence

The game should create stories between players.

Examples:

- one player becomes known for supplying the front
- one player builds a trench network everyone uses
- one player rescues another player's wounded squad
- two players on opposite sides keep clashing over the same road
- a faction remembers who opened the final assault
- players coordinate to keep a forward camp alive

This is the heart of the multiplayer dream.

## Retention Problem

The big risk is holding users.

Persistent war games need reasons to return that do not feel like chores.

The return reasons should be:

- my camp recovered while I was away
- my soldiers are ready again
- my faction needs help at a named place
- a new operation is available
- another player affected the front
- my camp can now recruit or upgrade
- the enemy is close to breaking through
- a final assault window opened

Avoid:

- daily chores
- punishment for not logging in
- endless grind with no war movement
- requiring large groups before the game is fun
- offline loss that feels unfair

## First Multiplayer Shape

Do not start with the full MMO dream.

Start with asynchronous faction contribution.

The first multiplayer-feeling version could be:

- players choose a side
- each player has a personal camp
- operations submit results to a shared faction war
- faction progress moves over time
- players can see other player contributions
- camps and squads persist
- direct real-time co-op comes later

This gets the social war feeling without needing perfect real-time multiplayer first.

## Three Product Options

## Option A: Single-Player First, Multiplayer Later

Build the full single-player officer war, then add multiplayer contribution later.

Good:

- safest engineering path
- strongest solo game
- easier to balance

Bad:

- delays the thing you are most passionate about
- may build systems that do not fit multiplayer later

## Option B: Async Persistent War First

Build personal camps and faction contribution early, but operations can still be solo instances.

Good:

- gets social emergence sooner
- easier than real-time multiplayer
- personal camps and side choice become core from the start
- good for retention experiments

Bad:

- needs backend persistence
- needs anti-cheat and trust decisions eventually
- social magic may be limited at first

## Option C: Real-Time Multiplayer War First

Build shared live multiplayer with both sides, shared fronts, and players operating in the same battlefield.

Good:

- closest to the dream
- strongest social emergence
- most exciting if it works

Bad:

- highest engineering risk
- hardest retention problem
- hardest balancing problem
- could delay all playable progress

## Recommendation

Choose Option B.

Make the game multiplayer in its product identity early, but not in the hardest real-time technical form first.

The first version should be:

- persistent side choice
- personal camp
- personal squad
- solo operations
- shared faction war progress
- visible player contributions
- later co-op and direct PvP

This lets the product aim at social emergence while still shipping playable loops.

## The New Campaign Spine

1. Player chooses a side.
2. Player starts alone.
3. Player runs top-down operations for supplies and rank.
4. Player unlocks a personal camp.
5. Player receives first assigned soldier.
6. Player grows squad and camp.
7. Player runs operations that help personal camp and faction war.
8. Player contributes supplies, trenches, forward camps, rescues, and assaults.
9. Faction war state changes based on player contributions.
10. Side wins when the enemy war machine collapses.

## Key Design Rule

Every system should serve at least one of these:

- personal camp attachment
- squad attachment
- faction contribution
- social story
- war progress

If a system does not serve one of those, it is probably not core.

## First Retention Loop

The first retention loop should be simple:

1. Run an operation.
2. Bring supplies home.
3. Upgrade camp or recruit.
4. Contribute something to the faction.
5. See the faction front move or react.
6. Return because the next operation matters.

## The Main Open Question

Should the first multiplayer proof be:

### A: Shared War Board

Players contribute operation results to a shared war board, but never meet in real time.

### B: Ghost Contributions

Players see other players' camps, trenches, supply drops, and fallen squads as world artifacts.

### C: Small Co-Op Operations

Two to four players can run the same operation together for one side.

Recommendation:

Start with A plus B.

The shared war board gives persistence. Ghost contributions create social presence. Co-op can come after the operation loop is stable.

