# AAA Knife Combat Implementation Plan

This plan is explicitly scoped to the decoupled `Survivor Walk Test` scene.

The goal is not to add a fake thrown-blade projectile or a ranged surrogate. The goal is to make close knife use feel premium, fast, readable, and violent while staying true to melee contact. Every milestone below is intended to fit in one coding pass.

## Product Intent

- Make the knife feel like a real close-range weapon, not a gun with no ammo.
- Keep all damage application contact-based: no projectile travel, no fake bullet line solving hits for the knife.
- Push the knife toward premium readability through anticipation, contact, hit payoff, and recovery, not through range inflation.
- Keep the work sandbox-first inside `Survivor Walk Test` until a later directive explicitly promotes it into raid runtime.

## Milestone 1. Contact Melee Backbone

Deliver one shared knife-contact runtime for the sandbox.

Required outcome:
- `3 Knife` no longer routes through the generic firearm shot event for hit resolution.
- Knife use creates a dedicated melee event with:
  - wind-up
  - active contact window
  - recovery window
  - contact origin / arc / reach
  - victim hit point
  - hit / miss / kill result
- Damage only applies if the target is inside the short contact solve during the active window.
- The gray aim line and yellow firearm-style projectile read must not be used as the hit authority for knife attacks.

Acceptance bar:
- The sandbox clearly reads knife attempts as melee swings or thrusts.
- Misses are honest.
- Hits happen only at close contact.
- The runtime is structured so later polish can hang off one knife event backbone instead of more special cases.

## Milestone 2. AAA Knife Payoff Pass

Turn the knife backbone into a satisfying premium-feel melee interaction.

Required outcome:
- Add a strong melee presentation stack tied to the knife contact event:
  - anticipatory hand/body commit
  - contact snap
  - short target hit-stun or body shock
  - stronger close-range audio punctuation
  - slash/stab trail or contact smear
  - blood/body impact read where appropriate
  - clearer recovery and reset
- Add near-contact pressure feedback so the player understands when they were in range versus barely short.
- Make kill confirmation feel decisive without turning the knife into an arcade execution button.
- Keep the read grounded in one brutal close-range interaction, not VFX spam.

Acceptance bar:
- Knife hits feel intentional and powerful.
- Misses feel sharp but readable, not vague.
- The player can understand range, commitment, contact, and reset from feel alone.
- The result reads as AAA melee polish inside the sandbox while staying fully non-projectile and close-contact.
