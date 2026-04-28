import { spawn, spawnSync } from "node:child_process";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";

const host = "127.0.0.1";
const port = 5847;
const baseUrl = `http://${host}:${port}/`;

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

function assertSmoke(condition, message, details = null) {
  if (condition) {
    return;
  }
  const suffix = details ? `\n${JSON.stringify(details, null, 2)}` : "";
  throw new Error(`${message}${suffix}`);
}

async function runEnemyCommanderSmoke() {
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
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.stack || error.message));
    page.on("console", (message) => {
      if (message.type() === "error") {
        pageErrors.push(message.text());
      }
    });

    try {
      await page.goto(`${baseUrl}?enemy-commander-smoke=${Date.now()}`, { waitUntil: "networkidle" });
      await page.waitForFunction(() => Boolean(window.__topdownExtractionAgentApi), null, { timeout: 15000 });

      const result = await page.evaluate(() => {
        const api = window.__topdownExtractionAgentApi;
        api.stageState("town-war");
        api.reinforceTownWar({ campId: "camp-b", role: "rifleman", count: 6 });
        api.reinforceTownWar({ campId: "camp-b", role: "suppressor", count: 2 });
        let townWar = api.getSnapshot().war.townWar;
        const campB = townWar.camps.find((camp) => camp.id === "camp-b");
        const campA = townWar.camps.find((camp) => camp.id === "camp-a");
        const focus = {
          x: (campA.spawn.position.x + campB.spawn.position.x) / 2 - 180,
          y: campB.spawn.position.y
        };
        const trench = api.placeDebugTownWarTrench({
          campId: "camp-b",
          x: focus.x,
          y: focus.y,
          facingAngleRadians: 0
        });

        townWar = api.getSnapshot().war.townWar;
        const candidates = townWar.soldiers
          .filter((soldier) => soldier.faction === "camp-b" && soldier.health.current > 0 && soldier.task.kind !== "build")
          .slice(0, 8);
        const fallback = candidates[0];
        const resupply = candidates[1];
        if (fallback) {
          api.stageTownWarSoldierPressure({ soldierId: fallback.id, pressure: 86 });
        }
        if (resupply) {
          api.setTownWarSoldierAmmo({ soldierId: resupply.id, inMag: 0, reserve: 0, maxMag: 30 });
        }

        api.advanceTownWar({ seconds: 5, tickSeconds: 0.25 });
        townWar = api.getSnapshot().war.townWar;
        const orders = townWar.enemyCommander.recentOrders;
        const kinds = [...new Set(orders.map((order) => order.kind))].sort();
        const soldierTaskReads = orders.map((order) => {
          const soldier = townWar.soldiers.find((entry) => entry.id === order.soldierId);
          return {
            kind: order.kind,
            soldierId: order.soldierId,
            orderTaskKind: order.task.kind,
            liveTaskKind: soldier?.task.kind ?? null,
            liveTaskLabel: soldier?.task.label ?? null,
            targetEntityId: soldier?.task.targetEntityId ?? null
          };
        });

        return {
          trenchOk: trench.ok,
          fallbackId: fallback?.id ?? null,
          resupplyId: resupply?.id ?? null,
          ordersIssued: townWar.enemyCommander.ordersIssued,
          kinds,
          soldierTaskReads,
          pageSummary: townWar.enemyCommander
        };
      });

      const requiredKinds = ["assault", "defend-camp", "fall-back", "occupy-trench", "patrol", "resupply"];
      assertSmoke(result.trenchOk, "Expected enemy trench setup to succeed.", result);
      assertSmoke(result.ordersIssued >= requiredKinds.length, "Expected enemy commander to issue multiple orders.", result);
      for (const kind of requiredKinds) {
        assertSmoke(result.kinds.includes(kind), `Expected enemy commander to issue ${kind}.`, result);
      }
      assertSmoke(
        result.soldierTaskReads.every(
          (read) =>
            read.liveTaskKind !== null &&
            (read.orderTaskKind === read.liveTaskKind || (read.kind === "fall-back" && read.liveTaskKind === "defend")) &&
            /^Enemy commander:/.test(read.liveTaskLabel ?? "")
        ),
        "Expected commander orders to be applied or resumed as normal live soldier tasks.",
        result.soldierTaskReads
      );
      assertSmoke(pageErrors.length === 0, "Expected no browser errors during enemy commander smoke.", pageErrors);
      console.log(`enemy-commander smoke passed: ${result.kinds.join(", ")}.`);
    } finally {
      await page.close().catch(() => {});
      await browser.close().catch(() => {});
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

runEnemyCommanderSmoke().catch((error) => {
  console.error(error);
  process.exit(1);
});
