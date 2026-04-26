# Blue Assisted Fire And Casualty Exfil Implementation Plan

## Goal

Ship the full conscious-casualty feature in the smallest clean slices:

- Blue can fire while being assisted or carried
- the boys can extract Blue through the normal exfil system instead of stalling in rescue logic

## Why This Order

The feature crosses combat, rescue, and extraction. The safest order is:

1. generic helper layer
2. player fire integration
3. casualty extraction handoff
4. snapshot and readability
5. showcase verification

That keeps the code simple and prevents the feature from becoming a pile of rescue-specific exceptions.

## Milestone 1: Generic Rescue-Fire Helpers

Add derived helpers in simulation for:

- active player rescue task
- rescue fire mode
- rescue fire profile
- casualty extract active

Acceptance:

- helpers compile cleanly
- no user-facing behavior changes yet

## Milestone 2: Blue Fire While Rescued

Integrate rescue fire into player combat.

Scope:

- allow fire in `assist` and `carry`
- block reload and grenades while rescue-fire is active
- apply rescue spread and cadence penalties
- apply movement penalty to the rescue task when Blue fires

Acceptance:

- Blue can fire while being moved
- movement is still controlled by the rescuer
- firing feels compromised

## Milestone 3: Casualty Exfil Handoff

Integrate the rescue layer with extraction.

Scope:

- detect when a player rescue task is moving to an extract
- auto-start extraction hold when the team reaches the ring
- do not clear the rescue task too early if the destination is the extract

Acceptance:

- the boys can haul Blue into the ring and begin extraction without manual interaction
- the squad no longer feels stuck between rescue and exfil

## Milestone 4: Snapshot And Readability

Expose the feature for agents and players.

Scope:

- add snapshot fields for rescue-fire and casualty extract status
- add short readability labels in Phaser/HUD
- update wiki/manual

Acceptance:

- future agents can inspect the feature via `snapshot`
- the player can tell when Blue is allowed to shoot while being moved

## Milestone 5: Verification

Use CLI-first proof.

Required checks:

- `npm run build`
- `npm run game:cli -- snapshot`
- `npm run game:cli -- showcase --id wounded-soldier`
- `npm run game:cli -- capture --showcase wounded-soldier --path ...`

## First-Pass Tuning

- `assist` fire spread should be bad but useful
- `carry` fire should be worse than `assist`
- firing while rescued should noticeably slow movement
- casualty auto-exfil should prefer finishing the escape over re-engaging for kills

## Main Risks

- Too much special-case logic inside `tryFirePlayerWeapon`
- Extraction auto-start triggering at the wrong times
- Rescue tasks clearing too early or lingering too long
- UI wording becoming debuggy instead of readable
