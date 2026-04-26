# Frontline Officer

This project is a fork of `Top Down Extraction Shooter` inside the 2D game engine workspace.

When dealing with bugs use GStack Investigate Skill.

## Mandatory Direction Read

Before coding, read this document completely:

`C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\frontline-officer\docs\PERSISTENT_WAR_OFFICER_FORK_INTENT.md`

That document is the current product north star for this fork.

The old extraction-shooter documents still exist because this fork inherited the previous codebase and design history. Treat them as source material to mine for reusable systems, not as the active product direction.

## Game Identity

- Working title: `Frontline Officer`
- Slug: `frontline-officer`
- Core fantasy: `Shape a slow, cinematic NPC-driven war as an officer whose build orders, logistics, and commands decide who lives, who dies, and which camp falls.`
- Primary loop: `Prepare protected stash resources, place build orders and battlefield intent, watch soldiers execute under risk, personally intervene when worth the danger, bank or lose war assets, and push toward destroying the enemy camp.`
- Camera and movement perspective: `Top-down combat readability is mandatory.`
- First playable target: `One replayable town with two opposing camps, autonomous soldiers, buildable trenches/ammo positions, slow suppression-driven fights, protected stash preparation, and a match ending when one camp is destroyed.`

## Product Pillars

- `Officer consequence: the player's orders are the reason people live and die.`
- `NPC war first: soldiers must autonomously build, occupy, suppress, retreat, resupply, and recover before online play matters.`
- `Slow cinematic combat: fights should breathe through cover, suppression, hesitation, fallback, and logistics instead of arcade swarm pressure.`
- `Building risk and reward: every trench, bunker, crate, wire line, depot, and med post creates both advantage and exposure.`
- `Protected grind: stash/extraction flow lets players bank tanks, good guns, supplies, and operation stockpiles for future pushes.`
- `Hardcore intervention: the player can enter the war personally, but officer death costs tech tree progress.`
- `First town first: prove one replayable, expandable town before chasing a giant war map or multiplayer.`

## Implementation Direction

- Default runtime path: `2D Phaser browser game`.
- The current codebase is inherited from the extraction shooter. Reuse good systems instead of rewriting everything:
  - gun identity and shoot feel
  - dialogue/story-pack architecture
  - stash and extraction banking surfaces
  - squad/soldier state ideas
  - suppression, casualty, body recovery, territory, and route scar concepts
- Do not preserve extraction as the primary win condition. In this fork, extraction is a banking/preparation layer inside a larger persistent war.
- Online play is later. Single-player NPC war simulation must work first.
- Modern Ukraine-war context should ground battlefield texture, but the setting, factions, places, and events must remain fictional.

## Shipping Priority Order

When choosing work without a newer human directive, move the first playable forward in this order:

1. `First-town war state`: create a durable state model for one replayable town.
2. `Two camps`: establish one camp for each side and make camp health/control inspectable.
3. `Autonomous soldiers`: spawn NPC soldiers who can move, fight, suppress, retreat, and recover without being puppets.
4. `Officer build order`: let the player place at least one battlefield construction order.
5. `Construction execution`: make soldiers travel to the order and build the object under risk.
6. `Trench or cover payoff`: completed construction must change survivability, suppression, or movement choices.
7. `Camp destruction win condition`: the match ends when one camp is destroyed.
8. `Protected operation banking`: preserve the stash/extraction menu as protected preparation for future pushes.

## Local Rules

- Keep work contained inside this project folder.
- Prefer work that advances the officer/build-order/NPC-war loop over extraction-only polish.
- Favor AI behavior, building execution, logistics, terrain consequence, first-town replayability, and emergent soldier drama.
- Avoid broad UI-only work unless it directly supports officer orders, protected stash preparation, battlefield readability, or verification.
- Avoid feature drift into a pure RTS command console. The war should be watched through soldiers reacting to orders and terrain.
- Avoid feature drift into a lone-soldier extraction shooter. Personal intervention is valuable but not the core loop.
- Use Game Studio workflows when they help planning, implementation, or playtesting.
- Default desktop browser QA, screenshots, smoke tests, and Playwright verification to `1920 x 1080` unless the user explicitly asks for another viewport.
- The fork has dedicated Vite ports:
  - dev: `http://127.0.0.1:5847/`
  - preview: `http://127.0.0.1:5848/`

## Automation Definition Of Done

Each recurring automation run should leave one clean handoff:

- one useful behavior, system seam, or verification surface changed;
- one CLI, browser, screenshot, or build proof recorded in the final answer;
- Agile state updated when card progress changed;
- docs updated only when the project reality changed;
- no broad cleanup or unrelated refactor bundled into the run.

## Not Yet

Do not spend automation runs on these until the first-town officer-war slice works:

- online multiplayer;
- a giant persistent world map;
- tanks-first development before infantry/build-order consequence is proven;
- broad UI polish that does not support orders, banking, readability, or verification;
- lore expansion without playable simulation impact;
- extraction-only raid polish;
- new economies or tech trees before camp destruction and operation banking are inspectable.

## Current State

This fork currently starts from the inherited extraction-shooter codebase. The product direction has been pivoted by documentation, but most runtime systems still need to be reshaped toward the officer-led persistent war.

## Agent Surfaces

- Fork north star: [docs/PERSISTENT_WAR_OFFICER_FORK_INTENT.md](docs/PERSISTENT_WAR_OFFICER_FORK_INTENT.md)
- AgileSprints project: `C:\Users\Javier\Desktop\CodexCLI\AgileSprints\Frontline Officer`
- Project wiki: [wiki/README.md](wiki/README.md)
- Project CLI manual: [wiki/project-cli.md](wiki/project-cli.md)
- Project CLI entry point: `npm run game:cli -- <command>`
- After code changes, update and maintain relevant docs so future agents know whether a system is inherited extraction behavior or active frontline-officer behavior.

## Inherited Reference Docs

Use these for historical context and reusable mechanics, not as the active north star:

- [Tactical Squad Extraction North Star](docs/TACTICAL_SQUAD_EXTRACTION_NORTH_STAR.md)
- [Product Direction And Spec Intent](docs/PRODUCT_DIRECTION_AND_SPEC_INTENT.md)
- [Infiltration Shooter Direction](docs/INFILTRATION_SHOOTER_DIRECTION.md)
- [Combat Center Of Gravity Direction](docs/COMBAT_CENTER_OF_GRAVITY_DIRECTION.md)
- [Systemic Reuse And Prefab Rules](docs/SYSTEMIC_REUSE_AND_PREFAB_RULES.md)
