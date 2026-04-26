# Squad Moving Suppression Player Spec

## Purpose

Add a deeper moving-fire command for the selected boy:

- `Ctrl + RMB` orders the selected boy to move while delivering controlled suppression toward a chosen target point or lane.

This is not a panic mag dump.

It is a calculated covering-fire command that lets the player move, cross, breach, or peel while one brother keeps a dangerous lane honest.

## Product Promise

The player should be able to say:

- "Cover me while we move."
- "Walk fire onto that window while I cross."
- "Keep that doorway dead while we shift left."
- "Suppress that house on the move, do not just dump the mag."
- "If anything pops out there, handle it while I maneuver."

This should make the squad feel like a real small unit instead of followers with simple attack toggles.

## Three Layers

### Fantasy Layer

The player is commanding one brother to move with intent while keeping a chosen threat lane pinned by disciplined fire.

### Gameplay Layer

The player selects one boy, points at a threat point, and presses `Ctrl + RMB`.

That boy then:

- keeps moving or following the current movement task
- keeps his attention on the selected lane
- fires controlled bursts into that lane while moving
- reacts faster to enemies that pop out there
- stays worse against threats outside that sector

### Code / Simulation Layer

The engine tracks:

- the selected squadmate
- the chosen suppression target point
- the moving anchor or movement objective
- the watched suppression sector
- controlled burst cadence
- line-of-sight and range checks
- resume and break conditions

This must still use the same real combat runtime: bullets, ammo, reloads, LOS, projectile spread, pressure, and squad command state.

## Loop Position

This command sits between `Ctrl + RMB` moving sector coverage and explicit `Alt + Click` / `Alt + V` static suppression.

The intended stack becomes:

- `Alt + RMB`: planted sector watch
- `Ctrl + RMB`: moving suppression / covering fire
- `Alt + Click` or `Alt + V`: static suppression on a point
- `Alt + G`: frag

That gives the player distinct tactical jobs:

- plant a killer on a lane
- walk one brother with covering fire
- pin a pocket hard
- break a room with a grenade

## Core Behavior

### Input

`Ctrl + RMB` should target a world point.

That point represents:

- the lane to suppress while moving
- the threat source to keep under control
- the place the moving boy should keep ready to answer

### What The Boy Does

When the command is active, the selected boy:

- keeps moving with the current maneuver instead of planting
- keeps facing and scanning toward the chosen suppression lane
- fires deliberate short bursts rather than continuous spray
- prioritizes enemies that appear inside or near the selected lane
- avoids wasting too much fire on off-sector threats
- remains less precise and less stable than planted watch
- remains more deliberate and less wasteful than static suppress

### What Makes It Deep

The skill is not just pressing the command.

The skill is:

- picking the right boy
- picking the right lane
- crossing at the right time
- pairing the command with your own movement
- knowing whether this should be moving suppression, planted watch, static suppress, or a frag

Examples:

- rifle boy using moving suppression across a long street: strong
- SMG boy walking suppression into a close house mouth: strong
- shotgun boy trying to cover a wide yard while moving: weak
- moving suppression on the wrong window while the real threat swings from another side: bad

## Distinction From Nearby Commands

`Alt + RMB` planted watch:

- stronger readiness
- narrower commitment
- better first-shot punishment
- weaker mobility

`Ctrl + RMB` moving suppression:

- keeps maneuver alive
- controlled covering bursts
- medium readiness in one lane
- weaker outside that lane

`Alt + Click` / `Alt + V` static suppress:

- stronger pinning on one fixed point
- less movement
- more deliberate pressure effect
- less suitable for keeping up with the maneuver

`V` attack:

- aggressive pursuit
- chases
- less disciplined

## UI Language

Preferred player-facing names:

- `Covering Move`
- `Moving Suppression`
- `Walk Fire`

Recommended shipped label:

- `Covering Move`

Recommended short live reads:

- `Covering Left Window`
- `Walking Fire On Door`
- `Moving Suppression: Yard`
- `Covering Cross`

Avoid debug language like:

- mobile suppression state
- move suppress vector
- locomotion fire overlay

## Feedback

### World Feedback

The world should show:

- a moving sector line or wedge from the boy
- the suppression target point
- a lighter lane marker than planted watch
- brief burst tracers that make the controlled rhythm readable

### HUD Feedback

The selected-boy surface should show:

- `Covering Move` as the active order
- target label
- movement state such as `Crossing`, `Covering`, or `Broken`
- a short note that this is controlled fire, not a full suppress hold

### Squad Comms

Examples:

- "Covering that window while we move."
- "Walking fire on the house."
- "Keeping that lane honest."
- "Cross now. I have the doorway."

## Success Criteria

The feature is successful when:

- the player can reliably use one boy to cover movement through a dangerous lane
- the command feels distinct from both planted watch and static suppression
- the boy does not turn the command into a dumb mag dump
- lane choice and weapon choice clearly matter
- the feature creates room for more map complexity and better flanking encounters later

## Why This Strengthens The Game

This feature makes the battlefield richer without adding RTS bloat.

It gives the player a new way to solve hard spaces:

- one brother moves with controlled fire
- another plants on a lane
- the player crosses or breaches

That directly supports the long-term goal of deeper maps, harder room chains, more open crossings, and more ways to beat enemy positions through tactics instead of raw stats.
