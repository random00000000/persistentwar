# Ship Readiness Report

Date: 2026-04-27

## Verdict

`Playable with known issues`.

`Frontline Officer` is ready for a controlled internal demo and continued playtesting. It is not ready for a public release. The slice now sells the core idea in moments: the player is the Russian officer on the right-side camp, named soldiers build and fight, trenches are directional, trenches can be occupied by real soldiers, ammo support matters, expeditions and breaches create operation stories, and debriefs carry supplies and named soldier records forward.

The remaining issue is not absence of systems. The issue is that the first-town battle still needs clearer cause-and-effect and a stronger long-term war arc before a new player can understand the whole `RimWorld + Foxhole` fantasy without guidance.

## What Ships In The Current Slice

- Russian `camp-a` player side on the right.
- Ukrainian `camp-b` enemy side on the left.
- One replayable town-war space with autonomous soldiers.
- Officer build tools for trenches, ammo crates, and dugouts.
- Mouse-position building placement with trench and dugout rotation.
- Named soldiers with roles, priorities, skills, needs, morale, ammo, and jobs.
- Soldiers that build, occupy trenches, fire from trenches, resupply, suppress, rescue, and react to pressure.
- Trench advantage that depends on direction, occupation, fire range, suppression, grenade danger, and ammo support.
- Connected trench networks, sandbags, wire, dugouts, ammo support, expeditions, camp weak points, demolition stock, and operation debrief carryover.
- First-minute guidance rail.
- Compact `Build`, `Orders`, `Art On/Off`, priority, camp, and debrief panes.
- Clean town-war reset API and performance/reset smoke coverage.

## Tutorialization

The first minute is much stronger than before. A new player can see the Russian camp, find `Build`, arm a trench ghost, rotate it with the mouse wheel, and open `Orders`. The UI no longer starts as an unexplained simulation wall.

Remaining gap: the game now has the whole operation, but it still does not teach it cleanly enough. A new player may need guidance to connect `trench -> ammo/dugout -> expedition -> breach -> debrief -> next prep`.

## Balance And Combat Readability

Trenches now visibly matter. Occupants are real soldiers, not fake markers. They keep separation, fire weapons, consume ammo, benefit from direction, and can be suppressed or threatened by grenades. Ammo crates can support nearby trench occupants.

Remaining gap: the staged arc now exists in systems and smoke proof, but the battlefield still needs more in-world feedback so the player can see why the line held, why ammo disappeared, and why a weak point broke without opening reports.

## Smoke Test Coverage

Core regression coverage exists for:

- faction correctness;
- Russian camp on the right;
- Ukrainian spawn side;
- trench placement, rotation, occupation, firing, ammo spend, and separation;
- ammo crate support;
- colony-sim work/priorities;
- expedition, camp-breach, and complete operation-loop carryover;
- downed soldier rescue and delegated extraction;
- reset/restart safety;
- performance runaway checks.

Recommended gate before demo:

```powershell
npm run build
npm run smoke:town-war-loop
npm run smoke:town-war-operation-loop
npm run smoke:town-war-shipping
npm run smoke:town-war-performance
```

## Browser QA

Browser QA at `1920 x 1080` confirms the current UI is usable: build placement is visible, the first-minute rail is dismissible, the priority panel is reachable, trench occupation is readable, soldier hover/name reads exist, and camp art can be hidden for debugging.

Remaining gap: camp art is still visually dense when enabled. The `Art On/Off` button makes debugging possible, but a future art pass should make decorative sprites, tactical cover, trench slots, and soldiers read cleanly at the same time.

## Performance And Reset Safety

The current reset path is hardened:

```js
window.__topdownExtractionAgentApi.resetTownWar()
```

`resetTownWar()` clears stale orders, structures, placement ghosts, selected soldiers, camp-art state, and telemetry. The performance/reset smoke advances 600 simulated seconds, checks for bounded sprite/label counts, resets, toggles camp art again, reloads, and confirms the state stays clean.

Known caveat: headless browser RAF timing is low in this environment, so the automated test guards against relative degradation and runaway object counts rather than claiming a true 60 FPS player experience.

## Debug-Only Surfaces

The following should be judged as hardening aids, not final public UI:

- browser console agent API;
- `Art On/Off` camp-art debug toggle;
- first-minute rail wording;
- compact smoke-test screenshots;
- reset/performance artifact reports.

The final game should keep the usefulness of these surfaces while replacing debug language with in-world officer tools.

## Does It Sell RimWorld + Foxhole?

Partially, yes.

The strongest proof is the soldier/building interaction: named NPCs with roles and priorities execute officer build orders, occupy terrain, consume ammo, get pressured, and create readable stories. That is the RimWorld side connecting to the Foxhole side.

The fantasy is closer now because the war can escalate from position-building into an expedition, breach, debrief, and next-operation stockpile. The remaining problem is presentation and pacing: the operation loop exists, but the live battlefield must make those consequences obvious without relying on debug-style reports.

## Priority Gaps Before Public Shipping

1. Operation tutorialization.
   A fresh player needs one guided path through build, support, expedition, breach, debrief, and next prep.

2. Building synergy explanation.
   The UI should clearly explain why trench plus ammo crate plus dugout is better than any one structure alone.

3. World-space debrief feedback.
   The battlefield should visibly point to the trench combo, route danger, supply loss, and weak point damage that the debrief names.

4. Enemy camp destruction readability.
   A new player needs to understand how to damage or destroy the Ukrainian camp.

5. Stash-facing operation banking.
   The operation stockpile works, but the protected stash still needs to become the obvious preparation layer for future pushes.

6. Art readability.
   Decorative camp art should stop competing with soldiers, cover slots, and tactical reads.

7. Subjective performance QA.
   Run a visible browser play session on the target machine before calling it demo-ready outside the dev loop.

## Next Recommendation

Do not add a giant map, multiplayer, tanks, or a deep tech tree yet. The next useful sprint should make the completed operation loop readable to a new player:

`place trench -> build under risk -> occupy -> resupply -> withstand counterplay -> push -> damage enemy camp -> debrief why it worked or failed`.
