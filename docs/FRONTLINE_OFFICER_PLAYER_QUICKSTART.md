# Frontline Officer Player Quickstart

Date: 2026-04-27

## Current Slice

`Frontline Officer` is currently a single-player first-town prototype. You play as the Russian-side officer at `camp-a` on the right side of the map. The Ukrainian enemy camp is `camp-b` on the left side.

The current goal is to shape the first fight with build orders and priorities:

- place trenches, ammo crates, and dugouts;
- add sandbags and wire to trench networks;
- rotate trenches so their firing side faces the enemy;
- watch named soldiers build, occupy, resupply, suppress, rescue, and fight;
- use the officer tools to understand why a position held or failed;
- order a small push group that creates route beats and scars before contact;
- prepare demolition stock and breach visible Ukrainian camp weak points;
- end the operation to bank supplies, carry named soldier records forward, and read what mattered;
- push toward destroying the enemy camp.

This is not the final public UI. The current UI is a playable/debuggable hardening slice meant to prove the `RimWorld + Foxhole` frontline fantasy.

## Run The Game

From this project folder:

```powershell
npm install
npm run dev -- --host 127.0.0.1 --port 5847 --strictPort
```

Open:

```text
http://127.0.0.1:5847/?debugRaid=1
```

The dedicated dev port is `5847`. The dedicated preview port is `5848`.

## First Five Minutes

1. Look for `Russian camp online`.
   Your camp is on the right. The enemy camp is on the left.

2. Press `Place trench` in the first-minute rail, or use the subtle `Build` button.
   A trench ghost appears under the mouse.

3. Move the mouse to choose the trench site.
   Put it between your Russian camp and the enemy pressure.
   If the ghost is near an existing Russian trench endpoint, it snaps to extend the network; if it is perpendicular near a segment, it snaps as a branch.

4. Scroll the mouse wheel to rotate the trench.
   The trench is directional. Bad facing can make the trench weaker.

5. Left-click the ground to issue the build order.
   A named soldier should travel to the site and build under risk.

6. Open `Orders`.
   Use `Build`, `Priorities`, `Push`, `Camp`, and `Debrief` to see who is working, who is moving, and what the fight is doing to the camp.

7. Watch the trench.
   A useful trench should show real occupied bays, soldier names, firing reads, suppression reads, ammo support, and danger reads.

8. Add support if the position stalls.
   Ammo crates now feed connected trench networks, dugouts link to connected trench segments, sandbags strengthen the firing side, and wire slows assaults while warning when it risks blocking retreat.

## Useful Debug Controls

- `Build`: opens the compact build strip.
- `Orders`: opens the RimWorld-like officer tools.
- `Art On/Off`: hides or restores decorative Russian camp art so trenches and soldiers are easier to debug.
- Hover or look near a soldier to see a subtle name/role read.
- `Esc`: cancels active placement.
- Mouse wheel during trench or dugout placement: rotates the preview.

These controls are intentionally visible during hardening. They are not all final-fiction UI.

## Clean Reset

In the browser console:

```js
window.__topdownExtractionAgentApi.resetTownWar()
```

This resets the town-war slice to a clean Russian `camp-a` start, clears build orders and placed structures, clears placement ghosts, restores camp art, and resets runtime telemetry.

`stageState("town-war")` uses the same clean path:

```js
window.__topdownExtractionAgentApi.stageState("town-war")
```

## Building Combo Debug Surface

The current hardening API can inspect whether a trench line is actually supported:

```js
window.__topdownExtractionAgentApi.getTownWarBuildingComboReport()
```

Useful direct upgrade calls while testing:

```js
window.__topdownExtractionAgentApi.orderTownWarSandbags({ campId: "camp-a", segmentId: "<segment-id>" })
window.__topdownExtractionAgentApi.orderTownWarWire({ campId: "camp-a", segmentId: "<segment-id>" })
```

The report should make the line readable: ammo linked, dugout linked, sheltering soldiers, sandbag side bonus, wire slowdown, and warnings such as `Ammo too far`, `Dugout not linked`, `Wire blocks retreat`, `Flank open`, and `Grenade danger`.

## Colony Work Queue Debug Surface

The priority pane now includes a small work queue that names who owns active jobs and what the job is costing them. The same read is available from the browser console:

```js
window.__topdownExtractionAgentApi.getTownWarWorkQueueReport({ campId: "camp-a" })
```

Use this when checking whether the RimWorld-like priority layer is actually influencing the war. The report should name builders, suppressors, medics, haulers, defenders, exhausted soldiers, and stalled rescue/build consequences.

## Expedition Push Debug Surface

The `Push` tab sends four to five named Russian soldiers from `camp-a` toward one objective:

- `Extend trench`
- `Stock line`
- `Probe approach`

The same read is available from the browser console:

```js
window.__topdownExtractionAgentApi.orderTownWarExpedition({ campId: "camp-a", objective: "probe-enemy-approach" })
window.__topdownExtractionAgentApi.getTownWarExpeditionReport()
```

You can also order a fallback:

```js
window.__topdownExtractionAgentApi.requestTownWarExpeditionRetreat({ expeditionId: "<expedition-id>" })
```

The report should show named soldiers, route progress, danger, route beats such as `spotted`, `pinned`, `low-ammo`, `wounded`, and `retreating`, plus route scars like `road crossing hot`.

## Camp Breach Debug Surface

The `Push` tab now also shows demolition stock and Ukrainian camp weak points: command core, spawn dugout, ammo dump, radio mast, and bunker entrance. Prep stock, then breach a weak point:

```js
window.__topdownExtractionAgentApi.prepareTownWarDemolition({ campId: "camp-a" })
window.__topdownExtractionAgentApi.orderTownWarCampBreach({ attackerCampId: "camp-a", targetCampId: "camp-b", weakPointKind: "ammo-dump" })
window.__topdownExtractionAgentApi.getTownWarCampDamageReport({ campId: "camp-b" })
```

The report should show weak-point health/status, active breach teams, demolition stock, camp supply/readiness changes, and debrief lines explaining whether the assault stalled or succeeded.

## Complete Operation Loop Debug Surface

The `Debrief` tab now closes the first-town loop:

```js
window.__topdownExtractionAgentApi.prepareTownWarOperation({ ammo: 410, build: 410, food: 260, med: 150 })
window.__topdownExtractionAgentApi.startNextTownWarOperation()
window.__topdownExtractionAgentApi.endTownWarOperation()
window.__topdownExtractionAgentApi.getTownWarOperationReport()
```

The operation debrief should explain supply banked back to protected reserves, supply lost or spent, which trench combo mattered, who worked or carried wounds forward, which route was dangerous, what Ukrainian camp weak point was damaged, and what to build or bring next.

## Verification Commands

Use these before judging the slice:

```powershell
npm run build
npm run smoke:town-war-loop
npm run smoke:town-war-network
npm run smoke:town-war-combos
npm run smoke:town-war-work-queue
npm run smoke:town-war-expedition
npm run smoke:town-war-breach
npm run smoke:town-war-operation-loop
npm run smoke:town-war-shipping
npm run smoke:town-war-performance
```

Important artifact folders:

- `artifacts/town-war-playable-loop/`
- `artifacts/town-war-performance-reset/`
- `artifacts/town-war-work-queue/`
- `artifacts/town-war-expedition/`
- `artifacts/town-war-camp-breach/`
- `artifacts/town-war-operation-loop/`

## Current Caveats

- The first town is playable as a prototype, not a finished public release.
- The long-term war can still feel stale after first contact.
- Trench networks now snap, extend, branch, and share ammo/dugout support, but they still need richer trench-mouth editing and more polished combo controls.
- Building synergy is now inspectable through combo reports, and work ownership is visible in the priority pane, but the live UI still needs to explain combinations and stalled jobs without debug-console help.
- Expeditions now create named route stories and scars, but they are still a first-town threshold model rather than a full terrain graph with player-authored routes.
- Camp breach now damages weak points and degrades enemy camp capacity, but the map feedback is still mostly UI/report driven and should gain stronger world-space weak-point art.
- Protected operation banking and debrief carryover are now live, but they still need a fuller stash-facing campaign surface before this feels like a complete metagame.
- The UI still includes hardening/debug surfaces that should be refined before public shipping.
