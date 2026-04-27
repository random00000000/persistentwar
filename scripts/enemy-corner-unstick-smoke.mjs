import { spawn, spawnSync } from "node:child_process";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";
import viewportModule from "../automation-artifacts/playwright-viewport.cjs";

const host = "127.0.0.1";
const port = 5852;
const url = `http://${host}:${port}/`;
const { DESKTOP_VIEWPORT } = viewportModule;

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
      // Server is still starting.
    }

    await delay(250);
  }

  throw new Error(`Timed out waiting for ${serverUrl}`);
}

function distance(left, right) {
  return Math.hypot(left.x - right.x, left.y - right.y);
}

async function runEnemyCornerUnstickSmoke() {
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
        spawnSync("taskkill", ["/pid", String(server.pid), "/t", "/f"], {
          stdio: "ignore",
          shell: false
        });
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
      const page = await browser.newPage({ viewport: DESKTOP_VIEWPORT });
      const pageErrors = [];

      page.on("pageerror", (error) => {
        pageErrors.push(error.stack || error.message);
      });

      await page.goto(url, { waitUntil: "networkidle" });
      await page.waitForFunction(() => Boolean(window.__topdownExtractionAgentApi), null, { timeout: 15000 });

      const staged = await page.evaluate(() => window.__topdownExtractionAgentApi.stageEnemyCornerUnstick());
      if (!staged.ok || staged.enemyId === null || !staged.start || !staged.goal) {
        throw new Error(`Failed to stage enemy corner unstick scenario: ${JSON.stringify(staged)}`);
      }

      await page.waitForTimeout(6200);
      const finalSnapshot = await page.evaluate(() => window.__topdownExtractionAgentApi.getSnapshot());
      const enemy = finalSnapshot.raid?.enemies?.find((entry) => entry.id === staged.enemyId);
      if (!enemy) {
        throw new Error(`Expected staged enemy-${staged.enemyId} to remain present. Snapshot: ${JSON.stringify(finalSnapshot.raid?.enemies ?? null)}`);
      }

      const movedFromStart = distance(enemy.position, staged.start);
      const distanceToGoalBefore = distance(staged.start, staged.goal);
      const distanceToGoalAfter = distance(enemy.position, staged.goal);
      if (movedFromStart < 32 || distanceToGoalAfter >= distanceToGoalBefore - 18) {
        throw new Error(
          `Expected Ukrainian enemy to recover from building corner and make progress. ` +
            `Moved ${movedFromStart.toFixed(1)}px, goal before ${distanceToGoalBefore.toFixed(1)}px, after ${distanceToGoalAfter.toFixed(1)}px. ` +
            `Enemy: ${JSON.stringify(enemy)} Staged: ${JSON.stringify(staged)}`
        );
      }

      if (pageErrors.length > 0) {
        throw new Error(`Browser page errors detected:\n${pageErrors.join("\n\n")}`);
      }

      console.log("Enemy corner unstick smoke passed.");
      console.log(`Enemy-${staged.enemyId} moved ${movedFromStart.toFixed(1)}px off ${staged.obstacle?.label ?? "building corner"}.`);
      console.log(`Goal progress: ${distanceToGoalBefore.toFixed(1)}px -> ${distanceToGoalAfter.toFixed(1)}px.`);
    } finally {
      await browser.close();
    }
  } catch (error) {
    const message = error instanceof Error ? error.stack || error.message : String(error);
    throw new Error(`${message}\n\nDev server output:\n${serverOutput}`);
  } finally {
    cleanup();
  }
}

runEnemyCornerUnstickSmoke().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
