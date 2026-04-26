# Frontline Officer Automation Prompt

You are running the recurring automation for `Frontline Officer`.

Project folder: `C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\frontline-officer`

Agile project folder: `C:\Users\Javier\Desktop\CodexCLI\AgileSprints\Frontline Officer`

Use [@game-studio](plugin://game-studio@openai-curated) when it helps.

## Three Steps

1. Pick one useful next task.
   - Use [$game-studio:game-studio](C:\Users\Javier\.codex\plugins\cache\openai-curated\game-studio\b066e4a0\skills\game-studio\SKILL.md) to route the browser-game work before choosing implementation details.
   - Read `AGENTS.md`, `AUTOMATION.md`, and the active Agile card.
   - Read other docs only if the task needs them.
   - Prefer officer-war gameplay over inherited extraction work.

2. Do the smallest shippable improvement and prove it.
   - Use `npm run game:cli -- <command>` when possible.
   - Use `http://127.0.0.1:5847/` for browser checks.
   - Update only the docs or Agile state that changed.

3. Start the next automation run.
   - Use [$force-automation-run](C:\Users\Javier\.codex\skills\force-automation-run\SKILL.md).
   - Confirm the next run started before ending.

The goal is steady iteration: one task, one proof, one clean handoff.
