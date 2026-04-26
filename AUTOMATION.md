# Automation Notes

Use this file for project-specific automation guidance that should persist across recurring runs.

## Early Target

`A complete raid where the player can use distinct guns, fight scavs, gather loot, and extract successfully back to the stash.`

## Current Automation Focus

- Treat the first playable as already delivered.
- Validate progress through playtesting when useful.
- Record durable decisions in `docs/`.
- Prioritize thematic presentation, bespoke audiovisual work, sprite quality, and stronger content polish on top of the existing raid loop.
- Use Game Studio workflows, with Phaser as the default 2D implementation path.

## Project-Specific Constraints

- `Keep the camera and traversal strictly top-down.`
- `Different guns must create meaningfully different combat behavior in the first playable.`
- `Combat should reward positioning, pacing, and player skill instead of instant trivial clears.`
- `Stash flow should remain part of the first playable loop if it materially supports raid tension.`

## Ready Automation Setup

After the project is added manually in the Codex app, create the recurring automation from inside this project context using [automation prompt](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/topdownextractionshooter/docs/automation_prompt.md).
