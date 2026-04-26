# Gulag Duel Implementation Plan

This plan is explicitly scoped to a new decoupled front-door scene, not the live raid runtime.

The goal is to create a self-contained `Gulag Duel` test scene where the player fights one AI opponent using the same survivor-character presentation stack as the `Survivor Walk Test`. The point is to prove a stylish, readable top-down duel loop with reusable player/enemy actor tech before promoting any of it into raid gameplay.

Each milestone below should fit in one coding pass.

## Product Intent

- Add a new dedicated front-door scene with its own main-menu button.
- Reuse the survivor test character stack for both player and enemy so the duel looks like two real operators, not a target dummy and a player.
- Keep it sandbox-first and decoupled from raid logic.
- Offer three selectable difficulties so the scene can work both as a fun duel and as a controllable AI lab.
- Prioritize readable gunfights, strong presentation, and a clean repeat loop.

## Milestone 1. Scene Shell And Menu Entry

Create the new scene and route to it from the main menu.

Required outcome:
- Add a `Gulag Duel` button to the front door.
- Add a dedicated page/panel for the scene.
- Stage a simple combat pocket with player spawn, enemy spawn, duel bounds, and minimal HUD.
- Keep the scene fully decoupled from raid runtime and stash runtime.

Acceptance bar:
- The scene opens from the menu.
- The player can spawn into it reliably.
- It is clear this is a separate duel sandbox, not a hacked-over raid.

## Milestone 2. Shared Character Stack

Make both sides use the same survivor-character presentation pipeline.

Required outcome:
- Reuse the `Survivor Walk Test` actor stack for the player.
- Render the enemy using the same frame-ring system, same weapon/body readability model, and same shot-feel presentation family.
- Support at least one clear enemy visual distinction without changing the core rig (for example armband/team tint).

Acceptance bar:
- Player and enemy both look like the same character family.
- Enemy no longer reads like a placeholder target or abstract marker.
- Shooting silhouettes stay readable for both sides.

## Milestone 3. Duel AI Backbone

Implement the first real duel AI.

Required outcome:
- Enemy can acquire the player, face the player, move with intent, and fire back.
- AI uses line-of-sight, basic cover/spacing behavior, and a short combat state machine.
- Enemy should not just rush in a straight line or stand still forever.
- AI should be readable enough that the player can understand whether it is pressuring, settling, or repositioning.

Acceptance bar:
- The AI can complete a basic duel end-to-end.
- It looks like an opponent, not just an auto-turret.
- The enemy is using the same gun/shot character family as the player-facing sandbox.

## Milestone 4. Difficulty Selection

Add three selectable duel difficulties.

Required outcome:
- Support `Easy`, `Standard`, and `Hard`.
- Difficulty should change behavior quality, not just raw health.
- Good tuning levers include:
  - reaction delay
  - settle time
  - pressure willingness
  - spacing discipline
  - aim stability
  - burst control

Acceptance bar:
- The three modes are easy to choose.
- They feel meaningfully different.
- `Hard` feels like a real duel test instead of only inflated stats.

## Milestone 5. Round Flow And Win/Lose Loop

Turn the duel into a stable repeatable mode.

Required outcome:
- Add round start, round end, reset, and replay flow.
- Surface clear `won / lost / rerun` state.
- Keep the scene quick to rerun from failure.
- Preserve the selected difficulty and basic setup between reruns.

Acceptance bar:
- The duel is fast to iterate on.
- It can be used as a real test mode, not only a one-off spectacle.
- The loop makes repeated AI tuning practical.

## Milestone 6. Final AAA Duel Polish

Push the scene from functional to impressive.

Required outcome:
- Tighten presentation, readability, and duel pressure.
- Add stronger intro/readout polish, better kill confirmation, and more satisfying reset flow.
- Make the enemy’s shared-character shooting look premium enough that the scene sells the “same actor tech on both sides” idea immediately.
- Keep the result contained and regression-safe inside the sandbox scene.

Acceptance bar:
- The scene feels like a polished duel lab.
- The enemy using the same survivor-character pipeline feels like a feature, not a compromise.
- The front door now has a strong new experiment worth reusing later.
