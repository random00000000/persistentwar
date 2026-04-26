# Gun Doctrine Player Spec

## Purpose

Define the player-facing promise for weapons as tactical doctrine rather than stat flavor.

This package should make the player feel that bringing the right gun, and giving the boys the right guns, changes how an operation is fought.

## Source Direction

- [Tactical Squad Extraction North Star](../../TACTICAL_SQUAD_EXTRACTION_NORTH_STAR.md)
- [Main Map Tactical Slice Player Spec](../main-map-tactical-slice/PLAYER_SPEC.md)
- [AI Pressure And Territorial Replayability Player Spec](../ai-pressure-and-territorial-replayability/PLAYER_SPEC.md)

## Package Boundary

This package should translate map spaces and AI pressure into weapon-role decisions.

It owns:

- weapon family identity
- doctrinal use cases
- squad gun-role clarity

It depends on:

- map geometry being real
- AI pressure being meaningful

It should not own:

- settlement state
- stash persistence
- extraction pacing

## Product Promise

Guns should not feel like:

- linear upgrades
- generic damage sticks
- different recoil skins on the same answer

They should feel like:

- different ways to solve a tactical problem
- different ways to lead the boys
- different ways to risk and win a raid

The player story should sound like this:

- `The rifle owned the long lane, but it was wrong for the second room.`
- `The shotgun made the breach work, but the road after it felt dangerous.`
- `The SMG let me take the block fast, but it got exposed on the crossing.`
- `The PKM changed the whole push because the windows could not contest us cleanly anymore.`
- `The pistol saved the run after the primary went dry.`

## Fantasy Layer

The player should feel that the squad is bringing a real assault package into the district.

Weapon choice should answer:

- who owns long lanes
- who wins the first room
- who pins the trench lip
- who screens the crossing
- who survives when the plan breaks

The guns should support the `me and the boys` fantasy directly.

The player is not just equipping a hero weapon.

They are choosing the squad’s doctrine for this operation.

## Gameplay Layer

Weapon choice should shape:

- entry method
- room tempo
- lane control
- suppression reliability
- armor or plate pressure
- extraction risk
- ammo appetite

The player should naturally think:

- `rifle for the long angle`
- `SMG for aggressive room work`
- `shotgun for the first door and ugly corners`
- `PKM when I want to pin the district open`
- `pistol when I need insurance and recovery options`

## Core Weapon Families

The north-star weapon ladder should become:

- `Handgun`
  Backup survival tool and last-resort room insurance.
- `SMG`
  Fast close-quarters pressure weapon for interior work and aggressive movement.
- `Shotgun`
  Room-breaking and door-winning weapon with real open-ground risk.
- `Core rifle`
  General-purpose lane and medium-range control weapon.
- `PKM-class machine gun`
  Dedicated suppression and lane-denial weapon that changes how assaults and defenses play.
- `One endgame-changing weapon class`
  A late-game doctrinal weapon that materially changes how certain operations are planned.

## Tactical Doctrine Promise

The player should not be choosing weapons by taste alone.

They should be choosing:

- what kind of fight they want to force
- what risks they are willing to take
- what jobs the boys can perform cleanly

Each weapon family should have:

- a best space
- a failure space
- a rhythm
- an ammo burden
- a squad role

## Role By Space

Weapons should map cleanly onto the map package’s spaces.

### Handgun

Best in:

- emergency last-ditch close defense
- ugly compromised interiors
- recovery or casualty moments where the primary is unavailable

Weak in:

- lane control
- trench assault from distance
- outdoor pressure

### SMG

Best in:

- room entry
- short hallways
- fast building pressure
- close follow-through behind the boys

Weak in:

- long crossings
- exposed road fights
- stubborn window contests at range

### Shotgun

Best in:

- first door
- hard corner fights
- stair-step room stacks
- breaking the first defender in a room

Weak in:

- open ground
- long lane re-engagement
- sustained pressure after the first breach

### Rifle

Best in:

- roads
- yards
- outdoor windows
- medium-range support
- steady general-purpose operations

Weak in:

- fastest room tempo
- the first split-second breach shock

### PKM

Best in:

- suppression
- pinning windows and trench lips
- covering movement for the squad
- forcing the enemy to stay small while others move

Weak in:

- fast room entry
- light, low-burden raids
- tight recovery movement if overcommitted

## Relationship To The Boys

Weapons should make squad assignment clearer.

The player should be able to think in squad roles such as:

- rifleman
- breacher
- room pusher
- suppression gunner
- reserve sidearm carrier

The boys should not all feel like mirrored copies of the player.

The squad should read as a small weapon doctrine package.

## Relationship To Extraction

Weapons should change extraction pressure too.

Examples:

- a shotgun-heavy loadout may dominate interiors but make the road to exfil feel tense
- a rifle-centric loadout may keep extractions cleaner but make rooms slower
- a PKM may make the push stronger but create ammo and burden pressure
- a pistol may save a broken extract without being a primary raid plan

## Relationship To Loot

Enemy weapons should feel desirable because they represent doctrine, not only resale value.

The player should sometimes think:

- `it feels like a crime to leave this gun here`

But that decision should stay tactical, not free.

Picking up a found weapon should create:

- opportunity
- loadout disruption
- greed pressure

## Success Criteria

This package is working when players naturally say things like:

- `I brought the wrong gun for this district.`
- `The PKM opened the whole assault.`
- `The shotgun won the room but scared me on the road.`
- `The pistol saved a bad raid.`
- `The boys felt different because their guns changed what they could do.`

## Failure Modes

- weapons collapse into one best answer
- new guns are only more damage or less spread
- the squad still feels weapon-agnostic
- the pistol is decorative
- the PKM is just a stronger rifle
- the endgame weapon is only a bigger number
