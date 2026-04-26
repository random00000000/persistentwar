# Blue Assisted Fire And Casualty Extraction Spec

## Purpose

Turn a great emergent moment into an intentional combat feature:

- Blue gets wounded or goes down
- the boys take over movement and try to extract him like a real player would
- Blue can still return limited fire in the right casualty state
- the squad does not get stuck because `carry rescue` and `normal extract logic` are fighting each other

This is not a revive perk. It is a desperation-state squad fantasy.

## Product Promise

When Blue is too hurt to move cleanly, the raid should not instantly become over. The boys should try to save him, fight the chase, and haul him to exfil. If Blue is still conscious, he should be able to instinctively cover the boys with degraded fire while they move him.

The player story should sound like this:

- "I was hit bad, the boys dragged me out, and I was still shooting over their shoulder."
- "Rook kept me on my feet while Makar screened the lane."
- "We were not playing normal anymore. We were surviving the pull."

## Three Layers

### Fantasy Layer

Blue is wounded, half-lucid, and still trying to protect his people while they protect him.

The boys are not reviving a hero back to full power. They are trying to get their squad leader home under pressure.

### Gameplay Layer

Blue loses normal movement and normal combat control, but not all agency.

The squad dynamically shifts from assault doctrine into casualty extraction doctrine:

- one boy helps Blue move or carries him
- another boy screens, suppresses, or peels the chase
- Blue can sometimes shoot while being assisted
- the squad tries to extract using the same kind of pathing and threat judgment a normal player would use

### Code / Simulation Layer

The simulation must distinguish:

- Blue's casualty state
- Blue's consciousness and fire eligibility
- the current rescue mode: `stabilize`, `assist-walk`, `single-carrier`, `two-man carry`, `body-carry`
- whether the squad is still in local rescue mode or has committed to a full extraction route

## Core Design Insight

Two systems are related but should not be treated as the same thing:

1. `Casualty Handling`
   Blue is wounded/downed, the boys stabilize him, get him upright, or carry him.

2. `Extraction Behavior`
   Once the boys decide "we are leaving with Blue," they should run a proper exfil behavior instead of hovering in place around the casualty interaction.

If those are blended into one vague rescue action, the squad gets stuck. They keep trying to complete a body interaction instead of transitioning into a real escape plan.

So the intended flow is:

`hit -> wounded/downed -> stabilize -> assist/carry -> commit exfil -> move like a real extraction team`

## State Model

Blue should be split into these practical combat states:

### 1. Wounded

- Blue still self-moves
- Blue still fires normally, but with wound penalties
- Blue can self-extract

### 2. Downed Conscious

- Blue cannot self-move
- Blue can issue reduced orders
- Blue cannot fight effectively from the floor
- this is the handoff point into squad rescue

### 3. Assisted-Walk

- one boy helps Blue move
- Blue is conscious and upright enough to return limited fire
- Blue can still aim and shoot, but badly
- this is the best state for the "instinctively shooting while being hauled out" fantasy

### 4. Single-Carrier Critical

- one boy is hard-carrying Blue
- Blue may still be conscious, but is far less stable
- Blue can only fire in a much worse form than `assisted-walk`
- ideally pistol-only or extreme hipfire if primary-fire support feels too strong

### 5. Two-Man Carry

- the squad commits more bodies to hauling Blue
- Blue has little or no combat agency
- this is for truly bad states and heavy pressure

### 6. Dead Carry

- no combat agency
- only body recovery and extraction consequence remain

## Assisted Fire Rules

Blue should not either "shoot normally" or "not shoot at all." The right answer is degraded, state-dependent fire.

### Assisted-Walk Fire

Allowed:

- limited primary fire
- short suppressive bursts
- player aims and shoots

Restricted:

- severe spread and recoil instability
- slower fire cadence
- reduced sight picture or narrower effective arc
- no reload while moving
- no grenades
- firing slows the assist movement briefly

### Single-Carrier Fire

Allowed:

- very weak emergency return fire
- best fit is pistol-only or terrible hipfire

Restricted:

- no reload while being carried
- no grenades
- strong spread and aim wobble
- carrier speed drops when Blue fires

### Two-Man Carry / Dead Carry

Not allowed:

- no firing
- no fake combat agency

## Why This Is Fun

This adds:

- a real push/pull between covering fire and escape speed
- a memorable battlefield story
- a strong "me and the boys" payoff
- degraded agency instead of binary fail state

It also creates mastery:

- better players know when to fire and when to stay quiet
- better players know when to order `keep moving`, `set me down`, or `screen left`
- better players read whether the squad should attempt `assisted-walk` or commit to hard carry

## Squad Extraction Doctrine

When Blue is in a carry or assist state, the boys should try to extract with him the way a good human player would.

That means:

- prefer the already-focused extract if it is still viable
- otherwise choose the safest reachable exfil, not the closest by distance only
- value short clean routes over greedy detours
- avoid re-entering hot loot pockets once casualty extraction is live
- let one boy commit to movement and another to screening when possible

The squad should behave like a casualty extraction team, not a normal assault wedge.

### Extraction Doctrine Priorities

1. keep Blue alive
2. keep the carrier alive
3. keep at least one screener active
4. reach exfil
5. preserve extra loot only if it does not break the casualty pull

## Anti-Stuck Rule

This is the main engineering-design rule for the bug you saw.

Once Blue rescue graduates from `local body handling` into `movement toward exfil`, the squad must leave the rescue-interaction loop and enter a distinct `casualty extract mode`.

That mode should:

- own the current destination
- own the movement leash
- suppress idle regroup behavior
- suppress normal attack re-anchoring unless a stop-and-fight threshold is crossed
- hand off cleanly into the existing exfil hold once the team reaches the extraction area

The boys should not keep re-deciding whether to stabilize Blue if Blue is already being moved.

## Orders While Being Assisted

Blue should still retain reduced command authority.

Good reduced-order set:

- `keep moving`
- `set me down`
- `hold here`
- `screen left`
- `screen right`
- `smoke the lane` later, if smoke exists

These are high-value, low-complexity commands that fit the wounded fantasy.

Blue should not have full squad micromanagement while being carried.

## Readability And Feedback

The player should understand the casualty pull instantly from the map.

### Permanent Readability

- squad roster tags: `WOUNDED`, `DOWN`, `ASSIST`, `CARRY`
- Blue state banner: `ASSISTED`, `CARRIED`, `CRITICAL`
- exfil board callout when casualty extract mode is active

### Transient Feedback

- `ROOK HAS BLUE`
- `MAKAR SCREENING`
- `BLUE FIRING FROM ASSIST`
- `SETTING BLUE DOWN`
- `EXFIL COMMITTED`

These should be short-lived battlefield callouts, not debug overlays.

## Tuning Rules

Start conservative.

- `assisted-walk` should feel powerful emotionally, not mechanically overpowered
- `single-carrier fire` should be barely viable under pressure
- the squad should choose extraction more often than re-engagement once Blue is in carry state
- firing while assisted should buy survival sometimes, but also create real risk by slowing escape

## Success Criteria

The feature is working when:

- Blue can be wounded, helped, and extracted without instant hard fail
- the boys transition from rescue into actual exfil behavior without getting stuck
- Blue can still shoot in the correct assisted state
- that shooting feels desperate and compromised, not normal
- players naturally tell stories about being hauled out under fire

## Explicit Distinction For Future Implementation

If future agents touch this system, keep this separation:

- `Rescue System`
  Handles stabilize, assist, carry, and casualty state transitions.

- `Casualty Exfil System`
  Handles route choice, movement commitment, screen assignment, extraction ring behavior, and exfil completion while Blue is being moved.

They should interlock, but they should not be the same state machine.
