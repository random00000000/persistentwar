# Frontline Officer Automation Prompt

This is an automated development workflow for `Frontline Officer`.

Project folder: `C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\frontline-officer`

Agile project folder: `C:\Users\Javier\Desktop\CodexCLI\AgileSprints\Frontline Officer`

Use [@game-studio](plugin://game-studio@openai-curated) for this recurring game-development run.

WARNING: This is a recurring automation. As the final step of each run, use [$force-automation-run](C:\Users\Javier\.codex\skills\force-automation-run\SKILL.md) to trigger this automation again, then verify it started before ending the run.

## Product Direction

Read `C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\frontline-officer\AGENTS.md` first. That file is the source of truth for the game vision, constraints, and execution rules.

Read `C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\frontline-officer\AUTOMATION.md` for the current simplified automation loop.

Use the active Agile card from `C:\Users\Javier\Desktop\CodexCLI\AgileSprints\Frontline Officer` as the default next task. Read other docs only when the task needs them.

Check task state with the AgileSprints CLI:

```powershell
python C:\Users\Javier\Desktop\CodexCLI\AgileSprints\agile.py --project-path "C:\Users\Javier\Desktop\CodexCLI\AgileSprints\Frontline Officer" sprint-status
python C:\Users\Javier\Desktop\CodexCLI\AgileSprints\agile.py --project-path "C:\Users\Javier\Desktop\CodexCLI\AgileSprints\Frontline Officer" board
```

## Operating Rules

- Keep all game work inside `C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\frontline-officer`.
- Use the AgileSprints CLI for sprint and card state. Treat the active card as the agentic task tool for recurring runs.
- Use the project CLI for runtime inspection and verification when possible.
- Use `http://127.0.0.1:5847/` for browser checks.
- Prefer officer-war gameplay over inherited extraction work.
- Favor soldiers, orders, trenches, cover, suppression, logistics, camp damage, and protected operation banking.
- Update only the docs or Agile state that changed.

## Workflow Steps

1. Pick one useful next task.
   - Use [$game-studio:game-studio](C:\Users\Javier\.codex\plugins\cache\openai-curated\game-studio\b066e4a0\skills\game-studio\SKILL.md) as the browser-game routing step.
   - Start from the active Agile card when available.
   - Read only the docs needed for the task.

2. Do the smallest shippable improvement and prove it.
   - Use `npm run game:cli -- <command>` when possible.
   - Use browser/playtest screenshots when the change is visual or gameplay-facing.
   - Keep the run focused on one clean handoff.

3. Update Agile card flow.
   - If the task is finished, move the card workflow to `review`.
   - If a card moved from sprint work into review, pull one ready backlog card into the sprint.
   - Use the AgileSprints CLI for these changes.
   - Card review command: `python C:\Users\Javier\Desktop\CodexCLI\AgileSprints\agile.py --project-path "C:\Users\Javier\Desktop\CodexCLI\AgileSprints\Frontline Officer" workflow-set <CARD-ID> review`
   - Sprint pull command: `python C:\Users\Javier\Desktop\CodexCLI\AgileSprints\agile.py --project-path "C:\Users\Javier\Desktop\CodexCLI\AgileSprints\Frontline Officer" move-card <BACKLOG-CARD-ID> sprint`

4. Start the next automation run.
   - Use [$force-automation-run](C:\Users\Javier\.codex\skills\force-automation-run\SKILL.md).
   - Confirm the next run started before ending.
