import { spawn, spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";

const host = "127.0.0.1";
const port = 5847;
const baseUrl = `http://${host}:${port}/`;
const url = `${baseUrl}?debugRaid=1`;
const artifactDir = "artifacts/town-war-readability-loop";

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

function hasLabel(overlay, labelPart, reasonPart = null) {
  return overlay.icons.some(
    (icon) =>
      icon.label.toLowerCase().includes(labelPart.toLowerCase()) &&
      (reasonPart === null || icon.shortReason.toLowerCase().includes(reasonPart.toLowerCase()))
  );
}

async function saveScreenshot(page, name) {
  const path = `${artifactDir}/${name}.png`;
  const bytes = await page.screenshot({ path, fullPage: false });
  assertSmoke(bytes.byteLength > 100000, `Expected non-empty screenshot ${name}.`, { bytes: bytes.byteLength });
  return path;
}

async function runReadabilityLoopSmoke() {
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
        const prep = api.prepareTownWarOperation({ ammo: 420, build: 420, food: 220, med: 140 });
        const start = api.startNextTownWarOperation();
        api.deployTownWarOfficer({ campId: "camp-a" });
        api.focusTownWarLane({ campId: "camp-a", lane: "mid" });

        const townWar = api.getSnapshot().war.townWar;
        const campA = townWar.camps.find((camp) => camp.id === "camp-a");
        const origin = {
          x: campA.spawn.position.x - 360,
          y: campA.spawn.position.y - 160
        };
        api.focusTownWarCamera({ x: origin.x + 180, y: origin.y + 130 });

        const badPreview = api.stageTownWarBuildPreview({
          campId: "camp-a",
          kind: "trench",
          x: origin.x,
          y: origin.y,
          facingAngleRadians: 0
        });
        return { prep, start, origin, badPreview };
      });
      await page.waitForTimeout(450);
      const badPreviewRuntime = await page.evaluate(() => window.__topdownExtractionAgentApi.getTownWarRuntimeReport());
      const badPreviewShot = await saveScreenshot(page, "01-preview-bad-trench");

      const support = await page.evaluate((origin) => {
        const api = window.__topdownExtractionAgentApi;
        const trench = api.placeDebugTownWarTrench({
          campId: "camp-a",
          x: origin.x,
          y: origin.y,
          facingAngleRadians: Math.PI
        });
        const ammo = api.orderTownWarAmmoCrate({
          campId: "camp-a",
          x: origin.x + 24,
          y: origin.y + 18
        });
        const waitFor = (predicate, maxSteps = 48) => {
          for (let step = 0; step < maxSteps; step += 1) {
            const state = api.getSnapshot().war.townWar;
            if (predicate(state)) {
              return state;
            }
            api.advanceTownWar({ seconds: 5, tickSeconds: 0.25 });
          }
          return api.getSnapshot().war.townWar;
        };
        waitFor((state) => state.ammoCrates.some((crate) => crate.faction === "camp-a" && crate.destroyedAtSeconds === null));
        const goodTrenchPreview = api.stageTownWarBuildPreview({
          campId: "camp-a",
          kind: "trench",
          x: origin.x + 76,
          y: origin.y + 24,
          facingAngleRadians: Math.PI
        });
        const ammoPreview = api.stageTownWarBuildPreview({
          campId: "camp-a",
          kind: "ammo-crate",
          x: origin.x + 42,
          y: origin.y + 12,
          facingAngleRadians: 0
        });
        const dugoutPreview = api.stageTownWarBuildPreview({
          campId: "camp-a",
          kind: "dugout",
          x: origin.x + 70,
          y: origin.y + 18,
          facingAngleRadians: Math.PI
        });
        const dugout = api.orderTownWarDugout({
          campId: "camp-a",
          x: origin.x + 70,
          y: origin.y + 18,
          facingAngleRadians: Math.PI
        });
        waitFor((state) => state.dugouts.some((entry) => entry.faction === "camp-a" && entry.destroyedAtSeconds === null));
        const inspectPane = api.setTownWarOfficerPane({ pane: "priorities", open: true });
        return { trench, ammo, goodTrenchPreview, ammoPreview, dugoutPreview, dugout, inspectPane };
      }, staged.origin);
      await page.waitForTimeout(450);
      const supportRuntime = await page.evaluate(() => window.__topdownExtractionAgentApi.getTownWarRuntimeReport());
      const supportShot = await saveScreenshot(page, "02-preview-valid-support");

      const inspectRuntime = await page.evaluate(() => window.__topdownExtractionAgentApi.getTownWarRuntimeReport());
      const inspectShot = await saveScreenshot(page, "03-inspect-mode-links");

      const live = await page.evaluate(() => {
        const api = window.__topdownExtractionAgentApi;
        const townWar = api.getSnapshot().war.townWar;
        const crate = townWar.ammoCrates.find((entry) => entry.faction === "camp-a" && entry.destroyedAtSeconds === null);
        const emptyCrate = crate ? api.stageTownWarAmmoCrateStock({ crateId: crate.id, ammo: 0 }) : null;
        api.stageTownWarBuildPreview({ campId: "camp-a", kind: null });
        api.setTownWarOfficerPane({ pane: "build", open: false });
        api.advanceTownWar({ seconds: 2, tickSeconds: 0.25 });
        const overlay = api.getTownWarReadabilityOverlay().overlay;
        const debrief = api.endTownWarOperation();
        const operationReport = api.getTownWarOperationReport();
        api.setTownWarOfficerPane({ pane: "debrief", open: true });
        return { emptyCrate, overlay, debrief, operationReport };
      });
      await page.waitForTimeout(450);
      const liveRuntime = await page.evaluate(() => window.__topdownExtractionAgentApi.getTownWarRuntimeReport());
      const liveShot = await saveScreenshot(page, "04-live-blocker");
      const debriefShot = await saveScreenshot(page, "05-debrief-readability-reason");

      assertSmoke(staged.prep.ok, "Expected operation prep to succeed.", staged.prep);
      assertSmoke(staged.start.ok, "Expected operation start to succeed.", staged.start);
      assertSmoke(staged.badPreview.ok, "Expected bad trench preview to stage.", staged.badPreview);
      assertSmoke(hasLabel(staged.badPreview.overlay, "faces away", "Rotate"), "Expected bad trench preview to warn about facing.", staged.badPreview.overlay);
      assertSmoke(
        badPreviewRuntime.report.scene?.readabilityBuildPreviewIcons >= 2,
        "Expected build-preview icons to render for bad trench.",
        badPreviewRuntime.report.scene
      );
      assertSmoke(support.trench.ok, "Expected debug trench to place.", support.trench);
      assertSmoke(support.ammo.ok, "Expected ammo order to succeed.", support.ammo);
      assertSmoke(hasLabel(support.goodTrenchPreview.overlay, "faces enemy", "Firing arc"), "Expected useful trench preview to face enemy.", support.goodTrenchPreview.overlay);
      assertSmoke(hasLabel(support.goodTrenchPreview.overlay, "ammo linked", "crate"), "Expected useful trench preview to show ammo link.", support.goodTrenchPreview.overlay);
      assertSmoke(hasLabel(support.ammoPreview.overlay, "ammo feeds", "feed"), "Expected ammo preview to show fed slots.", support.ammoPreview.overlay);
      assertSmoke(hasLabel(support.dugoutPreview.overlay, "dugout linked", "support"), "Expected dugout preview to show linked support.", support.dugoutPreview.overlay);
      assertSmoke(supportRuntime.report.scene?.readabilityBuildPreviewIcons >= 2, "Expected support preview icons to render.", supportRuntime.report.scene);
      assertSmoke(support.inspectPane.ok, "Expected inspect pane to open.", support.inspectPane);
      assertSmoke(inspectRuntime.report.scene?.readabilityInspectMode, "Expected inspect mode to be active.", inspectRuntime.report.scene);
      assertSmoke(inspectRuntime.report.scene?.readabilityInspectIcons >= 3, "Expected inspect icons to render.", inspectRuntime.report.scene);
      assertSmoke(live.emptyCrate?.ok, "Expected crate to stage empty.", live.emptyCrate);
      assertSmoke(hasLabel(live.overlay, "ammo crate empty", "No ammo"), "Expected live overlay to report empty crate.", live.overlay);
      assertSmoke(live.debrief.ok, "Expected operation debrief to succeed.", live.debrief);
      assertSmoke(
        live.debrief.result.debrief?.buildingComboLines.some((line) => line.includes("Readability Ammo crate empty: No ammo left to support firing.")),
        "Expected debrief building lines to reuse the live readability reason.",
        live.debrief.result.debrief?.buildingComboLines
      );
      assertSmoke(live.operationReport.result.debrief !== null, "Expected operation report to expose debrief.", live.operationReport);
      assertSmoke(pageErrors.length === 0, "Expected no browser errors during readability loop smoke.", pageErrors);

      const report = {
        origin: staged.origin,
        badPreview: staged.badPreview.overlay,
        supportPreview: support.goodTrenchPreview.overlay,
        ammoPreview: support.ammoPreview.overlay,
        dugoutPreview: support.dugoutPreview.overlay,
        inspectRuntime: inspectRuntime.report,
        liveOverlay: live.overlay,
        debrief: live.debrief.result.debrief,
        screenshots: [badPreviewShot, supportShot, inspectShot, liveShot, debriefShot]
      };
      await writeFile(`${artifactDir}/readability-loop-report.json`, JSON.stringify(report, null, 2));
      console.log(
        `town-war-readability-loop smoke passed: ${staged.badPreview.overlay.totals.buildPreview} bad-preview icons, ${inspectRuntime.report.scene.readabilityInspectIcons} inspect icons, debrief reused empty-crate reason.`
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

runReadabilityLoopSmoke().catch((error) => {
  console.error(error);
  process.exit(1);
});
