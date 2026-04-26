# Frontline Officer Automation Prompt

This is an automated development workflow for `Frontline Officer`.

Project folder: `C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\frontline-officer`

Agile project folder: `C:\Users\Javier\Desktop\CodexCLI\AgileSprints\Frontline Officer`

Use [@game-studio](plugin://game-studio@openai-curated) for this recurring game-development run.

WARNING: This is a recurring automation. As the final step of each run, use [$force-automation-run](C:\Users\Javier\.codex\skills\force-automation-run\SKILL.md) to trigger this automation again, then verify it started before ending the run.

## Product Direction

Read `C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\frontline-officer\AGENTS.md` first. That file is the source of truth for the game vision, constraints, and execution rules.

Then read `C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\frontline-officer\docs\PERSISTENT_WAR_OFFICER_FORK_INTENT.md`. Treat this as the active north star.

Then read `C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\frontline-officer\DIRECTIVES.md`. Treat directives as current product-shaping instructions from the developer. They are incremental and do not all need to be completed in one run.

Read `C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\frontline-officer\AUTOMATION.md` for project-specific run rules.

Read the live decision document at `C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\frontline-officer\docs\decision_making_document.md` and use it as the durable source of pending human decisions for this fork.

Read the Agile sprint state with the Agile CLI from `C:\Users\Javier\Desktop\CodexCLI\AgileSprints` before choosing implementation work. Prefer the active card unless the human has given a newer directive.

## Operating Rules

- Keep all project artifacts inside `C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\frontline-officer` unless updating the AgileSprints project through its CLI.
- Use the 2D engine CLI for routine project status and directive checks.
- Use the AgileSprints CLI for card, sprint, and handoff state.
- Prioritize officer-war simulation work over inherited extraction content.
- Preserve top-down Phaser readability.
- Keep dev and preview ports dedicated to this fork: dev `5847`, preview `5848`.
- When useful, playtest and inspect the game visually before and after changes.
- Include at least one screenshot or visual verification artifact in the final automation report when gameplay-facing work changes.
- Record durable design or scope choices in `docs\decision_making_document.md`.
- Record task progress in the Agile project when a card moves or meaningful work completes.

## Preferred First Work

Use the Agile card `CARD-001 Audit inherited runtime and name the officer-war cutover seams` as the first implementation-facing run unless the sprint state says another card is active.

That first run should identify the minimum runtime seams needed to pivot from extraction raid simulation into:

- first-town war state,
- two opposing camps,
- autonomous NPC soldiers,
- officer build orders,
- trench or cover construction,
- suppression and cover behavior,
- protected operation banking,
- camp destruction victory.

## Workflow Steps

1. Read `AGENTS.md`, `DIRECTIVES.md`, `AUTOMATION.md`, and `docs\PERSISTENT_WAR_OFFICER_FORK_INTENT.md` in the project folder.
2. Read the decision document at `docs\decision_making_document.md`.
3. From `C:\Users\Javier\Desktop\CodexCLI\AgileSprints`, run the Agile CLI to inspect active sprint and card state.
4. Use [@game-studio](plugin://game-studio@openai-curated) for `Game Studio` workflow planning and browser-game routing.
5. Use [$game-studio:web-game-foundations](C:\Users\Javier\.codex\plugins\cache\openai-curated\game-studio\b066e4a0\skills\web-game-foundations\SKILL.md) if architecture or simulation boundaries need clarification.
6. Use [$game-studio:phaser-2d-game](C:\Users\Javier\.codex\plugins\cache\openai-curated\game-studio\b066e4a0\skills\phaser-2d-game\SKILL.md) as the default implementation path for this 2D top-down game.
7. Use [$game-studio:game-ui-frontend](C:\Users\Javier\.codex\plugins\cache\openai-curated\game-studio\b066e4a0\skills\game-ui-frontend\SKILL.md) only when the next slice needs officer orders, protected stash, HUD readability, or verification surfaces.
8. Use [$game-studio:sprite-pipeline](C:\Users\Javier\.codex\plugins\cache\openai-curated\game-studio\b066e4a0\skills\sprite-pipeline\SKILL.md) when sprite generation or normalization is needed.
9. Use [$game-studio:game-playtest](C:\Users\Javier\.codex\plugins\cache\openai-curated\game-studio\b066e4a0\skills\game-playtest\SKILL.md) when verification, frontend QA, combat readability checks, or gameplay review would improve quality.
10. Implement one cohesive improvement that moves the fork toward the first-town officer-war slice.
11. Update docs/wiki and Agile card state so the next agent can continue without rediscovery.
12. If a design or scope choice should be escalated, record it in the decision document before ending the run.
13. Use [$force-automation-run](C:\Users\Javier\.codex\skills\force-automation-run\SKILL.md) to trigger this automation again and confirm it is running before ending the run.
