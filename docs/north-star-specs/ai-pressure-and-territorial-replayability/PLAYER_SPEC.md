# AI Pressure And Territorial Replayability Player Spec

## Purpose

Define the player-facing promise for the system that makes the war feel masterable, alive, and worth replaying:

- adaptive enemy pressure
- surrender and collapse behavior
- casualty and medevac responses
- towns, compounds, and sectors changing hands over time

This package is one of the core product slices for the tactical squad extraction north star.

## Source Direction

- [Tactical Squad Extraction North Star](../../TACTICAL_SQUAD_EXTRACTION_NORTH_STAR.md)
- [Infiltration Shooter Direction](../../INFILTRATION_SHOOTER_DIRECTION.md)
- [Core Verbs Raw Fantasy](../../CORE_VERVS_RAW_FANTASY.md)
- [Core Verbs Raw Fantasy V2](../../CORE_VERVS_RAW_FANTASYV2.md)
- [Extraction Direction](../../EXTRACTION_DIRECTION.md)
- [Main Map Tactical Slice Player Spec](../main-map-tactical-slice/PLAYER_SPEC.md)

## Package Boundary

This package owns:

- AI pressure
- suppression consequences
- collapse and surrender behavior
- settlement-state replayability

It depends on the map package for:

- the tactical spaces where these states play out

It should not absorb:

- district geometry
- gun-role design
- stash persistence rules

## Product Promise

The battlefield should feel like a living gray zone, not a static level.

The player should be able to return to the same town and find:

- different control
- different pressure
- different tactical problems
- remembered scars from earlier fights
- new reasons to suppress, breach, hold, recover, or retreat

The player story should sound like this:

- `We pinned them in the first trench and made them break.`
- `We came back the next day and Blue had the town again.`
- `One casualty changed the whole operation and pulled a medevac bigger than the fight.`
- `They held the room until suppression and grenades finally broke them.`
- `We thought the town was won, but it was only temporarily ours.`

## Fantasy Layer

You and the boys are fighting through a fictional modern war where ground never stays solved for long.

The enemy are not cardboard targets.

They:

- pin you
- hold space
- reinforce
- pull wounded
- collapse when pressured correctly
- surrender when trapped
- reclaim settlements if you do not finish the job

The emotional fantasy is:

`We are not clearing content. We are surviving and shaping a living war pocket that can still turn against us later.`

## Gameplay Layer

The player should repeatedly engage with these tactical questions:

- is this room soft enough to enter
- is this trench segment ready to assault
- is this crossing safe enough to take
- is the enemy pinned or only delayed
- did this casualty just make the whole operation more dangerous
- is this town actually secured, only breaking, or about to be lost again
- do we hold this pocket, recover what matters, or extract now

Replayability should come from:

- different enemy postures in the same space
- changing control states for towns and compounds
- variable support pressure and route pressure
- remembered prior outcomes
- the player's growing tactical mastery over suppression, collapse, surrender, and retake logic

## Core Player Fantasy

The player is mastering a battlefield language, not memorizing a script.

That language should include:

- suppression
- pinning
- holding sectors
- room entry
- trench assault
- casualty handling
- surrender pressure
- territorial hold and retake

The player should feel that better doctrine produces better outcomes.

## Tactical Mastery Promise

This feature is successful when repeated play teaches real doctrine.

Better players should learn:

- how to create pins instead of trading fair shots
- how to read whether enemies are holding, collapsing, or about to counterpush
- how to use cover, windows, thresholds, and trench lips to control tempo
- when a casualty means the push should stop
- when surrender is available
- when a settlement is only temporarily stable
- when to re-enter a route because the town state has become favorable again

## Gray-Zone Replayability Promise

The same map should feel different because the war keeps moving.

Towns and compounds should be able to become:

- held
- contested
- lost
- breaking
- reclaimed
- scarred by previous raids

The player should return to places that:

- remember planted flags
- remember body recovery or body debt
- remember broken pockets
- remember losing ground
- have changed hands multiple times

This is not meant to be a grand strategy layer.

It is a living territorial layer that keeps the tactical map fresh.

## AI Pressure Promise

The enemy should pressure the player with readable battlefield verbs instead of fake difficulty.

Important pressure behaviors:

- suppression that materially changes movement and peeking
- entrenched or interior defense that punishes bad entry
- strong reaction to casualties
- medevac or casualty-pull responses
- reinforcement or fallback when the fight turns
- surrender when the player correctly isolates and dominates a pocket
- retake pressure after the player leaves a town half-finished

## What The Player Should See

The player should be able to read territorial and AI state from the battlefield itself, not only from side panels.

Readability sources should include:

- flags
- scar markers
- body lanes
- changed hold dressing
- support traffic
- route boards
- bunker or village state changes
- dialogue and radio traffic
- debrief fallout

The town changing hands must feel visible.

It cannot live only in a number.

## Relationship To Extraction

This system exists to make extraction matter more.

It should increase extraction tension by making the player ask:

- do we secure this pocket now or leave it unstable
- do we recover the body now or come back later
- if we extract, what will this town look like when we return
- if we stay, will the route go hot enough to trap us

The player should be extracting from an unfinished local problem inside an unfinished wider war.

## Dialogue And Atmosphere

Dialogue should support this feature by making the changing war feel personal.

It should react to:

- pinned states
- surrender windows
- casualty pulls
- reclaimed ground
- lost ground
- returning to the same settlement
- remembered bad lanes

The tone should remain human and campaign-like:

- dread
- dark humor
- pride
- fatigue
- remembered failure

## Success Criteria

This feature is working when players naturally say things like:

- `I had to pin them before we could move.`
- `They were holding the room correctly and I got punished.`
- `The casualty changed the whole fight.`
- `The surrender only happened because we broke the pocket properly.`
- `We were here before, but the town belonged to someone else this time.`
- `We did not really clear it. We only bought time.`

## Failure Modes

- AI only feels harder, not deeper
- suppression is cosmetic
- surrender is random or scripted
- town-state changes are invisible or too abstract
- replayability comes from noise rather than learnable variation
- settlements change hands without readable causes
- the same map still feels effectively solved after one good run
