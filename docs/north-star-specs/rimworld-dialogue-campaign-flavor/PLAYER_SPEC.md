# RimWorld Dialogue Campaign Flavor Player Spec

## Purpose

Define the player-facing promise for dialogue as human flavor, campaign memory, and squad identity.

This package should make the player feel that the boys are not sterile tactical announcers. They are people living through a long ugly campaign, reacting to tactical truth, carrying memory forward, and making the war feel inhabited.

## Source Direction

- [Tactical Squad Extraction North Star](../../TACTICAL_SQUAD_EXTRACTION_NORTH_STAR.md)
- [Main Map Tactical Slice Player Spec](../main-map-tactical-slice/PLAYER_SPEC.md)
- [AI Pressure And Territorial Replayability Player Spec](../ai-pressure-and-territorial-replayability/PLAYER_SPEC.md)
- [Stash Normalization And Squad Recovery Player Spec](../stash-normalization-and-squad-recovery/PLAYER_SPEC.md)
- [Extraction Pressure And Operation Flow Player Spec](../extraction-pressure-and-operation-flow/PLAYER_SPEC.md)
- [Gun Doctrine Player Spec](../gun-doctrine/PLAYER_SPEC.md)

## Package Boundary

This package owns the human flavor and campaign memory reaction layer.

It depends on all other packages to provide real events worth reacting to.

It should not:

- replace missing tactical depth with extra chatter
- explain obvious mechanics the player can already read
- turn the squad into nonstop Marvel-style quip machines

## Product Promise

Dialogue should not feel like:

- tutorial VO
- generic bark spam
- constant exposition
- a substitute for map clarity or AI readability

It should feel like:

- overheard battlefield life
- brothers reacting to pressure, grief, fear, and luck
- small recurring memories that make the campaign feel persistent
- seasoning that turns a good tactical run into a memorable war story

The player story should sound like this:

- `They remembered the trench where we lost him and that changed how the next push felt.`
- `One boy joked over coffee, then the next room went bad and the contrast hit hard.`
- `The squad started calling that route cursed without the game ever declaring it so outright.`
- `The memorial wall, handoff board, and debrief made it feel like the campaign remembered what happened.`

## Fantasy Layer

The player should feel that the squad is living through:

- a tactical campaign
- a slower war between operations
- a history of places, losses, and routines

This is the part of the product that preserves:

- trench coffee
- bunker downtime
- dark humor
- family and wake obligations
- returning to bad ground
- the weird half-calm that exists between brutal pushes

The tone target is not Hollywood monologue writing.

It is closer to:

- quiet observations
- blunt callouts
- recurring phrases
- awkward humor
- memory under pressure

## Gameplay Layer

The player should hear and read dialogue that reacts to:

- tactical events
- operation-state shifts
- body recovery
- memorial debt
- territorial return
- downtime pockets
- weapon doctrine and squad role identity

The player should not need dialogue to understand the game.

The player should want dialogue because it makes the game they already understand feel human.

## Code / Simulation Layer

Under the hood, the system should track:

- dialogue event kinds
- memory tags
- story-pack families
- delivery context
- speaker identity
- campaign and debrief fallout hooks

The player should feel those as:

- `the boys remember`
- `this place has history`
- `that route means something now`
- `the squad sounds different because the campaign changed`

## Core Dialogue Promise

Dialogue should react to tactical truth.

If the player:

- assaults a trench
- clears a room
- suppresses a window
- loses a boy
- recovers a body
- pivots to a casualty exfil
- returns to a town that changed hands

the dialogue layer should help that moment stick.

The key rule is:

`AI tactics and map design create the mastery. Dialogue makes those moments memorable.`

## Core Campaign Memory Promise

The campaign should feel remembered through people, not just numbers.

The squad should accumulate small campaign memory through:

- repeated ground
- repeated losses
- repeated extracts
- repeated routines
- repeated squad habits

That memory should show up in:

- short live barks
- frontline focus cards
- debrief war logs
- memorial wall text
- handoff board tone
- stash flavor

## Tactical Reaction Beats

Dialogue should react well to tactical truth in four main ways.

### 1. Immediate Combat Reaction

Examples:

- contact, pinning, breach warning, collapse warning
- a boy recognizing a bad lane
- someone calling that the route is getting too loud

### 2. Situation Recognition

Examples:

- this is now a body recovery
- this room is not worth another push
- that exfil is turning hot
- this district is different from last time

### 3. Aftermath And Memory

Examples:

- debrief lines that remember a hard run
- war-log lines that frame what changed
- memorial notes that feel personal without becoming melodrama

### 4. Quiet Life Beats

Examples:

- trench coffee
- bunker pauses
- dark humor on the move
- low-heat conversation that reveals squad texture

## Downtime Promise

The war should not sound like pure constant panic.

This package should preserve space for:

- coffee and burner moments
- dead time in bunkers
- low-stakes route chatter
- small civilian or search beats

Those moments matter because they make the violent moments hit harder.

## Relationship To The Boys

Dialogue should differentiate the squad without turning each boy into a huge authored narrative tree.

The player should feel:

- one boy stays calm under casualty pressure
- another uses dark humor
- another is more practical and blunt
- another notices civilians, bodies, or route details first

The squad should feel like recognizable people in a unit, not random bark generators.

## Relationship To Campaign Fallout

Dialogue should help bind the campaign layer together.

It should react to:

- towns flipping
- remembered routes
- sector scars
- memorial debt
- replacement chairs
- story-finale style decisions when they exist

This is what makes the war feel like it is continuing between runs.

## Relationship To Stash And Memorial

The stash should be one of the strongest dialogue flavor surfaces.

It should support:

- memorial wall language
- family-call and wake language
- chair handoff tone
- quiet comments about recovered guns, sealed med stock, or bad debt

This is where the campaign stops being abstract.

## Relationship To Extraction

Dialogue should sharpen operation endings.

It should help sell:

- clean disciplined exits
- route panic
- hot exfil recognition
- body drag or casualty pull tone

It should not scream the same warning over and over.

It should recognize when the run changed identity.

## UI Language

Use blunt human language, not writerly exposition.

Preferred qualities:

- short
- specific
- lived-in
- occasionally funny
- occasionally cold

Avoid:

- lore dumps
- paragraph barks
- constant naming of the system state
- dialogue that sounds like patch notes

## Examples

## Returning To Bad Ground

- the squad enters a trench or room stack they fought through before
- one short line recognizes the place
- the player feels the route has a memory without the game stopping to explain itself

## Quiet Before Violence

- the squad gets a coffee or low-heat beat
- a small human line lands
- the next firefight hits harder because of the contrast

## Memorial Follow-Through

- a body is missing
- the memorial wall, next-order recommendation, and squad flavor all align
- the player feels the campaign is carrying the loss forward

## Success Criteria

This package is working when:

- players remember specific lines because of what was happening, not because the writing was loud
- the squad feels human without talking nonstop
- repeated routes and losses feel remembered
- memorial and handoff surfaces feel emotionally real
- downtime moments enrich the war instead of distracting from it

## Failure Modes

- dialogue explains instead of enriches
- dialogue tries to carry missing tactical depth
- the squad never shuts up
- every boy sounds the same
- the campaign has memory in data only, not in human reaction
- quiet moments are cut away in favor of constant combat noise
