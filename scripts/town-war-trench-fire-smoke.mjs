import { spawn, spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";

const host = "127.0.0.1";
const port = 5847;
const baseUrl = `http://${host}:${port}/`;
const url = `${baseUrl}?debugRaid=1`;
const artifactDir = "artifacts/town-war-trench-fire";

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

async function runTrenchFireSmoke() {
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
        const enemy = snapshot.soldiers
          .filter((soldier) => soldier.faction === "camp-b" && soldier.health.current > 0)
          .sort((left, right) => right.position.x - left.position.x)[0];
        const shooter = snapshot.soldiers.find((soldier) => soldier.faction === "camp-a" && soldier.health.current > 0);
        const trenchPosition = {
          x: enemy.position.x + 260,
          y: enemy.position.y
        };
        const trench = api.placeDebugTownWarTrench({
          campId: "camp-a",
          x: trenchPosition.x,
          y: trenchPosition.y,
          facingAngleRadians: Math.PI
        });
        const coverSlotId = trench.result.coverSlot.id;
        const staged = api.stageTownWarSoldierInCover({
          soldierId: shooter.id,
          coverSlotId,
          kind: "hold"
        });
        const ammo = api.setTownWarSoldierAmmo({
          soldierId: shooter.id,
          inMag: 30,
          reserve: 90,
          maxMag: 30
        });
        const before = api.getSnapshot().war.townWar;
        const beforeShooter = before.soldiers.find((soldier) => soldier.id === shooter.id);
        const beforeEnemy = before.soldiers.find((soldier) => soldier.id === enemy.id);
        api.advanceTownWar({ seconds: 8, tickSeconds: 0.25 });
        const after = api.getSnapshot().war.townWar;
        const afterShooter = after.soldiers.find((soldier) => soldier.id === shooter.id);
        const afterEnemy = after.soldiers.find((soldier) => soldier.id === enemy.id);
        const holdOverlay = api.getTownWarReadabilityOverlay().overlay;

        const orderedStaged = api.stageTownWarSoldierInCover({
          soldierId: shooter.id,
          coverSlotId,
          kind: "hold"
        });
        const orderedTask = api.stageTownWarSoldierTask({
          soldierId: shooter.id,
          kind: "defend",
          label: "Debug defend order marker while in trench",
          x: trenchPosition.x + 420,
          y: trenchPosition.y
        });
        const orderedAmmo = api.setTownWarSoldierAmmo({
          soldierId: shooter.id,
          inMag: 30,
          reserve: 90,
          maxMag: 30
        });
        const beforeOrdered = api.getSnapshot().war.townWar;
        const beforeOrderedShooter = beforeOrdered.soldiers.find((soldier) => soldier.id === shooter.id);
        api.advanceTownWar({ seconds: 1, tickSeconds: 1 });
        const afterOrdered = api.getSnapshot().war.townWar;
        const afterOrderedShooter = afterOrdered.soldiers.find((soldier) => soldier.id === shooter.id);
        api.focusTownWarCamera({ x: trenchPosition.x + 120, y: trenchPosition.y + 60 });

        return {
          enemyId: enemy.id,
          shooterId: shooter.id,
          trench,
          staged,
          ammo,
          before: {
            shooterAmmo: beforeShooter.ammo.inMag + beforeShooter.ammo.reserve,
            enemyHealth: beforeEnemy.health.current
          },
          after: {
            shooterAmmo: afterShooter.ammo.inMag + afterShooter.ammo.reserve,
            enemyHealth: afterEnemy.health.current,
            shooterTask: afterShooter.task.kind,
            shooterTargetKind: afterShooter.targetIntent.targetKind,
            shooterTargetReason: afterShooter.targetIntent.reason
          },
          ordered: {
            staged: orderedStaged,
            task: orderedTask,
            ammo: orderedAmmo,
            beforeAmmo: beforeOrderedShooter.ammo.inMag + beforeOrderedShooter.ammo.reserve,
            afterAmmo: afterOrderedShooter.ammo.inMag + afterOrderedShooter.ammo.reserve,
            afterTask: afterOrderedShooter.task,
            afterTargetKind: afterOrderedShooter.targetIntent.targetKind,
            afterTargetReason: afterOrderedShooter.targetIntent.reason
          },
          overlay: holdOverlay
        };
      });

      await page.waitForTimeout(450);
      const screenshotPath = `${artifactDir}/hold-task-trench-firing.png`;
      const screenshot = await page.screenshot({ path: screenshotPath, fullPage: false });

      assertSmoke(result.trench.ok, "Expected debug trench placement to succeed.", result.trench);
      assertSmoke(result.staged.ok, "Expected soldier cover staging to succeed.", result.staged);
      assertSmoke(result.ammo.ok, "Expected soldier ammo staging to succeed.", result.ammo);
      assertSmoke(result.after.shooterTask === "hold", "Expected shooter to remain on hold task.", result.after);
      assertSmoke(result.after.shooterTargetKind !== "none", "Expected hold-task trench occupant to acquire a target.", result.after);
      assertSmoke(result.after.shooterAmmo < result.before.shooterAmmo, "Expected hold-task trench occupant to spend ammo.", { before: result.before, after: result.after });
      assertSmoke(result.after.enemyHealth < result.before.enemyHealth, "Expected hold-task trench occupant to damage enemy.", { before: result.before, after: result.after });
      assertSmoke(result.ordered.staged.ok, "Expected ordered soldier cover staging to succeed.", result.ordered.staged);
      assertSmoke(result.ordered.task.ok, "Expected ordered soldier task staging to succeed.", result.ordered.task);
      assertSmoke(result.ordered.ammo.ok, "Expected ordered soldier ammo staging to succeed.", result.ordered.ammo);
      assertSmoke(result.ordered.afterTask.kind !== "move", "Expected armed trench occupant to stay braced instead of leaving for the order marker.", result.ordered);
      assertSmoke(result.ordered.afterAmmo < result.ordered.beforeAmmo, "Expected trench occupant with an active order marker to still spend ammo.", result.ordered);
      assertSmoke(
        result.overlay.icons.some((icon) => icon.targetType === "soldier" && icon.targetId === result.shooterId && icon.label === "Soldier firing"),
        "Expected readability overlay to report hold-task trench soldier firing.",
        result.overlay.icons
      );
      assertSmoke(
        !result.overlay.icons.some((icon) => icon.targetType === "trench" && icon.targetId === result.trench.result.order.orderId && icon.label === "Trench needs ammo"),
        "Expected a trench with an armed occupant to avoid the needs-ammo warning even without linked crate support.",
        result.overlay.icons
      );
      assertSmoke(screenshot.byteLength > 100000, "Expected non-empty trench firing screenshot.", { bytes: screenshot.byteLength });
      assertSmoke(pageErrors.length === 0, "Expected no browser errors during trench fire smoke.", pageErrors);

      await writeFile(`${artifactDir}/trench-fire-report.json`, JSON.stringify({ ...result, screenshot: screenshotPath }, null, 2));
      console.log(
        `town-war-trench-fire smoke passed: ${result.shooterId} stayed on hold, spent ${result.before.shooterAmmo - result.after.shooterAmmo} ammo, enemy health ${result.before.enemyHealth.toFixed(1)}->${result.after.enemyHealth.toFixed(1)}.`
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

runTrenchFireSmoke().catch((error) => {
  console.error(error);
  process.exit(1);
});
