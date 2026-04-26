# Fireteam Building Doctrine Amendment

## Purpose

Lock the next concrete evolution of enemy AI inside the AI pressure package:

- enemies should increasingly read as small frightened fireteams instead of independent rush bots
- buildings should become the main defensive language for town fights
- room clearing should become a first-class mastery verb the player can repeatedly practice in raids

This amendment is not a replacement for the existing AI pressure package.

It is a more explicit direction for how that package should evolve.

## Status

This amendment should be treated as active product direction.

Future agents should assume that enemy AI is intentionally moving toward:

- 4-man fireteam logic
- building-first defensive posture
- ranged suppression before commit
- room-clearing mastery as a repeatable raid skill ladder

## Product Intent

The north star is not:

- enemies that instantly rush because they detected the player
- enemies that only become harder by collapsing distance faster
- building interiors that are cosmetic cover shells

The north star is:

- a readable 4-man hostile element
- one support gunner and three rifles as the baseline composition
- buildings, room chains, trench mouths, and yard-to-door transitions as the decisive tactical spaces
- a player who learns how to isolate, pin, breach, clear, and hold

The intended player sentence is:

`The support gun fixed the lane, one rifleman held the window, one started to slide outside, and the back room stayed dangerous until we cleared it properly.`

## Baseline Enemy Squad Shape

The default hostile squad should increasingly read as:

- `1 support gunner`
- `3 riflemen`

The exact weapon list can vary, but the battlefield read should stay stable.

The player should be able to identify:

- the gunner who owns the outside lane
- the near rifle who stops a free first entry
- the side rifle who threatens a shift or outside angle
- the deeper rifle who makes room two and room three dangerous

## Core Enemy Verbs

Enemy squads should primarily solve fights through these verbs:

- `hold`
- `fix`
- `shift`
- `stack`
- `recover`
- `break`

### Hold

Occupy a building, room chain, trench segment, bunker mouth, or yard-to-door transition.

### Fix

Use the support gunner or anchored rifles to suppress the player from outside the structure so the player cannot cross or flood freely.

### Shift

Slide one rifleman to a side angle, secondary door, alley, or yard lip while the rest of the squad preserves the hold.

### Stack

When the breach becomes real, compress inward and turn the structure into a multi-room clear instead of an open-yard chase.

### Recover

React to casualties by covering, dragging, or compressing the hold rather than immediately suiciding forward.

### Break

If isolated and dominated, lose cohesion, collapse deeper, surrender, or abandon the structure.

## Behavioral Rules

### 1. Building-First Rule

If a fireteam can solve the fight from a building, bunker, trench mouth, or similar hard point, it should prefer that over immediate pursuit.

### 2. Support-First Pressure Rule

The support gunner should usually create the first dangerous problem:

- pin crossings
- punish open approaches
- force the player to respect windows, doorways, and yard lips

The support gunner should rarely be the first enemy to rush.

### 3. Room-Clear Rule

The player should not win most building fights by shooting one man outside and then inheriting a free empty interior.

A defended building should often require:

- outside suppression
- threshold discipline
- first-room entry
- second-room follow-through
- hold conversion after the clear

### 4. Compression Rule

Once the player breaks the first threshold, defenders should often compress deeper into the structure instead of running into the yard.

This is what turns buildings into practiceable room-clear spaces instead of short cover interactions.

### 5. Rush Exception Rule

Immediate rushes should still exist, but as exceptions:

- sweepers
- panic commits
- a broken flank trying to recover the hold
- a very short-range punish after the player misplays a threshold

Rush should be a tactical punctuation mark, not the default opening behavior.

### 6. Squad Degradation Rule

Enemy squads should become easier to solve when composition breaks:

- kill the support gunner and the crossing gets easier
- kill the anchor rifle and the first entry gets cleaner
- kill the deep rifle and room two becomes less scary

The player should feel that role-killing matters.

## Readability Rules

The player must be able to learn this AI like a stealth-action mastery game, not endure it like random pressure.

This means:

- one stable baseline squad shape
- stable role signals
- stable building-defense behaviors
- punishable and learnable reactions

The player should be able to say:

- `that window is the support gun`
- `that yard man is the outside lid`
- `there is still a deep-room defender alive`
- `they compressed inside because we woke the building too early`

## Relationship To Existing AI Package

This amendment does not replace:

- pressure posture
- surrender and collapse logic
- casualty response
- settlement replayability

It redirects how those systems should manifest in town and building fights.

The preferred order of expression is now:

1. building hold
2. support-fire fix
3. side-angle shift
4. room-clear compression
5. collapse / surrender / recovery outcome

## What Future Agents Should Prefer

When choosing between two AI implementations, prefer the one that:

- keeps enemies in buildings longer
- makes room clearing more necessary
- creates more outside suppression before inside collapse
- preserves squad composition readability
- rewards patient setup and entry discipline

Avoid changes that:

- make every contact turn into an open chase
- flatten all enemies into generic roamers
- make buildings tactically optional
- make rooms easier by moving defenders outside too early
- increase difficulty by only increasing rush speed or instant certainty

## Desired Proof Slices

This direction is only real if it is provable in authored and runtime slices.

Required proof families:

- `support gun owns the crossing`
- `first room is cracked but room two is still dangerous`
- `building compresses after loud contact`
- `support gun kill materially changes the push`
- `player clears the same room chain better on repeated attempts`

## Success Criteria

This amendment is working when players naturally say things like:

- `They stayed inside and made me clear them properly.`
- `The support gun had the whole street until I solved it.`
- `I got the first room, but the second room still punished me.`
- `Killing the gunner changed the whole building.`
- `That was a real room clear, not just a doorway shootout.`

## Durable Rule

Future AI work in this project should assume:

`Town fights are increasingly about breaking small defensive fireteams out of buildings and mastering the room-clear process they force on the player.`
