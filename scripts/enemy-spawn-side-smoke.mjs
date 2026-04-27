import { spawn, spawnSync } from "node:child_process";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";
import viewportModule from "../automation-artifacts/playwright-viewport.cjs";

const host = "127.0.0.1";
const port = 5855;
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

async function runEnemySpawnSideSmoke() {
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
        spawnSync("taskkill", ["/pid", String(server.pid), "/t", "/f"], { stdio: "ignore", shell: false });
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
      page.on("pageerror", (error) => pageErrors.push(error.stack || error.message));
      page.on("console", (message) => {
        if (message.type() === "error") {
          pageErrors.push(message.text());
        }
      });

      await page.goto(url, { waitUntil: "networkidle" });
      await page.waitForFunction(() => Boolean(window.__topdownExtractionAgentApi), null, { timeout: 15000 });
      const result = await page.evaluate(() => {
        const api = window.__topdownExtractionAgentApi;
        api.configureNextRaid({ routeId: "broken-signal", weaponId: "rifle" });
        const snapshot = api.stageState("raid");
        const camps = snapshot.war?.townWar?.camps ?? [];
        const playerCamp = camps.find((camp) => camp.id === "camp-a");
        const enemyCamp = camps.find((camp) => camp.id === "camp-b");
        if (!playerCamp || !enemyCamp) {
          return { ok: false, reason: "missing-camps", snapshot };
        }

        const contactLineX = (playerCamp.spawn.position.x + enemyCamp.spawn.position.x) / 2;
        const maxEnemySpawnX = Math.min(playerCamp.spawn.position.x - 360, contactLineX + 180);
        const enemies = snapshot.raid?.enemies ?? [];
        const offenders = enemies.filter((enemy) => enemy.position.x > maxEnemySpawnX + 1);
        return {
          ok: offenders.length === 0 && enemies.length > 0,
          reason: offenders.length > 0 ? "enemy-spawned-behind-russian-side" : enemies.length > 0 ? "ok" : "no-enemies",
          maxEnemySpawnX,
          playerCampX: playerCamp.spawn.position.x,
          enemyCampX: enemyCamp.spawn.position.x,
          enemyCount: enemies.length,
          offenders: offenders.map((enemy) => ({
            id: enemy.id,
            squadId: enemy.squadId,
            role: enemy.squadRole,
            x: enemy.position.x,
            y: enemy.position.y
          })),
          rightmostEnemyX: enemies.reduce((max, enemy) => Math.max(max, enemy.position.x), Number.NEGATIVE_INFINITY)
        };
      });

      if (!result.ok) {
        throw new Error(`Expected Ukrainian enemies to spawn on their side. Result: ${JSON.stringify(result)}`);
      }
      if (pageErrors.length > 0) {
        throw new Error(`Browser page errors detected:\n${pageErrors.join("\n\n")}`);
      }

      console.log("Enemy spawn side smoke passed.");
      console.log(
        `Enemy count ${result.enemyCount}; rightmost Ukrainian x ${result.rightmostEnemyX.toFixed(1)} <= side limit ${result.maxEnemySpawnX.toFixed(1)}.`
      );
      console.log(`Russian camp x ${result.playerCampX.toFixed(1)}; Ukrainian camp x ${result.enemyCampX.toFixed(1)}.`);
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

runEnemySpawnSideSmoke().catch((error) => {
  console.error(error);
  process.exit(1);
});
