# RimWorld Dialogue Campaign Flavor Implementation Plan

## Purpose

Sequence the work required to deepen dialogue without making it carry the tactical layer by itself.

## Source Direction

- [Tactical Squad Extraction North Star](../../TACTICAL_SQUAD_EXTRACTION_NORTH_STAR.md)
- [Systemic Reuse And Prefab Rules](../../SYSTEMIC_REUSE_AND_PREFAB_RULES.md)
- [RimWorld Dialogue Campaign Flavor Player Spec](./PLAYER_SPEC.md)
- [RimWorld Dialogue Campaign Flavor Implementation Spec](./IMPLEMENTATION_SPEC.md)
- [Main Map Tactical Slice Implementation Plan](../main-map-tactical-slice/IMPLEMENTATION_PLAN.md)
- [AI Pressure And Territorial Replayability Implementation Plan](../ai-pressure-and-territorial-replayability/IMPLEMENTATION_PLAN.md)
- [Stash Normalization And Squad Recovery Implementation Plan](../stash-normalization-and-squad-recovery/IMPLEMENTATION_PLAN.md)
- [Extraction Pressure And Operation Flow Implementation Plan](../extraction-pressure-and-operation-flow/IMPLEMENTATION_PLAN.md)

## Package Boundary

This plan should come after the core tactical and consequence packages are real enough that dialogue can react to them instead of compensating for them.

It should remain tightly tied to existing story-pack tooling and showcase verification rather than expanding into a standalone narrative system.

## Why This Order

The project already has the seed of its best flavor layer.

The risk is not that dialogue is absent. The risk is:

- it drifts away from the new product identity
- it becomes too loud
- it starts covering for tactical gaps

So the order should be:

1. lock the hook and story-family rules
2. deepen tactical-reaction families
3. deepen campaign-memory families
4. preserve quiet-life beats
5. tighten stash and debrief flavor cohesion

The reuse rule for this plan is:

- expand through shared story families, hooks, and memory tags before adding custom one-off writing branches

That keeps dialogue grounded in the game that exists.

## Milestone 1. Hook And Story-Family Alignment

### Goal

Make the authoring model clearly match the north-star product.

### Work

- define recommended story-family categories
- document hook expectations for each family
- map current dialogue surfaces onto shared hook families before adding new bespoke flavor
- align story-pack scaffold usage with the new tactical squad extraction identity
- identify weak or legacy story families that no longer fit cleanly

### Acceptance

- an agent can scaffold a new story pack that clearly fits the product
- story-family categories are easy to reason about
- the package has explicit guardrails against chatter replacing tactics

## Milestone 2. Tactical Reaction Pass

### Goal

Make live dialogue react better to the core tactical verbs.

### Work

- expand short combat and route-recognition lines for:
  - pinning
  - collapse
  - bad-lane recognition
  - route turning
  - hot exfil
  - casualty pull
- ensure delivery stays short and sparse enough for combat readability
- verify at least one trench, room, and exfil reaction family

### Acceptance

- tactical lines feel specific to the situation
- combat readability is not harmed
- the squad sounds like they are reading the fight, not narrating it

## Milestone 3. Campaign Memory Pass

### Goal

Make repeated places, losses, and recoveries feel remembered.

### Work

- add or expand story families for:
  - returning to bad ground
  - district flip memory
  - body debt
  - body recovered
  - chair handoff
  - repeated extract patterns
- ensure memory tags and route history can support those lines
- verify one return-to-route memory showcase

### Acceptance

- the same route can feel different because it is remembered
- losses and recoveries have human carryover
- the campaign sounds persistent without needing long exposition

## Milestone 4. Quiet Life And Contrast Pass

### Goal

Preserve the slower human side of the war.

### Work

- deepen coffee, bunker, civilian-window, and search chatter families
- keep delivery subtle and contrast-driven
- ensure quiet-life beats still fit the tactical extraction product

### Acceptance

- the game still has room to breathe
- quiet beats enrich rather than distract
- contrast between calm and violence becomes part of the product identity

## Milestone 5. Stash, Memorial, And Debrief Cohesion

### Goal

Make the post-raid campaign layer feel like one human aftermath surface.

### Work

- align memorial wall tone, handoff board tone, war-log tone, and campaign fallout tone
- deepen language around family calls, wakes, replacement chairs, and remembered routes
- make sure these surfaces sound like the same campaign voice without flattening personality

### Acceptance

- memorial and handoff surfaces feel emotionally coherent
- debrief war-log and fallout reads support the same campaign identity
- the stash feels inhabited by consequence

## Milestone 6. Verification And Expansion Pass

### Goal

Only after the core flavor loop works, broaden story variety carefully.

### Work

- add one or two additional story families where the current hooks prove strong
- add more showcase coverage for downtime and route memory
- refine repetition control and delivery spacing

### Acceptance

- additional writing deepens identity instead of raising noise

## Verification Strategy

Every milestone should be verified in three ways.

### 1. CLI Story-Pack Workflow

Must prove:

- `story-pack list` remains usable
- `story-pack scaffold` produces north-star-aligned stubs
- story families can be added without touching resolver code unnecessarily

### 2. Authored Showcases

Need at least:

- war-beat focus
- body recovery
- memorial wall
- field coffee or burner coffee
- hostile lane chatter
- one return-memory showcase if added

### 3. Snapshot And Surface Proof

Must show:

- dialogue memory tags where useful
- debrief war-log cohesion
- memorial and handoff tone cohesion
- operation-state or route-state flavor where appropriate

## Initial Tuning Guidance

- prefer fewer stronger lines over large bark libraries
- repeat a few identity-building phrases rather than forcing endless novelty
- keep combat delivery short
- let downtime delivery breathe
- preserve silence as part of the pacing

## Risks

### 1. Dialogue Overreach

If dialogue starts carrying gameplay clarity, the package is masking deeper problems.

Mitigation:

- keep the rule that dialogue reacts to tactical truth only

### 2. Noise Creep

If every event gets a line, the player will tune the squad out.

Mitigation:

- bias toward restraint and contrast

### 3. Tonal Flattening

If all surfaces sound authored by the same neutral voice, the squad stops feeling human.

Mitigation:

- keep light personality differentiation and surface-specific tone

### 4. Content Sprawl

If story families multiply without hook discipline, authoring will become incoherent.

Mitigation:

- lock hook categories first

### 5. Campaign Memory Without Payoff

If routes and losses are tracked but rarely acknowledged, the system will feel hollow.

Mitigation:

- prioritize a few strong remembered-route and memorial families early

## First Build Recommendation

If implementation begins immediately, the first concrete build should be:

1. document the north-star story-family categories
2. scaffold one new remembered-route family and one hot-exfil reaction family
3. verify one memorial and handoff cohesion pass
4. preserve one coffee or bunker quiet-life pass
5. add one compact snapshot or showcase proof for dialogue memory tags

That build should prove that new flavor can be authored by reusing the story-pack workflow and hook grammar rather than by editing resolver logic for each case.

That is the smallest build that proves dialogue is enriching the tactical campaign instead of sitting beside it.
