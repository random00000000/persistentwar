# Main Map Tactical Slice Player Spec

## Purpose

Define the player-facing promise for the main replayable tactical map slice that proves the product.

This is the map package that should turn the project from:

- good-feeling firefights
- strong local authored slices
- promising route flavor

into:

- one real tactical squad extraction battlefield the player can study, replay, and master

## Source Direction

- [Tactical Squad Extraction North Star](../../TACTICAL_SQUAD_EXTRACTION_NORTH_STAR.md)
- [Infiltration Shooter Direction](../../INFILTRATION_SHOOTER_DIRECTION.md)
- [Core Verbs Raw Fantasy](../../CORE_VERVS_RAW_FANTASY.md)
- [Core Verbs Raw Fantasy V2](../../CORE_VERVS_RAW_FANTASYV2.md)
- [Extraction Direction](../../EXTRACTION_DIRECTION.md)
- [AI Pressure And Territorial Replayability Player Spec](../ai-pressure-and-territorial-replayability/PLAYER_SPEC.md)
- [Gun Doctrine Player Spec](../gun-doctrine/PLAYER_SPEC.md)
- [Stash Normalization And Squad Recovery Player Spec](../stash-normalization-and-squad-recovery/PLAYER_SPEC.md)
- [Extraction Pressure And Operation Flow Player Spec](../extraction-pressure-and-operation-flow/PLAYER_SPEC.md)
- [RimWorld Dialogue Campaign Flavor Player Spec](../rimworld-dialogue-campaign-flavor/PLAYER_SPEC.md)

## Package Boundary

This package owns the battlefield itself:

- district identity
- sub-zones
- tactical geometry
- room, trench, bunker, road, and extract spaces

It depends on the AI package for:

- settlement-state shifts
- retake logic
- pressure posture

It should not absorb:

- weapon-role tuning
- stash consequence rules
- extraction pacing rules
- dialogue architecture

## Product Promise

The main map should feel like one living gray-zone battlefield where:

- you and the boys enter through believable approach lanes
- small tactical decisions matter constantly
- towns, compounds, trenches, roads, and bunkers produce distinct problems
- extraction routes stay meaningful because the whole district can turn against you
- repeated runs into the same place produce different tactical stories

The player story should sound like this:

- `We crossed the road under cover, stacked on the first room, broke the trench lip with grenades, looted fast, and got out while the route was still barely viable.`
- `The town looked familiar, but the held house was gone, the windows were hotter, and we had to solve the same block in a different way.`
- `We used the bunker as a reset pocket, then pushed again before the district hardened.`

## Fantasy Layer

The map is not just an arena.

It is a living dead-sector district in a fictional ongoing war.

The player should feel:

- quiet infiltration through villages, roads, tree lines, or ruined blocks
- the fear of crossing open ground
- the pressure of windows and doors that are actually dangerous
- trench lips and bunker mouths that must be earned
- relief when a basement or bunker becomes a temporary foothold
- the sense that the same district can become friendlier, uglier, or more broken depending on what happened last time

The map should support both:

- intense sudden violence
- slower periods of movement, listening, planning, and dread

## Gameplay Layer

The main map should present a chain of granular tactical problems.

The player should repeatedly solve:

- how to cross a dangerous lane
- how to pressure a window
- how to enter a room without dying at the lip
- how to follow through into the second room
- how to assault a trench segment
- how to use a bunker or basement as a reset foothold
- how to choose between one more push and extraction

The map should reward doctrine, not only aim.

## Core Map Fantasy

The main map should feel like:

`one replayable district made from many small tactical truths`

not:

`one huge open map that only feels large`

It should contain:

- towns or settlement blocks
- industrial or logistics compounds
- trench or fighting-line elements
- roads and exposed crossings
- bunker or basement footholds
- extraction edges that feel different depending on route pressure

## Tactical Spaces The Map Must Prove

The first north-star map should deliberately support these spaces:

- doorways
- windows
- alleys
- courtyards
- stair-step or chained room interiors
- yard-to-building transitions
- trench segments and trench corners
- bunker mouths
- casualty corridors
- extraction lanes

These spaces should be good enough that players can practice them.

## Main Replayability Promise

Replayability should come from:

- the map containing many tactical problems in one district
- the district changing hands and changing pressure over time
- different approach lanes becoming attractive on different runs
- the same house, block, trench, or road feeling different because of state changes
- the player trying different doctrine against the same spaces

The map should support sentences like:

- `This run I attacked the block through the basement side.`
- `This run the trench was too hot, so I used the bunker reset first.`
- `This run the town was only half ours and the windows punished the old route.`

## Role In The Full Product Loop

The map is where the whole product comes together:

- squad command becomes meaningful because geometry demands it
- gun doctrine becomes meaningful because spaces reward different loadouts
- AI pressure becomes meaningful because the map has defensible and attackable positions
- stash consequence becomes meaningful because loadout and recovery decisions are shaped by the district
- extraction becomes meaningful because leaving the district alive is never trivial

The map package owns the battlefield truth those systems act on.

It should not decide:

- which gun family is correct
- how the stash classifies the outcome
- whether the run ended as profit, recovery, or survival

It should make those decisions meaningful by providing the spaces that force them.

## Relationship To The Boys

The map must support `me and the boys` directly.

It needs enough structure that the player can:

- send boys to cover a sector
- leave boys holding a foothold
- lean on the boys for room follow-through
- move with the boys across a dangerous lane
- recover a body or retreat through a space the boys helped win

The map should make their presence tactically useful and emotionally memorable.

## Relationship To Dialogue

Dialogue should make the map feel inhabited and remembered.

It should react to:

- returning to the same block
- remembering a bad doorway or bad trench
- bunker downtime
- body debt in a known lane
- town control changing

But the map must do the heavy lifting first.

That means the map should intentionally preserve:

- coffee or bunker downtime pockets
- remembered bad ground
- lanes that can become part of memorial or recovery memory

Those are dialogue opportunities because the map made them real first.

## Success Criteria

This map slice is working when players naturally say things like:

- `That room stack taught me something.`
- `That trench was beatable, but not casually.`
- `The map made me use the boys correctly.`
- `The district felt alive instead of static.`
- `I came back to the same place and it demanded a new plan.`
- `I knew the map better, but it still was not solved.`

## Failure Modes

- the map is big but tactically empty
- spaces look flavorful but do not change play
- one route becomes obviously dominant
- room clears stop at the first doorway and do not support follow-through
- footholds are decorative instead of tactically meaningful
- replayability comes only from random spawn churn
- the map feels fully solved after one strong success
