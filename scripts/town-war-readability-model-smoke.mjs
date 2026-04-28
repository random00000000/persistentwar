import { spawn, spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";

const host = "127.0.0.1";
const port = 5847;
const baseUrl = `http://${host}:${port}/`;
const url = `${baseUrl}?debugRaid=1`;
const artifactDir = "artifacts/town-war-readability-model";

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

function hasIcon(icons, targetType, label, reasonPart = null) {
  return icons.some(
    (icon) =>
      icon.targetType === targetType &&
      icon.label === label &&
      (reasonPart === null || icon.shortReason.toLowerCase().includes(reasonPart.toLowerCase()))
  );
}

async function runReadabilityModelSmoke() {
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

      const result = await page.evaluate(() => {
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
        const overlayResponse = api.getTownWarReadabilityOverlay();
        const snapshotOverlay = api.getSnapshot().war.readability;

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
          overlay: overlayResponse.overlay,
          snapshotOverlay
        };
      });

      const icons = result.overlay.icons;
      assertSmoke(result.correctTrench.ok, "Expected debug correct trench placement to succeed.", result.correctTrench);
      assertSmoke(result.wrongTrench.ok, "Expected debug wrong-facing trench placement to succeed.", result.wrongTrench);
      assertSmoke(result.emptyTrench.ok, "Expected debug empty trench placement to succeed.", result.emptyTrench);
      assertSmoke(result.linkedDugout.ok, "Expected linked dugout order to succeed.", result.linkedDugout);
      assertSmoke(result.unlinkedDugout.ok, "Expected unlinked dugout order to succeed.", result.unlinkedDugout);
      assertSmoke(result.ammoOrder.ok, "Expected ammo crate order to succeed.", result.ammoOrder);
      assertSmoke(result.emptyCrate?.ok, "Expected ammo crate empty staging to succeed.", result.emptyCrate);
      assertSmoke(result.pressure?.ok, "Expected pinned soldier staging to succeed.", result.pressure);
      assertSmoke(result.casualty?.ok, "Expected wounded soldier staging to succeed.", result.casualty);
      assertSmoke(result.overlay.ok, "Expected readability overlay report to be ok.", result.overlay);
      assertSmoke(result.snapshotOverlay?.ok, "Expected snapshot war.readability to expose the overlay.", result.snapshotOverlay);

      assertSmoke(hasIcon(icons, "trench", "Trench facing wrong way", "faces away"), "Expected wrong-facing trench reason.", icons);
      assertSmoke(hasIcon(icons, "trench", "Trench needs occupant", "No one occupying"), "Expected no-occupant trench reason.", icons);
      assertSmoke(hasIcon(icons, "ammo-crate", "Ammo crate empty", "No ammo left"), "Expected empty ammo crate reason.", icons);
      assertSmoke(hasIcon(icons, "dugout", "Dugout not linked", "Too far"), "Expected unlinked dugout reason.", icons);
      assertSmoke(
        hasIcon(icons, "dugout", "Dugout linked", "supports") || hasIcon(icons, "dugout", "Dugout shelter active", "sheltering"),
        "Expected linked or active-shelter dugout reason.",
        icons
      );
      assertSmoke(
        icons.some((icon) => icon.targetType === "soldier" && (icon.label === "Soldier pinned" || icon.label === "Soldier retreating")),
        "Expected pinned/retreating soldier readability state.",
        icons
      );
      assertSmoke(hasIcon(icons, "soldier", "Soldier wounded", "is"), "Expected wounded soldier readability state.", icons);
      assertSmoke(result.overlay.totals.byTargetType.trench >= 2, "Expected at least two trench readability icons.", result.overlay.totals);
      assertSmoke(result.overlay.totals.byTargetType["ammo-crate"] >= 1, "Expected at least one ammo crate readability icon.", result.overlay.totals);
      assertSmoke(result.overlay.totals.byTargetType.dugout >= 2, "Expected at least two dugout readability icons.", result.overlay.totals);
      assertSmoke(result.overlay.totals.byTargetType.soldier >= 2, "Expected at least two soldier readability icons.", result.overlay.totals);
      assertSmoke(pageErrors.length === 0, "Expected no browser errors during readability model smoke.", pageErrors);

      await writeFile(`${artifactDir}/readability-model-report.json`, JSON.stringify(result.overlay, null, 2));
      console.log(
        `town-war-readability-model smoke passed: ${result.overlay.totals.icons} icons, ${result.overlay.totals.blockers} blockers. ${result.overlay.readable}`
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

runReadabilityModelSmoke().catch((error) => {
  console.error(error);
  process.exit(1);
});
