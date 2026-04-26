# Endgame Campaign Finale Implementation Plan

## Purpose

Sequence the work required to turn the campaign into a beatable arc with a final offensive and true escape.

## Source Direction

- [Tactical Squad Extraction North Star](../../TACTICAL_SQUAD_EXTRACTION_NORTH_STAR.md)
- [Endgame Direction](../../ENDGAME_DIRECTION.md)
- [Systemic Reuse And Prefab Rules](../../SYSTEMIC_REUSE_AND_PREFAB_RULES.md)
- [Main Map Tactical Slice Implementation Plan](../main-map-tactical-slice/IMPLEMENTATION_PLAN.md)
- [AI Pressure And Territorial Replayability Implementation Plan](../ai-pressure-and-territorial-replayability/IMPLEMENTATION_PLAN.md)
- [Gun Doctrine Implementation Plan](../gun-doctrine/IMPLEMENTATION_PLAN.md)
- [Stash Normalization And Squad Recovery Implementation Plan](../stash-normalization-and-squad-recovery/IMPLEMENTATION_PLAN.md)
- [Extraction Pressure And Operation Flow Implementation Plan](../extraction-pressure-and-operation-flow/IMPLEMENTATION_PLAN.md)
- [RimWorld Dialogue Campaign Flavor Implementation Plan](../rimworld-dialogue-campaign-flavor/IMPLEMENTATION_PLAN.md)

## Package Boundary

This plan should come after the core campaign systems are real enough that a finale can be earned instead of scripted around their absence.

It should be the last major north-star package to fully activate, because it is the culmination of the rest.

## Why This Order

The endgame must not arrive before the game has something worth ending.

The risk is:

- building a bespoke final mission too early
- forcing the campaign to point at an ending before the loop itself is strong
- solving endgame with scripted exception handling instead of systemic culmination

So the order should be:

1. formalize campaign finale state
2. reveal the final stronghold in a lightweight way
3. prove preparation raids and readiness logic
4. prove the final offensive structure
5. prove true-escape resolution and retry logic

The reuse rule for this plan is:

- build the finale by composing the shared map, AI, weapon, stash, extraction, and dialogue primitives before adding any finale-specific branches

## Milestone 1. Campaign Finale State

### Goal

Give the campaign a real endgame state machine.

### Work

- add a compact campaign finale state
- add a compact final stronghold state
- expose finale readiness and completion in `snapshot`
- define the minimum reveal or lock conditions

### Acceptance

- the campaign can be `locked`, `revealed`, `preparing`, `ready`, `launched`, or `won`
- CLI can inspect whether the finale exists and whether it is available

## Milestone 2. Reveal The Final Stronghold

### Goal

Make the final district a real known target before it becomes a playable victory path.

### Work

- add one stronghold label and identity
- establish its elite enemy reputation in campaign surfaces
- surface that the district exists and is currently too dangerous
- connect that reveal to existing fallout, route, or dialogue surfaces

### Acceptance

- the player can understand that a final stronghold exists
- the player can understand they are not yet ready
- the reveal feels like campaign escalation, not a sudden plot twist

## Milestone 3. Preparation-Raid Interlock

### Goal

Make the finale something the player prepares for through the normal extraction game.

### Work

- define 2-4 reusable preparation outputs:
  - safer lane
  - weaker flank
  - recovered heavy asset
  - improved route intel
- map those outputs into existing campaign, stash, and route systems
- avoid bespoke finale-only prep logic if shared modifiers can represent it

### Acceptance

- preparation raids materially affect readiness
- the player can improve finale odds without needing infinite grind
- prep benefits are readable and not just hidden numbers

## Milestone 4. Final Offensive Proof

### Goal

Build the final offensive as the hardest authored composition of the base game.

### Work

- define the final stronghold district or assault path
- compose the hardest room, trench, crossing, bunker, and extract problems into one operation
- preserve casualty, body-recovery, and extraction pressure truths
- verify that the finale feels like the base game at maximum difficulty, not a genre swap

### Acceptance

- the final offensive uses the same tactical language as the campaign
- the final district is meaningfully harder than normal content
- the player can lose because of tactical failure, not only because of low gear

## Milestone 5. True Escape Resolution

### Goal

Make winning the finale feel categorically different from winning a normal raid.

### Work

- add true-escape resolution state
- add campaign-complete debrief or closure surface
- ensure stash and campaign flow stop behaving like a normal next-run cycle after success
- preserve the possibility of future chapter extension without invalidating the ending

### Acceptance

- success is framed as escaping the war sector
- the player receives closure, not just another payout screen
- the ending feels final for this campaign chapter

## Milestone 6. Failure And Retry Pass

### Goal

Let the finale stay hard without turning it into a dead-end punishment wall.

### Work

- define how finale failure returns the player to campaign prep state
- keep squad and stash consequences real
- ensure failure does not corrupt or trivialize the rest of the campaign loop
- add one showcase for post-failure recoverability

### Acceptance

- the player can fail and try again
- the campaign still feels serious
- the ending remains hard without becoming brittle

## Verification Strategy

Every milestone should be verified in three ways.

### 1. CLI Snapshot

Must expose:

- finale state
- stronghold readiness
- prep progress
- finale launched state
- true-escape completion

### 2. Authored Showcases

Need at least:

- stronghold revealed
- preparation-ready campaign
- final-offensive launch
- finale failure state
- true-escape completion

### 3. Debrief And Closure Proof

Must show:

- the campaign has escalated into a finale
- preparation changed the odds
- the final result is distinct from a normal raid outcome

## Initial Tuning Guidance

- the finale should be hard enough to require preparation but not so gated that players feel forced into grind
- preparation should improve survivability, not guarantee success
- the final stronghold should be tactically denser, not just more crowded
- true-escape framing should be strong and concise
- failure should sting, but not reset the entire campaign fantasy

## Risks

### 1. Bespoke Finale Trap

If the finale works like a separate game mode, it weakens the whole campaign.

Mitigation:

- compose it from shared primitives first

### 2. Gear Gate Without Mastery

If the player wins mostly because they farmed enough gear, the ending becomes flat.

Mitigation:

- make the final district demand real doctrine and command skill

### 3. Endless Preparation

If preparation never feels sufficient, the endgame collapses into grind.

Mitigation:

- set a readable readiness threshold and cap prep value

### 4. Weak Escape Resolution

If the final success screen feels like a normal raid success, the ending fails emotionally.

Mitigation:

- give true escape a distinct campaign-complete state and framing

### 5. No Room For Expansion

If the ending sounds like the universe is over, future maps become awkward.

Mitigation:

- frame the ending as escaping this war sector and finishing this campaign chapter

## First Build Recommendation

If implementation begins immediately, the first concrete build should be:

1. add campaign finale state and stronghold reveal state
2. expose finale readiness in `snapshot`
3. prove one preparation modifier that affects the future final district
4. author one rough final-stronghold district slice using shared map and pressure primitives
5. add one true-escape success read distinct from a normal extract

That is the smallest build that proves the campaign can become finishable without abandoning the systemic game.
