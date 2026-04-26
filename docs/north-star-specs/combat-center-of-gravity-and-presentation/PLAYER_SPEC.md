# Combat Center Of Gravity And Presentation Player Spec

## Purpose

Define the player-facing promise for the final cross-cutting package:

- combat and command are the center of gravity of the game
- the existing briefing-and-keys language is the skill ladder
- AI, maps, guns, stash, audio, and VFX must all make that combat layer hit harder

## Source Direction

- [Combat Center Of Gravity Direction](../../COMBAT_CENTER_OF_GRAVITY_DIRECTION.md)
- [Tactical Squad Extraction North Star](../../TACTICAL_SQUAD_EXTRACTION_NORTH_STAR.md)
- [Systemic Reuse And Prefab Rules](../../SYSTEMIC_REUSE_AND_PREFAB_RULES.md)
- [Main Map Tactical Slice Player Spec](../main-map-tactical-slice/PLAYER_SPEC.md)
- [AI Pressure And Territorial Replayability Player Spec](../ai-pressure-and-territorial-replayability/PLAYER_SPEC.md)
- [Gun Doctrine Player Spec](../gun-doctrine/PLAYER_SPEC.md)
- [Stash Normalization And Squad Recovery Player Spec](../stash-normalization-and-squad-recovery/PLAYER_SPEC.md)
- [Extraction Pressure And Operation Flow Player Spec](../extraction-pressure-and-operation-flow/PLAYER_SPEC.md)
- [RimWorld Dialogue Campaign Flavor Player Spec](../rimworld-dialogue-campaign-flavor/PLAYER_SPEC.md)

## Package Boundary

This package owns the product promise that combat and command are the main attraction.

It owns:

- combat-as-identity framing
- command-runtime centrality
- hardcore starting power curve
- audio and VFX support for tactical readability

It does not own:

- map geometry rules by themselves
- AI state machines by themselves
- weapon family tuning by itself

## Product Promise

The player should feel that the best part of the game is not a menu, not a story card, and not broad war fiction.

It should be:

- using a deep controller
- using the boys well
- reading a dangerous battlefield
- surviving through real tactical decisions

The player should say:

- `I can send a boy to frag that position because the command system is real.`
- `I can pin a lane, clear a room, and make it to extract because the game gave me actual verbs.`
- `I started with almost nothing, and now every better gun and every better boy assignment means something.`

## Fantasy Layer

The fantasy is:

- a poor conscript and his boys clawing their way into competence and lethality through repeated tactical survival

Not:

- a fully equipped raid god from minute one

The player should feel the arc from:

- weak and under-equipped

to:

- practiced, dangerous, and doctrinally competent

## Gameplay Layer

The player loop should feel like this:

1. Read the briefing and internalize the key combat language.
2. Enter the raid under-equipped enough that decisions matter.
3. Use the boys and the command verbs to survive tactical spaces.
4. Hear, see, and feel the consequences through strong combat presentation.
5. Extract, rearm, and slowly become more capable.

The skill ladder should not mainly come from hidden RPG growth.

It should come from:

- mastering the controls
- learning when to suppress
- learning when to send a frag
- learning when to brace, push, or leave
- learning how to equip yourself versus your boys

## Code / Simulation Layer

Under the hood, the player should be benefiting from:

- one shared command-and-tactical-action runtime
- one shared friendly combatant model
- one shared pressure and suppression language
- one shared combat feedback layer through tracers, impacts, flashes, and sound

The player should not feel:

- separate combat rules for the player and everyone else

## Existing Strength To Protect

The game already has a real command grammar in the briefing and in combat:

- `Follow`
- `Defend`
- `Attack`
- `Brace lane`
- `Covering move`
- `Quick suppress`
- `Commit suppress`
- `Frag cursor`

This is already deeper than most extraction shooters.

The package rule is:

- do not flatten this language to make the game simpler
- raise the rest of the game to justify it

## Hardcore Opening Promise

The start of the game should feel poor, tense, and slightly humiliating in the right way.

Desired player feeling:

- `I do not have enough gun for this yet.`
- `If I keep the better rifle for myself, one of my boys suffers.`
- `That handgun run was ugly, but we made it out.`

The opening should make the climb into competence emotionally real.

## Audio Promise

Combat audio should help the player understand:

- what is firing
- what is close
- what is suppressive
- when a grenade is about to matter
- when the squad is in real danger

Good player reaction:

- `I could hear the lane getting worse before I fully saw it.`

## Visual Effects Promise

Combat effects should make weapon identity and pressure readable.

The player should be able to feel:

- rifle discipline
- SMG spray violence
- shotgun door violence
- grenade panic
- suppression pressure

without the screen turning into noise.

## Relationship To Other Packages

### Map

The combat package makes map spaces feel worth mastering.

### AI

The combat package makes AI pressure feel like a real opponent to the current command language.

### Guns

The combat package makes weapon doctrine feel visible and audible.

### Stash

The combat package makes poverty, sacrifice, and upgrade feel tactically meaningful.

### Extraction

The combat package makes the final minutes of a raid feel like the hardest exam for the command runtime.

### Dialogue

The combat package gives dialogue something real to remember.

## Success Criteria

- the command system still feels like the deepest thing in the game
- the player can begin under-equipped without the game feeling pointless
- audio and VFX make firefights feel sharper and more legible
- the rest of the product clearly exists to support combat mastery
- players improve mainly through tactical skill and doctrine, not only through accumulation

## Failure Modes

- the player starts too rich and skips hardship
- AI and maps still do not justify the command language
- gun presentation is flat and samey
- grenade, suppression, and lane control feel mechanically deep but theatrically weak
- the game becomes broader instead of deeper
