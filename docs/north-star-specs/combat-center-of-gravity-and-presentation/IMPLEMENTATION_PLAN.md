# Combat Center Of Gravity And Presentation Implementation Plan

## Purpose

Sequence the work needed to make the current combat-and-command runtime the explicit center of the product, then strengthen it with hardship, audio, and VFX.

## Source Direction

- [Combat Center Of Gravity Direction](../../COMBAT_CENTER_OF_GRAVITY_DIRECTION.md)
- [Tactical Squad Extraction North Star](../../TACTICAL_SQUAD_EXTRACTION_NORTH_STAR.md)
- [Systemic Reuse And Prefab Rules](../../SYSTEMIC_REUSE_AND_PREFAB_RULES.md)
- [Main Map Tactical Slice Implementation Plan](../main-map-tactical-slice/IMPLEMENTATION_PLAN.md)
- [AI Pressure And Territorial Replayability Implementation Plan](../ai-pressure-and-territorial-replayability/IMPLEMENTATION_PLAN.md)
- [Gun Doctrine Implementation Plan](../gun-doctrine/IMPLEMENTATION_PLAN.md)
- [Stash Normalization And Squad Recovery Implementation Plan](../stash-normalization-and-squad-recovery/IMPLEMENTATION_PLAN.md)
- [Extraction Pressure And Operation Flow Implementation Plan](../extraction-pressure-and-operation-flow/IMPLEMENTATION_PLAN.md)
- [RimWorld Dialogue Campaign Flavor Implementation Plan](../rimworld-dialogue-campaign-flavor/IMPLEMENTATION_PLAN.md)

## Package Boundary

This plan is cross-cutting and should steer the other packages rather than replace them.

It is best treated as:

- a product-alignment pass that becomes active early
- a combat presentation pass that lands after the baseline systems are stable enough to showcase

## Why This Order

The command runtime is already good.

So the goal is not to rebuild combat first.
The goal is to:

1. formalize that the controller and briefing are the main skill ladder
2. prove the game can start harder and poorer
3. make runtime command actions more inspectable
4. add audio and VFX that tell the truth about that runtime

The reuse rule for this plan is:

- presentation should be layered on top of shared combat primitives, not implemented as detached effects or bespoke sequences

## Milestone 1. Direction Lock

### Goal

Make the combat-center-of-gravity direction explicit in project docs and spec scaffolding.

### Work

- add the direction doc
- add the package to the spec stack
- link it from wiki and north-star references

## Milestone 2. Hardcore Start Proof

### Goal

Make the campaign capable of starting from a genuinely poor baseline.

### Work

- expose current starting gear and stash state in CLI
- tune toward a near-empty start baseline
- coordinate with gun and stash packages so low-start gear does not break the campaign

## Milestone 3. Command Runtime Verification

### Goal

Make the existing combat depth easier to prove and tune.

### Work

- add compact CLI reads for selected boy action, suppress state, grenade runtime, and nearby pressure state
- add combat-center showcases around boy frag and suppress runtime

## Milestone 4. Audio Pass

### Goal

Make the combat runtime sound as serious as it already plays.

### Work

- add per-weapon-family discharge identity
- add suppression / snap-by pressure layer
- add grenade lifecycle readability
- add clearer priority rules for combat callouts

## Milestone 5. VFX Pass

### Goal

Make combat state readable and satisfying through truthful visual feedback.

### Work

- add muzzle flash variants by weapon family
- make tracers and impacts easier to read by faction and material
- make suppression and blast reads clearer

## Milestone 6. Cross-Package Alignment Pass

### Goal

Use this package to push the rest of the stack back toward tactical depth where needed.

### Work

- verify map spaces justify current commands
- verify AI uses suppression and lane pressure well enough
- verify gun doctrine changes combat feel
- verify stash scarcity reinforces combat decisions
- verify dialogue still reacts to combat truth instead of replacing it

## Verification Strategy

### CLI Snapshot

Must expose:

- command activity
- tactical-action state
- nearby pressure or suppression state
- starting hardship read

### Showcases

Need at least:

- boy frag runtime
- suppress runtime
- combat presentation
- hardcore-start

### Human Review

Must answer:

- does the game still feel like the command runtime is its main differentiator
- do the other systems now make that runtime matter more

## Risks

- presentation without deeper tactical validation
- hardcore scarcity becoming misery instead of tension
- this package becoming philosophy without implementation leverage

## First Build Recommendation

1. add the combat-center CLI snapshot read
2. add one `boys-frag-runtime` and one `suppression-runtime` showcase
3. expose a compact hardcore-start read
4. add first-pass muzzle flash and tracer differentiation tied to existing weapon and impact state
5. add first-pass gunshot and grenade audio identity
