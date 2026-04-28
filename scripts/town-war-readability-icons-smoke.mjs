import { spawn, spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";

const host = "127.0.0.1";
const port = 5847;
const baseUrl = `http://${host}:${port}/`;
const url = `${baseUrl}?debugRaid=1`;
const artifactDir = "artifacts/town-war-readability-icons";

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

async function runReadabilityIconsSmoke() {
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
      await page.waitForFunction(() => Boolean(window.__topdownExtractionAgentApi), null, { timeout: 15000 });

      const staged = await page.evaluate(() => {
        const api = window.__topdownExtractionAgentApi;
        api.stageState("town-war");
        api.deployTownWarOfficer({ campId: "camp-a" });
        api.focusTownWarLane({ campId: "camp-a", lane: "mid" });

        const snapshot = api.getSnapshot().war.townWar;
        const campA = snapshot.camps.find((camp) => camp.id === "camp-a");
        const origin = {
          x: campA.spawn.position.x - 360,
          y: campA.spawn.position.y - 160
        };

        const correctTrench = api.placeDebugTownWarTrench({
          campId: "camp-a",
          x: origin.x,
          y: origin.y,
          facingAngleRadians: Math.PI
        });
        const wrongTrench = api.placeDebugTownWarTrench({
          campId: "camp-a",
          x: origin.x,
          y: origin.y + 130,
          facingAngleRadians: 0
        });
        const linkedDugout = api.orderTownWarDugout({
          campId: "camp-a",
          x: origin.x + 68,
          y: origin.y + 12,
          facingAngleRadians: Math.PI
        });
        const unlinkedDugout = api.orderTownWarDugout({
          campId: "camp-a",
          x: origin.x + 620,
          y: origin.y + 420,
          facingAngleRadians: Math.PI
        });
        const ammoOrder = api.orderTownWarAmmoCrate({
          campId: "camp-a",
          x: origin.x + 18,
          y: origin.y + 18
        });

        const waitFor = (predicate, maxSteps = 48) => {
          for (let step = 0; step < maxSteps; step += 1) {
            const townWar = api.getSnapshot().war.townWar;
            if (predicate(townWar)) {
              return townWar;
            }
            api.advanceTownWar({ seconds: 5, tickSeconds: 0.25 });
          }
          return api.getSnapshot().war.townWar;
        };

        let townWar = waitFor(
          (state) =>
            state.dugouts.filter((dugout) => dugout.faction === "camp-a" && dugout.destroyedAtSeconds === null).length >= 2 &&
            state.ammoCrates.some((crate) => crate.faction === "camp-a" && crate.destroyedAtSeconds === null)
        );

        const crate = townWar.ammoCrates.find((entry) => entry.faction === "camp-a" && entry.destroyedAtSeconds === null);
        const emptyCrate = crate ? api.stageTownWarAmmoCrateStock({ crateId: crate.id, ammo: 0 }) : null;

        townWar = api.getSnapshot().war.townWar;
        const pinnedSoldier = townWar.soldiers.find((soldier) => soldier.faction === "camp-a" && soldier.health.current > 0);
        const pressure = pinnedSoldier
          ? api.stageTownWarSoldierPressure({ soldierId: pinnedSoldier.id, pressure: pinnedSoldier.morale.maxPressure })
          : null;
        const woundedCandidate = townWar.soldiers.find(
          (soldier) => soldier.faction === "camp-a" && soldier.health.current > 0 && soldier.id !== pinnedSoldier?.id
        );
        const casualty = woundedCandidate
          ? api.stageTownWarCasualty({
              soldierId: woundedCandidate.id,
              x: woundedCandidate.position.x,
              y: woundedCandidate.position.y,
              severity: "serious"
            })
          : null;

        api.advanceTownWar({ seconds: 2, tickSeconds: 0.25 });
        const emptyTrench = api.placeDebugTownWarTrench({
          campId: "camp-a",
          x: origin.x,
          y: origin.y - 160,
          facingAngleRadians: Math.PI
        });
        api.focusTownWarCamera({ x: origin.x + 160, y: origin.y + 90 });

        const overlay = api.getTownWarReadabilityOverlay().overlay;
        return {
          correctTrench,
          wrongTrench,
          emptyTrench,
          linkedDugout,
          unlinkedDugout,
          ammoOrder,
          emptyCrate,
          pressure,
          casualty,
          overlay,
          focus: { x: origin.x + 160, y: origin.y + 90 }
        };
      });

      await page.waitForTimeout(700);
      const runtime = await page.evaluate(() => window.__topdownExtractionAgentApi.getTownWarRuntimeReport());
      const screenshotPath = `${artifactDir}/readability-icons-1920x1080.png`;
      const screenshot = await page.screenshot({ path: screenshotPath, fullPage: false });

      assertSmoke(staged.correctTrench.ok, "Expected debug correct trench placement to succeed.", staged.correctTrench);
      assertSmoke(staged.wrongTrench.ok, "Expected debug wrong-facing trench placement to succeed.", staged.wrongTrench);
      assertSmoke(staged.emptyTrench.ok, "Expected debug empty trench placement to succeed.", staged.emptyTrench);
      assertSmoke(staged.linkedDugout.ok, "Expected linked dugout order to succeed.", staged.linkedDugout);
      assertSmoke(staged.unlinkedDugout.ok, "Expected unlinked dugout order to succeed.", staged.unlinkedDugout);
      assertSmoke(staged.ammoOrder.ok, "Expected ammo crate order to succeed.", staged.ammoOrder);
      assertSmoke(staged.emptyCrate?.ok, "Expected ammo crate empty staging to succeed.", staged.emptyCrate);
      assertSmoke(staged.pressure?.ok, "Expected pinned soldier staging to succeed.", staged.pressure);
      assertSmoke(staged.casualty?.ok, "Expected wounded soldier staging to succeed.", staged.casualty);
      assertSmoke(staged.overlay.ok, "Expected readability overlay to be ok.", staged.overlay);
      assertSmoke(staged.overlay.totals.normal >= 6, "Expected several normal-mode readability icons.", staged.overlay.totals);
      assertSmoke(runtime.report.scene?.readabilityIcons >= 6, "Expected visible readability icons in scene report.", runtime.report.scene);
      assertSmoke(
        runtime.report.scene?.readabilityNormalIcons >= 6,
        "Expected normal-mode readability icons in scene report.",
        runtime.report.scene
      );
      assertSmoke(screenshot.byteLength > 100000, "Expected a non-empty 1920x1080 readability screenshot.", { bytes: screenshot.byteLength });
      assertSmoke(pageErrors.length === 0, "Expected no browser errors during readability icon smoke.", pageErrors);

      const report = {
        focus: staged.focus,
        overlay: staged.overlay,
        runtime: runtime.report,
        screenshot: screenshotPath
      };
      await writeFile(`${artifactDir}/readability-icons-report.json`, JSON.stringify(report, null, 2));
      console.log(
        `town-war-readability-icons smoke passed: ${runtime.report.scene.readabilityIcons} rendered icons, ${staged.overlay.totals.normal} normal overlay icons. Screenshot: ${screenshotPath}`
      );
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

runReadabilityIconsSmoke().catch((error) => {
  console.error(error);
  process.exit(1);
});
