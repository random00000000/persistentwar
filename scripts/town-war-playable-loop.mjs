import { mkdir, writeFile } from "node:fs/promises";
import { spawn, spawnSync } from "node:child_process";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";

const host = "127.0.0.1";
const port = 5847;
const baseUrl = `http://${host}:${port}/`;
const url = `${baseUrl}?debugRaid=1`;
const artifactDir = "artifacts/town-war-playable-loop";

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

function round(value, digits = 2) {
  return Number(value.toFixed(digits));
}

function findNearestEnemy(snapshot, slot) {
  const enemies = snapshot.war.townWar.combatants.filter((combatant) => combatant.faction !== slot.faction);
  return enemies.sort(
    (left, right) =>
      Math.hypot(left.position.x - slot.position.x, left.position.y - slot.position.y) -
      Math.hypot(right.position.x - slot.position.x, right.position.y - slot.position.y)
  )[0] ?? null;
}

function buildDebrief({ snapshot, order, buildReport, target, angle }) {
  const soldiers = snapshot.war.townWar.soldiers;
  const builderId = order.order?.assignedSoldierId ?? null;
  const builder = builderId ? soldiers.find((soldier) => soldier.id === builderId) ?? null : null;
  const trenchSlots = snapshot.war.townWar.aiTactics.coverSlots
    .filter((slot) => slot.faction === "camp-a" && slot.sourceKind === "trench")
    .sort(
      (left, right) =>
        Math.hypot(left.position.x - target.x, left.position.y - target.y) -
        Math.hypot(right.position.x - target.x, right.position.y - target.y)
    )
    .slice(0, 3);
  const occupiedSlots = trenchSlots.filter((slot) => slot.occupiedBySoldierId);
  const occupiedNames = occupiedSlots.map((slot) => {
    const soldier = soldiers.find((candidate) => candidate.id === slot.occupiedBySoldierId);
    return soldier?.displayName ?? slot.occupiedBySoldierId;
  });
  const proofSlot = occupiedSlots[0] ?? trenchSlots[0] ?? null;
  const nearestEnemy = proofSlot ? findNearestEnemy(snapshot, proofSlot) : null;
  const directionalFit =
    proofSlot && nearestEnemy
      ? Math.abs(
          Math.sin(
            Math.atan2(nearestEnemy.position.y - proofSlot.position.y, nearestEnemy.position.x - proofSlot.position.x) -
              proofSlot.facingAngleRadians
          )
        )
      : 0;
  const pressureSaved = proofSlot?.protection ?? 0;
  const ammoCrates = snapshot.war.townWar.logistics?.ammoCrates ?? snapshot.war.townWar.ammoCrates ?? [];
  const nearestAmmo = ammoCrates
    .filter((crate) => crate.faction === "camp-a" && !crate.destroyed)
    .sort(
      (left, right) =>
        Math.hypot(left.position.x - target.x, left.position.y - target.y) -
        Math.hypot(right.position.x - target.x, right.position.y - target.y)
    )[0] ?? null;
  const ammoDistance = nearestAmmo ? Math.hypot(nearestAmmo.position.x - target.x, nearestAmmo.position.y - target.y) : null;
  const ammoSupport =
    nearestAmmo && ammoDistance !== null && ammoDistance <= 360
      ? `${nearestAmmo.id} ${Math.round(ammoDistance)}px behind line`
      : "no close ammo crate";
  const held = occupiedSlots.length >= 2 && directionalFit >= 0.72 && pressureSaved >= 0.35;
  const namedStories = snapshot.war.townWar.frontlineStories
    .filter((story) => story.faction === "camp-a")
    .slice(0, 8)
    .map((story) => ({
      kind: story.kind,
      soldier: story.soldierName,
      summary: story.summary,
      consequence: story.consequence,
      memoryTag: story.memoryTag
    }));

  return {
    builder: builder ? `${builder.displayName} (${builder.id})` : builderId ?? "unknown",
    trench: order.order?.orderId ?? "unknown trench order",
    angleFacing: `${Math.round((angle * 180) / Math.PI)}deg, directional fit ${Math.round(directionalFit * 100)}%`,
    ammoSupport,
    aiOccupation: `${occupiedSlots.length}/${trenchSlots.length} slots occupied${occupiedNames.length > 0 ? ` by ${occupiedNames.join(", ")}` : ""}`,
    holdReason: held
      ? `Held because soldiers occupied the trench, the open side faced the enemy, and cover cut pressure by ${Math.round(pressureSaved * 100)}%.`
      : `Weak hold because occupation ${occupiedSlots.length}/${trenchSlots.length}, directional fit ${Math.round(
          directionalFit * 100
        )}%, pressure saved ${Math.round(pressureSaved * 100)}%.`,
    buildFeedback: buildReport?.summary ?? "no build report",
    namedStories,
    screenshots: {
      roster: `${artifactDir}/00-roster-work-state.png`,
      preview: `${artifactDir}/01-preview-rotate.png`,
      build: `${artifactDir}/02-builder-at-work.png`,
      occupation: `${artifactDir}/03-trench-occupied.png`,
      debrief: `${artifactDir}/04-debrief.png`
    },
    metrics: {
      occupiedSlots: occupiedSlots.length,
      trenchSlots: trenchSlots.length,
      directionalFit: round(directionalFit),
      pressureSaved: round(pressureSaved),
      nearestEnemyDistance: proofSlot && nearestEnemy ? round(Math.hypot(nearestEnemy.position.x - proofSlot.position.x, nearestEnemy.position.y - proofSlot.position.y), 1) : null
    }
  };
}

async function runPlayableLoop() {
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
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

    try {
      await page.goto(url, { waitUntil: "networkidle" });
      await page.waitForFunction(() => Boolean(window.__topdownExtractionAgentApi));

      const setup = await page.evaluate(() => {
        const api = window.__topdownExtractionAgentApi;
        api.stageState("town-war");
        api.completeOfficerSoloSurvival();
        api.deployTownWarOfficer({ campId: "camp-a" });
        const focus = api.focusTownWarLane({ campId: "camp-a", lane: "mid" });
        const holdAssignment = focus.focus.assignments.find((assignment) => assignment.task?.targetPosition);
        const target = holdAssignment?.task?.targetPosition ?? api.getSnapshot().war.townWar.aiThreats.frontlineFocus.position;
        const enemyCamp = api.getSnapshot().war.townWar.camps.find((camp) => camp.id === "camp-b");
        const enemyPosition = enemyCamp?.spawn?.position ?? { x: target.x - 500, y: target.y };
        const enemyAngle = Math.atan2(enemyPosition.y - target.y, enemyPosition.x - target.x);
        const angle = enemyAngle + Math.PI / 2;
        api.focusTownWarCamera({ x: target.x, y: target.y + 70 });
        return { target, angle };
      });

      await page.locator("[data-officer-tools-toggle]").click();
      await page.locator('[data-officer-tools-tab="priorities"]').click();
      await page.screenshot({ path: `${artifactDir}/00-roster-work-state.png`, fullPage: true });
      await page.locator("[data-officer-tools-close]").click();

      await page.locator("[data-build-mode-toggle]").click();
      await page.locator('[data-officer-place="trench"]').first().click();
      await page.mouse.move(960, 540);
      await page.mouse.wheel(0, 540);
      await page.screenshot({ path: `${artifactDir}/01-preview-rotate.png`, fullPage: true });
      await page.keyboard.press("Escape");
      await page.locator("[data-build-mode-toggle]").click();

      const order = await page.evaluate(({ target, angle }) => {
        const api = window.__topdownExtractionAgentApi;
        api.focusTownWarCamera({ x: target.x, y: target.y + 70 });
        return api.orderTownWarTrench({ campId: "camp-a", x: target.x, y: target.y, facingAngleRadians: angle });
      }, setup);

      const orderId = order.order?.orderId;
      if (!order.ok || typeof orderId !== "string") {
        throw new Error(`Expected trench order to be accepted. Result: ${JSON.stringify(order)}`);
      }

      const buildReport = await page.evaluate((activeOrderId) => {
        const api = window.__topdownExtractionAgentApi;
        api.advanceTownWar({ seconds: 28, tickSeconds: 0.25 });
        return api.getTownWarBuildReport({ orderId: activeOrderId });
      }, orderId);
      await page.screenshot({ path: `${artifactDir}/02-builder-at-work.png`, fullPage: true });

      const finalSnapshot = await page.evaluate(() => {
        const api = window.__topdownExtractionAgentApi;
        api.advanceTownWar({ seconds: 210, tickSeconds: 0.25 });
        return api.getSnapshot();
      });
      await page.screenshot({ path: `${artifactDir}/03-trench-occupied.png`, fullPage: true });

      await page.locator("[data-officer-tools-toggle]").click();
      await page.locator('[data-officer-tools-tab="debrief"]').click();
      await page.screenshot({ path: `${artifactDir}/04-debrief.png`, fullPage: true });

      const debrief = buildDebrief({
        snapshot: finalSnapshot,
        order,
        buildReport,
        target: setup.target,
        angle: setup.angle
      });

      if (debrief.metrics.occupiedSlots < 2 || debrief.metrics.directionalFit < 0.72 || debrief.metrics.pressureSaved < 0.35) {
        throw new Error(`Expected playable trench loop to visibly hold. Debrief: ${JSON.stringify(debrief, null, 2)}`);
      }
      const storyKinds = new Set(debrief.namedStories.map((story) => story.kind));
      if (!storyKinds.has("build") || !storyKinds.has("cover") || !storyKinds.has("occupy")) {
        throw new Error(`Expected named build, cover, and occupation stories. Debrief: ${JSON.stringify(debrief, null, 2)}`);
      }
      if (!debrief.namedStories.some((story) => story.consequence.toLowerCase().includes("fatigue") || story.consequence.toLowerCase().includes("trench hold"))) {
        throw new Error(`Expected at least one named soldier consequence. Debrief: ${JSON.stringify(debrief, null, 2)}`);
      }

      await writeFile(`${artifactDir}/debrief.json`, `${JSON.stringify(debrief, null, 2)}\n`, "utf8");

      console.log("Town-war playable build loop passed.");
      console.log(`URL: ${url}`);
      console.log(`Order: ${order.summary}`);
      console.log(`Build: ${buildReport.summary}`);
      console.log(`Debrief: ${debrief.holdReason}`);
      console.log(`Named stories: ${debrief.namedStories.map((story) => `${story.soldier} ${story.kind}`).join(", ")}`);
      console.log(`Screenshots: ${Object.values(debrief.screenshots).join(", ")}`);
      console.log(`Debrief JSON: ${artifactDir}/debrief.json`);
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

runPlayableLoop().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
