import { spawn, spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";

const host = "127.0.0.1";
const port = 5847;
const baseUrl = `http://${host}:${port}/`;
const url = `${baseUrl}?debugRaid=1`;
const artifactDir = "artifacts/town-war-operation-loop";

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

function supplyTotal(supply) {
  return supply.ammo + supply.build + supply.food + supply.med;
}

async function runOperationLoopSmoke() {
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
      await mkdir(artifactDir, { recursive: true });
      await page.goto(url, { waitUntil: "networkidle" });
      await page.waitForFunction(() => Boolean(window.__topdownExtractionAgentApi));

      const result = await page.evaluate(() => {
        const api = window.__topdownExtractionAgentApi;
        api.stageState("town-war");
        const prep = api.prepareTownWarOperation({ ammo: 410, build: 410, food: 260, med: 150 });
        const start = api.startNextTownWarOperation();
        api.deployTownWarOfficer({ campId: "camp-a" });
        api.focusTownWarLane({ campId: "camp-a", lane: "mid" });

        const getCampNetwork = () => {
          const report = api.getTownWarTrenchNetworkReport().report;
          return report.networks.find((network) => network.faction === "camp-a") ?? null;
        };
        const advanceUntilSegments = (minimumSegments) => {
          for (let step = 0; step < 48; step += 1) {
            const network = getCampNetwork();
            if (network && network.segmentCount >= minimumSegments) {
              return network;
            }
            api.advanceTownWar({ seconds: 5, tickSeconds: 0.25 });
          }
          return getCampNetwork();
        };
        const waitFor = (predicate) => {
          for (let step = 0; step < 36; step += 1) {
            const snapshot = api.getSnapshot().war.townWar;
            if (predicate(snapshot)) {
              return snapshot;
            }
            api.advanceTownWar({ seconds: 5, tickSeconds: 0.25 });
          }
          return api.getSnapshot().war.townWar;
        };

        const snapshot = api.getSnapshot().war.townWar;
        const campA = snapshot.camps.find((camp) => camp.id === "camp-a");
        const origin = {
          x: campA.spawn.position.x - 330,
          y: campA.spawn.position.y - 150
        };
        const facingAngleRadians = Math.PI / 2;
        let nextTarget = origin;
        const trenchOrders = [];
        for (let index = 0; index < 3; index += 1) {
          const order = api.orderTownWarTrench({
            campId: "camp-a",
            x: nextTarget.x,
            y: nextTarget.y,
            facingAngleRadians
          });
          trenchOrders.push(order);
          const network = advanceUntilSegments(index + 1);
          const tail = network?.segments.slice().sort((left, right) => right.center.y - left.center.y)[0] ?? null;
          nextTarget = tail
            ? {
                x: tail.nodeB.x + Math.cos(facingAngleRadians) * 42,
                y: tail.nodeB.y + Math.sin(facingAngleRadians) * 42
              }
            : { x: nextTarget.x, y: nextTarget.y + 84 };
        }

        api.advanceTownWar({ seconds: 16, tickSeconds: 0.25 });
        const network = getCampNetwork();
        const segments = network?.segments.slice().sort((left, right) => left.center.y - right.center.y) ?? [];
        const nearSegment = segments[0] ?? null;
        const farSegment = segments[segments.length - 1] ?? null;

        const ammoOrder = api.orderTownWarAmmoCrate({
          campId: "camp-a",
          x: nearSegment.center.x + 250,
          y: nearSegment.center.y
        });
        waitFor((state) => state.ammoCrates.some((crate) => crate.faction === "camp-a" && crate.destroyedAtSeconds === null));
        const dugoutOrder = api.orderTownWarDugout({
          campId: "camp-a",
          x: nearSegment.center.x + 70,
          y: nearSegment.center.y + 14,
          facingAngleRadians: Math.PI
        });
        waitFor((state) => state.dugouts.some((dugout) => dugout.faction === "camp-a" && dugout.destroyedAtSeconds === null));
        const sandbags = api.orderTownWarSandbags({ campId: "camp-a", segmentId: farSegment.segmentId });
        const wire = api.orderTownWarWire({ campId: "camp-a", segmentId: nearSegment.segmentId });
        api.advanceTownWar({ seconds: 8, tickSeconds: 0.25 });
        const comboBeforePush = api.getTownWarBuildingComboReport().report;

        const expeditionOrder = api.orderTownWarExpedition({ campId: "camp-a", objective: "probe-enemy-approach" });
        api.advanceTownWar({ seconds: 10, tickSeconds: 0.25 });
        const expeditionReport = api.getTownWarExpeditionReport({ expeditionId: expeditionOrder.result.expedition?.id }).report;

        const campDamageBefore = api.getTownWarCampDamageReport({ campId: "camp-b" }).report;
        const weakPoint = campDamageBefore.weakPoints.find((entry) => entry.kind === "ammo-dump") ?? campDamageBefore.weakPoints[0];
        const demolition = api.prepareTownWarDemolition({ campId: "camp-a", grenades: 1, satchels: 1, demoCharges: 1 });
        const breach = api.orderTownWarCampBreach({
          attackerCampId: "camp-a",
          targetCampId: "camp-b",
          weakPointId: weakPoint.id
        });
        api.advanceTownWar({ seconds: 110, tickSeconds: 0.5 });

        const comboAfterBreach = api.getTownWarBuildingComboReport().report;
        const campDamageAfter = api.getTownWarCampDamageReport({ campId: "camp-b" }).report;
        const debrief = api.endTownWarOperation();
        const operationReport = api.getTownWarOperationReport();
        const next = api.startNextTownWarOperation();
        const nextSnapshot = api.getSnapshot().war.townWar;

        return {
          prep,
          start,
          trenchOrders,
          network,
          ammoOrder,
          dugoutOrder,
          sandbags,
          wire,
          comboBeforePush,
          comboAfterBreach,
          expeditionOrder,
          expeditionReport,
          demolition,
          breach,
          campDamageBefore,
          campDamageAfter,
          debrief,
          operationReport,
          next,
          nextOperation: nextSnapshot.operation,
          pageOperation: nextSnapshot.operation
        };
      });

      const debrief = result.debrief.result.debrief;
      const comboNetwork = result.comboBeforePush.networks.find((network) => network.faction === "camp-a");
      const damagedWeakPoints = result.campDamageAfter.weakPoints.filter((weakPoint) => weakPoint.status !== "intact");

      assertSmoke(pageErrors.length === 0, "Expected no browser errors during operation-loop smoke.", pageErrors);
      assertSmoke(result.prep.ok && result.start.ok, "Expected operation prep and launch to succeed.", { prep: result.prep, start: result.start });
      assertSmoke(result.trenchOrders.every((order) => order.ok), "Expected all trench orders to succeed.", result.trenchOrders);
      assertSmoke(result.network?.segmentCount >= 3, "Expected at least three connected Russian trench segments.", result.network);
      assertSmoke(result.ammoOrder.ok && result.dugoutOrder.ok && result.sandbags.ok && result.wire.ok, "Expected support buildings and fieldwork to succeed.", {
        ammoOrder: result.ammoOrder,
        dugoutOrder: result.dugoutOrder,
        sandbags: result.sandbags,
        wire: result.wire
      });
      assertSmoke(comboNetwork?.ammo.linked && comboNetwork?.dugout.linked, "Expected trench network to be ammo-fed and dugout-linked.", comboNetwork);
      assertSmoke(result.expeditionOrder.ok, "Expected expedition order to succeed.", result.expeditionOrder);
      assertSmoke((result.expeditionReport.latestExpedition?.beats.length ?? 0) >= 2, "Expected expedition route beats in the operation.", result.expeditionReport);
      assertSmoke(result.demolition.ok && result.breach.ok, "Expected demolition prep and camp breach to succeed.", { demolition: result.demolition, breach: result.breach });
      assertSmoke(damagedWeakPoints.length > 0, "Expected Ukrainian weak point damage before debrief.", result.campDamageAfter);
      assertSmoke(result.debrief.ok && debrief, "Expected operation debrief to succeed.", result.debrief);
      assertSmoke(supplyTotal(debrief.bankedSupply) > 0 && supplyTotal(debrief.lostSupply) > 0, "Expected debrief to bank and lose/spend supplies.", debrief);
      assertSmoke(debrief.buildingComboLines.some((line) => line.includes("Trench")), "Expected debrief to name building combo impact.", debrief.buildingComboLines);
      assertSmoke(debrief.workLines.length > 0 && debrief.soldierLines.length > 0, "Expected debrief to carry named work and soldier records.", debrief);
      assertSmoke(debrief.routeLines.some((line) => line.includes("Route") || line.includes("progress")), "Expected debrief to explain expedition route.", debrief.routeLines);
      assertSmoke(debrief.campDamageLines.some((line) => line.includes("Ammo dump") || line.includes("weak point") || line.includes("breach")), "Expected debrief to explain camp weak-point damage.", debrief.campDamageLines);
      assertSmoke(debrief.recommendations.length >= 3, "Expected actionable next-operation recommendations.", debrief.recommendations);
      assertSmoke(result.next.ok && result.nextOperation.lastDebrief, "Expected next operation to preserve last debrief after runtime reset.", result.nextOperation);

      await page.locator("[data-officer-tools-toggle]").click();
      await page.locator('[data-officer-tools-tab="debrief"]').click();
      await page.screenshot({ path: `${artifactDir}/01-operation-debrief-pane.png`, fullPage: false });
      await writeFile(`${artifactDir}/operation-loop-report.json`, JSON.stringify(result, null, 2));

      await browser.close();
      return result;
    } catch (error) {
      await browser.close();
      throw error;
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

runOperationLoopSmoke()
  .then((result) => {
    const debrief = result.debrief.result.debrief;
    console.log(
      `town-war-operation-loop smoke passed: ${debrief.summary} | ${debrief.buildingComboLines[0]} | ${debrief.routeLines[0]}`
    );
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
