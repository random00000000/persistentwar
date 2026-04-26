# Gun Doctrine Implementation Spec

## Purpose

Define the implementation baseline and acceptance criteria for weapon families, including the missing handgun, PKM-class weapon, and one endgame-changing class.

This package should deepen weapon identity without taking ownership of map geometry or AI posture.

## Source Direction

- [Tactical Squad Extraction North Star](../../TACTICAL_SQUAD_EXTRACTION_NORTH_STAR.md)
- [Systemic Reuse And Prefab Rules](../../SYSTEMIC_REUSE_AND_PREFAB_RULES.md)
- [Main Map Tactical Slice Implementation Spec](../main-map-tactical-slice/IMPLEMENTATION_SPEC.md)
- [AI Pressure And Territorial Replayability Implementation Spec](../ai-pressure-and-territorial-replayability/IMPLEMENTATION_SPEC.md)

## Package Boundary

This package should tune guns against established spaces and enemy behaviors.

It should not redefine those spaces or behaviors.

## Current Code Baseline

The current weapon baseline is real and already threaded through stash, loadout, squad roles, combat simulation, and route-fit UI.

### Existing Weapon Ladder

In [weapons.ts](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/topdownextractionshooter/src/game/weapons.ts), current `WeaponId` is:

- `none`
- `rifle`
- `smg`
- `shotgun`

Current definitions already expose meaningful tuning surfaces:

- `damage`
- `pellets`
- `spread`
- `fireInterval`
- `range`
- `magazineSize`
- `reserveAmmo`
- `ammoPackAmmo`
- `reloadStyle`
- `moveSpeed`
- `moveSpreadPenalty`
- `recoilPerShot`
- `noiseRadius`
- `noiseScore`

Current named weapons:

- `VKR Rifle`
- `Kite SMG`
- `Morrow Shotgun`

### Existing Doctrine Hints

The codebase already includes early doctrine shaping:

- route-fit scoring in [main.ts](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/topdownextractionshooter/src/main.ts)
- loadout fit and ledger guidance
- CQB room-stack readouts
- brace, reload, control, and armor-profile copy
- squad weapon cycling and default role assignment in [simulation.ts](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/topdownextractionshooter/src/game/simulation.ts)
- weapon-sensitive squad command hold radius, sector watch arcs, suppress profiles, and moving-suppress profiles

This means the package should deepen existing doctrine work, not invent it from nothing.

### Existing Squad Weapon Integration

The simulation already:

- assigns squadmate weapons
- derives squad combat profiles from weapon choice
- changes suppress and sector-watch behavior by weapon
- reflects loadout mix in room and frontage surfaces

That is a strong foundation for turning weapons into squad doctrine.

## Problem Statement

The current ladder is promising but incomplete.

Right now:

- rifle, SMG, and shotgun have meaningful differences
- route-fit and room-CQB guidance already exist

But the product is still missing:

- a handgun as a true backup doctrine tool
- a PKM-class suppression weapon that changes map control
- an endgame-changing weapon class
- a clearer relationship between weapon choice, squad role, and AI pressure outcomes

Without those additions, the extraction-shooter and squad-commander identity remains underpowered.

## Reuse Rule

This package should extend one shared weapon framework and one shared combatant firing model.

It should prefer:

- new weapon-family configuration
- new doctrinal metadata
- new squad-role mappings

over weapon behavior that only one map, one showcase, or one actor type can understand.

## Feature Goals

### 1. Make Weapon Choice Truly Doctrinal

Each weapon family must answer a tactical question.

The player should be able to infer:

- what space it wins
- what space it fears
- what role it gives the boys
- what burden or ammo tax it creates

### 2. Add The Missing Ladder Pieces

The north-star ladder requires:

- `pistol` or equivalent handgun
- `pkm` or equivalent machine gun
- one endgame weapon class

### 3. Strengthen Squad Role Readability

Weapon choice must more strongly affect:

- squadmate role identity
- support-order effectiveness
- suppression profile
- room follow-through profile

### 4. Preserve Existing Good Differentiation

Do not flatten the current useful distinctions between rifle, SMG, and shotgun.

## Weapon Family Matrix

### Handgun

Implementation role:

- backup weapon
- recovery-state sidearm
- cheap insurance

Required traits:

- low raid cost
- fast draw or quick fallback read
- low ammo burden
- weak lane value
- high emergency value at short range

Required interactions:

- should be visible in stash and loadout as a meaningful optional reserve
- should work in compromised or emergency states where a primary is unavailable

### SMG

Current baseline role is valid and should be preserved:

- close room pressure
- fast movement
- short-range aggression

Needs stronger doctrinal lock:

- explicitly better than rifle in room tempo
- explicitly worse than rifle in long-lane stability

### Shotgun

Current baseline role is valid and should be preserved:

- breach and room shock
- devastating at close range
- dangerous to rely on in open ground

Needs stronger doctrinal lock:

- best first-body weapon in interiors
- clearly weak for extended lane control after the breach

### Rifle

Current baseline role is valid and should be preserved:

- general-purpose route weapon
- medium-range lane control
- strongest current anti-plate or frontal discipline option

Needs stronger doctrinal lock:

- make it the most stable baseline answer without making it the best at everything

### PKM-Class Machine Gun

New required family.

Implementation role:

- suppression leader
- trench-lip and window denial
- covering movement anchor
- slower but more oppressive assault support

Required traits:

- high magazine size
- high reserve appetite
- strong sustained suppression profile
- slower mobility and heavier burden
- stronger noise and attention cost

Required interactions:

- should materially improve pinning and covering movement
- should give the squad a visibly different assault profile
- should not feel like a rifle with a bigger mag

### Endgame Weapon Class

New required family.

The exact fantasy can be finalized later, but it must:

- materially change how some operations are planned
- not simply become the strongest all-purpose weapon

Candidate directions:

- designated marksman rifle
- grenade launcher platform
- battle rifle or anti-armor rifle
- breaching or support-specialist weapon

Rule:

- the endgame class must create a different doctrine, not delete doctrine choice

## State Additions

### WeaponId Expansion

Extend `WeaponId` to include at minimum:

- `pistol`
- `pkm`
- `endgame-*` chosen final id

### Weapon Metadata Expansion

The current `WeaponDefinition` is close, but may need additions such as:

- `family`
- `roleLabel`
- `suppressionWeight`
- `armorPressure`
- `burdenWeight`

These fields can remain simulation-facing as long as the player-facing consequence is clear.

### Squad Role Mapping

Replace simple cycle-like assignment with more explicit doctrine mapping.

At minimum:

- default role preference by weapon family
- support-order modifier hooks by weapon family
- squad loadout summary that reads like doctrine, not only inventory

## Behavior Requirements

### Route And Space Fit

Weapons must visibly interact with:

- long lanes
- windows
- room stacks
- bunker mouths
- trench lips
- extraction edges

Examples:

- rifles stabilize long angles
- SMGs and shotguns win room tempo
- PKM anchors suppression and crossing support
- pistols save compromised close fights but do not become primary solutions

### AI Interaction

Weapons must matter against the AI package.

Required relationships:

- suppression-capable weapons should better create pinned states
- close-quarter weapons should better exploit collapsing or routed interiors
- lane weapons should better punish exposed crossings or failed retakes

### Squad Command Interaction

Weapons must matter to squad command execution.

Existing weapon-based command helpers should be deepened so:

- hold radius
- watch arc
- suppress profile
- moving suppress profile

become more legible and more distinct across weapon families.

### Looted Weapon Interaction

Found enemy weapons should become a real doctrine event.

Required first-step support:

- allow a found-weapon opportunity path to affect current run doctrine or next-run stash
- do not let found weapons live only as flavor text

## UI And CLI Requirements

### Existing Surfaces To Reuse

Reuse before expanding:

- loadout bench
- weapon drawer
- route-fit and ledger surfaces
- CQB room-stack loadout read
- squad loadout wedge and roster weapon reads

### Required UI Additions

- sidearm or reserve slot clarity if handgun is introduced
- explicit doctrinal role read for PKM and endgame class
- clearer squad doctrine summary when weapon mix changes

### CLI Requirements

The package must remain testable through CLI and snapshot paths.

Needed visibility:

- current player weapon family
- squad loadout mix
- doctrine summary
- weapon-sensitive suppression or command read
- route-fit comparison

Needed showcase coverage:

- one rifle-dominant lane slice
- one SMG or shotgun room-clear slice
- one PKM suppression slice
- one compromised or fallback sidearm slice

## Acceptance Criteria

The package is complete for the first north-star version when:

- handgun, PKM, and one endgame weapon class exist as distinct doctrine tools
- no weapon family collapses the choice space into one best answer
- rifles, SMGs, shotguns, and PKM all have clearly different best spaces and failure spaces
- the boys’ behavior and command value visibly change with weapon loadout
- UI and CLI surfaces can explain why a weapon is a good or bad fit
- found weapons can matter beyond flavor

## Out Of Scope For This Package

- full attachment or modding tree
- exhaustive ammo-caliber simulation
- full ballistic realism pass
- trader or market economy

Those can come later if they strengthen doctrine instead of obscuring it.

## Risks

- adding guns without adding doctrine
- making PKM just a rifle upgrade
- making pistol purely decorative
- making the endgame class invalidate the rest of the ladder
- overcomplicating stats until the player can no longer read the difference
