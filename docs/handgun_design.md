# Handgun Design Slice

## Goal

Add a holster-side handgun that looks weak on paper but rewards disciplined play, fast swaps, and smart positioning instead of raw DPS.

## Intended Role

- Backup tool for bad reload timing, close peeks, and broken primary plans.
- Cheapest firearm in the stash, but never a dominant all-range answer.
- Skill weapon that pays off calm tracking, braced follow-up shots, and finishing already-damaged enemies.

## Combat Identity

- Low raw damage and poor armor pressure.
- Fast ready time and fast reload.
- Tight first-shot accuracy when the player is stationary or braced.
- Harsh falloff once the player panic-spams or tries to duel rifles across open lanes.

## Stash And Loadout Rules

- Lives in the `Holster` slot and follows the same drag-and-drop gearing flow as the rest of the operator kit.
- Should be staged from the stash wall, not selected through a separate weapon-picker flow.
- Holster state must stay visible in the stash so the player understands whether the raid has a recovery option.

## First Implementation Recommendation

1. Add a true pistol weapon definition and holster swap input.
2. Let the player swap between `On Sling` primary and `Holster` sidearm during raid.
3. Tune the pistol for recovery and cleanup, not room-clearing dominance.
4. Surface the pistol in briefing, stash, and HUD only where it materially helps readability.

## Balance Guardrails

- It should lose prolonged stand-up fights against every primary.
- It should still feel satisfying when used for smart emergency saves.
- It should improve player agency under pressure without collapsing the primary-weapon identity.
