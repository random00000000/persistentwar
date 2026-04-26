# Combat Center Of Gravity Direction

## Purpose

Lock the product around the thing the current game already does unusually well:

- deep player control
- deep boy command
- reusable tactical actions
- readable real-time combat verbs

This document exists to make one rule explicit:

- the combat-and-command runtime is the center of gravity of the whole game

Everything else should strengthen it:

- AI
- maps
- guns
- stash
- extraction
- dialogue
- audio
- visual effects

## Locked Direction

The game should not be built as:

- a broad war sandbox with shallow controls
- a loot loop that happens to have squadmates
- a story game that compensates for weak combat

It should be built as:

- a hardcore tactical squad extraction game where the command-and-controller layer is already deep, and the rest of the product is being raised to match it

## Code Reality

The current codebase already supports this direction.

The strongest existing asset is not only shooting. It is the shared combat grammar around:

- briefing-first key teaching in [controls.ts](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/topdownextractionshooter/src/game/controls.ts)
- mission-beat and key-strip surfacing in [main.ts](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/topdownextractionshooter/src/main.ts)
- direct squad commands and tactical actions queued from the live runtime in [main.ts](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/topdownextractionshooter/src/main.ts)
- shared grenade, suppression, tracer, impact, and pressure state in [simulation.ts](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/topdownextractionshooter/src/game/simulation.ts)
- one shared friendly-combatant runtime for boys, support units, and incident allies in [simulation.ts](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/topdownextractionshooter/src/game/simulation.ts)

The important consequence is:

- the game already has a real tactical language

The product direction now needs to protect it and build around it.

## Core Product Truth

The player should feel like:

- a conscript growing into a feared small-unit leader

not:

- a rich operator who starts fully loaded

The ideal starting fantasy is:

- the stash is almost empty
- the player can begin with a handgun or no meaningful primary
- giving a better rifle to one of the boys is a real sacrifice
- every early weapon upgrade changes what the squad can attempt

This supports:

- hardcore tension
- real skill gap
- stash meaning
- squad meaning
- doctrinal growth instead of instant abundance

## Product Layer

The game should feel like a place where the player learns a real battlefield vocabulary:

- move
- brace
- follow
- defend
- attack
- sector watch
- covering move
- quick suppress
- commit suppress
- boy frag at cursor
- breach
- recover
- extract

The current briefing already exposes this language directly. That is not tutorial garnish. It is the skill ladder.

The rule is:

- the keys are not just controls
- the keys are the doctrine surface of the game

## What Must Revolve Around Combat

### AI

AI must become good enough that the existing command language matters more, not less.

The enemy should:

- pin with suppression
- punish greedy lane peeks
- defend rooms and trenches in ways that require proper verbs
- react differently under pressure, panic, blind fire, and collapse

### Maps

Maps must exist to reward the current controller and command runtime.

They should create reasons to use:

- directional brace
- boy grenade throws
- moving suppression
- room entry discipline
- trench denial
- casualty pull under fire

### Guns

Guns should deepen the command language rather than distract from it.

The rule is:

- guns are doctrine multipliers for the existing combat runtime

### Stash

Stash should support a hardcore climb from weakness, not immediate abundance.

The rule is:

- the player starts poor enough that weapon assignment and loadout sacrifice matter

### Extraction

Extraction should pressure the player to apply the command language under stress, not bypass it.

### Dialogue

Dialogue remains the seasoning that remembers what the combat systems made happen.

It should react to:

- a boy frag saving the push
- suppression holding a crossing
- a room clear going clean or bad
- a last-second extract with bad casualties

## Audio Direction

Audio should make the combat runtime feel hard, readable, and dangerous.

Required emphasis:

- distinct gunshot identity by weapon class
- different suppression sound feel from accurate aimed fire
- grenade throw, bounce, fuse, return, and blast readability
- bullet cracks and snap-by pressure near the player
- stronger room and trench tail when fights happen in confined spaces
- clearer callout priority for squad commands, danger, downed states, and extract pressure

The audio rule is:

- combat sound should help the player read pressure, not only decorate the map

## Visual Effects Direction

Visual effects should make the existing combat systems feel as serious as they already play.

Required emphasis:

- muzzle flash identity by gun family
- tracer readability for player, boys, and hostile fire
- impact bursts that distinguish dust, concrete, and suppression hits
- grenade blast and pressure rings that read clearly without becoming noisy
- armor break, flesh hit, pressure, and panic flashes that support decision-making

The VFX rule is:

- effects should tell the truth about danger, lane control, and weapon identity

## Hardcore Start Direction

The campaign should begin lower and harder than a standard extraction shooter.

Desired opening state:

- tiny stash
- almost no surplus guns
- weak reserve of meds and ammo
- one modest sidearm or equivalent low-tier survival kit
- boys may sometimes deserve the better rifle more than the player

This makes later power feel earned and makes squad allocation meaningful from the first hours.

## Success Test

This direction is working when the player says:

- `The controls and boy orders are the reason I am still playing.`
- `The AI and maps finally make those commands matter.`
- `I started like a conscript with nothing, and now I can solve real tactical problems.`
- `Gunshots, tracers, muzzle flash, suppression, and grenade bursts finally make the command layer feel as good as it actually is.`

## Failure Test

This direction is failing when:

- the game grows in scope but not in tactical depth
- maps and AI still do not justify the command language
- stash abundance erases early hardship
- audio and VFX undersell the combat runtime
- dialogue carries scenes that combat should have carried first
