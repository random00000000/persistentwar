import { spawn, spawnSync } from "node:child_process";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";

const host = "127.0.0.1";
const port = 5854;
const baseUrl = `http://${host}:${port}/`;
const url = `${baseUrl}?debugRaid=1`;

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

function launchServer() {
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

async function runNamedProjectileSmoke() {
  const server = launchServer();
  const cleanup = () => server.cleanup();
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
      await page.goto(url, { waitUntil: "networkidle" });
      await page.waitForFunction(() => Boolean(window.__topdownExtractionAgentApi), null, { timeout: 15000 });

      const setup = await page.evaluate(() => {
        const api = window.__topdownExtractionAgentApi;
        api.stageState("town-war");
        api.deployTownWarOfficer({ campId: "camp-a" });
        const snapshot = api.getSnapshot().war.townWar;
        const shooter =
          snapshot.soldiers.find((soldier) => soldier.faction === "camp-a" && soldier.traits?.includes("field-cook")) ??
          snapshot.soldiers.find((soldier) => soldier.faction === "camp-a" && soldier.archetype === "cook") ??
          snapshot.soldiers.find((soldier) => soldier.faction === "camp-a" && soldier.task.kind === "hold");
        const target =
          snapshot.soldiers.find((soldier) => soldier.faction === "camp-b" && soldier.health.current > 0 && soldier.role === "rifleman") ??
          snapshot.soldiers.find((soldier) => soldier.faction === "camp-b" && soldier.health.current > 0);
        const friendlyCover = snapshot.aiTactics.coverSlots
          .filter((slot) => slot.faction === "camp-a" && slot.sourceKind !== "trench")
          .sort((left, right) => left.position.x - right.position.x)[0];
        const enemyCover = snapshot.aiTactics.coverSlots
          .filter((slot) => slot.faction === "camp-b" && slot.sourceKind !== "trench")
          .sort((left, right) => right.position.x - left.position.x)[0];
        if (!shooter || !target || !friendlyCover || !enemyCover) {
          return { ok: false, reason: "missing-fixtures", shooter, target, friendlyCover, enemyCover };
        }

        const stagedShooter = api.stageTownWarSoldierInCover({
          soldierId: shooter.id,
          coverSlotId: friendlyCover.id,
          kind: "hold"
        });
        const stagedTarget = api.stageTownWarSoldierInCover({
          soldierId: target.id,
          coverSlotId: enemyCover.id,
          kind: "defend"
        });
        const workTarget = {
          x: friendlyCover.position.x + (enemyCover.position.x - friendlyCover.position.x) * 0.25,
          y: friendlyCover.position.y + (enemyCover.position.y - friendlyCover.position.y) * 0.25
        };
        const task = api.stageTownWarSoldierTask({
          soldierId: shooter.id,
          kind: "build",
          label: "Camp work: carry planks under contact",
          x: workTarget.x,
          y: workTarget.y
        });
        const ammo = api.setTownWarSoldierAmmo({
          soldierId: shooter.id,
          inMag: 30,
          reserve: 90,
          maxMag: 30
        });
        api.advanceTownWar({ seconds: 0.75, tickSeconds: 0.25 });
        const staged = api.getSnapshot().war.townWar;
        const stagedShooterState = staged.soldiers.find((soldier) => soldier.id === shooter.id);
        const stagedTargetState = staged.soldiers.find((soldier) => soldier.id === target.id);
        api.focusTownWarCamera({ x: stagedShooterState?.position.x ?? friendlyCover.position.x, y: stagedShooterState?.position.y ?? friendlyCover.position.y });
        return {
          ok: true,
          shooterId: shooter.id,
          shooterName: shooter.displayName,
          targetId: target.id,
          friendlyCover,
          enemyCover,
          workTarget,
          distance: stagedShooterState && stagedTargetState
            ? Math.hypot(stagedShooterState.position.x - stagedTargetState.position.x, stagedShooterState.position.y - stagedTargetState.position.y)
            : Math.hypot(friendlyCover.position.x - enemyCover.position.x, friendlyCover.position.y - enemyCover.position.y),
          stagedShooter,
          stagedTarget,
          task,
          ammo,
          shooterState: stagedShooterState
        };
      });

      assertSmoke(setup.ok, "Expected named projectile smoke fixtures to stage.", setup);
      assertSmoke(setup.stagedShooter.ok, "Expected named Russian shooter to stage in cover.", setup.stagedShooter);
      assertSmoke(setup.stagedTarget.ok, "Expected target to stage in enemy cover.", setup.stagedTarget);
      assertSmoke(setup.task.ok, "Expected named Russian colony shooter work task to stage.", setup.task);
      assertSmoke(setup.ammo.ok, "Expected named Russian shooter ammo to stage.", setup.ammo);
      assertSmoke(setup.distance <= 300, "Expected staged named colony worker target to be inside close defensive reaction range.", setup);
      assertSmoke(setup.shooterState.task.kind === "build", "Expected named Russian colony shooter to remain in a work task while reacting.", setup.shooterState);
      assertSmoke(setup.shooterState.targetIntent.targetKind !== "none", "Expected named Russian shooter to have combat target intent.", setup.shooterState);
      assertSmoke(setup.shooterState.ammo.inMag < 30, "Expected named Russian colony shooter to spend personal ammo while working.", setup.shooterState);

      const projectileProof = await page.waitForFunction(
        (shooterId) => {
          const debug = window.__townWarNamedProjectileDebug;
          return Boolean(debug && debug.openBursts > 0 && debug.soldierIds.includes(shooterId)) ? debug : false;
        },
        setup.shooterId,
        { timeout: 5000 }
      ).then((handle) => handle.jsonValue());

      assertSmoke(projectileProof.openBursts > 0, "Expected named Russian NPC to draw open-field projectile/tracer bursts.", projectileProof);
      assertSmoke(projectileProof.soldierIds.includes(setup.shooterId), "Expected projectile debug to include the named Russian shooter.", { setup, projectileProof });

      const raidProjectionProof = await page.evaluate(() => {
        const snapshot = window.__topdownExtractionAgentApi.getSnapshot();
        const soldiers = snapshot.war.townWar.soldiers;
        const soldierById = new Map(soldiers.map((soldier) => [soldier.id, soldier]));
        const projected = snapshot.raid.friendlyCombatants.filter((combatant) => combatant.ownerKind === "town-war-soldier");
        return {
          projectedCount: projected.length,
          friendlyOwnerKinds: [...new Set(snapshot.raid.friendlyCombatants.map((combatant) => combatant.ownerKind))].sort(),
          invalidFriendlyActors: snapshot.raid.friendlyCombatants
            .filter((combatant) => combatant.ownerKind !== "squadmate" && combatant.ownerKind !== "town-war-soldier")
            .map((combatant) => ({ ownerKind: combatant.ownerKind, ownerId: combatant.ownerId, name: combatant.name })),
          projected: projected.map((combatant) => {
            const soldier = soldierById.get(combatant.ownerId);
            return {
              ownerId: combatant.ownerId,
              name: combatant.name,
              weaponId: combatant.weaponId,
              matchesSoldier: Boolean(soldier && soldier.displayName === combatant.name),
              soldierTask: soldier?.task?.kind ?? null,
              soldierRole: soldier?.role ?? null
            };
          }),
          staticGarrisonCount: snapshot.raid.friendlyCombatants.filter((combatant) => combatant.ownerKind === "camp-garrison").length
        };
      });

      assertSmoke(raidProjectionProof.projectedCount > 0, "Expected raid-side shooters to be projected from colony soldiers.", raidProjectionProof);
      assertSmoke(
        raidProjectionProof.invalidFriendlyActors.length === 0,
        "Expected scene-friendly NPCs to be only squadmates or unified town-war soldiers.",
        raidProjectionProof
      );
      assertSmoke(raidProjectionProof.staticGarrisonCount === 0, "Expected no separate static Russian garrison NPCs after consolidation.", raidProjectionProof);
      assertSmoke(
        raidProjectionProof.projected.every((combatant) => combatant.matchesSoldier),
        "Expected projected raid shooters to keep the same identity as colony soldiers.",
        raidProjectionProof
      );
      assertSmoke(pageErrors.length === 0, "Expected no browser errors during named projectile smoke.", pageErrors);

      console.log(
        `town-war-named-projectiles smoke passed: colony worker ${setup.shooterName} (${setup.shooterId}) drew ${projectileProof.openBursts} open projectile burst(s), kept task ${setup.shooterState.task.kind}, spent ammo at ${Math.round(setup.distance)}px, and ${raidProjectionProof.projectedCount} colony soldier(s) own the raid shooting bodies.`
      );
    } finally {
      await page.close().catch(() => {});
      await browser.close().catch(() => {});
    }
  } catch (error) {
    if (server.output) {
      console.error(server.output);
    }
    throw error;
  } finally {
    cleanup();
  }
}

runNamedProjectileSmoke().catch((error) => {
  console.error(error);
  process.exit(1);
});
