# Colony War Loop Decision Picker

This doc is about the missing RimWorld-like layer.

The question is not "how many trench upgrades do we have?"

The question is:

What does the colony sim do every day that helps the player win the war?

## Product Thesis

The colony layer should be about growing, protecting, and spending a human war machine.

The main economy is not iron, copper, belts, and factories.

The main economy is soldiers.

Soldiers are recruited, fed, trained, armed, wounded, traumatized, promoted, rescued, rested, and sometimes lost.

The player wins the war by turning a fragile camp into a force that can keep building camps, holding trench lines, and eventually breaking the enemy front.

## The Big Verb

The big verb is:

Raise the army.

Not just "build a base."

Not just "place trenches."

Raise the army means:

- get more soldiers
- keep them alive
- give them weapons
- assign them work
- build camps for them
- feed and rest them
- recover the wounded
- decide who risks the front
- push the war forward

## Three Product Options

## Option A: Soldier Roster Economy

This is the simplest version.

The colony loop is about managing a roster of named soldiers. More soldiers come from events, rescues, recruitment, and surviving operations.

The player does:

- recruit new soldiers when the camp has capacity
- rescue wounded or stranded soldiers
- rotate tired soldiers to rest
- assign builders, medics, riflemen, suppressors, and defenders
- equip better weapons from stash
- accept that dead soldiers are gone

Why this is good:

- fastest to ship
- emotionally strong
- avoids Factorio-style logistics
- works with the current named soldier direction

Risk:

- may feel too thin if recruitment is just a button

Best first version:

Yes.

## Option B: Camp Capacity Economy

This version makes camps matter more.

Soldiers are still the main economy, but camps determine how many soldiers you can support. A better camp can hold more soldiers, rest them faster, treat wounds, store ammo, and launch bigger pushes.

The player does:

- build bunks to increase soldier capacity
- build med tents to recover wounded soldiers
- build mess tents to reduce fatigue
- build ammo storage to support more defenders
- build training space to improve rookies
- build radio or command posts to coordinate farther fronts

Why this is good:

- gives the colony layer a real base-building loop
- makes forward camps meaningful
- creates natural progression
- still avoids detailed production chains

Risk:

- if every building is just a stat box, it becomes dull

Best first version:

Good target after roster economy works.

## Option C: Living Front Army Economy

This is the full Foxhole-like dream.

The world has multiple camps and fronts. Soldiers live in camps, move between fronts, recover, build, fight, and get replaced over time. The player is managing a living war effort.

The player does:

- build new camps along the front
- assign companies to sectors
- move veterans to critical fronts
- train rookies in rear camps
- send builders and medics where they are needed
- choose when to abandon a camp
- decide which front deserves scarce good soldiers

Why this is good:

- closest to the living war fantasy
- gives the RimWorld layer purpose
- makes the war feel bigger than one battle
- creates stories over many operations

Risk:

- too much if the game does not automate well
- can become map management instead of officer drama

Best first version:

No. This is the destination.

## Recommendation

Target Option C, but build it through Option A and Option B.

The first shippable colony loop should be:

1. Soldiers are the main economy.
2. Camps create soldier capacity.
3. Wounded soldiers reduce your usable force.
4. Better camps recover and support more soldiers.
5. More soldiers let you hold more trenches and build forward camps.
6. Forward camps let you push the war closer to the enemy.
7. The war ends when one side can no longer sustain camps and soldiers.

## How To Get More Soldiers

Avoid a generic "buy unit" button if possible.

Use war-flavored sources:

### 1. Local Recruits

The camp can recruit locals when morale, food, and safety are high enough.

Player read:

"The camp feels survivable. Two locals volunteered."

### 2. Rescued Stragglers

Some operations reveal wounded or cut-off soldiers. If rescued, they join or return later.

Player read:

"You pulled Makar out of the ditch. He will fight again after treatment."

### 3. Reinforcement Convoys

The rear sends soldiers if the route is open and the camp has capacity.

Player read:

"A reinforcement truck reached the rear camp with three rookies."

### 4. Survivors From Lost Camps

If a forward camp falls, some soldiers may escape and return traumatized.

Player read:

"The forward camp is gone. Four survivors made it back. Two are wounded."

### 5. Veteran Promotions

A soldier who survives enough operations becomes more valuable than a new recruit.

Player read:

"Vira is no longer just a rifleman. He is an anchor for the second line."

## What Soldiers Need

Keep the needs simple and war-relevant.

### Core Needs

- food
- rest
- medical care
- ammo
- morale
- shelter

These should affect what soldiers can do:

- hungry soldiers build slower
- tired soldiers fallback earlier
- wounded soldiers cannot hold front slots well
- low morale soldiers panic sooner
- ammo-starved soldiers cannot cover fallback
- unsheltered soldiers recover slowly

## The Colony Buildings That Matter

Do not start with a big build catalog.

Start with buildings that directly support the soldier economy.

## First Camp Buildings

### Bunks

Increase soldier capacity and rest speed.

### Mess

Reduces hunger and improves morale.

### Med Tent

Turns wounded soldiers back into usable soldiers.

### Ammo Store

Lets more soldiers defend and resupply trenches.

### Training Yard

Improves rookies slowly.

### Radio Post

Lets the camp coordinate farther trench lines and forward camps.

## The First Real Colony Loop

The first version should feel like this:

1. You start with a small camp and a few soldiers.
2. You build basic survival structures.
3. You recruit or rescue a few more soldiers.
4. You assign some to build, some to defend, some to rest.
5. You build a forward trench and later a forward camp.
6. Enemy pressure wounds or kills people.
7. Your med tent and bunks decide how fast the army recovers.
8. If you recover, you push again.
9. If you fail, your army shrinks and the front collapses.

That is a RimWorld-like loop with a war ending.

## How The War Ends From The Colony Side

The war should not end only because a health bar hit zero.

It should end because one side cannot sustain the army anymore.

Victory:

- enemy main camp destroyed
- enemy forward camps abandoned
- enemy soldier pool collapses

Defeat:

- your main camp destroyed
- not enough soldiers left to hold
- no supplies and no recovery path

Withdrawal:

- player abandons the town to save soldiers and stash

Stalemate:

- both sides are too exhausted to push
- player can rebuild or end the operation

## The Anti-Factorio Rule

Do not make the player run a factory.

Use chunky, understandable resources:

- soldiers
- ammo
- food
- medical stock
- build material
- weapons

Avoid:

- conveyor chains
- multi-step recipes
- tiny production ratios
- constant hauling micro
- optimizing throughput for its own sake

The player should care that ammo is low because Olek cannot cover Vira's fallback.

The player should not care that a sawmill is producing 0.7 planks per second.

## The Best First Slice

Build this first:

### Soldier Economy Slice

- Start with 4 to 6 named soldiers.
- Camp has a capacity of 6.
- Build bunks to raise capacity to 8.
- Build med tent to recover wounded soldiers.
- Add one recruitment event.
- Add one rescue event.
- Wounded soldiers leave the active pool until treated.
- Dead soldiers permanently reduce the pool.
- Forward camp requires minimum soldiers and build material.
- Final assault requires enough active soldiers or it is too risky.

This gives the colony layer a reason to exist.

## The Main Design Choice

Pick one:

### A: Roster First

We build soldier recruitment, wounds, recovery, death, and capacity first.

Best if:

We want emotional stakes quickly.

### B: Camp First

We build camp structures, capacity, and recovery buildings first.

Best if:

We want the base-building loop to feel real quickly.

### C: Front First

We build multiple camps and fronts first, with simple soldier pools.

Best if:

We want the Foxhole-like map fantasy immediately.

Recommendation:

Choose A, then B, then C.

Roster first gives the colony layer a soul. Camp buildings then give that soul a home. The living front comes after the player cares about the people moving through it.

