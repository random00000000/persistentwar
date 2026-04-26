# Stash Normalization And Squad Recovery Player Spec

## Purpose

Define the player-facing promise for the stash as the operational backbone of the game and for squad recovery as the human consequence layer that makes extraction matter.

This package should make the player feel that every raid starts and ends somewhere real:

- gear is staged with intent
- losses follow the squad home
- recovered bodies, sealed supplies, and stripped guns matter
- replacement boys arrive through a believable handoff instead of magic respawn

## Source Direction

- [Tactical Squad Extraction North Star](../../TACTICAL_SQUAD_EXTRACTION_NORTH_STAR.md)
- [Main Map Tactical Slice Player Spec](../main-map-tactical-slice/PLAYER_SPEC.md)
- [AI Pressure And Territorial Replayability Player Spec](../ai-pressure-and-territorial-replayability/PLAYER_SPEC.md)
- [Gun Doctrine Player Spec](../gun-doctrine/PLAYER_SPEC.md)

## Package Boundary

This package owns the persistent consequence layer between operations.

It owns:

- stash readability and normalization
- what can be staged into a raid
- what comes home from a raid
- squad depletion, reserve rotation, and replenishment
- missing-body debt, memorial debt, and recovery follow-through

It depends on:

- the map package to produce meaningful spaces and extractions
- the AI package to produce meaningful casualties, retakes, and pressure
- the gun package to make recovered weapons and loadout choices tactically meaningful

It should not own:

- battlefield geometry
- enemy pressure logic
- gun family doctrine

## Product Promise

The stash should not feel like:

- a detached menu
- a pile of props with unclear purpose
- a fake economy board
- a place where dead boys quietly disappear and new ones appear

It should feel like:

- the wall you build the next operation from
- the place where sealed haul, weapons, dressings, and contracts become the next plan
- the room where the cost of a bad raid is visible
- the room where the boys who made it home, and the boys who did not, are accounted for

The player story should sound like this:

- `We brought back the PKM, two sealed med bundles, and just enough ammo to go again.`
- `We got Yara home, but Rook is still on the wall and now the next run has to be a recovery push.`
- `The stash looked thin, so I cut the loadout down and ran lighter.`
- `The new boy is not just a respawn. He is taking a dead man's chair and I felt that.`

## Fantasy Layer

The player should feel like they are running a small, battered war room with their squad.

The stash is where:

- weapons are chosen
- supplies are committed
- hot-market haul gets sorted
- memorial debt stares back at the player
- the next operation is shaped by what survived the last one

This is where the extraction-shooter product and the squad-commander product actually meet.

The north-star emotion is:

`We are not collecting loot for its own sake. We are keeping the boys in the fight long enough to make it through this war.`

## Gameplay Layer

The player should use the stash to answer five questions before every raid:

- what am I bringing
- what am I risking
- who is available
- what loss still needs to be answered
- what kind of operation can we realistically afford right now

The stash loop should support:

- staging a weapon doctrine package
- committing medkits and ammo packs into the run
- deciding whether a found gun is worth keeping, selling, or fielding next
- reading which boys are active, reserve, hurt, dead, or not yet replaced
- deciding whether to chase profit, body recovery, or readiness

The player should not need to parse an abstract spreadsheet to make those calls.

## Code / Simulation Layer

Under the hood, the system should track:

- persistent stash credits
- persistent stash supplies
- item classification and item legality
- what stash items are deployable, sellable, mission-only, or memorial-only
- squad roster status
- casualty records and body recovery state
- reserve timers
- recruit or replacement availability
- unresolved memorial pressure

The player should read those as:

- `gear on the wall`
- `dressings left`
- `ammo left`
- `boys ready`
- `boys recovering`
- `boys missing`
- `chairs still empty`

## Core Stash Promise

The stash should be normalized around clear item meanings.

If something is visible in the stash wall, the player should be able to understand which bucket it belongs to:

- `deployable`
  A weapon, sidearm, medkit, ammo pack, support tool, or other item that can go into the next raid.
- `recoverable haul`
  A sealed or stripped item that came back from a raid and can now become money, doctrine, or future support.
- `operation token`
  A contract, route packet, or support marker that informs the next run.
- `memorial artifact`
  Something visible because it represents squad consequence, not because it is loot.

The stash should stop containing ambiguous filler that looks interactable but is only there to fake density.

Atmosphere is still allowed, but every visible item needs a readable gameplay category.

## Core Squad Recovery Promise

The squad should not replenish like an arcade life counter.

Replacement should feel:

- practical
- grounded
- a little painful
- fast enough to keep the game playable

The roster loop should support:

- active boys
- reserve boys
- dead boys
- missing-body debt
- wake or family follow-through
- replacement candidates taking open chairs over time

The player should feel that one death matters, but the game should still remain playable and recoverable.

## The Recovery Loop

The intended loop is:

1. A raid creates success, wounds, missing bodies, or losses.
2. The debrief tells the player what came home and what did not.
3. The stash shows the material result:
   - credits
   - sealed supplies
   - recovered weapons
   - depleted prep stock
4. The operator tab shows the human result:
   - active roster
   - reserve timers
   - memorial debt
   - replacement flow
5. The player builds the next operation around both.

That is the persistent tension this package exists to protect.

## Deployable Item Normalization

The player should always understand whether an item can make it into the next raid.

The first north-star rule should be:

- if the item is on the operational wall and tagged as gear or supply, it can either be brought, sold, or staged for a specific support effect

The player should not be left wondering:

- `Why is this in my stash if it cannot do anything?`

Examples of meaningful stash categories:

- sidearm
- primary weapon
- medkit bundle
- ammo pack
- stripped enemy weapon
- sealed clinic stock
- tagged industrial salvage
- broker cargo
- route support packet

Each category should have a clear destination:

- rig
- raid backpack
- support action
- broker sale
- memorial or operator board

## Relationship To Guns

The stash is where gun doctrine becomes a product loop instead of a single-match choice.

It should support:

- staging the primary and sidearm package
- preserving recovered enemy guns
- deciding which weapon belongs to Blue versus the boys
- reading ammo burden before deployment

The player should think:

- `The PKM is worth the burden on this run.`
- `This shotgun belongs in the wall until the room-heavy district comes back.`
- `That pistol is weak, but it is honest insurance.`

## Relationship To Extraction

Extraction is what validates the stash.

Without extraction:

- supplies do not come home
- found guns do not matter
- body recovery debt remains unresolved
- squad loss stays as an open wound

This package should make extraction feel personal and material at the same time.

The player should sometimes extract because:

- the stash needs the haul
- the boys are too depleted
- a body has already been recovered and greed is no longer worth it

## Relationship To Replayability

Replayability should come from persistent friction, not just random item drops.

Good replayability sources for this package:

- towns changing hands change what loadout feels correct
- prior losses create body-recovery or readiness pressure
- recovered weapons create new doctrinal options
- reserve recovery means the squad composition can shift across runs
- broker demand or contract pressure changes what haul matters right now

## UI Language

Use blunt operational language.

Preferred labels:

- `Ready`
- `Reserve`
- `Missing`
- `Recovered`
- `Wake owed`
- `Chair open`
- `Rigged for raid`
- `Broker tagged`
- `Sealed med stock`
- `Ammo committed`
- `Recovered weapon`

Avoid:

- `inventory normalization`
- `replacement pipeline`
- `persistent asset classification`

## Dialogue And Flavor Role

RimWorld-style emergent dialogue should season this package, not replace it.

The stash should sometimes speak through:

- short debrief lines
- memorial wall lines
- handoff board lines
- quiet comments about a recovered gun, a missing body, or a chair being filled

The goal is not chatter for its own sake.

The goal is to make the stash feel inhabited by the consequences of the raid.

## Examples

## Thin Win

- the player extracts with low ammo, one sealed med bundle, and a stripped SMG
- one squadmate is still active but another goes to reserve for two days
- the stash now supports one more raid, but only barely
- the next loadout feels constrained in a satisfying way

## Body Debt Run

- a boy dies and the body is not recovered
- the memorial wall and next-push card both keep that debt visible
- the player chooses a lighter, more practical recovery loadout next run
- successful recovery clears the debt and changes the emotional read of the stash

## Chair Handoff

- a veteran dies
- there is a delay before a replacement becomes available
- when the new boy arrives, the handoff board frames it as taking an empty chair, not spawning a unit
- the squad feels persistent even though the game remains playable

## Success Criteria

This package is working when:

- the stash reads as the real operational backbone of the game
- players know what can enter a raid and why
- recovered haul and weapons create real next-run decisions
- squad loss feels human and persistent without turning into admin overload
- replacement keeps the game playable without erasing the emotional cost
- extraction feels like the thing that turns danger into continuity

## Failure Modes

- stash items are still visually rich but mechanically ambiguous
- the stash becomes a spreadsheet instead of a war room
- replacement is instant and emotionless
- replacement is so slow that the game becomes punishment admin
- body recovery debt is visible in copy but weak in play
- the player cannot tell what any given recovered item is for
