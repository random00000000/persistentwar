# Officer-War Cutover Seams (CARD-001)

This fork inherits a working extraction-shooter runtime. This note maps the current code owners to the Frontline Officer first-town officer-war loop, and names the smallest safe cutover boundaries for:

- town state
- camp state
- soldier state
- officer orders + build state
- CLI inspect/verify surfaces

## Current Runtime Owners (Inherited)

**Simulation + state core**

- `C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\frontline-officer\src\game\simulation.ts`
  - Primary state owner today (`RaidController`, `RaidState`, plus most combat + suppression + casualty + extraction + "frontline" incident/support state).
  - Contains most of the "NPC war texture" ingredients that should be reused (suppression pressure, squad mates, hostile intent, casualty recovery beats).

**Phaser scene + rendering + live input**

- `C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\frontline-officer\src\game\scene\RaidScene.ts`
  - Scene orchestration, sprites, overlays, camera, and input bindings.
  - Currently tightly coupled to `RaidController` and raid-centric terminology.

**Map/route definitions**

- `C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\frontline-officer\src\game\arena.ts`
  - "Route" layout data: obstacles, spawn points, extracts, pockets, props.
  - This is the closest existing seam for the "first town layout shell" card (`CARD-003`), but today it is raid-route shaped (insert/extract centric).

**Player-facing controls copy**

- `C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\frontline-officer\src\game\controls.ts`
  - Key bindings + HUD instruction text. Currently "raid" and "boys net" framed.

**Weapons + inventory/stash**

- `C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\frontline-officer\src\game\weapons.ts`
  - Weapon identity + tuning (keep this).
- `C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\frontline-officer\src\game\inventory.ts`
  - Stash/inventory grid + item definitions (keep this as the "protected operation banking" substrate).

**Dialogue/story-pack architecture**

- `C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\frontline-officer\src\game\dialogue\storyPacks.ts`
- `C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\frontline-officer\src\game\dialogue\story-packs\*.ts`
  - Reusable story-pack system and templates (keep this; it is part of the "NPC war first" drama surface).

**Runtime entry + UI + agent API**

- `C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\frontline-officer\src\main.ts`
  - Owns the top-level Phaser boot, UI rendering, and exposes the browser automation API (still named `window.__topdownExtractionAgentApi`).

**CLI surface (inspect/stage/verify/capture)**

- `C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\frontline-officer\scripts\project-cli.mjs`
  - The authoritative automation surface (Playwright-driven), calling `window.__topdownExtractionAgentApi.*`.

## The New Officer-War Owners (Target)

These should become the stable owners as the fork pivots (names are intentional "war/town/camp" vocabulary, not "raid/extract" vocabulary):

- **Town state owner**: `town` is the replayable container and terrain/POI registry.
  - Target module: `src/game/war/townState.ts`
- **Camp state owner**: each side's camp health/control/supply and win/loss condition state.
  - Target module: `src/game/war/campState.ts`
- **Soldier state owner**: autonomous soldier agents (move, fight, suppress, retreat, recover, resupply).
  - Target module: `src/game/war/soldierState.ts`
- **Orders + build state owner**: officer build orders, intent orders, and construction progress.
  - Target modules: `src/game/war/ordersState.ts`, `src/game/war/constructionState.ts`
- **War controller**: the orchestrator that steps the above owners and exposes a clean snapshot surface.
  - Target module: `src/game/war/warController.ts`

These should be introduced *alongside* `RaidController` first, then gradually become the primary owners as "raid/extraction" becomes a banking layer instead of the core loop.

## Smallest Safe Cutover Boundaries (Next Cards Start Here)

This is the "do not guess" boundary for the next implementation cards:

1. **Create a `war` namespace in snapshot truth before changing behavior**
   - A minimal "read-only" `war` snapshot (town + two camps placeholders) is the safest first seam because it gives CLI a stable inspect point without refactoring combat.
   - Implemented: `getSnapshot()` now includes `snapshot.war`, and the CLI exposes it via `npm run game:cli -- cutover`.
2. **Town + camps exist even if soldiers are still raid-centric**
   - `CARD-002` ("first town and two camp state backbone") should create durable IDs and health/control fields for two camps. Do not block on soldier AI.
   - Current implementation convention: `camp-a` is the player's camp on the right side of the town, and `camp-b` is the enemy camp on the left side.
   - Player/officer deployment is locked to `camp-a`; attempts to deploy the officer to `camp-b` must fail.
   - Initial Russian `camp-a` colonists must not auto-march to the road crossing. They start as camp/perimeter workers and only leave for the frontline when the player gives a focus/build/resupply order.
   - `camp-a` and `camp-b` have first-pass Phaser bunker/camp art in `src/game/scene/RaidScene.ts` so the opposing camps read as attackable fortified places instead of invisible coordinates. `camp-a` is the player's Russian camp on the right and uses the Russian camp asset set with red/gray camp overlays, an expanded compound footprint, bunker core, trench gates, motor-pool, medical/recovery props, extra tents, and supply staging art; `camp-b` is the Ukrainian enemy camp on the left.
   - Raid start seeds a small `camp-b` enemy garrison through `src/game/simulation.ts`; those defenders are normal attackable `EnemyState` combatants anchored near the enemy camp.
   - Raid start projects live Russian `TownWarSoldierState` colony soldiers into `town-war-soldier` friendly combatants inside the right-side player camp instead of spawning a separate anonymous `camp-garrison` NPC type. Those projected colony soldiers keep their town-war identity, role, ammo, and task ownership while using the inherited `spawnAiWeaponProjectiles` / `spawnWeaponProjectiles` / `BulletState` path so they shoot like the older raid-side NPCs.
   - The scene hides duplicate town-war sprites for projected soldiers while the raid combat body is active, so the player sees one Russian NPC per projected colony soldier instead of a colony-sim body plus a separate shooter body.
   - Raid start still seeds a Ukrainian frontline patrol near the first-town contact line. Friendly and hostile AI fire through the reusable projectile wrapper used by player bullets.
   - Hostile shots aimed at the player use `HOSTILE_PLAYER_BALANCE` in `src/game/simulation.ts`: enemies still fire real bullets and apply suppression, but player-facing hostile shots have softer damage, range, speed, and cadence than AI-vs-AI fire so the enemy fights without feeling overtuned.
   - Town-war Ukrainian deaths mark their fallen enemy bodies with `bodyAlarmSuppressed`, so inherited body-recovery behavior can still leave bodies on the field without spawning the old six-man `body-wave` reinforcement horde.
   - `getAgentSnapshot()` now exposes live `raid.bullets`, `raid.friendlyCombatants`, and corrected Ukrainian/Russian combatant summaries so browser checks can prove AI bullets, damage, wounds, and deaths without guessing from sprites.
3. **Soldiers become a parallel agent system, not a rewrite**
   - Start with "autonomous soldier" state that can be stepped in the same tick as raid simulation, then migrate rendering to show them.
4. **Orders/build are their own ledger**
   - Officer orders should be a durable ledger (placed orders, accepted orders, in-progress, completed, failed), independent of whether construction execution is perfect yet.

## Inherited Systems To Reuse (Keep)

At least three systems worth preserving as-is or near-as-is:

- **Gun identity + shoot feel**: `src/game/weapons.ts` + the bullet/combat runtime inside `src/game/simulation.ts`.
- **Dialogue/story-pack architecture**: `src/game/dialogue/*` for NPC drama and battlefield texture.
- **Protected stash / inventory grid**: `src/game/inventory.ts` as the future "protected operation banking" layer.
- **Automation/CLI contract**: `scripts/project-cli.mjs` as the inspect + verify surface (keep it stable while state owners shift).

## Extraction Assumptions To Avoid Preserving (Do Not Carry Over)

At least three extraction-first assumptions that must not stay "core truth" in this fork:

- **Extraction as the primary win condition** (in Frontline Officer, extraction is banking/prep inside a larger war).
- **Raid phase as the primary game loop owner** (war state must exist outside the raid moment).
- **Player kill-focus as the main driver of progress** (player wins by orders, logistics, and buildings changing survivability and camp outcomes).
- **Fast arcade tempo** (combat should breathe via suppression, hesitation, fallback, resupply).

## What The Next Card Should Not Have To Guess

When `CARD-002` starts, it should treat these as the authoritative seams:

- Town data starts life near `src/game/arena.ts` (layout + POIs), but the durable owner should be `src/game/war/townState.ts`.
- Camps are not "extract points" -- create them as first-class `camp` entities with health/control/supply fields.
- CLI snapshot should grow a `war.*` section so automation can verify camp health and win condition later.


