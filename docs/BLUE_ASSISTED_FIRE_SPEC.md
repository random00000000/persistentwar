# Blue Assisted Fire Spec

## Purpose

Preserve the exact feeling the player found in combat:

- Blue is badly hurt
- the boys are moving him
- enemies are still chasing
- Blue instinctively tries to shoot back and cover the pull

This feature is about letting Blue remain emotionally and tactically present while his agency is degraded.

## Product Promise

If Blue is still conscious while being helped out of the fight, he can sometimes return limited fire. It should feel desperate, unstable, and costly, not like normal shooting.

## Fantasy Layer

Blue is not a dead weight yet. He is bleeding, being hauled out, and still trying to keep the boys alive.

The player fantasy is:

- "I was half-carried and still shooting over their shoulder."
- "The boys had me, but I was still in the fight."
- "We survived because I bought them one more second while they dragged me."

## Gameplay Layer

Blue gets partial combat agency in specific rescue states.

Allowed states:

- `assisted-walk`
- `single-carrier critical` in a weaker form

Disallowed states:

- `downed on the floor`
- `two-man carry`
- `dead carry`

The player still aims and fires, but does not control movement.

## State Rules

### Assisted-Walk

- one boy helps Blue stay upright
- Blue can fire his primary
- spread, recoil, and cadence are much worse
- reloads are disabled while moving
- grenades are disabled
- firing briefly slows the assist movement

This is the main state that should preserve the great moment you described.

### Single-Carrier Critical

- one boy is hauling Blue more aggressively
- Blue can only fire in a much worse emergency form
- best default: pistol-only or severe hipfire restrictions
- firing should heavily tax movement

### Two-Man Carry

- no firing
- this state is about extraction survival, not combat heroics

## Design Rules

- Blue should never shoot at full effectiveness while being moved by someone else.
- Blue should never reload cleanly while being assisted or carried.
- Blue should never throw grenades while being assisted or carried.
- Blue firing must create a tradeoff by slowing or destabilizing the rescue.
- the rescuer AI can override Blue's firing request if survival requires movement first

## Why This Is Fun

This adds:

- emotional intensity
- a visible degraded-control state instead of binary fail
- real tension between `cover them` and `keep moving`
- a memorable squad story

It also creates mastery:

- knowing when to shoot and when not to
- knowing when to ask to be set down
- knowing when suppressive fire is worth the movement penalty

## Readability

The player should understand why Blue can or cannot shoot.

Required feedback:

- `ASSISTED FIRE` when Blue is in the allowed state
- `NO FIRE` when carry state forbids shooting
- short transient callouts like `ROOK HAS BLUE`, `BLUE FIRING`, `SETTING HIM DOWN`

## Success Criteria

- the player can fire while being assisted in the correct state
- the firing feels unstable and compromised
- the player cannot mistake this for normal combat control
- the system reliably creates the "I was still fighting while being dragged out" story

## Main Risks

- If Blue shoots too well, the state becomes overpowered.
- If Blue cannot shoot in the right state, the fantasy is lost.
- If the penalties are unreadable, the feature feels inconsistent instead of dramatic.
