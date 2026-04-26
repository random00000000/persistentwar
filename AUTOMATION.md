# Automation Notes

Use this file for project-specific automation guidance that should persist across recurring runs.

## Early Target

`One replayable town with two opposing camps, autonomous soldiers, officer build orders, buildable trenches and ammo positions, protected operation banking, and a match ending when one camp is destroyed.`

## Current Automation Focus

- Keep the automation simple: one useful task, one proof, one clean handoff.
- Treat `docs/PERSISTENT_WAR_OFFICER_FORK_INTENT.md` as the active product direction when more context is needed.
- Start from the active Agile card when available.
- Use [$game-studio:game-studio](C:\Users\Javier\.codex\plugins\cache\openai-curated\game-studio\b066e4a0\skills\game-studio\SKILL.md) as the browser-game routing step.
- Prefer officer-war gameplay over inherited extraction work.
- Favor soldiers, orders, trenches, cover, suppression, logistics, camp damage, and protected operation banking.

## Project-Specific Constraints

- `Top-down combat readability is mandatory.`
- `Battles should be slow and cinematic.`
- `Every build order should imply risk and reward.`
- `The first town must stay replayable and expandable.`
- `Online multiplayer is later; single-player NPC war is the first proof.`

## Workflow Steps

1. Pick one useful next task.
2. Do the smallest shippable improvement and prove it.
3. Use [$force-automation-run](C:\Users\Javier\.codex\skills\force-automation-run\SKILL.md) to start the next automation run and confirm it started.

## Ready Automation Setup

The recurring Codex automation should use [automation prompt](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/frontline-officer/docs/automation_prompt.md).
