import { spawn, spawnSync } from "node:child_process";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";

const host = "127.0.0.1";
const port = 5851;
const url = `http://${host}:${port}/?debugRaid=1`;

function getServerCommand() {
  if (process.platform === "win32") {
    return {
      command: process.env.ComSpec || "cmd.exe",
      args: ["/d", "/s", "/c", `npm run dev -- --host ${host} --port ${port} --strictPort`]
    };
  }

  return {
    command: "npm",
    args: ["run", "dev", "--", "--host", host, "--port", `${port}`, "--strictPort"]
  };
}

async function waitForServer(serverUrl, timeoutMs) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(serverUrl);
      if (response.ok) {
        return;
      }
    } catch {
      // Server is still starting.
    }

    await delay(250);
  }

  throw new Error(`Timed out waiting for ${serverUrl}`);
}

async function runTownWarTrenchSmoke() {
  const serverCommand = getServerCommand();
  const server = spawn(serverCommand.command, serverCommand.args, {
    stdio: ["ignore", "pipe", "pipe"],
    shell: false
  });

  let serverOutput = "";
  const appendOutput = (chunk) => {
    serverOutput += chunk.toString();
    if (serverOutput.length > 8000) {
      serverOutput = serverOutput.slice(-8000);
    }
  };
  server.stdout.on("data", appendOutput);
  server.stderr.on("data", appendOutput);

  const cleanup = () => {
    if (!server.killed) {
      if (process.platform === "win32" && server.pid) {
        spawnSync("taskkill", ["/pid", String(server.pid), "/t", "/f"], { stdio: "ignore" });
      } else {
        server.kill();
      }
    }
  };

  process.on("exit", cleanup);
  process.on("SIGINT", () => {
    cleanup();
    process.exit(130);
  });
  process.on("SIGTERM", () => {
    cleanup();
    process.exit(143);
  });

  try {
    await waitForServer(url, 15000);
    const browser = await chromium.launch({ headless: true });

    try {
      async function runRealtimeClockScenario() {
        const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
        await page.goto(url, { waitUntil: "networkidle" });
        await page.waitForFunction(() => Boolean(window.__topdownExtractionAgentApi));

        try {
          await page.evaluate(() => {
            window.__topdownExtractionAgentApi.stageState("town-war");
          });
          const before = await page.evaluate(() => window.__topdownExtractionAgentApi.getSnapshot().war.townWar.clock.seconds);
          await page.waitForTimeout(1400);
          const after = await page.evaluate(() => window.__topdownExtractionAgentApi.getSnapshot().war.townWar.clock.seconds);
          return { before, after, elapsed: after - before };
        } finally {
          await page.close();
        }
      }

      async function runInitialRussianCampScenario() {
        const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
        await page.goto(url, { waitUntil: "networkidle" });
        await page.waitForFunction(() => Boolean(window.__topdownExtractionAgentApi));

        try {
          return await page.evaluate(() => {
            const api = window.__topdownExtractionAgentApi;
            api.stageState("town-war");
            const start = api.getSnapshot().war.townWar;
            api.advanceTownWar({ seconds: 40, tickSeconds: 0.25 });
            const after = api.getSnapshot().war.townWar;
            const camp = start.camps.find((entry) => entry.id === "camp-a");
            const focus = start.aiThreats.frontlineFocus.position;
            const summarize = (snapshot) =>
              snapshot.soldiers
                .filter((soldier) => soldier.faction === "camp-a")
                .slice(0, 3)
                .map((soldier) => ({
                  id: soldier.id,
                  name: soldier.displayName,
                  role: soldier.role,
                  task: soldier.task.kind,
                  label: soldier.task.label,
                  distanceToCamp: Math.hypot(soldier.position.x - camp.spawn.position.x, soldier.position.y - camp.spawn.position.y),
                  distanceToFocus: Math.hypot(soldier.position.x - focus.x, soldier.position.y - focus.y)
                }));

            return {
              start: summarize(start),
              after: summarize(after)
            };
          });
        } finally {
          await page.close();
        }
      }

      async function runScenario(facingMode) {
        const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
        await page.goto(url, { waitUntil: "networkidle" });
        await page.waitForTimeout(1000);

        try {
          return await page.evaluate((mode) => {
            const api = window.__topdownExtractionAgentApi;
            api.deployTownWarOfficer({ campId: "camp-a" });
            const focus = api.focusTownWarLane({ campId: "camp-a", lane: "mid" });
            const holdAssignment = focus.focus.assignments.find((assignment) => assignment.task?.targetPosition);
            const target = holdAssignment?.task?.targetPosition ?? api.getSnapshot().war.townWar.aiThreats.frontlineFocus.position;
            const enemyCamp = api.getSnapshot().war.townWar.camps.find((camp) => camp.id === "camp-b");
            const enemyPosition = enemyCamp?.spawn?.position ?? { x: target.x - 500, y: target.y };
            const enemyAngle = Math.atan2(enemyPosition.y - target.y, enemyPosition.x - target.x);
            const angle = mode === "good" ? enemyAngle + Math.PI / 2 : enemyAngle;
            const order = api.orderTownWarTrench({ campId: "camp-a", x: target.x, y: target.y, facingAngleRadians: angle });
            const orderId = order.order?.orderId ?? null;
            api.advanceTownWar({ seconds: 30, tickSeconds: 0.25 });
            const midBuildReport = orderId ? api.getTownWarBuildReport({ orderId }) : null;
            let maxOccupiedTrenchPressureRatio = 0;
            for (let step = 0; step < 40; step += 1) {
              api.advanceTownWar({ seconds: 5, tickSeconds: 0.25 });
              const stepSnapshot = api.getSnapshot();
              const stepTrenches = stepSnapshot.war.townWar.aiTactics.coverSlots.filter(
                (slot) => slot.faction === "camp-a" && slot.sourceKind === "trench" && slot.occupiedBySoldierId !== null
              );
              for (const slot of stepTrenches) {
                const soldier = stepSnapshot.war.townWar.soldiers.find((entry) => entry.id === slot.occupiedBySoldierId) ?? null;
                const pressureRatio =
                  soldier?.morale?.maxPressure > 0 ? soldier.morale.pressure / soldier.morale.maxPressure : 0;
                maxOccupiedTrenchPressureRatio = Math.max(maxOccupiedTrenchPressureRatio, pressureRatio);
              }
            }
            const snapshot = api.getSnapshot();
            const trenches = snapshot.war.townWar.aiTactics.coverSlots.filter((slot) => slot.faction === "camp-a" && slot.sourceKind === "trench");
            const occupiedTrenches = trenches.filter((slot) => slot.occupiedBySoldierId !== null);
            const occupied = trenches.find((slot) => slot.occupiedBySoldierId !== null) ?? null;
            const occupiedSlotReads = occupiedTrenches.map((slot) => {
              const occupyingSoldier = snapshot.war.townWar.soldiers.find((soldier) => soldier.id === slot.occupiedBySoldierId) ?? null;
              return {
                slotId: slot.id,
                occupiedBySoldierId: slot.occupiedBySoldierId,
                soldierExists: Boolean(occupyingSoldier),
                soldierFaction: occupyingSoldier?.faction ?? null,
                soldierHealth: occupyingSoldier?.health?.current ?? null,
                soldierPressure: occupyingSoldier?.morale?.pressure ?? null,
                soldierMaxPressure: occupyingSoldier?.morale?.maxPressure ?? null,
                soldierPressureRatio:
                  occupyingSoldier?.morale?.maxPressure > 0
                    ? occupyingSoldier.morale.pressure / occupyingSoldier.morale.maxPressure
                    : null,
                coverSlotId: occupyingSoldier?.coverIntent?.coverSlotId ?? null,
                coverState: occupyingSoldier?.coverIntent?.state ?? null,
                taskKind: occupyingSoldier?.task?.kind ?? null,
                targetReason: occupyingSoldier?.targetIntent?.reason ?? null,
                distanceToSlot: occupyingSoldier
                  ? Math.hypot(occupyingSoldier.position.x - slot.position.x, occupyingSoldier.position.y - slot.position.y)
                  : null
              };
            });
            const trenchClaimReads = snapshot.war.townWar.soldiers
              .map((soldier) => {
                const slot = soldier.coverIntent?.coverSlotId
                  ? snapshot.war.townWar.aiTactics.coverSlots.find((entry) => entry.id === soldier.coverIntent.coverSlotId) ?? null
                  : null;
                if (!slot || slot.sourceKind !== "trench" || soldier.coverIntent?.state !== "occupying") {
                  return null;
                }
                return {
                  soldierId: soldier.id,
                  slotId: slot.id,
                  slotOccupantId: slot.occupiedBySoldierId,
                  distanceToSlot: Math.hypot(soldier.position.x - slot.position.x, soldier.position.y - slot.position.y)
                };
              })
              .filter(Boolean);
            const duplicateClaimSlotIds = trenchClaimReads
              .map((read) => read.slotId)
              .filter((slotId, index, ids) => ids.indexOf(slotId) !== index);
            const unownedTrenchClaims = trenchClaimReads.filter((read) => read.slotOccupantId !== read.soldierId);
            let minOccupiedSlotSpacing = Number.POSITIVE_INFINITY;
            for (let leftIndex = 0; leftIndex < occupiedTrenches.length; leftIndex += 1) {
              for (let rightIndex = leftIndex + 1; rightIndex < occupiedTrenches.length; rightIndex += 1) {
                const left = occupiedTrenches[leftIndex];
                const right = occupiedTrenches[rightIndex];
                minOccupiedSlotSpacing = Math.min(
                  minOccupiedSlotSpacing,
                  Math.hypot(left.position.x - right.position.x, left.position.y - right.position.y)
                );
              }
            }
            const occupant = occupied
              ? snapshot.war.townWar.soldiers.find((soldier) => soldier.id === occupied.occupiedBySoldierId) ?? null
              : null;
            const trenchReachReads = occupiedSlotReads.map((read) => {
              const soldier = snapshot.war.townWar.soldiers.find((entry) => entry.id === read.occupiedBySoldierId) ?? null;
              const target = soldier
                ? snapshot.war.townWar.combatants.find((combatant) => combatant.id === soldier.targetIntent.targetId) ?? null
                : null;
              const baseRange = soldier?.task?.kind === "suppress" ? 420 : soldier?.task?.kind === "attack" ? 340 : soldier?.task?.kind === "defend" ? 300 : null;
              return {
                soldierId: soldier?.id ?? null,
                taskKind: soldier?.task?.kind ?? null,
                targetId: soldier?.targetIntent?.targetId ?? null,
                targetReason: soldier?.targetIntent?.reason ?? null,
                targetDistance: soldier && target ? Math.hypot(target.position.x - soldier.position.x, target.position.y - soldier.position.y) : null,
                baseRange,
                frontTrenchRange: baseRange === null ? null : Math.round(baseRange * 1.48)
              };
            });
            const campAHealth = snapshot.war.townWar.soldiers
              .filter((soldier) => soldier.faction === "camp-a")
              .map((soldier) => soldier.health.current);
            const trenchGrenadeChatter = snapshot.war.townWar.chatter.filter(
              (entry) => entry.faction === "camp-a" && entry.tags?.includes("grenade") && /trench/i.test(entry.text)
            );
            const closestEnemy = occupied
              ? snapshot.war.townWar.combatants
                  .filter((combatant) => combatant.faction !== "camp-a")
                  .sort(
                    (left, right) =>
                      Math.hypot(left.position.x - occupied.position.x, left.position.y - occupied.position.y) -
                      Math.hypot(right.position.x - occupied.position.x, right.position.y - occupied.position.y)
                  )[0] ?? null
              : null;
            const trenchFit =
              occupied && closestEnemy
                ? Math.abs(
                    Math.sin(
                      Math.atan2(closestEnemy.position.y - occupied.position.y, closestEnemy.position.x - occupied.position.x) -
                        occupied.facingAngleRadians
                    )
                  )
                : null;

            return {
              mode,
              angle,
              orderOk: order.ok,
              orderSummary: order.summary,
              midBuildReadable: midBuildReport?.summary ?? null,
              trenchCount: trenches.length,
              occupiedTrenchCount: occupiedTrenches.length,
              occupiedSlotReads,
              trenchClaimReads,
              duplicateClaimSlotIds,
              unownedTrenchClaims,
              minOccupiedSlotSpacing: Number.isFinite(minOccupiedSlotSpacing) ? minOccupiedSlotSpacing : null,
              trenchReachReads,
              trenchCounterplayReads: occupiedSlotReads.map((read) => ({
                soldierId: read.occupiedBySoldierId,
                health: read.soldierHealth,
                pressureRatio: read.soldierPressureRatio,
                targetReason: read.targetReason
              })),
              trenchGrenadeChatterCount: trenchGrenadeChatter.length,
              trenchGrenadeChatter: trenchGrenadeChatter.map((entry) => entry.text),
              maxOccupiedTrenchPressureRatio,
              occupiedIds: occupiedTrenches.map((slot) => slot.occupiedBySoldierId),
              occupiedId: occupied?.occupiedBySoldierId ?? null,
              protection: occupied?.protection ?? null,
              directionalFit: trenchFit,
              minCampAHealth: Math.min(...campAHealth),
              occupantHealth: occupant?.health?.current ?? null,
              occupantTask: occupant?.task?.kind ?? null,
              occupantTactical: occupant?.tacticalIntent?.state ?? null,
              occupantCover: occupant?.coverIntent?.state ?? null
            };
          }, facingMode);
        } finally {
          await page.close();
        }
      }

      const realtimeResult = await runRealtimeClockScenario();
      const initialCampResult = await runInitialRussianCampScenario();
      const result = await runScenario("good");
      const badResult = await runScenario("bad");

      if (realtimeResult.elapsed < 0.75) {
        throw new Error(`Expected town-war simulation to advance during live raid play without CLI advance. Result: ${JSON.stringify(realtimeResult)}`);
      }

      if (
        initialCampResult.start.some((soldier) => soldier.distanceToFocus < 900 || soldier.task === "build") ||
        initialCampResult.after[0]?.distanceToFocus < 900 ||
        initialCampResult.after[0]?.distanceToCamp > 120
      ) {
        throw new Error(`Expected Russian starter colonists to stay at camp until ordered. Result: ${JSON.stringify(initialCampResult)}`);
      }

      if (!result.orderOk || result.trenchCount < 3 || result.occupiedTrenchCount < 2 || !result.occupiedId || result.occupantCover !== "occupying") {
        throw new Error(`Expected camp-a soldiers to gravitate into multiple trench slots. Result: ${JSON.stringify(result)}`);
      }

      const invalidOccupants = result.occupiedSlotReads.filter(
        (read) =>
          !read.soldierExists ||
          read.soldierFaction !== "camp-a" ||
          (read.soldierHealth ?? 0) <= 0 ||
          read.coverSlotId !== read.slotId ||
          read.coverState !== "occupying" ||
          (read.distanceToSlot ?? Number.POSITIVE_INFINITY) > 42
      );
      if (invalidOccupants.length > 0) {
        throw new Error(`Expected occupied trench slots to contain real living soldiers physically inside them. Invalid: ${JSON.stringify(invalidOccupants)} Result: ${JSON.stringify(result)}`);
      }
      if (result.duplicateClaimSlotIds.length > 0 || result.unownedTrenchClaims.length > 0 || (result.minOccupiedSlotSpacing ?? 0) < 38) {
        throw new Error(
          `Expected Russian trench occupants to claim unique separated firing bays, not stack in one trench slot. Claims: ${JSON.stringify(result.trenchClaimReads)} Spacing: ${result.minOccupiedSlotSpacing} Result: ${JSON.stringify(result)}`
        );
      }

      const trenchReachCount = result.trenchReachReads.filter((read) => /trench .*extends|trench firing bay extends/i.test(read.targetReason ?? "")).length;
      if (trenchReachCount < 2) {
        throw new Error(`Expected occupied trench soldiers to use extended trench fire reach in target selection. Reads: ${JSON.stringify(result.trenchReachReads)} Result: ${JSON.stringify(result)}`);
      }

      if ((result.minCampAHealth ?? 100) >= 99.5) {
        throw new Error(`Expected Russian soldiers to take real health damage under contact, not behave as immortal markers. Result: ${JSON.stringify(result)}`);
      }

      const maxOccupiedPressureRatio = Math.max(
        result.maxOccupiedTrenchPressureRatio ?? 0,
        ...result.trenchCounterplayReads.map((read) => read.pressureRatio ?? 0)
      );
      const minOccupiedTrenchHealth = Math.min(
        ...result.trenchCounterplayReads.map((read) => read.health ?? 100)
      );
      if (maxOccupiedPressureRatio < 0.12 || minOccupiedTrenchHealth > 96 || result.trenchGrenadeChatterCount < 1) {
        throw new Error(`Expected occupied Russian trench soldiers to be suppressible and grenade-vulnerable, while still using the trench. Counterplay: ${JSON.stringify(result.trenchCounterplayReads)} Result: ${JSON.stringify(result)}`);
      }

      if (!result.midBuildReadable || !/stage|%|builder/i.test(result.midBuildReadable)) {
        throw new Error(`Expected construction feedback report before completion. Result: ${JSON.stringify(result)}`);
      }

      if ((result.directionalFit ?? 0) <= 0.72 || (badResult.directionalFit ?? 1) >= 0.38) {
        throw new Error(`Expected trench rotation to create a clear good/bad directional advantage. Good: ${JSON.stringify(result)} Bad: ${JSON.stringify(badResult)}`);
      }

      console.log("Town-war trench smoke passed.");
      console.log(`Realtime clock: +${realtimeResult.elapsed.toFixed(2)}s while browser waited.`);
      console.log(`Order: ${result.orderSummary}`);
      console.log(`Build feedback: ${result.midBuildReadable}`);
      console.log(`Occupied by: ${result.occupiedId}`);
      console.log(`Occupied trench slots: ${result.occupiedTrenchCount}/${result.trenchCount} (${result.occupiedIds.join(", ")})`);
      console.log(`Occupied slot proof: ${result.occupiedSlotReads.map((read) => `${read.occupiedBySoldierId}@${Math.round(read.distanceToSlot ?? -1)}px/${read.coverState}`).join(", ")}`);
      console.log(`Trench spacing proof: ${Math.round(result.minOccupiedSlotSpacing ?? 0)}px minimum slot spacing; claims ${result.trenchClaimReads.map((read) => `${read.soldierId}->${read.slotId}`).join(", ")}`);
      console.log(`Trench reach proof: ${result.trenchReachReads.map((read) => `${read.soldierId} ${read.taskKind} ${Math.round(read.targetDistance ?? -1)}px/${read.baseRange}->${read.frontTrenchRange} ${read.targetReason}`).join(" | ")}`);
      console.log(`Trench counterplay proof: peak pressure ${Math.round((result.maxOccupiedTrenchPressureRatio ?? 0) * 100)}% | ${result.trenchCounterplayReads.map((read) => `${read.soldierId} hp${Math.round(read.health ?? 0)} pressure${Math.round((read.pressureRatio ?? 0) * 100)}% ${read.targetReason ?? ""}`).join(" | ")} | grenade chatter ${result.trenchGrenadeChatterCount}`);
      console.log(`Protection: ${Math.round((result.protection ?? 0) * 100)}%`);
      console.log(`Directional fit: good ${Math.round((result.directionalFit ?? 0) * 100)}% vs bad ${Math.round((badResult.directionalFit ?? 0) * 100)}%`);
      console.log(`Occupant health: good ${Math.round(result.occupantHealth ?? 0)} vs bad ${Math.round(badResult.occupantHealth ?? 0)}`);
      console.log(`Task: ${result.occupantTask} | Tactical: ${result.occupantTactical} | Cover: ${result.occupantCover}`);
    } finally {
      await browser.close();
    }
  } catch (error) {
    const message = error instanceof Error ? error.stack || error.message : String(error);
    throw new Error(`${message}\n\nDev server output:\n${serverOutput}`);
  } finally {
    cleanup();
  }
}

runTownWarTrenchSmoke().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
