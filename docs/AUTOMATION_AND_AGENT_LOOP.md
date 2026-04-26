# Automation And Agent Loop

The recurring automation for `Frontline Officer` should stay simple enough to
run often.

## Three-Step Loop

1. Pick one useful next task.
   - Use [$game-studio:game-studio](C:\Users\Javier\.codex\plugins\cache\openai-curated\game-studio\b066e4a0\skills\game-studio\SKILL.md) as the browser-game routing step.
   - Prefer the active Agile card.
   - Read only the docs needed for that task.
   - Keep the fork pointed at the officer-war loop.

2. Do the smallest shippable improvement and prove it.
   - Use the game CLI when possible.
   - Use browser screenshots when the change needs visual proof.
   - Update only docs or Agile state touched by the work.

3. Start the next automation run.
   - Use [$force-automation-run](C:\Users\Javier\.codex\skills\force-automation-run\SKILL.md).
   - Confirm the next run started.

## Useful Commands

2D engine status:

```powershell
python .\cli\game_engine_cli.py status frontline-officer
```

Agile sprint status:

```powershell
python .\agile.py --project-path "C:\Users\Javier\Desktop\CodexCLI\AgileSprints\Frontline Officer" sprint-status
```

Game runtime checks:

```powershell
npm run game:cli -- snapshot --url http://127.0.0.1:5847
npm run game:cli -- regression-gate --url http://127.0.0.1:5847
```

## Fixed Context

- Project: `C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\frontline-officer`
- Agile project: `C:\Users\Javier\Desktop\CodexCLI\AgileSprints\Frontline Officer`
- Active north star: `docs/PERSISTENT_WAR_OFFICER_FORK_INTENT.md`
- Automation prompt: `docs/automation_prompt.md`
- Dev URL: `http://127.0.0.1:5847/`

## Target

Build toward one small Foxhole-like town war:

- two camps,
- autonomous soldiers,
- officer build orders,
- trenches and cover,
- suppression and retreat,
- protected operation banking,
- camp destruction win condition.
