# Emergent Frontline AI Behavior Plan

This plan moves Frontline Officer toward a battlefield that feels like RollerCoaster Tycoon or RimWorld in war form: the player watches many small agents follow understandable rules, collide with constraints, react to feedback, and accidentally create memorable combat stories.

The goal is not smarter enemies that all hunt the player. The goal is a real-looking frontline where NPCs do the bulk of the fighting, both teams remain active, and the officer changes the war by placing orders, choosing risks, and intervening only when it matters.

## Current Code Baseline

- `src/game/townWar/controller.ts` already supports two factions, combatants, camps, construction orders, ammo crates, casualties, suppression pressure, retreat movement, resupply trips, camp morale/readiness, match resolution, and drama events.
- Town-war targeting currently uses a nearest-enemy scan over opposite-faction NPC combatants. This is a good NPC-first base, but it is too simple for a believable frontline because it lacks lanes, cover, roles, target memory, tactical intent, and balanced pressure.
- Current demo seeding spawns both teams, but their opening tasks are placeholder movements rather than a deliberate shared frontline around contested sectors.
- The inherited raid simulation and scene still contain many player-centered systems: nearby threats, support incidents, objective marker priority, combat readouts, and enemy pressure are often anchored to `state.player.position`.
- Existing inherited systems worth mining include doctrine states, pressure timers, blind fire, panic, friendly combatants, frontline incidents, tracers, impacts, and objective/debug surfaces.

## Emergence Principles

Use the infographic model directly:

- `Simple rules + interacting agents + feedback loops = emergent play.`
- `Movement + collision + terrain = flanks, chokepoints, and ambushes.`
- `Vision + noise + threat response = attention shifts and accidental chain reactions.`
- `Health + cover + reload + suppression = peeking, timing battles, fallback, and rescue windows.`
- `Scarcity + roles + logistics = ammo crises, priority conflicts, and visible officer consequences.`

Avoid these pitfalls:

- Too much chaos: every agent needs readable intent.
- Too little interaction: squads, cover, ammo, morale, and objectives must influence each other.
- Dominant strategy: the player should not solve every fight by personally drawing all aggro.
- Hidden rules: CLI snapshots and HUD/debug readouts must explain why soldiers chose targets or retreated.
- Excess complexity: start with a few strong rules before adding large behavior trees.

## Milestone 1: Frontline Threat Model And Player De-Centering

**Promise:** Enemy attention stops defaulting to the player. The battlefield itself becomes the main thing AI fights over.

**Status:** Implemented. Town-war soldiers now expose scored `targetIntent`, the war snapshot exposes `aiThreats`, the demo seed starts both teams on a shared road-crossing frontline, and `npm run game:cli -- verify --id frontline-ai-player-decenter` proves the idle officer is not consuming hostile attention.

### Simulation Work

- Add a frontline threat model that scores possible targets instead of always collapsing toward the player or nearest enemy.
- Track threat contacts for each faction or combatant:
  - visible enemy soldiers;
  - recent suppressive fire source;
  - exposed builders;
  - active construction sites;
  - ammo crates and resupply carriers;
  - camp structures;
  - noisy or firing player/officer.
- Add target intent fields to combatants so their current choice is inspectable:
  - `targetKind`: `soldier`, `suppression-source`, `builder`, `camp`, `build-site`, `ammo`, `player`, `fallback`;
  - `targetId`;
  - `targetScore`;
  - `reason`.
- Introduce a `playerThreatShare` budget so only a limited number of hostile NPCs focus the player unless the player is visibly reckless.
- Make player threat event-based:
  - firing raises threat sharply;
  - sprinting or entering close range raises threat modestly;
  - being quiet and behind the line decays threat;
  - threatening a camp or build site raises objective threat.
- Seed both teams toward a shared contested frontline lane instead of placeholder directions.
- Start migrating inherited player-centered readouts toward `frontlineFocus`, `activeLane`, or `officerFocus` anchors.

### Content Needed

- Threat reason labels for debug and future dialogue:
  - `returning fire`;
  - `protecting builder`;
  - `covering ammo run`;
  - `camp under pressure`;
  - `officer exposed`;
  - `enemy suppressor spotted`.
- A small set of named contested sectors for the first town:
  - road crossing;
  - market ruins;
  - school wall;
  - fuel yard approach.

### Acceptance Criteria

- With the player idle behind friendly lines, most hostile fire and movement targets NPCs, camp pressure, or sector objectives.
- If the player fires repeatedly or moves close to the enemy line, a believable subset of enemies reacts without the whole battlefield turning into player aggro.
- Both teams spawn with active orders that push them into the same contested area.
- CLI or debug output can explain why at least five combatants chose their current target.

### Verification

- Add or extend a CLI verification:
  - `npm run game:cli -- verify --id frontline-ai-player-decenter`
- Snapshot fields should include:
  - `war.playerThreatShare`;
  - `war.frontlineFocus`;
  - `war.combatants[*].targetIntent`;
  - `war.threatContacts`;
  - `war.campPressure`.

## Milestone 2: Cover, Suppression, And Small-Unit Tactics

**Promise:** Firefights start looking like a frontline: soldiers pause, seek cover, suppress, reload, hesitate, bound forward, and fall back.

**Status:** Implemented. Town-war state now exposes `aiTactics.coverSlots`, `suppressionFields`, `tacticalPairs`, and `completedConstructionImpact`; soldiers expose `tacticalIntent` and `coverIntent`; completed trenches create cover slots; cover reduces incoming damage/pressure; and `npm run game:cli -- verify --id frontline-ai-cover-suppression` proves the behavior from the CLI.

### Simulation Work

- Add simple cover slots around camps, trenches, barricades, ruins, walls, and active construction.
- Cover slots should have:
  - position;
  - facing or protected direction;
  - occupancy;
  - exposure score;
  - sector/lane id;
  - source object id when created by construction.
- Extend combatant tactical intent with a small number of readable states:
  - `seek-cover`;
  - `hold-cover`;
  - `suppress-area`;
  - `bound-forward`;
  - `reload-behind-cover`;
  - `fallback`;
  - `cover-builder`;
  - `recover-wounded`.
- Let suppression change behavior rather than only acting as a damage modifier:
  - pinned soldiers advance slower or stop;
  - suppressed soldiers fire less accurately;
  - soldiers under high pressure prefer cover or fallback;
  - nearby suppressors can hold fire on a sector to let riflemen move;
  - builders delay construction or request cover when a site is too hot.
- Add basic pair behavior:
  - one soldier suppresses while another moves;
  - a builder prefers working when at least one friendly covers the site;
  - ammo runners avoid the hottest route if an alternate exists.
- Make trenches and completed cover visibly matter by reducing damage, pressure gain, or exposure.

### Content Needed

- Cover and tactical beat labels:
  - `pinned behind wall`;
  - `covering advance`;
  - `reload window`;
  - `builder waiting for fire support`;
  - `falling back under pressure`;
  - `holding trench line`.
- First-town cover sources:
  - existing camp barricades;
  - market stalls or ruined walls;
  - road craters;
  - completed trenches;
  - ammo positions.

### Acceptance Criteria

- In a no-player simulation, both teams exchange fire for a sustained period without instantly rushing into each other.
- Suppressed soldiers visibly change behavior: hold, miss more, retreat, or seek cover.
- Completed cover changes survivability or suppression outcomes in an inspectable way.
- At least one build order creates a new cover slot that later influences an NPC decision.
- The fight remains readable: every tactical state has a short reason.

### Verification

- Add or extend a CLI verification:
  - `npm run game:cli -- verify --id frontline-ai-cover-suppression`
- Snapshot fields should include:
  - `war.coverSlots`;
  - `war.suppressionFields`;
  - `war.combatants[*].tacticalIntent`;
  - `war.combatants[*].coverIntent`;
  - `war.tacticalPairs`;
  - `war.completedConstructionImpact`.

## Milestone 3: Frontline Director, Reserves, And Cinematic Battle Read

**Promise:** The battle becomes watchable long-term: local pushes, reversals, ammo crises, trench holds, casualty recovery, reinforcements, and post-battle stories emerge from systems.

### Simulation Work

- Add a lightweight frontline director that observes the war without scripting exact outcomes.
- Track contested lanes or sectors:
  - pressure by faction;
  - living soldiers;
  - suppressed soldiers;
  - ammo level;
  - cover advantage;
  - active build orders;
  - casualties and body recovery need;
  - camp health/readiness.
- Let each side commit reserves based on resources and need:
  - rifle pair;
  - suppressor;
  - builder/logistics runner;
  - medic/recovery role;
  - camp defender.
- Keep balancing diegetic:
  - reinforcements require camp readiness or supply;
  - weak sides can stabilize through fallback and cover, not invisible rubber-banding;
  - strong sides can overextend and create counterattack windows.
- Add a cinematic battle read layer that summarizes the current battle shape:
  - `probing attack`;
  - `road crossing pinned`;
  - `ammo run under fire`;
  - `trench line holding`;
  - `builder lost at the site`;
  - `camp defenders wavering`;
  - `counterpush forming`;
  - `line collapse`.
- Feed major AI outcomes into the existing drama and debrief surfaces so long-term character and location memory can reference real battlefield causes.

### Content Needed

- Named frontline lane states:
  - `quiet`;
  - `skirmishing`;
  - `pinned`;
  - `pushing`;
  - `collapsing`;
  - `recovering`;
  - `overextended`.
- Reserve call reasons:
  - `line undermanned`;
  - `ammo route exposed`;
  - `builder needs escort`;
  - `camp taking fire`;
  - `counterpush opportunity`;
  - `casualties need recovery`.
- Cinematic battle report phrases for post-fight memory:
  - `held the road under suppression`;
  - `lost the trench before the ammo arrived`;
  - `counterattacked after the enemy ran dry`;
  - `saved the build crew with covering fire`;
  - `collapsed when the suppressor went down`.

### Acceptance Criteria

- With no player intervention, both teams fight for at least 90 seconds with visible pressure changes, casualty changes, and resource changes.
- At least one local reversal can occur because of ammo, suppression, cover, reserves, or morale.
- The director can explain the current battle state in one concise readout.
- Both sides continue to participate unless they are legitimately exhausted, routed, or defeated by camp destruction.
- Drama events come from actual AI outcomes, not prewritten cutscene timing.

### Verification

- Add or extend CLI verifications:
  - `npm run game:cli -- verify --id frontline-ai-balanced-war`
  - `npm run game:cli -- showcase --id ai-frontline-battle`
- Snapshot fields should include:
  - `war.frontlineLanes[*].pressure`;
  - `war.frontlineLanes[*].state`;
  - `war.aiDirector`;
  - `war.reserveCommitments`;
  - `war.cinematicBattleRead`;
  - `war.dramaEventsFromAi`.

## Implementation Order

1. Build the threat model first so the player stops acting like the center of all enemy attention.
2. Add cover and tactical intent after target choice is inspectable.
3. Add the director only after individual soldiers can already make believable local decisions.

## Definition Of Done For The Three-Milestone Slice

- NPCs from both teams fight each other without player input.
- The player can still become a threat, but only through visible, explainable actions.
- Soldiers have readable reasons for targeting, moving, holding, retreating, or suppressing.
- Cover, ammo, morale, and construction create different battle outcomes across repeated runs.
- A CLI verification can prove the war is balanced enough to watch before browser polish.
- The game starts to feel like a Foxhole-style frontline where NPCs carry the war and the officer shapes the conditions.

## Non-Goals

- No full behavior-tree rewrite in the first pass.
- No multiplayer dependency.
- No giant world map.
- No invisible rubber-band balancing.
- No pure RTS control layer.
- No lore-only drama that is disconnected from simulation events.
