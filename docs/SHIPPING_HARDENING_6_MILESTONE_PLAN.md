# Shipping Hardening 6 Milestone Plan

Date: 2026-04-26

## Purpose

This sprint is not for adding a bigger war. It is for turning the current `Frontline Officer` slice into something a new player can enter, understand, test, and replay without the game feeling like a developer sandbox.

The shippable target is one readable Russian-side playable town where the player can understand:

`This is my camp, this is the enemy camp, these are my soldiers, this is what I can build, this is why the line held or failed, and this is how I try again.`

## Milestone 1: First-Minute Tutorialization

Goal: make the first minute legible without explaining the whole game.

Work:

- Add a subtle first-run objective rail for the Russian player side.
- Label the Russian camp, Ukrainian enemy camp, current front, and available build tools clearly.
- Give the player one immediate useful action: place a trench or open build tools.
- Add short battlefield prompts for `Build`, `Priorities`, `Inspect Soldier`, and `Objective`.
- Keep prompts small and dismissible. Do not cover the battlefield.

Acceptance:

- A new player can identify their camp within 5 seconds.
- A new player can find the build menu within 15 seconds.
- A new player can place or preview a trench within 45 seconds.
- The game no longer starts as a visually busy but unexplained simulation.

Agent Notes:

- Owner: Codex
- Files changed: `src/main.ts`, `src/styles.css`
- Verification: `npm run build`; browser check at `1920 x 1080` confirmed first-minute rail appears in town war and `Place trench` arms trench placement with the quick build strip visible.
- Follow-up risks: The rail is intentionally minimal; Milestone 4 should still do a full new-player browser pass for overlap and wording polish.

## Milestone 2: Balance And Readability Pass

Goal: make the first fight feel fair, slow, and understandable.

Work:

- Tune soldier movement, opening contact timing, suppression, health loss, trench protection, grenade danger, and ammo usage.
- Make trench advantage readable but not absolute.
- Ensure Russian soldiers do not rush into meaningless center-map idling.
- Ensure Ukrainian pressure arrives from the enemy side and creates believable threat.
- Add short feedback for `Pinned`, `Firing from trench`, `Ammo-fed`, `Out of ammo`, `Grenade danger`, and `Retreating`.

Acceptance:

- A trench line gives a visible survival/firepower advantage.
- Open-ground soldiers are clearly worse off than soldiers in a good trench.
- Enemy AI can still suppress, flank, or grenade trenches.
- The first contact lasts long enough for the player to read and react.

Agent Notes:

- Owner: Codex
- Files changed: `src/game/scene/RaidScene.ts`, `src/game/townWar/controller.ts`, `docs/SHIPPING_HARDENING_6_MILESTONE_PLAN.md`
- Verification: `npm run build`; `npm run smoke:town-war-trench`; browser screenshot at `1920 x 1080` saved to `artifacts/shipping-hardening-milestone-2-trench-compact-centered.png`; browser probe confirmed a built ammo crate fed 3/3 occupied trench slots.
- Follow-up risks: The trench readout now proves firing, grenade danger, and directional pressure reduction, but broader HUD clutter still needs the Milestone 4 browser QA pass.

## Milestone 3: Smoke Test Hardening

Goal: protect the systems that have repeatedly regressed.

Work:

- Expand smoke tests for Russian player-side faction correctness.
- Verify trench placement, rotation, occupation, firing, ammo spend, enemy pressure, and soldier separation.
- Verify ammo boxes support nearby trench occupants.
- Verify downed-soldier rescue and extraction-button delegation still work.
- Verify enemy spawn side and camp labels.
- Add one reset/restart smoke to catch stale server or state issues.

Acceptance:

- `npm run build` passes.
- Existing town-war smoke tests pass.
- New smoke coverage fails if trenches are occupied by fake soldiers, stop firing, stack soldiers, or lose faction alignment.
- Test output includes human-readable proof lines, not just pass/fail.

Agent Notes:

- Owner: Codex
- Files changed: `package.json`, `scripts/town-war-shipping-hardening-smoke.mjs`, `docs/SHIPPING_HARDENING_6_MILESTONE_PLAN.md`
- Verification: `npm run build`; `npm run smoke:town-war-shipping`; `npm run smoke:town-war-trench`; `npm run smoke:town-war-colony`; `npm run smoke:town-war-operation`; `npm run smoke:town-war-dugout`; `npm run smoke:town-war-russian-dialogue`; `npm run smoke:town-war-soldier-inspector`; `npm run smoke:enemy-spawn-side`
- Follow-up risks: The new smoke protects core state regressions and downed extraction delegation, but Milestone 4 still needs a visible browser QA pass because these checks do not judge HUD overlap or player comprehension.

## Milestone 4: Browser QA And New Player Pass

Goal: test what the player actually sees, not only the simulation state.

Work:

- Run browser QA at `1920 x 1080`.
- Start from a clean game state and play the first 10 minutes as a new Russian-side player.
- Check build menu discoverability, trench preview, rotation, camp art toggle, soldier name hover, priority pane, and debrief readability.
- Capture screenshots for before/after UI clarity.
- Fix blocking UI overlap, invisible controls, bad labels, and unreadable battlefield feedback.

Acceptance:

- Player can complete a first build order without docs.
- Player can tell whether a trench is occupied and firing.
- Player can inspect a soldier name/role without clutter.
- Player can distinguish tutorial prompts from debug overlays.
- No critical console errors during the browser pass.

Agent Notes:

- Owner: Codex
- Files changed: `src/main.ts`, `src/styles.css`, `src/game/scene/RaidScene.ts`, `docs/SHIPPING_HARDENING_6_MILESTONE_PLAN.md`
- Verification: `npm run build`; `npm run smoke:town-war-loop`; `npm run smoke:town-war-shipping`; browser QA at `1920 x 1080` saved screenshots to `artifacts/town-war-playable-loop/00-roster-work-state.png`, `artifacts/town-war-playable-loop/01-preview-rotate.png`, `artifacts/town-war-playable-loop/03-trench-occupied.png`, `artifacts/town-war-playable-loop/04-debrief.png`, `artifacts/shipping-hardening-milestone-4-camp-art-off.png`, and `artifacts/shipping-hardening-milestone-4-soldier-hover.png`.
- Follow-up risks: The active town-war UI is now much cleaner, but the camp art is still visually dense when enabled. The toggle makes debugging readable, while a future art pass should separate decorative camp sprites from tactical cover/slot readability.

## Milestone 5: Performance And Reset Safety

Goal: make the game stable enough to replay and debug.

Work:

- Profile the active town-war scene for frame drops, expensive graphics loops, runaway labels, and excessive sprite churn.
- Confirm dev server reset/restart behavior is reliable.
- Add or harden a clean game reset path.
- Ensure repeated trench placement, battle progression, and restart do not accumulate stale state.
- Keep the dedicated dev port aligned with project rules: `http://127.0.0.1:5847/`.

Acceptance:

- The game can be restarted cleanly without stale camps, ghost soldiers, or duplicate UI.
- A 10-minute local play session does not visibly degrade.
- Debug toggles such as camp art hiding remain stable after reset.
- Server reset instructions are documented for future agents.

Agent Notes:

- Owner: Codex
- Files changed: `src/main.ts`, `src/game/scene/RaidScene.ts`, `package.json`, `scripts/town-war-performance-reset-smoke.mjs`, `docs/TOWN_WAR_RESET_AND_PERFORMANCE.md`, `docs/SHIPPING_HARDENING_6_MILESTONE_PLAN.md`
- Verification: `npm run build`; `npm run smoke:town-war-performance` at `http://127.0.0.1:5847/?debugRaid=1`. The smoke accepted repeated Russian build orders, advanced 600 simulated seconds in 1200 ticks, sampled frame timing before/after, verified scene sprite and label counts stayed bounded, reset through `resetTownWar()`, toggled camp art after reset, reloaded the browser, and confirmed the town-war state remained clean. Artifacts: `artifacts/town-war-performance-reset/performance-reset-report.json`, `artifacts/town-war-performance-reset/01-after-10-minute-sim.png`, `artifacts/town-war-performance-reset/02-after-api-reset.png`.
- Follow-up risks: The headless browser environment reports low absolute RAF FPS, so the smoke guards against relative degradation and runaway counts instead of enforcing a fixed 60 FPS budget. A future final QA pass should still include a real visible browser play session for subjective smoothness.

## Milestone 6: Final Docs And Ship Readiness Review

Goal: decide honestly whether the slice is shippable.

Work:

- Update active docs to match runtime reality.
- Create a short player-facing quickstart.
- Create a ship readiness report covering tutorialization, balance, smoke tests, browser QA, performance, reset safety, known bugs, and remaining gaps.
- Remove or clearly label debug-only surfaces that should not be judged as final UI.
- Do one final `can a new player understand this?` pass.

Acceptance:

- The README or project docs explain how to run, reset, and test the current slice.
- Ship readiness is marked as one of: `Ready for demo`, `Playable with known issues`, or `Not ready`.
- Remaining gaps are specific, reproducible, and prioritized.
- The final report answers whether the current game sells the `RimWorld + Foxhole frontline officer` fantasy.

Agent Notes:

- Owner: Codex
- Files changed: `docs/FRONTLINE_OFFICER_PLAYER_QUICKSTART.md`, `docs/SHIP_READINESS_REPORT.md`, `docs/README.md`, `wiki/README.md`, `AGENTS.md`, `docs/SHIPPING_HARDENING_6_MILESTONE_PLAN.md`
- Verification: `npm run build`; `npm run smoke:town-war-loop`; `npm run smoke:town-war-shipping`; `npm run smoke:town-war-performance`. The final player-facing docs now explain how to run, reset, and test the current Russian-side town-war slice, and the readiness report marks the slice as `Playable with known issues`.
- Follow-up risks: The slice is controlled-demo ready, not public-release ready. The next sprint should focus on one complete operation arc: trench network placement, building synergy explanation, enemy camp damage readability, and protected operation banking.

## Sprint Definition Of Done

This sprint is complete when:

- a new player can start the game and understand the Russian-side objective;
- the first build order is obvious enough to attempt without docs;
- trenches visibly affect fights and have readable counters;
- smoke tests protect faction correctness, trench fighting, ammo support, rescue, and reset safety;
- browser QA confirms the UI serves the playable loop;
- performance remains stable through a 10-minute local session;
- final docs clearly state whether the slice is shippable.

## Non-Goals

- No multiplayer.
- No giant world map.
- No tanks-first work.
- No new deep tech tree.
- No broad economy expansion.
- No large new feature unless it is required to make the current playable slice understandable.
