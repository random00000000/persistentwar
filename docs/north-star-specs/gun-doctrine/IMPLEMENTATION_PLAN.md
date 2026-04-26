# Gun Doctrine Implementation Plan

## Purpose

Sequence the work required to make weapons feel doctrinally distinct without breaking the current combat baseline.

## Source Direction

- [Tactical Squad Extraction North Star](../../TACTICAL_SQUAD_EXTRACTION_NORTH_STAR.md)
- [Systemic Reuse And Prefab Rules](../../SYSTEMIC_REUSE_AND_PREFAB_RULES.md)
- [Main Map Tactical Slice Implementation Plan](../main-map-tactical-slice/IMPLEMENTATION_PLAN.md)
- [AI Pressure And Territorial Replayability Implementation Plan](../ai-pressure-and-territorial-replayability/IMPLEMENTATION_PLAN.md)

## Package Boundary

This plan should follow after the map and AI packages are stable enough to give weapon roles something real to solve.

## Why This Order

The project already has a usable weapon baseline.

The risk is jumping straight to a larger ladder before the doctrine surfaces and verification paths are ready.

So the order should be:

1. formalize doctrine against current weapons
2. add the missing ladder pieces one by one
3. deepen squad-role impact
4. only then add the endgame class

The reuse rule for this plan is:

- extend the shared weapon and combatant framework first
- avoid adding weapon behavior that only one map, one NPC subtype, or one showcase understands

## Milestone 1. Lock The Current Doctrine

### Goal

Turn the current rifle/SMG/shotgun baseline into explicitly owned doctrine rather than implicit feel.

### Work

- formalize doctrinal role reads for rifle, SMG, and shotgun
- tighten route-fit and room-fit language
- ensure squad loadout summaries reflect current weapon identity cleanly
- identify which current weapon behavior gaps are metadata or tuning gaps rather than new system gaps
- expose doctrine read in CLI and snapshot surfaces where missing

### Acceptance

- current ladder is clearly readable in UI and CLI
- rifle, SMG, and shotgun each have a clear best space and failure space

## Milestone 2. Add Handgun

### Goal

Introduce a real backup sidearm instead of leaving close-range recovery to the primary-only ladder.

### Work

- add `pistol` weapon family and stats
- add stash/loadout support for sidearm reserve
- support fallback or compromised-state handgun use
- add one showcase proving pistol value without making it primary doctrine

### Acceptance

- pistol is meaningful
- pistol is not a primary raid answer

## Milestone 3. Add PKM-Class Weapon

### Goal

Introduce the weapon that most strongly changes suppression and lane control.

### Work

- add `pkm` weapon family and stats
- create stronger sustained suppression profile than rifle
- deepen command and support-order interaction for PKM
- add one showcase proving that PKM changes how a crossing, window, or trench push is solved

### Acceptance

- PKM visibly changes pinning and covering movement
- PKM has clear movement, burden, or ammo tradeoffs

## Milestone 4. Deepen Squad Doctrine

### Goal

Make weapon choice change the boys, not only the player.

### Work

- map squad roles more explicitly to weapon families
- make squad order payoff and sector-watch readouts more weapon-aware
- expose clearer squad doctrine summaries

### Acceptance

- the boys feel tactically different under different weapon mixes
- squad doctrine reads clearly in stash and raid surfaces

## Milestone 5. Add Endgame Weapon Class

### Goal

Add one late-game doctrinal weapon that changes planning without flattening the ladder.

### Work

- choose final endgame family
- add weapon definition and tactical role
- add route-fit and squad-role integration
- prove one operation where it changes the plan in a distinct way

### Acceptance

- the endgame class creates a new doctrine
- it does not obsolete rifle, SMG, shotgun, PKM, or pistol

## Milestone 6. Looted Weapon Pass

### Goal

Make found enemy weapons a real doctrinal temptation.

### Work

- connect found-weapon opportunities to current-run or next-run doctrine
- surface why a found weapon is interesting
- keep the decision risky and readable

### Acceptance

- found weapons matter as more than flavor
- looting them can create a meaningful decision

## Verification Strategy

Every milestone should be verified in three ways:

### 1. CLI Snapshot

Must expose:

- player weapon family
- squad weapon mix
- doctrine summary
- route-fit read

### 2. Authored Showcases

Need at least:

- long-lane rifle slice
- CQB room slice for SMG or shotgun
- PKM suppression slice
- handgun recovery or compromised slice
- endgame-weapon proof slice once added

### 3. Debrief And Ledger Proof

Must show:

- weapon fit
- stash swing or result impact
- whether the chosen weapon was a good fit for the route

## Initial Tuning Guidance

- keep rifle as the stable baseline
- keep SMG and shotgun clearly superior only in their intended spaces
- keep PKM powerful but expensive in mobility, noise, or ammo burden
- keep pistol valuable mainly as insurance
- keep the endgame class narrow and expressive

## Risks

### 1. Ladder Collapse

If one weapon family becomes the best answer everywhere, doctrine dies.

Mitigation:

- keep explicit best-space and failure-space tuning

### 2. Feature Creep Into Modding

The package could balloon into attachments, calibers, and weapon sim complexity.

Mitigation:

- focus on doctrinal identity first

### 3. Squad Still Feels Flat

If the player weapon changes but the boys do not, the package underdelivers.

Mitigation:

- force squad-role integration by Milestone 4

### 4. PKM Or Endgame Weapon Breaks The Economy

If the new weapons are only more powerful, they distort stash and route balance.

Mitigation:

- tune burden, noise, ammo appetite, and fit, not only damage

## First Build Recommendation

If implementation starts immediately, the first concrete build should be:

1. formalize doctrine language for rifle, SMG, and shotgun
2. add handgun
3. add PKM
4. prove one rifle slice, one room slice, and one suppression slice

That build should stay inside the shared weapon framework rather than introducing bespoke weapon-only branches.

That is the smallest build that makes the weapon package feel materially closer to the north star.
