import { mkdir, writeFile } from "node:fs/promises";
import { spawn, spawnSync } from "node:child_process";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";

const host = "127.0.0.1";
const port = 5847;
const baseUrl = `http://${host}:${port}/`;
const url = `${baseUrl}?debugRaid=1`;
const viewport = { width: 1920, height: 1080 };
const artifactDir = "artifacts/town-war-performance-reset";

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
          spawnSync("taskkill", ["/pid", String(server.pid), "/t", "/f"], { stdio: "ignore", shell: false });
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

function round(value, digits = 2) {
  return Number(value.toFixed(digits));
}

function summarizeFrames(frames) {
  const sorted = [...frames].sort((left, right) => left - right);
  const average = frames.reduce((total, value) => total + value, 0) / Math.max(1, frames.length);
  const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))] ?? 0;
  const max = sorted[sorted.length - 1] ?? 0;
  return {
    samples: frames.length,
    averageMs: round(average),
    p95Ms: round(p95),
    maxMs: round(max),
    framesOver50Ms: frames.filter((value) => value > 50).length
  };
}

async function sampleFrames(page, frameCount = 180) {
  const frames = await page.evaluate(
    async (count) =>
      new Promise((resolve) => {
        const samples = [];
        let last = performance.now();
        const step = () => {
          const now = performance.now();
          samples.push(now - last);
          last = now;
          if (samples.length >= count) {
            resolve(samples);
            return;
          }
          window.requestAnimationFrame(step);
        };
        window.requestAnimationFrame(step);
      }),
    frameCount
  );
  return summarizeFrames(frames);
}

async function readStateSummary(page, label) {
  return page.evaluate((summaryLabel) => {
    const api = window.__topdownExtractionAgentApi;
    const snapshot = api.getSnapshot();
    const runtime = api.getTownWarRuntimeReport();
    const townWar = snapshot.war.townWar;
    const queryCount = (selector) => document.querySelectorAll(selector).length;

    return {
      label: summaryLabel,
      phase: snapshot.phase,
      officerFaction: townWar.officer.faction,
      clockSeconds: townWar.clock.seconds,
      soldiers: townWar.soldiers.length,
      combatants: townWar.combatants.length,
      orders: townWar.orders.length,
      activeOrders: townWar.orders.filter((order) => order.status !== "completed").length,
      completedOrders: townWar.orders.filter((order) => order.status === "completed").length,
      trenchSlots: townWar.aiTactics.coverSlots.filter((slot) => slot.sourceKind === "trench").length,
      ammoCrates: townWar.ammoCrates.filter((crate) => crate.destroyedAtSeconds === null).length,
      dugouts: townWar.dugouts.filter((dugout) => dugout.destroyedAtSeconds === null).length,
      ui: {
        gameCanvas: queryCount("#game-root canvas"),
        totalCanvas: queryCount("canvas"),
        officerToggle: queryCount("[data-officer-tools-toggle]"),
        buildToggle: queryCount("[data-build-mode-toggle]"),
        campArtToggle: queryCount("[data-camp-art-toggle]"),
        firstMinuteRail: queryCount("[data-first-minute-rail]"),
        campArtStatus: document.querySelector("[data-camp-art-status]")?.textContent?.trim() ?? null,
        officerMode: document.body.classList.contains("town-war-officer-mode"),
        buildMode: document.body.classList.contains("town-war-build-mode")
      },
      runtime: runtime.report
    };
  }, label);
}

function assertCleanUi(summary) {
  assertSmoke(summary.ui.gameCanvas === 1, "Expected exactly one Phaser game canvas.", summary);
  assertSmoke(summary.ui.officerToggle === 1, "Expected exactly one officer tools toggle.", summary);
  assertSmoke(summary.ui.buildToggle === 1, "Expected exactly one build toggle.", summary);
  assertSmoke(summary.ui.campArtToggle === 1, "Expected exactly one camp art toggle.", summary);
  assertSmoke(summary.ui.firstMinuteRail === 1, "Expected exactly one first-minute rail.", summary);
}

async function dirtyTownWar(page) {
  return page.evaluate(() => {
    const api = window.__topdownExtractionAgentApi;
    api.stageState("town-war");
    api.deployTownWarOfficer({ campId: "camp-a" });
    const focus = api.focusTownWarLane({ campId: "camp-a", lane: "mid" });
    const snapshot = api.getSnapshot().war.townWar;
    const focusPosition = snapshot.aiThreats.frontlineFocus.position;
    const ukrainianCamp = snapshot.camps.find((camp) => camp.id === "camp-b");
    const enemyPosition = ukrainianCamp?.spawn?.position ?? { x: focusPosition.x - 620, y: focusPosition.y };
    const enemyAngle = Math.atan2(enemyPosition.y - focusPosition.y, enemyPosition.x - focusPosition.x);
    const trenchAngle = enemyAngle + Math.PI / 2;
    const orders = [];

    for (const offsetY of [-120, 0, 120]) {
      orders.push(api.orderTownWarTrench({ campId: "camp-a", x: focusPosition.x, y: focusPosition.y + offsetY, facingAngleRadians: trenchAngle }));
    }
    orders.push(api.orderTownWarAmmoCrate({ campId: "camp-a", x: focusPosition.x + 145, y: focusPosition.y - 40 }));
    orders.push(api.orderTownWarDugout({ campId: "camp-a", x: focusPosition.x + 70, y: focusPosition.y + 150, facingAngleRadians: trenchAngle }));

    return {
      focus: focus.summary,
      orderSummaries: orders.map((order) => order.summary),
      acceptedOrders: orders.filter((order) => order.ok).length
    };
  });
}

async function advanceTenMinuteSimulation(page) {
  const chunks = [];
  for (let index = 0; index < 10; index += 1) {
    const chunk = await page.evaluate(() => {
      const api = window.__topdownExtractionAgentApi;
      const startedAt = performance.now();
      const result = api.advanceTownWar({ seconds: 60, tickSeconds: 0.5 });
      const elapsedMs = performance.now() - startedAt;
      return {
        elapsedMs,
        summary: result.summary,
        appliedTicks: result.advance.appliedTicks
      };
    });
    chunks.push(chunk);
    await page.waitForTimeout(50);
  }

  return {
    chunks,
    totalElapsedMs: round(chunks.reduce((total, chunk) => total + chunk.elapsedMs, 0)),
    totalTicks: chunks.reduce((total, chunk) => total + chunk.appliedTicks, 0)
  };
}

async function runPerformanceResetSmoke() {
  await mkdir(artifactDir, { recursive: true });

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

      const baselineReset = await page.evaluate(() => window.__topdownExtractionAgentApi.resetTownWar());
      await page.waitForTimeout(500);
      const baseline = await readStateSummary(page, "baseline");
      assertCleanUi(baseline);
      assertSmoke(baseline.phase === "raid", "Expected resetTownWar to leave the town-war slice playable.", baseline);
      assertSmoke(baseline.officerFaction === "camp-a", "Expected Russian camp-a player side after reset.", baseline);
      assertSmoke(baseline.runtime.scene !== null, "Expected active RaidScene runtime report.", baseline);
      assertSmoke(baseline.orders === 0 && baseline.trenchSlots === 0 && baseline.ammoCrates === 0, "Expected clean baseline state.", baseline);

      await page.locator("[data-camp-art-toggle]").click();
      await page.waitForTimeout(250);
      const artHidden = await readStateSummary(page, "camp-art-hidden");
      assertSmoke(artHidden.ui.campArtStatus === "Off", "Expected camp art toggle to hide Russian camp art.", artHidden);
      assertSmoke(artHidden.runtime.scene?.playerCampArtVisible === false, "Expected scene camp art visibility to be false.", artHidden);

      const dirty = await dirtyTownWar(page);
      assertSmoke(dirty.acceptedOrders >= 4, "Expected repeated build placement to accept multiple orders.", dirty);
      await page.waitForTimeout(500);
      const dirtySummary = await readStateSummary(page, "dirty-before-advance");
      assertSmoke(dirtySummary.orders >= 4, "Expected dirty state to include build orders.", dirtySummary);
      assertCleanUi(dirtySummary);

      const beforeFrames = await sampleFrames(page, 180);
      const tenMinuteAdvance = await advanceTenMinuteSimulation(page);
      await page.waitForTimeout(1000);
      const afterFrames = await sampleFrames(page, 180);
      const afterAdvance = await readStateSummary(page, "after-10-minute-sim");
      await page.screenshot({ path: `${artifactDir}/01-after-10-minute-sim.png`, fullPage: true });

      assertSmoke(afterAdvance.clockSeconds >= 590, "Expected accelerated ten-minute town-war clock progression.", afterAdvance);
      assertSmoke(afterAdvance.runtime.scene !== null, "Expected scene report after ten-minute sim.", afterAdvance);
      assertSmoke(
        afterFrames.p95Ms <= beforeFrames.p95Ms * 1.35,
        "Expected post-advance frame p95 to avoid significant degradation from baseline.",
        { beforeFrames, afterFrames, afterAdvance }
      );
      assertSmoke(
        afterFrames.averageMs <= beforeFrames.averageMs * 1.35,
        "Expected post-advance average frame time to avoid significant degradation from baseline.",
        { beforeFrames, afterFrames, afterAdvance }
      );
      assertSmoke((afterAdvance.runtime.scene?.soldierSprites ?? 0) <= afterAdvance.soldiers + 4, "Expected soldier sprite count to stay bounded by live soldiers.", afterAdvance);
      assertSmoke((afterAdvance.runtime.scene?.fieldworkLabels ?? 0) <= 18, "Expected fieldwork labels to stay bounded.", afterAdvance);
      assertSmoke((afterAdvance.runtime.scene?.statusLabels ?? 0) <= 18, "Expected status labels to stay bounded.", afterAdvance);

      const resetResult = await page.evaluate(() => window.__topdownExtractionAgentApi.resetTownWar());
      await page.waitForTimeout(600);
      const afterReset = await readStateSummary(page, "after-api-reset");
      await page.screenshot({ path: `${artifactDir}/02-after-api-reset.png`, fullPage: true });
      assertCleanUi(afterReset);
      assertSmoke(afterReset.runtime.scene !== null, "Expected scene report after reset.", afterReset);
      assertSmoke(afterReset.orders === 0, "Expected resetTownWar to clear orders.", { dirtySummary, afterReset, resetResult });
      assertSmoke(afterReset.trenchSlots === 0, "Expected resetTownWar to clear trench slots.", { dirtySummary, afterReset, resetResult });
      assertSmoke(afterReset.ammoCrates === 0 && afterReset.dugouts === 0, "Expected resetTownWar to clear support buildings.", { dirtySummary, afterReset });
      assertSmoke(afterReset.soldiers === baseline.soldiers, "Expected resetTownWar to restore baseline soldier count.", { baseline, afterReset });
      assertSmoke(afterReset.ui.campArtStatus === "On", "Expected resetTownWar to restore camp art toggle to On.", afterReset);
      assertSmoke(afterReset.runtime.scene?.playerCampArtVisible === true, "Expected scene camp art visibility to reset to true.", afterReset);

      await page.locator("[data-camp-art-toggle]").click();
      await page.waitForTimeout(250);
      const artHiddenAfterReset = await readStateSummary(page, "camp-art-hidden-after-reset");
      assertSmoke(artHiddenAfterReset.ui.campArtStatus === "Off", "Expected camp art toggle to still work after reset.", artHiddenAfterReset);
      assertSmoke(artHiddenAfterReset.runtime.scene?.playerCampArtVisible === false, "Expected scene camp art to hide after reset.", artHiddenAfterReset);

      await page.reload({ waitUntil: "networkidle" });
      await page.waitForFunction(() => Boolean(window.__topdownExtractionAgentApi), null, { timeout: 15000 });
      await page.evaluate(() => window.__topdownExtractionAgentApi.resetTownWar());
      await page.waitForTimeout(600);
      const afterReloadReset = await readStateSummary(page, "after-browser-reload-reset");
      assertCleanUi(afterReloadReset);
      assertSmoke(afterReloadReset.orders === 0 && afterReloadReset.trenchSlots === 0, "Expected browser reload reset to be clean.", afterReloadReset);
      assertSmoke(afterReloadReset.soldiers === baseline.soldiers, "Expected browser reload reset to restore baseline soldiers.", {
        baseline,
        afterReloadReset
      });
      assertSmoke(pageErrors.length === 0, "Expected no browser console/page errors during performance reset smoke.", pageErrors);

      const report = {
        url,
        baselineResetSummary: baselineReset.summary,
        baseline,
        dirty,
        dirtySummary,
        beforeFrames,
        tenMinuteAdvance,
        afterFrames,
        afterAdvance,
        resetResultSummary: resetResult.summary,
        afterReset,
        artHiddenAfterReset,
        afterReloadReset,
        screenshots: [`${artifactDir}/01-after-10-minute-sim.png`, `${artifactDir}/02-after-api-reset.png`]
      };
      await writeFile(`${artifactDir}/performance-reset-report.json`, `${JSON.stringify(report, null, 2)}\n`, "utf8");

      console.log("Town-war performance/reset smoke passed.");
      console.log(`URL: ${url}`);
      console.log(`10-minute sim: ${tenMinuteAdvance.totalTicks} ticks in ${tenMinuteAdvance.totalElapsedMs}ms.`);
      console.log(`Frames: before p95 ${beforeFrames.p95Ms}ms, after p95 ${afterFrames.p95Ms}ms, after spikes ${afterFrames.framesOver50Ms}.`);
      console.log(
        `Reset proof: advanced orders ${afterAdvance.orders}, trenches ${afterAdvance.trenchSlots}, crates ${afterAdvance.ammoCrates}; reset orders ${afterReset.orders}, trenches ${afterReset.trenchSlots}, crates ${afterReset.ammoCrates}.`
      );
      console.log(
        `Scene proof: soldiers ${afterAdvance.runtime.scene.soldierSprites}, fieldwork labels ${afterAdvance.runtime.scene.fieldworkLabels}, status labels ${afterAdvance.runtime.scene.statusLabels}, display objects ${afterAdvance.runtime.scene.displayObjects}.`
      );
      console.log(`Artifacts: ${artifactDir}/performance-reset-report.json, ${report.screenshots.join(", ")}`);
    } finally {
      await page.close();
      await browser.close();
    }
  } catch (error) {
    const message = error instanceof Error ? error.stack || error.message : String(error);
    throw new Error(`${message}\n\nDev server output:\n${server?.output ?? "(existing server used)"}`);
  } finally {
    cleanup();
  }
}

runPerformanceResetSmoke().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
