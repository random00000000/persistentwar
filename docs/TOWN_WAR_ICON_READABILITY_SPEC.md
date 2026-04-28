# Town War Icon Readability Spec

## Purpose

The current first-town war slice has enough simulation depth that players can miss why a position is winning, failing, or idle. This spec defines a cohesive icon feedback layer for trenches, ammo crates, dugouts, and soldier states so the battlefield explains itself without becoming a pure RTS console.

The goal is not more panel text. The goal is that a player can look at the town and answer:

- Is this trench online?
- Is it firing?
- If not, what is missing?
- Is this ammo crate stocked, low, empty, linked, or unreachable?
- Is this dugout placed correctly?
- Which soldiers are building, firing, pinned, wounded, rescuing, resupplying, or retreating?
- Which missing condition should I fix next?

## Design Principles

1. World-space first, panel second.
   Icons belong near the thing they explain. Panels can expand detail, but the map must carry the first read.

2. One icon grammar across systems.
   The same symbols should mean the same thing for trenches, crates, dugouts, and soldiers. For example, ammo is always a magazine/box symbol, medical is always a cross, pathing is always a route/arrow symbol, and danger is always a warning triangle.

3. Show readiness before detail.
   Each object gets one primary state badge: `online`, `working`, `blocked`, `missing input`, `danger`, or `disabled`. Secondary missing-reason icons appear only when needed.

4. Prefer icons plus short hover text.
   The normal playfield should use icons, color, pulse, and placement. Hover or inspect mode can reveal short text such as `Needs ammo`, `No firing slot`, or `Dugout not linked`.

5. Do not cover the fight.
   Icons should live above or beside the object, not over soldiers or muzzle lanes. They should scale down with zoom and fade when the camera is far away.

6. Debug truth and player truth must match.
   Any icon state should be backed by the same controller/report truth used by smoke tests and CLI reports. No decorative status icons.

## Visual Language

Use a small, consistent set of icon shapes. Implementation can use DOM overlay icons, Phaser text glyphs, or a sprite atlas, but the semantic set should stay stable.

| Meaning | Icon Concept | Color | Motion |
| --- | --- | --- | --- |
| Online / usable | check or solid dot | muted green | none |
| Working / executing | hammer or gear | pale amber | slow tick pulse |
| Firing / active attack | muzzle flash or chevron burst | warm yellow | short pulse on shot |
| Suppressing | stacked chevrons | yellow-orange | soft repeating pulse |
| Needs ammo | magazine or ammo box | amber | blink every 2s |
| Low ammo | half magazine | amber | none |
| Empty ammo | crossed magazine | red-orange | slow blink |
| Needs worker | hardhat or person outline | amber | none |
| Needs cover / exposed | shield outline | red-orange | slow pulse |
| No line of fire | blocked eye or crossed sightline | gray | none |
| Path blocked / unreachable | broken route arrow | red | none |
| Linked / connected | chain link | muted blue | none |
| Not linked | broken chain | amber | none |
| Wounded / casualty | medical cross | red | slow pulse |
| Rescue active | cross plus arrow | white/green | slow moving arrow |
| Retreat / fallback | rear arrow | pale blue | slow directional pulse |
| Danger / under threat | warning triangle | red | pulse only when threat is live |
| Disabled / destroyed | X or cracked badge | gray-red | none |

Color should not be the only carrier. Every critical state needs a distinct silhouette.

## Icon Stack Rules

Objects should never display a long row of unrelated badges. Use a hierarchy:

1. Primary badge: the object's current operating state.
2. Missing reason: the highest-priority blocker, if blocked.
3. Optional support badges: linked ammo, dugout, wire/sandbag support, or active fire.

Priority order for blockers:

1. Destroyed or disabled.
2. Path blocked or unreachable.
3. No worker or no soldier occupying/using it.
4. No ammo or supply.
5. No valid firing direction or no enemy in arc/range.
6. Suppressed, pinned, or too dangerous.
7. Low efficiency warnings such as exposed builders or weak support.

If multiple blockers exist, show the highest-priority icon in the primary slot and place the rest behind hover/inspect detail.

## Trench Feedback

### Trench Primary States

| State | Badge | Player Read |
| --- | --- | --- |
| Planned | outline hammer | Ordered, not built yet. |
| Building | hammer pulse | Soldiers are digging or moving to dig. |
| Built idle | green dot | Trench exists but is not currently firing. |
| Occupied | helmet/check | Soldiers are in slots. |
| Firing | muzzle burst | Occupied soldiers are attacking from the trench. |
| Suppressing | chevrons | Trench is applying pressure but may not be killing. |
| Blocked | warning plus reason | Trench cannot contribute. |
| Overrun / unsafe | red warning | Enemy pressure makes the trench dangerous. |
| Disabled / destroyed | cracked X | Trench no longer functions. |

### Why Is This Trench Not Firing?

When a built trench is not firing, it should expose exactly one primary reason:

| Reason | Icon | Short Hover Text |
| --- | --- | --- |
| No soldier in firing slot | person outline | `No one occupying firing slot` |
| Soldier present but no ammo | crossed magazine | `Occupant out of ammo` |
| Network ammo missing | crossed ammo box | `No linked ammo support` |
| Wrong facing | crossed sightline | `Trench faces away from enemy` |
| No enemy in range | dim sightline | `No target in arc` |
| Occupants pinned | warning chevrons | `Occupants suppressed` |
| Builder/occupant wounded | medical cross | `Soldier down in trench` |
| Retreat path blocked by wire | broken rear arrow | `Retreat path blocked` |
| Path to trench blocked | broken route arrow | `Cannot reach trench` |

### Trench Online Definition

A trench is `online` when:

- it is complete;
- at least one firing slot is reachable;
- its firing side has a valid arc toward expected enemy pressure;
- it can be occupied by a soldier;
- the occupant has ammo or linked ammo support exists;
- it is not destroyed or fully overrun.

An online trench can still be idle if no enemy is in range. That should display `online idle`, not `broken`.

### Trench Support Badges

Support badges should appear as small secondary icons around the trench badge:

- linked ammo crate: chain + ammo box;
- linked dugout: chain + bunker/dugout;
- sandbag front bonus: shield;
- wire nearby: coil/wire;
- bad wire placement: warning + rear arrow;
- exposed build: warning + hammer;
- occupied slots: small count chip such as `3/5`.

Do not display every support badge at once by default. In normal mode, show the most tactically relevant two. In inspect mode, show all.

## Ammo Crate Feedback

### Ammo Crate Primary States

| State | Badge | Player Read |
| --- | --- | --- |
| Planned | outline ammo box | Ordered, not built yet. |
| Building | hammer + ammo box | Soldiers are constructing or stocking it. |
| Stocked | ammo box check | Has useful ammo. |
| Feeding | chain + ammo pulse | Actively supporting nearby or networked trenches. |
| Low | half ammo box | Ammo is almost gone. |
| Empty | crossed ammo box | No longer supports firing. |
| Unlinked | broken chain | Stock exists, but no trench uses it. |
| Unreachable | broken route arrow | Soldiers cannot reach it. |
| Looted / destroyed | cracked ammo box | Gone or unusable. |

### Ammo Thresholds

Use consistent thresholds:

- `stocked`: above 35% of intended capacity;
- `low`: above 0 and at or below 35%;
- `empty`: 0;
- `feeding`: ammo decreased recently because a trench or soldier drew from it.

If exact capacity varies by crate type, the icon logic should use percentage and the hover can show exact amount.

### Ammo Hover Text

Hover or inspect mode should answer:

- `Stock: 127/220`
- `Feeding: 3 trench slots`
- `Linked: North trench network`
- `Missing: no connected trench`
- `Problem: route blocked`
- `Recent drain: -24 ammo in 30s`

## Dugout Feedback

### Dugout Primary States

| State | Badge | Player Read |
| --- | --- | --- |
| Planned | outline dugout | Ordered, not built yet. |
| Building | hammer + dugout | Soldiers are digging it. |
| Linked shelter | chain + shield | Correctly supports a nearby trench network. |
| Shelter active | shield pulse | Wounded/suppressed soldiers are using it. |
| Rally active | flag/arrow | Reinforcements can stage from it. |
| Too far / unlinked | broken chain | Dugout is placed but not supporting the line. |
| Exposed | warning + shield | Dugout is too close to enemy pressure or open ground. |
| Full | shield + count | Shelter is occupied to capacity. |
| Damaged | cracked shield | Support is degraded. |

### Is The Dugout Placed Correctly?

A dugout is `placed correctly` when:

- it is behind or beside the trench line, not in front of the firing edge;
- it is within link range of at least one trench segment or trench network;
- a route from camp or rear supply exists;
- it is not so close to enemy pressure that sheltering soldiers immediately re-enter lethal fire;
- it improves at least one behavior: rally, shelter, recovery, reinforcement, or trench occupation priority.

If not placed correctly, show the highest-priority placement problem:

| Problem | Icon | Short Hover Text |
| --- | --- | --- |
| No trench link | broken chain | `Too far from trench network` |
| In front of line | warning + rear arrow | `Dugout is exposed forward of line` |
| Route blocked | broken route arrow | `No safe path from camp` |
| No shelter effect | dim shield | `No soldiers can shelter here` |
| Enemy pressure too close | red warning | `Dugout under direct pressure` |

## Soldier State Feedback

Soldier icons should be small and transient. The player should see what a soldier is doing without turning every soldier into a UI stack.

### Soldier Primary States

| State | Badge | Player Read |
| --- | --- | --- |
| Moving to order | route arrow | Following an officer or work order. |
| Building | hammer | Constructing a trench, crate, dugout, or support object. |
| Occupying cover | shield | Taking or holding cover. |
| Firing | muzzle burst | Currently shooting. |
| Suppressing | chevrons | Firing to pin rather than kill. |
| Resupplying | ammo box | Carrying or drawing ammo. |
| Low ammo | half magazine | Needs resupply soon. |
| Out of ammo | crossed magazine | Cannot keep fighting. |
| Pinned | warning chevrons | Suppressed and not advancing. |
| Wounded/downed | medical cross | Needs rescue or treatment. |
| Rescuing | cross + arrow | Moving to recover a casualty. |
| Carrying wounded | cross + person | Extracting or dragging casualty. |
| Retreating | rear arrow | Falling back by logic or order. |
| Resting/recovering | bed/plus | Recovering fatigue or wounds. |
| Confused/stalled | question mark + warning | Has no useful task or path. |

### Soldier Icon Discipline

Only one soldier badge should be visible by default:

- show the current task if healthy;
- show `low ammo` only when it affects combat;
- show `pinned`, `wounded`, or `retreating` over ordinary task states;
- show rescue/carry states because they are story-critical;
- use hover/inspect for details such as name, role, fatigue, task owner, and reason.

Named soldier hover should combine identity and consequence:

`Vira Rus-1 | Builder | Digging north trench | Exposed | Ammo nearby`

## Cohesive Readability Modes

### Normal Mode

Normal play should show:

- primary icon for selected/hovered object;
- primary icon for objects with warnings;
- muzzle/fire pulses only when firing;
- casualty/rescue icons always, because they are urgent;
- low/empty ammo icons when they affect active fighting.

Normal mode should not show every online trench and stocked crate all the time.

### Officer Inspect Mode

Inspect mode should show the full network truth:

- trench online/offline badges;
- occupied slot counts;
- ammo links;
- dugout links;
- missing blockers;
- active routes;
- soldier task badges;
- weak camp support lines if relevant.

This can be bound to an existing officer tool, hover state, or a temporary key later.

### Build Preview Mode

While placing trenches, crates, and dugouts, show predicted icons before placement:

- trench firing arc;
- expected enemy-facing side;
- linked or unlinked ammo;
- linked or unlinked dugout;
- exposed builder risk;
- bad retreat/wire warning;
- path from camp;
- `will support X slots` when valid.

This is where the player learns the system before paying the cost.

## Implementation Model

Future implementation should add a single read-model layer rather than scattering icon decisions through rendering code.

Suggested shape:

```ts
type ReadabilityIconTone = "ok" | "working" | "warn" | "danger" | "disabled" | "info";

interface TownWarReadabilityIcon {
  id: string;
  targetType: "trench" | "ammo-crate" | "dugout" | "soldier" | "camp";
  targetId: string;
  icon: string;
  tone: ReadabilityIconTone;
  priority: number;
  label: string;
  shortReason: string;
  detailLines: string[];
  worldX: number;
  worldY: number;
  visibility: "normal" | "inspect" | "build-preview";
  pulse?: "none" | "slow" | "shot" | "danger";
}
```

Recommended controller/report entry points:

- `getTownWarTrenchReadabilityIcons()`
- `getTownWarAmmoCrateReadabilityIcons()`
- `getTownWarDugoutReadabilityIcons()`
- `getTownWarSoldierReadabilityIcons()`
- `getTownWarReadabilityOverlay()`

The overlay should be snapshot-friendly so smoke tests can assert reasons without image-only verification.

Current implementation note:

- `getTownWarReadabilityOverlay()` now owns normal, inspect, and build-preview icons.
- Build-preview icons use `visibility: "build-preview"` and are counted under `totals.buildPreview`.
- Officer inspect mode is currently triggered by the `Priorities` officer pane and reveals inspect-only support truth in the world layer.
- Operation debrief building lines reuse top live readability reasons, for example `Readability Ammo crate empty: No ammo left to support firing.`

## Acceptance Checks

An implementation pass is good enough when these questions can be answered from a screenshot plus hover/inspect:

1. Which trenches are online?
2. Which trenches are firing right now?
3. For each non-firing trench, what is the top missing condition?
4. Which ammo crates are stocked, low, empty, feeding, or unlinked?
5. Which dugouts are linked correctly, misplaced, active as shelter, or damaged?
6. Which soldiers are building, firing, pinned, wounded, rescuing, resupplying, or retreating?
7. Can the player tell whether a trench failed because of facing, ammo, occupancy, pathing, suppression, or enemy absence?
8. Can the player tell what one action would most likely fix the position?

Suggested smoke proof:

- place a trench facing the wrong way and verify `wrong facing`;
- place a correct trench with no occupant and verify `no firing slot occupied`;
- occupy a trench with no ammo and verify `needs ammo`;
- link a stocked crate and verify `online` then `firing`;
- drain the crate and verify `low` then `empty`;
- place a dugout too far from the trench and verify `not linked`;
- place a linked dugout and down a soldier nearby, then verify `shelter active` or rescue flow;
- pin one soldier and wound another, then verify state icons remain distinct.

## Anti-Patterns

- Do not add a permanent legend that explains every icon while covering the battlefield.
- Do not make each building display five badges at all times.
- Do not use color-only distinction for low/empty/danger states.
- Do not invent different ammo, medical, or path icons per subsystem.
- Do not hide core failure reasons only inside the Debrief tab.
- Do not show debug-only terms such as internal ids, raw enum names, or controller flags to players.
- Do not let icons imply a state that the simulation cannot prove.

## First Implementation Slice

The first useful slice should be narrow:

1. Add read-model generation for trenches, ammo crates, dugouts, and soldiers.
2. Render primary badges for selected/hovered objects plus warnings.
3. Add inspect mode that reveals all badges and hover reasons.
4. Add build-preview warnings for trench facing, ammo links, dugout links, and path risk.
5. Add one smoke test that proves icon reasons through snapshot/read-model data.

This should directly improve the current operation loop readability without adding new economy, map, or multiplayer scope.
