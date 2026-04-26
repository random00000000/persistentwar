# Tactical Occupied Buildings Implementation Plan

## Purpose

Turn the next practical enemy-AI complaint set into a durable milestone plan:

- obvious building occupation
- scary PKM lanes
- repeated room-clear problems
- fewer empty or weak structures
- clearer `this squad owns this house` reads

This document is intentionally more blunt than the earlier fireteam-building plan.

It exists because the prior doctrine pass improved structure more than it improved the felt raid.

The next work must produce stronger player-perceived combat, not just cleaner simulation semantics.

## Status

Treat this as active follow-up direction inside the AI pressure package.

Future agents should assume the product bar is no longer:

- `some buildings happen to contain stronger squads`

The new bar is:

- `the map should visibly contain defended buildings that create repeated room-clear problems`

## Problem Statement

The fireteam-building amendment improved doctrine, squad roles, and building preference.

But the felt gameplay gap is still clear:

- too many buildings still read as optional scenery or weak contact pockets
- PKM ownership is present, but not yet dominant enough in the spaces that should scare the player
- free play still does not force enough repeat room clears
- route pressure still spreads too much strength into loose outdoor clutter
- squad ownership of a structure is not always obvious enough at first glance

The next pass should feel less like an AI paper improvement and more like:

`that house is occupied, that PKM owns the lane, and I need to clear that structure to open the route`

## Product Promise

When this plan is working, the player should naturally say:

- `Every serious route had buildings that were obviously occupied.`
- `The machine gun made the street deadly until I solved the house.`
- `I had to clear multiple interiors, not just win one doorway.`
- `The map felt like a set of defended structures instead of scattered contacts.`
- `I could immediately tell which squad owned which building.`

## Design Rules

### 1. Building Ownership Before Open-Lane Filler

If spawn budget is limited, meaningful buildings should be occupied first.

Loose outdoor filler should be the leftover budget, not the main event.

### 2. PKM Creates The First Real Problem

The PKM should be the main outside danger attached to a held structure:

- crossing denial
- window denial
- yard denial
- peel denial

The player should feel the belt before the room clear.

### 3. Buildings Must Create Process

A building should rarely be solved by:

- killing one outside body
- peeking one window
- inheriting an empty interior

The intended building process is:

1. identify the held structure
2. solve or avoid the PKM lane
3. gain the threshold
4. clear room one
5. survive room two or back-room follow-through
6. convert the building into a temporary foothold

### 4. Important Structures Should Not Read Empty

The route should visibly contain:

- must-clear houses
- bunker mouths
- relay offices
- cellars
- gate buildings
- trench-entry structures

If a building is tactically important, it should usually feel occupied.

### 5. Ownership Must Be Readable Without Debugging

The player should be able to infer:

- which building is squad-owned
- which lane the support gun is controlling
- whether the interior is still live
- whether the structure is only cracked or actually cleared

## Milestone Order

## Milestone 1. Route Building Census

### Goal

Make the route know which structures are defendable and which ones matter.

### Work

- identify all defendable building obstacles per route
- distinguish:
  - `must-own`
  - `guarded`
  - `optional`
- prefer houses, offices, bunkers, cellars, relay rooms, gate structures, and trench-entry buildings
- expose this structure tagging in snapshot or CLI-readable route data where useful

### Acceptance

- every route has a durable set of defendable buildings
- future passes no longer have to guess which structures matter
- the route can reserve enemy budget for buildings intentionally instead of by loose proximity only

## Milestone 2. Must-Own Building Occupation

### Goal

Guarantee that the most important route structures are occupied first.

### Work

- reserve one full 4-man hostile squad for each `must-own` building until budget runs out
- only after that, reserve squads for remaining `guarded` buildings
- only after building reservation, spend leftovers on:
  - lanes
  - patrols
  - reserve clusters
- reduce generic outdoor filler if it competes with building occupation

### Acceptance

- each route visibly contains multiple occupied structures
- major buildings stop feeling empty or under-defended
- free play more consistently opens with real structure-clearing problems

## Milestone 3. PKM Strongpoint Ownership

### Goal

Make occupied buildings scary from outside.

### Work

- ensure each full squad has a real `support-gunner` with `pkm`
- bias support gunners toward windows, yard lips, gate mouths, trench overlooks, and upper rooms
- make PKM squads prioritize lane suppression over wandering pursuit
- increase the likelihood that the first serious route problem is a belt-fed lane tied to a structure
- reduce cases where support gunners are technically present but tactically invisible

### Acceptance

- players more often get pinned by a building-owned PKM lane
- crossing a street or yard without solving the PKM feels wrong
- `Pressure Posture` and moment-to-moment play agree on where the machine gun danger lives

## Milestone 4. Repeated Room-Clear Chains

### Goal

Turn raids into multiple room-clear problems, not one isolated breach showcase.

### Work

- increase the number of occupied structures per route
- vary structure depth so some fights are:
  - one-room holds
  - first-room plus back-room holds
  - cellar plus upper-room chains
  - bunker-mouth plus rear pocket chains
- reduce the chance that taking one structure collapses the entire route's interior resistance
- preserve enough spread that different buildings remain distinct problems

### Acceptance

- one raid can contain several real room-clear moments
- multiple structures on a route require separate tactical solves
- room clearing starts to feel like a repeatable mastery ladder instead of a one-off authored beat

## Milestone 5. Weak Structure Elimination

### Goal

Reduce empty, trivial, or fake-defended structures.

### Work

- audit buildings that are tactically important but usually empty
- audit buildings that get only one weak defender when they should hold a squad
- move enemy budget away from low-value outdoor scatter into those weak structures
- make sure the route's strongest buildings are not undercut by disposable nearby filler fights

### Acceptance

- fewer buildings feel like decorative cover shells
- fewer contacts feel like random one-man interruptions beside the real fight
- the route becomes denser with meaningful structural problems

## Milestone 6. Squad Ownership Readability

### Goal

Make `this squad owns this house` obvious in live play.

### Work

- surface stronger player-facing ownership reads in:
  - `Pressure Posture`
  - `Operation Flow`
  - hostile chatter
  - transient map language
- use language like:
  - `PKM owns the east house`
  - `Gate office still live`
  - `Cellar squad compressed deeper`
  - `North house cracked, back room still active`
- strengthen snapshot and CLI evidence so ownership is provable and not just anecdotal

### Acceptance

- players can immediately identify which structure is the current tactical problem
- occupied buildings are legible before the player fully commits
- squad ownership is readable without opening deep debug views

## Milestone 7. Route-Authored Must-Clear Proofs

### Goal

Push the strongest buildings from generic occupation into authored tactical identity.

### Work

- hand-tag 2-3 must-clear buildings per route
- give them stable tactical identity:
  - relay house
  - bunker mouth
  - freight office
  - gate control room
  - cellar hold
- add verifier coverage that these buildings are occupied and readable in their route slices

### Acceptance

- every route has a small set of memorable must-clear structures
- the route identity is partly defined by which buildings it asks the player to solve
- building occupation stops feeling purely procedural

## Recommended Verification

The next verification bar should include both generic and route-authored proof.

### Generic runtime proof

- `fireteam-audit`
- a new occupied-building audit:
  - verify multiple full squads are attached to route buildings
  - verify PKM squads own real lanes from those structures

### Authored route proof

- `dish-house-breach`
- `room-clear-drill`
- one route-specific must-own building proof per route

### Human review expectation

A reviewer should be able to boot a raid and quickly say:

- `that house is occupied`
- `that PKM is the lane problem`
- `that building still has a back room`

If that is not obvious, the milestone is not done.

## Risks

### 1. Density Without Clarity

If every building has enemies but the route becomes unreadable noise, the feature fails.

Mitigation:

- prefer a few strong occupied buildings over many weak contacts

### 2. PKM Frustration Without Counterplay

If PKM lanes are oppressive but not solvable, the game becomes miserable.

Mitigation:

- tie strong PKM lanes to readable structures, windows, and crossing problems the player can learn

### 3. Room-Clear Repetition

If every building feels identical, the map becomes homework.

Mitigation:

- vary depth, orientation, side shifts, and threshold layouts

### 4. Outdoor Spaces Becoming Pointless

If all pressure moves indoors, the route loses trench, crossing, and yard language.

Mitigation:

- keep outdoor spaces meaningful as the approach and suppression problem around the building

## First Build Recommendation

If work starts immediately, the next best implementation order is:

1. tag defendable buildings per route as `must-own`, `guarded`, or `optional`
2. guarantee full squad reservation for `must-own` structures
3. harden PKM lane placement on those same structures
4. add one generic verifier proving full-squad building ownership
5. author one must-clear structure per route so the gain is felt in play, not only in audit output

## Durable Rule

Future enemy-AI work should assume:

`A strong raid is increasingly a map of occupied structures, PKM-owned lanes, and repeat room-clear problems, not a scatter of independent contacts.`
