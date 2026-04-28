import { spawn, spawnSync } from "node:child_process";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";

const host = "127.0.0.1";
const port = 5863;
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
        api.prepareTownWarOperation({ ammo: 800, build: 900, food: 240, med: 140 });
      }
      if (typeof api.startNextTownWarOperation === "function") {
        api.startNextTownWarOperation();
      }
      api.focusTownWarLane({ campId: "camp-a", lane: "mid" });

      const snapshot = api.getSnapshot().war.townWar;
      const campA = snapshot.camps.find((camp) => camp.id === "camp-a");
      const origin = {
        x: campA.spawn.position.x - 330,
        y: campA.spawn.position.y - 170
      };
      const lineAngle = Math.PI / 2;

      const getCampNetwork = () => {
        const report = api.getTownWarTrenchNetworkReport().report;
        return report.networks.find((network) => network.faction === "camp-a") ?? null;
      };

      const advanceUntilSegments = (minimumSegments) => {
        for (let step = 0; step < 40; step += 1) {
          const network = getCampNetwork();
          if (network && network.segmentCount >= minimumSegments) {
            return network;
          }
          api.advanceTownWar({ seconds: 5, tickSeconds: 0.25 });
        }
        return getCampNetwork();
      };

      let nextTarget = origin;
      const trenchOrders = [];
      for (let index = 0; index < 5; index += 1) {
        const order = api.orderTownWarTrench({
          campId: "camp-a",
          x: nextTarget.x,
          y: nextTarget.y,
          facingAngleRadians: lineAngle
        });
        trenchOrders.push(order);
        const network = advanceUntilSegments(index + 1);
        const tail = network?.segments.slice().sort((left, right) => right.center.y - left.center.y)[0] ?? null;
        if (tail) {
          nextTarget = {
            x: tail.nodeB.x + Math.cos(lineAngle) * 42,
            y: tail.nodeB.y + Math.sin(lineAngle) * 42
          };
        } else {
          nextTarget = { x: nextTarget.x, y: nextTarget.y + 84 };
        }
      }

      api.advanceTownWar({ seconds: 20, tickSeconds: 0.25 });
      const network = getCampNetwork();
      const segments = network?.segments.slice().sort((left, right) => left.center.y - right.center.y) ?? [];
      const nearSegment = segments[0] ?? null;
      const farSegment = segments[segments.length - 1] ?? null;

      const ammoOrder = api.orderTownWarAmmoCrate({
        campId: "camp-a",
        x: nearSegment.center.x + 20,
        y: nearSegment.center.y
      });
      for (let step = 0; step < 30; step += 1) {
        const crates = api.getSnapshot().war.townWar.ammoCrates.filter((crate) => crate.faction === "camp-a" && crate.destroyedAtSeconds === null);
        if (crates.length > 0) {
          break;
        }
        api.advanceTownWar({ seconds: 5, tickSeconds: 0.25 });
      }

      const dugoutOrder = api.orderTownWarDugout({
        campId: "camp-a",
        x: nearSegment.center.x + 70,
        y: nearSegment.center.y + 12,
        facingAngleRadians: Math.PI
      });
      for (let step = 0; step < 30; step += 1) {
        const dugouts = api.getSnapshot().war.townWar.dugouts.filter((dugout) => dugout.faction === "camp-a" && dugout.destroyedAtSeconds === null);
        if (dugouts.length > 0) {
          break;
        }
        api.advanceTownWar({ seconds: 5, tickSeconds: 0.25 });
      }

      const sandbags = api.orderTownWarSandbags({ campId: "camp-a", segmentId: farSegment.segmentId });
      const wire = api.orderTownWarWire({ campId: "camp-a", segmentId: nearSegment.segmentId });
      api.advanceTownWar({ seconds: 8, tickSeconds: 0.25 });

      const occupiedSlot =
        api
          .getSnapshot()
          .war.townWar.aiTactics.coverSlots.find(
            (slot) => slot.sourceKind === "trench" && slot.faction === "camp-a" && slot.trenchNetwork?.networkId === network.networkId && slot.occupiedBySoldierId
          ) ?? null;
      const casualty =
        occupiedSlot && occupiedSlot.occupiedBySoldierId
          ? api.stageTownWarCasualty({
              soldierId: occupiedSlot.occupiedBySoldierId,
              x: occupiedSlot.position.x,
              y: occupiedSlot.position.y,
              severity: "serious"
            })
          : null;
      api.advanceTownWar({ seconds: 2, tickSeconds: 0.25 });

      const combo = api.getTownWarBuildingComboReport().report;
      const comboNetwork = combo.networks.find((entry) => entry.faction === "camp-a" && entry.networkId === network.networkId) ?? null;
      const resetSnapshot = api.stageState("town-war");
      const resetCombo = api.getTownWarBuildingComboReport().report;

      return {
        trenchOrders,
        ammoOrder,
        dugoutOrder,
        sandbags,
        wire,
        casualty,
        network,
        combo,
        comboNetwork,
        reset: {
          fieldworkUpgrades: resetSnapshot.war.townWar.fieldworkUpgrades.length,
          combo: resetCombo
        }
      };
    });

    assertSmoke(result.trenchOrders.every((order) => order.ok), "Expected all Russian trench orders to succeed.", result.trenchOrders);
    assertSmoke(result.network?.segmentCount >= 5, "Expected a connected Russian trench network with at least five segments.", result.network);
    assertSmoke(result.ammoOrder.ok, "Expected Russian ammo crate order to succeed.", result.ammoOrder);
    assertSmoke(result.dugoutOrder.ok, "Expected Russian dugout order to succeed.", result.dugoutOrder);
    assertSmoke(result.sandbags.ok, "Expected sandbags upgrade to succeed.", result.sandbags);
    assertSmoke(result.wire.ok, "Expected wire upgrade to succeed.", result.wire);
    assertSmoke(result.comboNetwork?.ammo.linked, "Expected ammo to link into the trench network.", result.comboNetwork);
    assertSmoke(
      result.comboNetwork?.ammo.networkFedSlotIds.length > result.comboNetwork?.ammo.localFedSlotIds.length,
      "Expected network ammo feed to reach more trench slots than local crate radius.",
      result.comboNetwork?.ammo
    );
    assertSmoke(result.comboNetwork?.dugout.linked, "Expected dugout to link into the trench network.", result.comboNetwork);
    assertSmoke(result.comboNetwork?.dugout.shelteringSoldierIds.length >= 1, "Expected linked dugout to shelter a wounded trench soldier.", result.comboNetwork?.dugout);
    assertSmoke(result.comboNetwork?.sandbags.frontProtectionBonus > 0, "Expected sandbags to add front protection.", result.comboNetwork?.sandbags);
    assertSmoke(result.comboNetwork?.sandbags.flankProtectionBonus === 0, "Expected sandbags to not protect every direction.", result.comboNetwork?.sandbags);
    assertSmoke(result.comboNetwork?.wire.enemySpeedMultiplier < 1, "Expected wire to slow enemy assault movement.", result.comboNetwork?.wire);
    assertSmoke(result.comboNetwork?.warnings.includes("Wire blocks retreat"), "Expected wire to create a retreat-path warning.", result.comboNetwork?.warnings);
    assertSmoke(result.reset.fieldworkUpgrades === 0, "Expected reset to clear sandbags and wire state.", result.reset);
    assertSmoke(result.reset.combo.totals.networks === 0, "Expected reset to clear combo networks.", result.reset.combo);
    assertSmoke(pageErrors.length === 0, "Expected no browser errors during building combo smoke.", pageErrors);

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
            combo: {
              segmentCount: result.comboNetwork?.segmentCount ?? 0,
              networkFedSlots: result.comboNetwork?.ammo.networkFedSlotIds.length ?? 0,
              localFedSlots: result.comboNetwork?.ammo.localFedSlotIds.length ?? 0,
              dugoutShelter: result.comboNetwork?.dugout.shelteringSoldierIds.length ?? 0,
              sandbags: result.comboNetwork?.sandbags.count ?? 0,
              wire: result.comboNetwork?.wire.count ?? 0,
              warnings: result.comboNetwork?.warnings ?? []
            },
            resetTotals: result.reset.combo.totals
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
