# Automation Notes

Use this file for recurring Frontline Officer automation runs. This fork is no
longer trying to finish the inherited extraction-shooter loop.

## Early Target

`One replayable town with two opposing camps, autonomous soldiers, officer build orders, buildable trenches and ammo positions, protected operation banking, and a match ending when one camp is destroyed.`

## Current Automation Focus

- Treat `docs/PERSISTENT_WAR_OFFICER_FORK_INTENT.md` as the active product direction.
- Use the inherited extraction systems as raw material only when they help the officer-war loop.
- Prefer simulation work over broad presentation polish: soldier autonomy, suppression, cover seeking, build-order execution, logistics, camp damage, and replayable town state.
- Keep the player's main action centered on placing orders and watching the war unfold.
- Preserve the protected stash/extraction menu as operation banking, not as the dominant raid loop.
- Use Game Studio workflows, with Phaser as the default 2D implementation path.
- Keep the dev server on the fork's dedicated ports: dev `5847`, preview `5848`.

## Project-Specific Constraints

- `Top-down combat readability is mandatory.`
- `Battles should be slow and cinematic: soldiers can back off, get pinned, suppress, move to cover, and survive or die because of orders.`
- `Every build order must imply risk and reward.`
- `The first town must stay replayable and expandable, with two camps and a clear destroy-the-camp win condition.`
- `Online multiplayer is later; single-player NPC war is the first proof.`
- `Ukraine-war-inspired texture is useful for market grounding, but factions, places, and events must stay fictionalized.`

## AgileSprints Link

Use the Agile project at `C:\Users\Javier\Desktop\CodexCLI\AgileSprints\Frontline Officer` for agent task handoff and sprint state.

Start with `CARD-001 Audit inherited runtime and name the officer-war cutover seams` unless the human has moved the active card.

## Ready Automation Setup

After the project is added manually in the Codex app, create the recurring automation from inside this project context using [automation prompt](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/frontline-officer/docs/automation_prompt.md).
