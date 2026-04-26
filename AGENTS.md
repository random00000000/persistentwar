# Top Down Extraction Shooter

This project is a long-running agentic game build inside the 2D game engine workspace.

When dealing with bugs use GStack Investigate Skill

## Game Identity

- Working title: `Top Down Extraction Shooter`
- Slug: `topdownextractionshooter`
- Core fantasy: `Survive high-stakes top-down raids by fighting scavs, securing loot, completing quests, and extracting alive so the stash keeps growing.`
- Primary loop: `Enter a raid, clear or avoid threats, loot valuable gear, complete quest objectives, extract alive, and manage the stash before the next run.`
- Camera and movement perspective: `Top-down movement and combat readability are mandatory.`
- First playable target: `A complete raid where the player can use distinct guns, fight scavs, gather loot, and extract successfully back to the stash.`

## Design Pillars

- `Deep fights with a real skill gap and room for winning strategies like Tarkov.`
- `Strong-looking, readable top-down combat and loot presentation.`
- `Raids and stash management should feel deep, tense, and replayable.`

## Implementation Direction

- Default runtime path: `2D Phaser browser game`, unless future directives intentionally change the stack.
- The first milestone should prove raid flow before broadening scope into bigger questlines, economy layers, or PvP.
- Weapon handling must create meaningful tactical differences early, not just cosmetic stat changes.

## Local Rules

- Keep work contained inside this project folder.
- Favor player-facing improvements, this does not mean more UI work, it means delivering on directives and making the game more deep in areas like Enemy AI, Orthogonal Enemies, Level Design and mostly what is asked on the directives.
- Avoid working UI improvements and favor Enemy AI, Level Design, Endgame and North Star Implementation Milestones.
- Use directives to shape the game development over multiple runs.
- Avoid feature drift that breaks the core fantasy.
- Use Game Studio workflows when they help planning, implementation, or playtesting.
- Preserve the top-down extraction-shooter identity instead of drifting into arcade swarm combat.
- Treat stash flow as part of the core loop, not a detached menu afterthought.
- Default desktop browser QA, screenshots, smoke tests, and Playwright verification to `1920 x 1080` unless the user explicitly asks for another viewport.

## Current State

This project has been customized from the template and is ready for the recurring directive-and-decision loop.

## Agent Surfaces


- Project wiki: [wiki/README.md](wiki/README.md) (Please read the wiki now before doeing any coding)
- Project CLI manual: [wiki/project-cli.md](wiki/project-cli.md)
- Project CLI entry point: `npm run game:cli -- <command>`
- After code changes, update and maintain the wiki so future agents have current documentation.
- Read the following document completely, this is the current slice to be delivered and must be read before doing coding work, it is the north star: 
C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\topdownextractionshooter\docs\TACTICAL_SQUAD_EXTRACTION_NORTH_STAR.md
The north star is the evolution of the first creative direction listed below:
C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\topdownextractionshooter\docs\INFILTRATION_SHOOTER_DIRECTION.md

- Shorter North Star Explanation Read Completely: C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\topdownextractionshooter\docs\PRODUCT_DIRECTION_AND_SPEC_INTENT.md
