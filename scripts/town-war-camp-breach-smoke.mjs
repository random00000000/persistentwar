import { spawn, spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";

const host = "127.0.0.1";
const port = 5847;
const baseUrl = `http://${host}:${port}/`;
const url = `${baseUrl}?debugRaid=1`;
const artifactDir = "artifacts/town-war-camp-breach";

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

async function runCampBreachSmoke() {
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
      await mkdir(artifactDir, { recursive: true });
      await page.goto(url, { waitUntil: "networkidle" });
      await page.waitForFunction(() => Boolean(window.__topdownExtractionAgentApi));

      const result = await page.evaluate(() => {
        const api = window.__topdownExtractionAgentApi;
        api.stageState("town-war");
        api.deployTownWarOfficer({ campId: "camp-a" });
        api.focusTownWarLane({ campId: "camp-a", lane: "mid" });
        const before = api.getTownWarCampDamageReport({ campId: "camp-b" }).report;
        const target = before.weakPoints.find((weakPoint) => weakPoint.kind === "ammo-dump") ?? before.weakPoints[0];
        const prep = api.prepareTownWarDemolition({ campId: "camp-a" });
        const order = api.orderTownWarCampBreach({
          attackerCampId: "camp-a",
          targetCampId: "camp-b",
          weakPointId: target.id
        });
        api.advanceTownWar({ seconds: 75, tickSeconds: 0.25 });
        const after = api.getTownWarCampDamageReport({ campId: "camp-b" }).report;
        const afterWeakPoint = after.weakPoints.find((weakPoint) => weakPoint.id === target.id);
        const beforeCamp = before.camps.find((camp) => camp.id === "camp-b");
        const afterCamp = after.camps.find((camp) => camp.id === "camp-b");
        const snapshot = api.getSnapshot();
        return {
          prepOk: prep.ok,
          prepSummary: prep.summary,
          orderOk: order.ok,
          orderSummary: order.summary,
          targetBefore: target,
          targetAfter: afterWeakPoint,
          campBefore: beforeCamp,
          campAfter: afterCamp,
          reportBefore: before,
          reportAfter: after,
          activeBreaches: after.activeBreaches,
          recentBreachEvents: snapshot.war.townWar.dialogue.recentDramaEvents.filter(
            (event) => event.tags.includes("breach") || event.tags.includes("weak-point")
          )
        };
      });

      if (!result.prepOk) {
        throw new Error(`Expected demolition prep to succeed. Result: ${JSON.stringify(result, null, 2)}`);
      }
      if (!result.orderOk) {
        throw new Error(`Expected Russian camp breach order to succeed. Result: ${JSON.stringify(result, null, 2)}`);
      }
      if (!result.targetAfter || result.targetAfter.health >= result.targetBefore.health || result.targetAfter.status === "intact") {
        throw new Error(`Expected target weak point to be damaged. Result: ${JSON.stringify(result, null, 2)}`);
      }
      const ammoChanged = result.campAfter.supply.ammo < result.campBefore.supply.ammo;
      const sustainmentChanged =
        result.campAfter.sustainment.ammoFlow < result.campBefore.sustainment.ammoFlow ||
        result.campAfter.sustainment.readiness < result.campBefore.sustainment.readiness ||
        result.campAfter.sustainment.warnings.length > result.campBefore.sustainment.warnings.length;
      if (!ammoChanged && !sustainmentChanged) {
        throw new Error(`Expected camp sustainment or supply to degrade after breach. Result: ${JSON.stringify(result, null, 2)}`);
      }
      if (!result.reportAfter.debriefLines.some((line) => line.includes("Ammo dump") || line.includes("breach"))) {
        throw new Error(`Expected breach debrief line. Result: ${JSON.stringify(result, null, 2)}`);
      }
      if (result.campAfter.health.current >= result.campBefore.health.current) {
        throw new Error(`Expected breach to apply camp damage. Result: ${JSON.stringify(result, null, 2)}`);
      }

      await page.locator("[data-officer-tools-toggle]").click();
      await page.locator('[data-officer-tools-tab="push"]').click();
      await page.screenshot({ path: `${artifactDir}/01-breach-pane.png`, fullPage: false });
      await writeFile(`${artifactDir}/camp-breach-report.json`, JSON.stringify(result, null, 2));

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

runCampBreachSmoke()
  .then((result) => {
    console.log(
      `town-war-camp-breach smoke passed: ${result.targetBefore.label} ${result.targetBefore.health}->${result.targetAfter.health} | camp ${result.campBefore.health.current}->${result.campAfter.health.current} | ${result.reportAfter.readable}`
    );
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
