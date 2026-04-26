# Extraction Pressure And Operation Flow Player Spec

## Purpose

Define the player-facing promise for extraction pressure, operation pacing, and the leave-or-stay tension that turns a firefight into an extraction-shooter run.

This package should make the player feel that a raid is not won by entering the district well. It is won by knowing when the district has given enough and getting the boys home through the pressure it creates on the way out.

## Source Direction

- [Tactical Squad Extraction North Star](../../TACTICAL_SQUAD_EXTRACTION_NORTH_STAR.md)
- [Main Map Tactical Slice Player Spec](../main-map-tactical-slice/PLAYER_SPEC.md)
- [AI Pressure And Territorial Replayability Player Spec](../ai-pressure-and-territorial-replayability/PLAYER_SPEC.md)
- [Stash Normalization And Squad Recovery Player Spec](../stash-normalization-and-squad-recovery/PLAYER_SPEC.md)
- [Gun Doctrine Player Spec](../gun-doctrine/PLAYER_SPEC.md)

## Package Boundary

This package owns:

- leave-or-stay tension
- operation pacing
- exfil pressure
- closure of the run

It depends on:

- the map package for the spaces being escaped
- the AI package for route heat and collapse pressure
- the stash package for post-raid consequence
- the gun package for what kind of exfil fight the squad can actually win

It should not own:

- core room geometry
- settlement state itself
- weapon-role tuning

## Product Promise

Extraction should not feel like:

- touching a finish line
- an administrative end button
- a detached afterthought once the good combat is done

It should feel like:

- the final tactical problem of the run
- the moment greed is tested
- the point where casualties, haul, pressure, and doctrine all become one choice

The player story should sound like this:

- `We had enough. The route was getting louder and the far spur still looked open, so we cut out.`
- `We stayed one room too long and turned a clean run into a desperate ring hold.`
- `The haul was good, but the body was already on the line, so that became the real objective.`
- `The PKM got us to exfil, but only because we committed to suppressing the ring before we burned the uplink.`

## Fantasy Layer

The player should feel like a small-unit leader trying to leave a district before it closes around him.

The operation is not just:

- enter
- kill
- loot
- leave

It is:

- stage a plan
- enter under uncertainty
- solve a sequence of tactical problems
- decide when the district is no longer worth pushing
- force a way out under pressure

This should carry both sides of your tone:

- intense violence when the route collapses
- slower stretches where the player reads the map, the squad, and the cost of pushing one more pocket

## Gameplay Layer

The player should constantly be answering:

- do we keep pressing
- do we pivot extracts
- do we stage the exit first
- do we stop looting and start leaving
- is this still a profit run or is it now a recovery run

The operation flow should naturally create phases:

1. `Approach`
   The player enters, reads the district, and sets the tone.
2. `Initial gain`
   The player clears or exploits the first tactical pockets.
3. `Commitment`
   The player takes on more risk for loot, contract progress, body recovery, or position.
4. `Recognition`
   The player realizes the district is turning and has to decide whether to keep pushing.
5. `Extraction problem`
   The chosen exfil becomes its own tactical fight.
6. `Debrief consequence`
   The result turns into stash, squad, and territorial fallout.

## Code / Simulation Layer

Under the hood, the game should track:

- focused extract choice
- planned extract posture
- route heat and extract heat
- extraction-hold duration and slip state
- contested ring state
- extraction crash-wave state
- casualty-extract state
- debrief economy and consequence summaries

The player should feel those as:

- `this ring is still clean`
- `that exfil is going to get ugly if I wait`
- `we can leave now, but not for free`
- `this run is no longer about greed`

## Core Extraction Promise

Extraction must validate the whole product loop.

It is where:

- tactical mastery becomes survival
- greed becomes risk
- stash consequence becomes real
- squad consequence becomes personal

If extraction is flat, the rest of the game loses weight.

## Core Operation Flow Promise

A raid should have a readable rise and fall, not just a pile of encounters.

The player should feel:

- a calm before the worst pocket
- a moment where the operation is going well
- a moment where the district starts pushing back
- a decision point where the right answer is to leave before the map makes that decision for them

The game should produce that shape consistently enough that players can build doctrine around it.

## Greed Versus Safety Loop

This is the heart of the package.

The player should often feel four competing pressures:

- `one more pocket could pay`
- `one more pocket could finish the contract`
- `one more minute could cost the squad`
- `one more minute could close the clean exfil`

That tension should not come only from a timer.

It should come from:

- noise
- route heat
- unresolved enemies
- town-state instability
- squad depletion
- ammo and med status
- body-recovery obligations

## Planned Exfil Promise

Extraction should begin before the ring is active.

The player should be able to think in advance:

- `if we burn this route, we leave by the far spur`
- `if the body comes home, we cut straight out`
- `if the district hardens, we need the screened exit not the fast one`

That means the game should support exfil planning as a tactical stance, not just an exit marker.

## Casualty Exfil Promise

Extraction should support the run changing identity.

A raid that began as:

- a profit run
- a contract run
- a room-clear run

can become:

- a casualty pull
- a body recovery
- a survival-only exfil

That shift is one of the strongest stories the game can tell.

## Relationship To Map And AI

Map and AI should make exfil pressure legible.

The player should read:

- which crossing will get ugly first
- which route is safer but longer
- which exfil is more exposed
- which pressure posture the enemy is taking toward the ring

Extraction should feel like the map and AI are completing the argument they started earlier in the run.

## Relationship To Stash

The stash is what makes leaving matter.

Because of that, extraction should make the player think in stash language:

- `bank it now`
- `carry the meds home`
- `this gun is not worth dying for`
- `if we lose this run, the whole next push changes`

The player should feel the stash before the debrief even appears.

## Relationship To Dialogue

RimWorld-style emergent dialogue should season operation flow and extraction pressure.

It should help sell:

- a boy calling that the route is turning
- someone urging the player to leave
- someone recognizing that a clean extract is slipping
- someone framing the run as a body drag rather than a win

This dialogue should clarify pressure, not replace it.

## UI Language

Use direct battlefield language.

Preferred labels:

- `Extract now`
- `Ring contested`
- `Hold the uplink`
- `Route slipping`
- `Crash wave inbound`
- `Casualty pull`
- `Clean exit`
- `Hot exfil`
- `Leave with the haul`

Avoid:

- `operation closure phase`
- `end-state trigger`
- `mission completion zone`

## Examples

## Clean Discipline

- the player clears the first objectives cleanly
- the squad is healthy and the route is still readable
- the player stages the safer exfil early and leaves with moderate haul
- the run feels disciplined rather than timid

## Greed Punished

- the player keeps pushing after the route clearly hardens
- the chosen exfil gets hotter
- the crash wave turns the ring into the hardest fight of the run
- the player extracts, but the debrief makes it obvious the greed cost them

## Recovery Exfil

- a boy goes down and later dies
- the body is recovered under pressure
- loot becomes secondary
- the exfil is now about getting the body out, not maximizing value
- the run still feels like a victory, but of a different kind

## Success Criteria

This package is working when:

- extraction feels like the decisive tactical wrapper around the raid
- players can feel a run changing from clean profit to dangerous overextension
- exfil choice and exfil timing both matter
- casualty pulls and body extracts feel like valid operation endings, not consolation prizes
- debrief reads clearly explain why the run felt good, bad, disciplined, or reckless

## Failure Modes

- extraction is just a finish line
- the raid lacks pacing and feels flat from start to finish
- greed pressure comes only from vague difficulty inflation
- all extracts feel equivalent
- operation endings do not meaningfully change based on casualties, stash pressure, or territorial pressure
