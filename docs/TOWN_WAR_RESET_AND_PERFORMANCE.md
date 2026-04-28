# Town War Reset And Performance Notes

Date: 2026-04-27

## Dedicated Dev Server

Use the fork port from `AGENTS.md`:

```powershell
npm run dev -- --host 127.0.0.1 --port 5847 --strictPort
```

Open:

```text
http://127.0.0.1:5847/?debugRaid=1
```

If the port is stuck on Windows, identify only the process bound to `5847` and stop that process:

```powershell
Get-NetTCPConnection -LocalPort 5847 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
Stop-Process -Id <PID> -Force
```

## Clean Runtime Reset

The browser agent API now exposes a clean town-war reset:

```js
window.__topdownExtractionAgentApi.resetTownWar()
```

`resetTownWar()` clears town-war build orders, trench slots, ammo crates, dugouts, placement ghosts, selected soldiers, heatmap/path telemetry, first-minute dismissal state, and the camp-art debug toggle. It re-seeds the current first-town slice as Russian `camp-a` on the right side and Ukrainian `camp-b` as the enemy on the left side.

`stageState("town-war")` uses the same reset path so QA scripts and manual browser tests start from the same clean baseline.

Runtime profiling data is available with:

```js
window.__topdownExtractionAgentApi.getTownWarRuntimeReport()
```

This reports FPS/frame time, town-war counts, scene sprite counts, label counts, display object count, and camp-art visibility.

## Milestone 5 Smoke

Run:

```powershell
npm run smoke:town-war-performance
```

The smoke test uses `http://127.0.0.1:5847/?debugRaid=1`, dirties the battlefield with repeated Russian build orders, advances an accelerated 10-minute town-war simulation, samples frame timing before and after, verifies sprite and label counts remain bounded, resets through `resetTownWar()`, toggles camp art again, reloads the browser, and confirms the reset is still clean.

Artifacts:

- `artifacts/town-war-performance-reset/performance-reset-report.json`
- `artifacts/town-war-performance-reset/01-after-10-minute-sim.png`
- `artifacts/town-war-performance-reset/02-after-api-reset.png`
