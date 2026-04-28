import { spawn, spawnSync } from "node:child_process";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";

const host = "127.0.0.1";
const port = 5847;
const baseUrl = `http://${host}:${port}/`;

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

async function runPlayerKillsTownWarEnemySmoke() {
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
      await page.goto(`${baseUrl}?player-kills-town-war-enemy-smoke=${Date.now()}`, { waitUntil: "networkidle" });
      await page.waitForFunction(() => Boolean(window.__topdownExtractionAgentApi), null, { timeout: 15000 });

      const result = await page.evaluate(() => {
        const api = window.__topdownExtractionAgentApi;
        api.resetTownWar();
        api.stageState("stash");
        api.configureNextRaid({ weaponId: "rifle" });
        api.reinforceTownWar({ campId: "camp-b", role: "rifleman", count: 5 });
        api.reinforceTownWar({ campId: "camp-b", role: "suppressor", count: 1 });
        api.advanceTownWar({ seconds: 3, tickSeconds: 0.25 });
        api.startRaid();

        let snapshot = api.getSnapshot();
        const unlinkedEnemies = snapshot.raid.enemies.filter((enemy) => !enemy.townWarSoldierId);
        let linkedEnemy = snapshot.raid.enemies.find((enemy) => enemy.townWarSoldierId && enemy.casualtyState !== "downed");
        if (unlinkedEnemies.length > 0) {
          return {
            ok: false,
            reason: "legacy-enemies-present",
            unlinkedEnemies,
            enemies: snapshot.raid.enemies
          };
        }
        if (!linkedEnemy) {
          return {
            ok: false,
            reason: "linked-enemy-missing",
            enemies: snapshot.raid.enemies,
            townWarEnemySoldiers: snapshot.war.townWar.soldiers.filter((soldier) => soldier.faction === "camp-b")
          };
        }

        const stage = api.stagePlayerNearTownWarEnemy({ enemyId: linkedEnemy.id });
        snapshot = stage.snapshot;
        linkedEnemy = snapshot.raid.enemies.find((enemy) => enemy.id === linkedEnemy.id);
        const soldierBefore = snapshot.war.townWar.soldiers.find((soldier) => soldier.id === linkedEnemy.townWarSoldierId);

        for (let attempt = 0; attempt < 70; attempt += 1) {
          const current = api.getSnapshot();
          const currentEnemy = current.raid.enemies.find((enemy) => enemy.id === linkedEnemy.id);
          if (!currentEnemy || currentEnemy.casualtyState === "downed" || currentEnemy.casualtyState === "dead") {
            break;
          }
          api.setAimTarget(currentEnemy.position);
          api.setTriggerHeld(true);
          api.advanceRaid({ seconds: 0.16, tickSeconds: 0.04 });
        }
        api.setTriggerHeld(false);

        snapshot = api.getSnapshot();
        const enemyAfter = snapshot.raid.enemies.find((enemy) => enemy.id === linkedEnemy.id);
        const soldierAfter = snapshot.war.townWar.soldiers.find((soldier) => soldier.id === linkedEnemy.townWarSoldierId);
        const unlinkedEnemiesAfter = snapshot.raid.enemies.filter((enemy) => !enemy.townWarSoldierId);
        return {
          ok: true,
          linkedEnemyId: linkedEnemy.id,
          townWarSoldierId: linkedEnemy.townWarSoldierId,
          soldierBefore: soldierBefore
            ? { id: soldierBefore.id, health: soldierBefore.health.current, displayName: soldierBefore.displayName }
            : null,
          enemyAfter: enemyAfter
            ? { id: enemyAfter.id, health: enemyAfter.health, casualtyState: enemyAfter.casualtyState }
            : null,
          soldierAfter: soldierAfter
            ? { id: soldierAfter.id, health: soldierAfter.health.current, currentNeed: soldierAfter.currentNeed, task: soldierAfter.task }
            : null,
          unlinkedEnemiesAfter,
          pendingReinforcementCount: snapshot.raid.pendingReinforcements.length,
          player: snapshot.raid.player
        };
      });

      assertSmoke(result.ok, "Expected a linked town-war enemy to be available in raid.", result);
      assertSmoke(result.soldierBefore?.health > 0, "Expected the linked town-war soldier to start alive.", result);
      assertSmoke(
        result.enemyAfter?.casualtyState === "downed" || result.enemyAfter?.casualtyState === "dead",
        "Expected player rifle fire to down the linked enemy raid body.",
        result
      );
      assertSmoke(
        result.soldierAfter?.health === 0,
        "Expected player rifle fire to write the kill back to the town-war enemy soldier.",
        result
      );
      assertSmoke(
        result.unlinkedEnemiesAfter.length === 0,
        "Expected no legacy Ukrainian raid AI to appear after player gunfire.",
        result
      );
      assertSmoke(
        result.pendingReinforcementCount === 0,
        "Expected legacy Ukrainian reinforcement waves to stay on hold.",
        result
      );
      assertSmoke(pageErrors.length === 0, "Expected no browser errors during player kill smoke.", pageErrors);
      console.log(
        `player-kills-town-war-enemy smoke passed: ${result.townWarSoldierId} downed by ${result.player.weaponName}.`
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

runPlayerKillsTownWarEnemySmoke().catch((error) => {
  console.error(error);
  process.exit(1);
});
