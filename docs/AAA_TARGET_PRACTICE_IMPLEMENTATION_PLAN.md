# AAA Target Practice Implementation Plan For The Survivor Walk Test

## Goal

Make the decoupled `Survivor Walk Test` feel satisfying to shoot against by turning it into a focused AAA-style target practice scene with readable target behavior, strong hit payoff, and stable re-check loops.

This plan is intentionally split into **six milestones**, with the expectation that each milestone is one focused coding pass. The order matters. Early milestones establish the target runtime and feedback contract that later polish depends on.

## Product Intent

In the test scene, the player should feel:

- there is always something worth shooting at
- targets react clearly and satisfyingly when hit
- different guns create different target-practice experiences
- target destruction feels premium, not placeholder
- the scene supports repetition, comparison, and skill checks instead of one-off curiosity
- the sandbox is good enough to judge controller feel, aim feel, and weapon read together

This is not a combat-AI plan. It is a **target-practice satisfaction** plan for the sandbox scene.

## Constraints

- Keep this work scoped to the decoupled `Survivor Walk Test`.
- Do not couple target-practice logic into live raid systems unless a later directive explicitly promotes it.
- Preserve top-down readability.
- Favor player-facing satisfaction over menu/UI expansion.
- Every milestone should leave the sandbox in a playable state by itself.

## Milestone 1. Target Runtime Backbone

### Objective

Turn the current ad hoc targets into a reusable target-practice runtime with explicit target types and lifecycle.

### Deliver

- define one shared target state payload for sandbox targets
- support spawn, idle, hit, down, reset, and respawn timing through that runtime
- separate target identity from scene placement so later passes can add waves, drills, or moving targets cleanly
- remove any one-off target assumptions from the current hardcoded scene logic

### Success Bar

- targets are managed by one stable system instead of scattered local flags
- future milestones can add new target behaviors without rewriting the scene loop

## Milestone 2. Satisfying Hit Reactions

### Objective

Make every hit feel like it landed.

### Deliver

- stronger nonlethal hit flinch and lethal collapse reads
- weapon-aware hit emphasis so junk guns, rifles, and marksman shots do not all feel identical
- clearer target flash, recoil, and death timing
- tune target feedback so fast follow-up fire still reads cleanly

### Success Bar

- even one shot into a target feels acknowledged
- lethal hits feel more final than chip hits
- the player can immediately tell whether they barely clipped, landed center mass, or dropped the target

## Milestone 3. Target Practice Layout And Flow

### Objective

Turn the sandbox into a better target-practice course instead of three static props in a field.

### Deliver

- create one or two deliberate practice layouts inside the scene
- include near, mid, and longer-range target placements
- add simple cover, lane, or spacing logic so targets read like a usable drill
- make the practice space support weapon comparison and movement while shooting

### Success Bar

- the scene feels like a usable practice bay
- different weapons create different solve patterns across the same layout
- the player can naturally repeat a drill without hunting for content

## Milestone 4. Moving And Timed Target Behaviors

### Objective

Add a higher-skill practice layer beyond static targets.

### Deliver

- add at least one moving target behavior
- add at least one timed pop-up or brief exposure behavior
- keep motion readable in top-down without turning the scene noisy
- make target timing support snap shooting, tracking, and lead judgment

### Success Bar

- the player can practice both static precision and live tracking
- the scene rewards better aim and timing instead of only repeated clicking

## Milestone 5. Score, Drill, and Reset Loop

### Objective

Make the sandbox worth replaying.

### Deliver

- add a lightweight score or drill result loop
- include simple measures like hits, misses, time, streak, or clean clears
- add one quick restart flow for repeating the same drill immediately
- keep the loop readable and fast so it supports feel testing, not menu friction

### Success Bar

- the player can run the same drill repeatedly and compare results
- the test scene starts feeling like a real practice tool instead of a one-minute novelty

## Milestone 6. Final AAA Target Practice Polish

### Objective

Push the whole target-practice stack into a premium, satisfying, regression-safe state.

### Deliver

- tune target runtime, hit reactions, layout, motion, and score loop together
- remove any target behaviors that muddy weapon readability
- tune junk guns so practice still feels rough in the right way, not broken
- tune premium guns so target destruction feels expensive without becoming cluttered
- add one or two stable target-practice states specifically for future regression checks
- document the supported target-practice tuning surfaces for future agents

### Success Bar

- shooting targets feels cohesive and repeatable
- the sandbox is useful both for player enjoyment and future gun-feel verification
- future agents can keep improving target practice without destabilizing the scene

## Recommended Build Order

1. Milestone 1 first, no exceptions.
2. Milestone 2 next, because hit payoff is the core of satisfaction.
3. Milestone 3 before motion, so movement sits on a real practice layout.
4. Milestone 4 after static drills already feel good.
5. Milestone 5 once the player has enough target variety to care about scoring.
6. Milestone 6 only after the previous five are individually stable.

## Regression Risks

- adding more targets but reducing readability
- making moving targets annoying instead of skillful
- over-polishing death reactions until they obscure aim feedback
- turning the sandbox into a score screen instead of a feel lab
- creating drills that favor one weapon so hard that comparison stops being useful

## Verification Expectations

Each milestone should finish with:

- a build pass
- one direct runtime check in the `Survivor Walk Test`
- one documented note in the wiki
- at least one stable way to re-check the new target behavior later

## Immediate Next Step

Start with **Milestone 1. Target Runtime Backbone** in the `Survivor Walk Test`.
