# Trench Network Decision Picker

Use this as the short design session. Each item is a place where the shippable version needs a choice.

## 1. Soldier Weapon Depth

Soldiers can be wired to use any weapon in the game, but the first shippable version needs a scope. Do we want trenches to treat weapons as simple role flavor, or should weapon identity strongly change how soldiers hold and fall back?

- Low: soldiers use role-default weapons only. Riflemen, suppressors, builders, medics, and defenders keep predictable guns.
- Mid: soldiers can use any existing weapon, but trench AI groups them into simple behaviors: rifle, automatic, close-range, precision.
- High: every weapon has trench-specific behavior, ammo demand, fallback confidence, suppression style, and emplacement synergy.

Recommendation: Mid. It gives the game real weapon flavor without making every AI decision depend on dozens of weapon-specific branches.

## 2. Trench Building Pieces

Foxhole has connected trench pieces that create long networks. We need to decide whether to mirror that style closely or keep this game more officer-driven and abstract.

- Low: each trench is a standalone fighting position with nearby fallback detection.
- Mid: trenches auto-connect when close enough, forming readable networks with slots, links, and fallback routes.
- High: mirror Foxhole-style pieces with explicit trench connectors, corners, T-junctions, firing bays, bunkers, and player-authored networks.

Recommendation: Mid. Auto-connected networks give us fallback and upgrade depth fast, while keeping placement simple for the first town.

## 3. Fallback Style

Falling back is the core behavior that makes a trench network feel alive. The key choice is how much control the player has versus how much soldiers decide for themselves.

- A: RimWorld-like. Soldiers evaluate needs, danger, ammo, morale, and job priority, then fallback automatically if their current trench is failing.
- B: Officer doctrine. The player marks fallback lines and doctrine, then soldiers follow those rules unless panic or injury interrupts.
- C: Tactical command. The player directly orders fallback from trench to trench during the fight.

Recommendation: B with some A. The player should set intent, but soldiers should still make survival decisions when the line collapses.

## 4. Upgrade Complexity

Trench upgrades can become the heart of the war, but the first shippable version should avoid a huge construction catalog.

- Low: three upgrades only: sandbags, ammo shelf, MG bay.
- Mid: six upgrades: sandbags, duckboards, ammo shelf, MG bay, firing slits, dugout link.
- High: full upgrade family: survival, firepower, logistics, information, command, and late-game bunker modules.

Recommendation: Low first, Mid next. Ship the smallest upgrade set that proves different trench roles.

## 5. MG Emplacement Behavior

MG emplacements should feel powerful, but they can easily become either useless or overpowered.

- Low: MG bay is a static range and suppression bonus for any suppressor in the slot.
- Mid: MG bay consumes ammo heavily, suppresses a lane, covers fallback, and is slow to abandon.
- High: MG bay has arcs, overheating, barrel changes, crew roles, ammo belts, and counterplay from grenades or flanks.

Recommendation: Mid. The important fantasy is "this bay holds the lane if fed," not a full machine gun simulator.

## 6. Network Capture

If trenches can be lost, the next question is whether enemies can occupy them. This has big gameplay consequences.

- Low: trenches can be abandoned or disabled, but not captured.
- Mid: enemies can contest and neutralize trenches, but not fully use upgrades yet.
- High: enemies can capture, occupy, repair, upgrade, and use the same trench network against the player.

Recommendation: Low for the first shippable fallback milestone. Add capture after fallback is reliable.

## 7. Player UI Control

The system needs controls, but too many buttons will turn it into an RTS console.

- Low: click trench, choose one upgrade, see occupants and ammo.
- Mid: click trench, choose upgrade, doctrine, fallback link, and priority.
- High: full trench planner with piece browser, network graph, doctrine editor, and per-slot assignment.

Recommendation: Mid eventually, but Low for the first playable pass. The CLI should prove the deeper controls before the UI gets them.

## 8. First Shippable Slice

The feature needs a first vertical slice that proves the fantasy without building the whole Foxhole war.

- Low: one forward trench and one fallback trench. Soldier falls back under pressure.
- Mid: forward trench, connection, second-line trench, ammo shelf, MG bay, and one fallback event.
- High: multi-branch trench network with upgrades, doctrine, casualty rescue, capture, and counterattack.

Recommendation: Mid. It gives enough drama to test the real fantasy: "the first line breaks, the second line saves the camp."

## 9. CLI First Commands

Agents need a simple command surface before UI polish.

- Low: `war-trench-network report` and `war-trench-fallback-test`.
- Mid: add `war-trench-upgrade`, `war-trench-doctrine`, and `war-trench-link`.
- High: add full scenario scripting for pressure, capture, repair, resupply, and counterpush.

Recommendation: Mid. It is enough for other agents to build and test fallback plus upgrades without needing the live UI.

## 10. Default Decision Set

If we want to start building without more debate, use this set:

- Soldier weapons: Mid.
- Trench pieces: Mid auto-connected networks.
- Fallback: B with some A.
- Upgrade complexity: Low first, then Mid.
- MG behavior: Mid.
- Capture: Low for now.
- UI: Low first.
- First slice: Mid.
- CLI: Mid.

This means the first build is: connected trenches, one fallback path, one ammo shelf, one MG bay, one soldier falling back under pressure, and a CLI report that explains why it happened.
