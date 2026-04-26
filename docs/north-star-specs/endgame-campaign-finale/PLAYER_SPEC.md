# Endgame Campaign Finale Player Spec

## Purpose

Define the player-facing promise for the final campaign arc, final stronghold, and true-escape ending.

This package should make the player feel that the whole game was building toward something real:

- not just more stash
- not just more raids
- not just harder pockets

but a final offensive that can actually be won.

## Source Direction

- [Tactical Squad Extraction North Star](../../TACTICAL_SQUAD_EXTRACTION_NORTH_STAR.md)
- [Endgame Direction](../../ENDGAME_DIRECTION.md)
- [Main Map Tactical Slice Player Spec](../main-map-tactical-slice/PLAYER_SPEC.md)
- [AI Pressure And Territorial Replayability Player Spec](../ai-pressure-and-territorial-replayability/PLAYER_SPEC.md)
- [Stash Normalization And Squad Recovery Player Spec](../stash-normalization-and-squad-recovery/PLAYER_SPEC.md)
- [Extraction Pressure And Operation Flow Player Spec](../extraction-pressure-and-operation-flow/PLAYER_SPEC.md)
- [RimWorld Dialogue Campaign Flavor Player Spec](../rimworld-dialogue-campaign-flavor/PLAYER_SPEC.md)

## Package Boundary

This package owns the final campaign arc:

- final stronghold fantasy
- preparation-to-finale relationship
- final offensive structure
- true-escape ending promise

It depends on all other north-star packages to make the ending earned.

It should not replace those packages with a one-off final mission.

## Product Promise

The endgame should not feel like:

- a detached boss level
- a random harder raid
- a stat wall that says `come back later`
- a fake ending that changes nothing

It should feel like:

- the hardest tactical district in the game
- the operation all the earlier raids were preparing the player to survive
- a real final campaign push with genuine closure

The player story should sound like this:

- `We were not ready the first time we saw that district, but after weeks of runs we finally had the doctrine, the guns, and the boys to break it.`
- `The final assault was not a gimmick. It tested every skill the campaign taught.`
- `When we got out, it felt like we had actually escaped.`

## Fantasy Layer

The player should feel that there is one final wall between survival and freedom.

That wall should be:

- a heavily fortified enemy stronghold
- held by a feared elite formation
- visually, tactically, and emotionally worse than the rest of the campaign

The fantasy is not:

- heroic invincibility

It is:

- grim competence finally becoming enough

The squad has survived long enough, learned enough, and built enough capability to take on the one place everybody knows is bad.

## Gameplay Layer

The endgame should ask the player to do three things:

1. Recognize that the final stronghold exists and is currently too dangerous.
2. Use the normal extraction campaign to prepare for it.
3. Execute a final offensive that demands the whole tactical language of the game.

The player should need:

- map mastery
- squad command
- doctrine choice
- stash preparation
- body and casualty discipline
- extraction judgment under maximum pressure

## Code / Simulation Layer

Under the hood, the endgame should read as:

- one campaign threshold
- one final stronghold state
- one preparation readiness model
- one final offensive operation flow
- one true-escape success state

The player should feel those as:

- `we are not ready yet`
- `now we can attempt it`
- `this is the real push`
- `if we survive this, we are out`

## Core Finale Promise

The final stronghold should be the hardest district in the game because it is tactically denser and more punishing than everything before it.

It should test:

- room follow-through
- trench assault
- crossing discipline
- suppression and pinning
- casualty handling
- extraction under collapse

The player should not win because the game turned generous.

They should win because they became capable enough.

## The Final Stronghold

The final stronghold should feel qualitatively different, not just numerically bigger.

It should contain a combination of:

- layered trench segments
- reinforced building interiors
- exposed lanes with machine-gun pressure
- bunker or command-node interiors
- extremely dangerous windows and lip fights
- high-pressure extract edges

The player should feel:

- `this place is cracked`
- `this place was designed to kill sloppy play`

## Preparation Raids

Preparation raids are a major part of the endgame promise.

They should make the player feel:

- the final offensive is earned
- the campaign matters before the ending
- each last run can improve the odds in a concrete way

Preparation raids should support things like:

- recovering heavy or rare weapons
- opening a safer approach lane
- gathering route or command intel
- staging recovery corridors
- weakening one part of the final district

The player should be able to attempt the finale without every prep raid, but they should feel the difference.

## Final Offensive Structure

The final offensive should feel like a multi-stage raid, not a flat arena.

The intended player arc is:

1. `Approach`
   Read the first danger and get the squad into the district.
2. `Break-in`
   Survive the first hard defensive line.
3. `Penetration`
   Push through the interior or trench follow-through problem.
4. `Crisis`
   Take or risk casualties, supply strain, or route collapse.
5. `Objective`
   Break the core position that ends the local campaign.
6. `True extract`
   Survive the final leave under pressure.

## The Elite Enemy

The final enemy should feel like a famous hardened brigade or mechanized formation inside the fiction of the game.

The design rule is:

- inspired by real modern conflict seriousness
- fictional in shipped identity

That lets the game build:

- reputation
- rumor
- fear
- iconography

without tying itself directly to one real unit name.

## Win Condition

The player wins the base campaign when they:

- complete the final offensive
- survive the decisive extraction
- successfully end the war-sector campaign

This should not be treated as:

- a normal extract with extra rewards

It should be treated as:

- real campaign closure
- true escape

## Failure Loop

The final offensive should be difficult enough to fail.

But failure should not destroy the campaign structure.

Good failure model:

- the player can fail the finale
- the campaign returns to a preparation-capable state
- stash and squad consequences remain real
- the player can recover and try again

That preserves tension without turning the ending into a one-life stunt.

## Relationship To The Core Packages

### Map

The finale proves whether the map package created a district worth mastering.

### AI

The finale proves whether AI pressure can support the hardest district in the game.

### Guns

The finale proves whether weapon doctrine creates meaningful preparation and tactical choices.

### Stash

The finale proves whether the stash actually prepared the player rather than only storing flavor.

### Extraction

The finale proves whether extraction is truly the final wrapper of the game.

### Dialogue

The finale proves whether the campaign can sound remembered, fearful, and final without drowning the player in exposition.

## Extensibility Promise

The ending should be real, but not terminal for future development.

The intended shipped meaning is:

- the player escaped this war sector

not:

- all possible future campaigns are over forever

That allows:

- new districts
- new war chapters
- harder follow-up finales
- expansions or sequel arcs

## Success Criteria

This package is working when:

- the campaign is beatable
- the ending feels earned, not bolted on
- the final district tests the same tactical language the player learned throughout the game
- preparation raids, stash growth, and squad consequence all matter before the finale
- true escape feels emotionally different from a normal successful extract

## Failure Modes

- the ending is only a harder version of a normal raid
- the final challenge ignores the game's tactical vocabulary
- the finale is mostly gear gate and not mastery gate
- the ending feels disconnected from stash, squad, and extraction consequence
- the ending is so final that later expansion becomes awkward
