# Frontline Officer

This project is a fork of `Top Down Extraction Shooter` inside the 2D game engine workspace.

When dealing with bugs use GStack Investigate Skill.

## Mandatory Direction Read

Before coding, read this document completely:

'C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\frontline-officer\HumanMadeNorthStar.md'

That document is the current product north star for this fork.

The old extraction-shooter documents still exist because this fork inherited the previous codebase and design history. Treat them as source material to mine for reusable systems, not as the active product direction.

Do not read the other Docs since there are too many and will not make code better.

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
