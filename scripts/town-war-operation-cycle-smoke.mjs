import { spawn, spawnSync } from "node:child_process";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";

const host = "127.0.0.1";
const port = 5847;
const baseUrl = `http://${host}:${port}/`;
const url = `${baseUrl}?debugRaid=1`;

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

async function isServerReady(serverUrl) {
  try {
    const response = await fetch(serverUrl);
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForServer(serverUrl, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await isServerReady(serverUrl)) {
      return;
    }
    await delay(250);
  }
  throw new Error(`Timed out waiting for ${serverUrl}`);
}

function launchServerIfNeeded() {
  const serverCommand = getServerCommand();
  const server = spawn(serverCommand.command, serverCommand.args, {
    stdio: ["ignore", "pipe", "pipe"],
    shell: false
  });

  let output = "";
  const appendOutput = (chunk) => {
    output += chunk.toString();
    if (output.length > 8000) {
      output = output.slice(-8000);
    }
  };
  server.stdout.on("data", appendOutput);
  server.stderr.on("data", appendOutput);

  return {
    get output() {
      return output;
    },
    cleanup() {
      if (!server.killed) {
        if (process.platform === "win32" && server.pid) {
          spawnSync("taskkill", ["/pid", String(server.pid), "/t", "/f"], { stdio: "ignore" });
        } else {
          server.kill();
        }
      }
    }
  };
}

async function runOperationCycleSmoke() {
  let server = null;
  if (!(await isServerReady(baseUrl))) {
    server = launchServerIfNeeded();
  }

  const cleanup = () => server?.cleanup();
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
    await waitForServer(baseUrl, 15000);
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

    try {
      await page.goto(url, { waitUntil: "networkidle" });
      await page.waitForFunction(() => Boolean(window.__topdownExtractionAgentApi));

      const result = await page.evaluate(() => {
        const api = window.__topdownExtractionAgentApi;

        const runBuildScenario = (stockpile) => {
          api.stageState("town-war");
          api.prepareTownWarOperation(stockpile);
          api.startNextTownWarOperation();
          api.deployTownWarOfficer({ campId: "camp-a" });
          api.setTownWarCampWork({ campId: "camp-a", work: "Resupply", priority: 5 });
          api.setTownWarCampWork({ campId: "camp-a", work: "Cook", priority: 5 });
          api.setTownWarCampWork({ campId: "camp-a", work: "Rest", priority: 5 });
          const snapshot = api.getSnapshot();
          const focus = snapshot.war.townWar.aiThreats.frontlineFocus.position;
          const enemyCamp = snapshot.war.townWar.camps.find((camp) => camp.id === "camp-b");
          const trenchTarget = { x: focus.x + 210, y: focus.y - 35 };
          const enemyAngle = Math.atan2((enemyCamp?.spawn.position.y ?? focus.y) - trenchTarget.y, (enemyCamp?.spawn.position.x ?? focus.x - 420) - trenchTarget.x);
          const order = api.orderTownWarTrench({
            campId: "camp-a",
            x: trenchTarget.x,
            y: trenchTarget.y,
            facingAngleRadians: enemyAngle + Math.PI / 2
          });
          api.advanceTownWar({ seconds: 32, tickSeconds: 0.25 });
          const after = api.getSnapshot();
          const activeOrder = after.war.townWar.orders.find((entry) => entry.id === order.order.orderId);
          const camp = after.war.townWar.camps.find((entry) => entry.id === "camp-a");
          return {
            ok: order.ok,
            orderId: order.order.orderId,
            progress: activeOrder?.build.progress ?? 0,
            buildRate: activeOrder?.build.buildRate ?? 0,
            stalled: activeOrder?.build.stalled ?? false,
            readiness: camp?.sustainment.readiness ?? 0,
            ammoFlow: camp?.sustainment.ammoFlow ?? 0,
            supply: camp?.supply ?? null
          };
        };

        const low = runBuildScenario({ ammo: 20, build: 80, food: 15, med: 10 });
        const high = runBuildScenario({ ammo: 240, build: 240, food: 190, med: 90 });

        const snapshot = api.getSnapshot();
        const russianSoldiers = snapshot.war.townWar.soldiers.filter((soldier) => soldier.faction === "camp-a");
        const carriedTarget = russianSoldiers.find((soldier) => soldier.role === "rifleman") ?? russianSoldiers[0];
        api.setTownWarSoldierNeeds({ soldierId: carriedTarget.id, fatigue: 0.78, hunger: 0.42, morale: 0.32 });
        api.stageTownWarCasualty({ soldierId: carriedTarget.id, severity: "serious" });
        api.advanceTownWar({ seconds: 2, tickSeconds: 0.25 });
        const debrief = api.endTownWarOperation();
        const next = api.startNextTownWarOperation();
        const nextSnapshot = api.getSnapshot();
        const carriedSoldier = nextSnapshot.war.townWar.soldiers.find((soldier) => soldier.id === carriedTarget.id);
        const operation = nextSnapshot.war.townWar.operation;
        const camp = nextSnapshot.war.townWar.camps.find((entry) => entry.id === "camp-a");

        return {
          low,
          high,
          carriedTarget: { id: carriedTarget.id, name: carriedTarget.displayName },
          debriefOk: debrief.ok,
          debriefRecommendations: debrief.result.operation.recommendations,
          nextOk: next.ok,
          carriedSoldier: carriedSoldier
            ? {
                id: carriedSoldier.id,
                name: carriedSoldier.displayName,
                currentNeed: carriedSoldier.currentNeed,
                fatigue: carriedSoldier.needs.fatigue,
                health: carriedSoldier.health.current,
                memoryTags: carriedSoldier.dramaMemoryTags
              }
            : null,
          operation,
          campSupply: camp?.supply ?? null
        };
      });

      if (!result.low.ok || !result.high.ok) {
        throw new Error(`Expected both operation stockpiles to allow a trench order. Result: ${JSON.stringify(result)}`);
      }
      if (!(result.high.progress > result.low.progress || result.high.readiness > result.low.readiness || result.high.ammoFlow > result.low.ammoFlow)) {
        throw new Error(`Expected stronger stockpile to improve build progress/readiness/ammo flow. Result: ${JSON.stringify(result)}`);
      }
      if (!result.debriefOk || result.debriefRecommendations.length < 2) {
        throw new Error(`Expected operation debrief to produce at least two recommendations. Result: ${JSON.stringify(result)}`);
      }
      if (!result.nextOk || !result.carriedSoldier || result.carriedSoldier.fatigue < 0.7 || result.carriedSoldier.health > 50) {
        throw new Error(`Expected named Russian soldier fatigue/wound to carry into next operation. Result: ${JSON.stringify(result)}`);
      }
      if (!result.operation.lastDebrief || result.operation.carriedSoldiers.length === 0 || !result.campSupply) {
        throw new Error(`Expected next operation to retain debrief, soldier records, and camp supply. Result: ${JSON.stringify(result)}`);
      }

      console.log("Town war operation-cycle smoke passed.");
      console.log(JSON.stringify(result, null, 2));
    } finally {
      await browser.close();
    }
  } catch (error) {
    if (server?.output) {
      console.error(server.output);
    }
    throw error;
  } finally {
    cleanup();
  }
}

runOperationCycleSmoke().catch((error) => {
  console.error(error);
  process.exit(1);
});
