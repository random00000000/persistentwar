# Top Down Extraction Shooter Automation Prompt

This is an automated development workflow for `Top Down Extraction Shooter`.

Project folder: `C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\topdownextractionshooter`

Use [@game-studio](plugin://game-studio@openai-curated) for this recurring game-development run.

WARNING: This is a recurring automation. As the final step of each run, use [$force-automation-run](C:\Users\Javier\.codex\skills\force-automation-run\SKILL.md) to trigger this automation again, then verify it started before ending the run.

## Product Direction

Read `C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\topdownextractionshooter\AGENTS.md` first. That file is the source of truth for the game vision, constraints, and execution rules.

Then read `C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\topdownextractionshooter\DIRECTIVES.md`. Treat directives as the current product-shaping instructions from the developer. They are incremental and do not all need to be completed in one run.

Read `C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\topdownextractionshooter\AUTOMATION.md` for project-specific run rules.

Read the live decision document at `C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\topdownextractionshooter\docs\decision_making_document.md` and use it as a durable source of pending human decisions that can later steer new directives.

## Operating Rules

- Prioritize player-facing improvements.
- Prefer coherent, shippable progress over scattered experiments.
- Do not leave dead code behind.
- Keep all project artifacts inside `C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\topdownextractionshooter`.
- When useful, playtest and inspect the game visually before and after changes.
- Preserve the top-down extraction-shooter identity.
- Keep the first few runs centered on a complete raid loop with distinct gun behavior, scav combat, loot, extraction, and stash follow-through.

## Workflow Steps

1. Read `AGENTS.md`, `DIRECTIVES.md`, and `AUTOMATION.md` in the project folder.
2. Read the decision document at `C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\topdownextractionshooter\docs\decision_making_document.md`.
3. Use [@game-studio](plugin://game-studio@openai-curated) for `Game Studio` workflow planning and early browser-game routing.
4. Use [$game-studio:web-game-foundations](C:\Users\Javier\.codex\plugins\cache\openai-curated\game-studio\2032fd0291961d866feca472adc8ed6a8cddafc6\skills\web-game-foundations\SKILL.md) if architecture or simulation boundaries need clarification.
5. Use [$game-studio:phaser-2d-game](C:\Users\Javier\.codex\plugins\cache\openai-curated\game-studio\2032fd0291961d866feca472adc8ed6a8cddafc6\skills\phaser-2d-game\SKILL.md) as the default implementation path for this 2D top-down game.
6. Use [$game-studio:game-ui-frontend](C:\Users\Javier\.codex\plugins\cache\openai-curated\game-studio\2032fd0291961d866feca472adc8ed6a8cddafc6\skills\game-ui-frontend\SKILL.md) when the next slice includes the stash, menus, overlays, inventory, or player-facing HUD.
7. Use [$game-studio:sprite-pipeline](C:\Users\Javier\.codex\plugins\cache\openai-curated\game-studio\2032fd0291961d866feca472adc8ed6a8cddafc6\skills\sprite-pipeline\SKILL.md) when sprite generation or normalization is needed.
8. Use [$game-studio:game-playtest](C:\Users\Javier\.codex\plugins\cache\openai-curated\game-studio\2032fd0291961d866feca472adc8ed6a8cddafc6\skills\game-playtest\SKILL.md) when verification, frontend QA, combat readability checks, or loot-flow review would improve quality.
9. Implement one or more cohesive improvements that move the game toward a stronger first playable or release candidate.
10. If a design or scope choice should be escalated, record it in the decision document before ending the run.
11. Use [$force-automation-run](C:\Users\Javier\.codex\skills\force-automation-run\SKILL.md) to trigger this automation again and confirm it is running before ending the run.
