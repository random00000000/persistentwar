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

async function runDugoutNetworkSmoke() {
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
        api.stageState("town-war");
        api.prepareTownWarOperation({ ammo: 260, build: 280, food: 180, med: 120 });
        api.startNextTownWarOperation();
        api.deployTownWarOfficer({ campId: "camp-a" });

        const initial = api.getSnapshot();
        const focus = initial.war.townWar.aiThreats.frontlineFocus.position;
        const enemyCamp = initial.war.townWar.camps.find((camp) => camp.id === "camp-b");
        const trenchTarget = { x: focus.x + 190, y: focus.y - 36 };
        const dugoutTarget = { x: focus.x + 265, y: focus.y + 28 };
        const enemyAngle = Math.atan2((enemyCamp?.spawn.position.y ?? focus.y) - trenchTarget.y, (enemyCamp?.spawn.position.x ?? focus.x - 420) - trenchTarget.x);
        const trenchAngle = enemyAngle + Math.PI / 2;

        const dugoutOrder = api.orderTownWarDugout({
          campId: "camp-a",
          x: dugoutTarget.x,
          y: dugoutTarget.y,
          facingAngleRadians: Math.PI
        });
        api.advanceTownWar({ seconds: 58, tickSeconds: 0.25 });

        const trenchOrder = api.orderTownWarTrench({
          campId: "camp-a",
          x: trenchTarget.x,
          y: trenchTarget.y,
          facingAngleRadians: trenchAngle
        });
        api.advanceTownWar({ seconds: 58, tickSeconds: 0.25 });

        const afterBuild = api.getSnapshot();
        const dugout = afterBuild.war.townWar.dugouts.find((entry) => entry.faction === "camp-a");
        const connectedSlots = dugout
          ? afterBuild.war.townWar.aiTactics.coverSlots.filter((slot) => dugout.connectedTrenchSlotIds.includes(slot.id))
          : [];
        const connectedUsers = afterBuild.war.townWar.soldiers.filter(
          (soldier) =>
            soldier.faction === "camp-a" &&
            connectedSlots.some((slot) => slot.id === soldier.coverIntent.coverSlotId || slot.id === soldier.task.targetEntityId)
        );

        const reinforce = api.reinforceTownWar({ campId: "camp-a", role: "defender", count: 1 });
        api.advanceTownWar({ seconds: 1, tickSeconds: 0.25 });
        const afterReinforce = api.getSnapshot();
        const reinforced = afterReinforce.war.townWar.soldiers.find((soldier) => soldier.id === reinforce.result.soldierIds[0]);

        const shelterTarget = reinforced ?? connectedUsers[0];
        if (shelterTarget) {
          api.stageTownWarCasualty({ soldierId: shelterTarget.id, severity: "serious" });
          api.advanceTownWar({ seconds: 3, tickSeconds: 0.25 });
        }
        const afterShelter = api.getSnapshot();
        const shelterDugout = afterShelter.war.townWar.dugouts.find((entry) => entry.id === dugout?.id);

        const damage = dugout ? api.damageTownWarDugout({ dugoutId: dugout.id, amount: 55 }) : null;
        const damagedReport = api.getTownWarDugoutReport();
        const debrief = api.endTownWarOperation();

        return {
          dugoutOrderOk: dugoutOrder.ok,
          trenchOrderOk: trenchOrder.ok,
          dugout,
          connectedSlotCount: connectedSlots.length,
          connectedUsers: connectedUsers.map((soldier) => ({
            id: soldier.id,
            task: soldier.task.label,
            targetEntityId: soldier.task.targetEntityId,
            coverReason: soldier.coverIntent.reason,
            tacticalReason: soldier.tacticalIntent.reason
          })),
          reinforce: {
            ok: reinforce.ok,
            soldierIds: reinforce.result.soldierIds,
            summary: reinforce.summary
          },
          reinforced: reinforced
            ? {
                id: reinforced.id,
                x: reinforced.position.x,
                y: reinforced.position.y,
                task: reinforced.task.label,
                targetEntityId: reinforced.task.targetEntityId,
                targetReason: reinforced.targetIntent.reason,
                coverReason: reinforced.coverIntent.reason
              }
            : null,
          shelterDugout,
          damage: damage
            ? {
                ok: damage.ok,
                summary: damage.summary,
                status: damage.dugout?.status ?? null,
                health: damage.dugout?.health ?? null
              }
            : null,
          damagedReport: {
            summary: damagedReport.summary,
            dugouts: damagedReport.report.dugouts.map((entry) => ({
              id: entry.id,
              status: entry.status,
              readable: entry.readable,
              health: entry.health,
              connectedTrenchSlotIds: entry.connectedTrenchSlotIds,
              shelteringSoldierIds: entry.shelteringSoldierIds
            }))
          },
          debriefRecommendations: debrief.result.operation.recommendations
        };
      });

      if (!result.dugoutOrderOk || !result.trenchOrderOk || !result.dugout) {
        throw new Error(`Expected dugout and trench orders to complete. Result: ${JSON.stringify(result)}`);
      }
      if (result.connectedSlotCount <= 0) {
        throw new Error(`Expected dugout to connect nearby trench slots. Result: ${JSON.stringify(result)}`);
      }
      if (result.connectedUsers.length <= 0) {
        throw new Error(`Expected Russian soldiers to move into dugout-connected trench slots. Result: ${JSON.stringify(result)}`);
      }
      if (!result.reinforced || !/dugout/i.test(`${result.reinforced.targetReason} ${result.reinforced.coverReason} ${result.reinforced.task}`)) {
        throw new Error(`Expected reinforcement to rally through the dugout. Result: ${JSON.stringify(result)}`);
      }
      if (!result.shelterDugout || result.shelterDugout.shelteringSoldierIds.length <= 0) {
        throw new Error(`Expected wounded/suppressed soldier to shelter at dugout. Result: ${JSON.stringify(result)}`);
      }
      if (!result.damage?.ok || !/damaged|collapsing/i.test(result.damagedReport.summary)) {
        throw new Error(`Expected dugout damage to reduce effectiveness. Result: ${JSON.stringify(result)}`);
      }
      if (!result.debriefRecommendations.some((entry) => /dugout/i.test(entry))) {
        throw new Error(`Expected debrief to name dugout as a position cause. Result: ${JSON.stringify(result)}`);
      }

      console.log("Town war dugout-network smoke passed.");
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

runDugoutNetworkSmoke().catch((error) => {
  console.error(error);
  process.exit(1);
});
