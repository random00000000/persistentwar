import { spawn, spawnSync } from "node:child_process";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";

const host = "127.0.0.1";
const port = 5862;
const url = `http://${host}:${port}/`;
const viewport = { width: 1920, height: 1080 };

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
      // Vite is still starting.
    }
    await delay(250);
  }

  throw new Error(`Timed out waiting for ${serverUrl}`);
}

function assertSmoke(condition, message, details = null) {
  if (condition) {
    return;
  }

  const suffix = details ? `\n${JSON.stringify(details, null, 2)}` : "";
  throw new Error(`${message}${suffix}`);
}

async function runScenario(browser) {
  const page = await browser.newPage({ viewport });
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.stack || error.message));
  page.on("console", (message) => {
    if (message.type() === "error") {
      pageErrors.push(message.text());
    }
  });

  try {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.waitForFunction(() => Boolean(window.__topdownExtractionAgentApi), null, { timeout: 15000 });

    const result = await page.evaluate(() => {
      const api = window.__topdownExtractionAgentApi;
      api.stageState("town-war");
      api.deployTownWarOfficer({ campId: "camp-a" });
      if (typeof api.prepareTownWarOperation === "function") {
        api.prepareTownWarOperation({ ammo: 500, build: 600, food: 240, med: 120 });
      }
      if (typeof api.startNextTownWarOperation === "function") {
        api.startNextTownWarOperation();
      }
      api.focusTownWarLane({ campId: "camp-a", lane: "mid" });

      const snapshot = api.getSnapshot().war.townWar;
      const campA = snapshot.camps.find((camp) => camp.id === "camp-a");
      const origin = {
        x: campA.spawn.position.x - 330,
        y: campA.spawn.position.y
      };
      const lineAngle = Math.PI / 2;

      const advanceUntilSegments = (minimumSegments) => {
        for (let step = 0; step < 30; step += 1) {
          const report = api.getTownWarTrenchNetworkReport().report;
          const campNetwork = report.networks.find((network) => network.faction === "camp-a");
          if (campNetwork && campNetwork.segmentCount >= minimumSegments) {
            return report;
          }
          api.advanceTownWar({ seconds: 5, tickSeconds: 0.25 });
        }
        return api.getTownWarTrenchNetworkReport().report;
      };

      const firstOrder = api.orderTownWarTrench({ campId: "camp-a", x: origin.x, y: origin.y, facingAngleRadians: lineAngle });
      const firstReport = advanceUntilSegments(1);
      const firstNetwork = firstReport.networks.find((network) => network.faction === "camp-a");
      const firstSegment = firstNetwork?.segments[0] ?? null;

      const secondTarget = firstSegment
        ? {
            x: firstSegment.nodeB.x + Math.cos(lineAngle) * 42,
            y: firstSegment.nodeB.y + Math.sin(lineAngle) * 42
          }
        : { x: origin.x, y: origin.y + 84 };
      const secondOrder = api.orderTownWarTrench({
        campId: "camp-a",
        x: secondTarget.x,
        y: secondTarget.y,
        facingAngleRadians: lineAngle
      });
      const secondReport = advanceUntilSegments(2);
      const secondNetwork = secondReport.networks.find((network) => network.faction === "camp-a");

      const baseSegment = secondNetwork?.segments[0] ?? firstSegment;
      const branchTarget = baseSegment
        ? {
            x: baseSegment.center.x + 42,
            y: baseSegment.center.y
          }
        : { x: origin.x + 42, y: origin.y };
      const branchOrder = api.orderTownWarTrench({ campId: "camp-a", x: branchTarget.x, y: branchTarget.y, facingAngleRadians: 0 });
      const branchReport = advanceUntilSegments(3);
      api.advanceTownWar({ seconds: 24, tickSeconds: 0.25 });
      const occupiedReport = api.getTownWarTrenchNetworkReport().report;
      const campNetwork = occupiedReport.networks.find((network) => network.faction === "camp-a") ?? null;
      const ukrainianNetwork = occupiedReport.networks.find((network) => network.faction === "camp-b") ?? null;
      const occupiedIds = campNetwork
        ? campNetwork.segments.flatMap((segment) => segment.occupiedBySoldierIds)
        : [];
      const uniqueOccupiedIds = [...new Set(occupiedIds)];

      const resetSnapshot = api.stageState("town-war");
      const resetReport = api.getTownWarTrenchNetworkReport().report;

      return {
        firstOrder,
        secondOrder,
        branchOrder,
        firstReport,
        secondReport,
        branchReport,
        occupiedReport,
        campNetwork,
        ukrainianNetwork,
        occupiedIds,
        uniqueOccupiedIds,
        reset: {
          trenchSlots: resetSnapshot.war.townWar.aiTactics.coverSlots.filter((slot) => slot.sourceKind === "trench").length,
          report: resetReport
        }
      };
    });

    assertSmoke(result.firstOrder.ok, "Expected first Russian trench order to succeed.", result.firstOrder);
    assertSmoke(result.secondOrder.ok, "Expected second Russian trench order to succeed.", result.secondOrder);
    assertSmoke(result.branchOrder.ok, "Expected branch Russian trench order to succeed.", result.branchOrder);
    assertSmoke(result.secondOrder.order.trenchNetwork?.placementKind === "extend", "Expected nearby second trench to extend the first network.", result.secondOrder);
    assertSmoke(result.branchOrder.order.trenchNetwork?.placementKind === "branch", "Expected perpendicular trench to become a branch.", result.branchOrder);
    assertSmoke(result.campNetwork?.segmentCount >= 3, "Expected one Russian trench network with at least three segments.", result.campNetwork);
    assertSmoke(result.campNetwork?.junctionCount >= 1, "Expected a branch or junction in the Russian trench network.", result.campNetwork);
    assertSmoke(!result.ukrainianNetwork, "Expected no Ukrainian network to merge into the Russian trench report.", result.occupiedReport);
    assertSmoke(result.occupiedIds.length === result.uniqueOccupiedIds.length, "Expected trench occupants to be unique, not stacked into fake duplicate soldiers.", {
      occupiedIds: result.occupiedIds,
      uniqueOccupiedIds: result.uniqueOccupiedIds
    });
    assertSmoke(result.reset.trenchSlots === 0, "Expected reset to clear trench cover slots.", result.reset);
    assertSmoke(result.reset.report.totals.segments === 0, "Expected reset to clear trench network metadata.", result.reset.report);
    assertSmoke(pageErrors.length === 0, "Expected no browser errors during trench network smoke.", pageErrors);

    return result;
  } finally {
    await page.close();
  }
}

async function main() {
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
      const result = await runScenario(browser);
      console.log(
        JSON.stringify(
          {
            ok: true,
            network: {
              segmentCount: result.campNetwork?.segmentCount ?? 0,
              slotCount: result.campNetwork?.slotCount ?? 0,
              occupiedCount: result.campNetwork?.occupiedCount ?? 0,
              junctionCount: result.campNetwork?.junctionCount ?? 0
            },
            resetTotals: result.reset.report.totals
          },
          null,
          2
        )
      );
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error(serverOutput);
    console.error(error);
    process.exitCode = 1;
  } finally {
    cleanup();
  }
}

await main();
