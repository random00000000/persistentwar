import { spawn, spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";

const host = "127.0.0.1";
const port = 5847;
const baseUrl = `http://${host}:${port}/`;
const url = `${baseUrl}?debugRaid=1`;
const artifactDir = "artifacts/town-war-colony-loop";

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

async function runColonyWiringSmoke() {
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
      await mkdir(artifactDir, { recursive: true });
      await page.goto(url, { waitUntil: "networkidle" });
      await page.waitForFunction(() => Boolean(window.__topdownExtractionAgentApi));

      await page.evaluate(() => {
        const api = window.__topdownExtractionAgentApi;
        api.stageState("town-war");
        api.deployTownWarOfficer({ campId: "camp-a" });
        api.focusTownWarLane({ campId: "camp-a", lane: "mid" });
      });
      await page.locator("[data-officer-tools-toggle]").click();
      await page.locator('[data-officer-tools-tab="camp"]').click();
      await page.screenshot({ path: `${artifactDir}/01-before-priority.png`, fullPage: false });

      const result = await page.evaluate(() => {
        const api = window.__topdownExtractionAgentApi;
        api.stageState("town-war");
        api.deployTownWarOfficer({ campId: "camp-a" });
        api.setTownWarCampWork({ campId: "camp-a", work: "Resupply", priority: 5 });
        api.setTownWarCampWork({ campId: "camp-a", work: "Cook", priority: 5 });
        api.setTownWarCampWork({ campId: "camp-a", work: "Rest", priority: 4 });

        let snapshot = api.getSnapshot();
        const campBSoldiers = snapshot.war.townWar.soldiers.filter((soldier) => soldier.faction === "camp-a");
        const campBCombatantIds = new Set(
          snapshot.war.townWar.combatants.filter((combatant) => combatant.faction === "camp-a").map((combatant) => combatant.id)
        );
        const allFightersAreWorkers = campBSoldiers.every((soldier) => campBCombatantIds.has(soldier.id));

        const builder = campBSoldiers.find((soldier) => soldier.role === "builder") ?? campBSoldiers[0];
        const medic = campBSoldiers.find((soldier) => soldier.role === "medic") ?? campBSoldiers[1];
        const cover = campBSoldiers.find((soldier) => soldier.id !== builder.id && soldier.id !== medic.id && soldier.role === "suppressor") ??
          campBSoldiers.find((soldier) => soldier.id !== builder.id && soldier.id !== medic.id);
        const casualtyTarget = campBSoldiers.find((soldier) => soldier.id !== builder.id && soldier.id !== medic.id && soldier.id !== cover?.id) ??
          campBSoldiers.find((soldier) => soldier.id !== medic.id);

        api.presetTownWarPriority({ soldierId: builder.id, preset: "builder" });
        api.presetTownWarPriority({ soldierId: medic.id, preset: "medic" });
        if (cover) {
          api.presetTownWarPriority({ soldierId: cover.id, preset: "suppressor" });
        }

        const focus = api.focusTownWarLane({ campId: "camp-a", lane: "mid" });
        const holdAssignment = focus.focus.assignments.find((assignment) => assignment.task?.targetPosition);
        const focusTarget = holdAssignment?.task?.targetPosition ?? api.getSnapshot().war.townWar.aiThreats.frontlineFocus.position;
        const enemyCamp = api.getSnapshot().war.townWar.camps.find((camp) => camp.id === "camp-b");
        const target = {
          x: (enemyCamp?.spawn.position.x ?? focusTarget.x - 420) + 180,
          y: focusTarget.y
        };
        const enemyAngle = Math.atan2((enemyCamp?.spawn.position.y ?? target.y) - target.y, (enemyCamp?.spawn.position.x ?? target.x - 400) - target.x);
        const order = api.orderTownWarTrench({ campId: "camp-a", x: target.x, y: target.y, facingAngleRadians: enemyAngle + Math.PI / 2 });
        const orderId = order.order?.orderId;
        api.advanceTownWar({ seconds: 12, tickSeconds: 0.25 });
        const buildReport = orderId ? api.getTownWarBuildReport({ orderId }) : null;

        if (casualtyTarget) {
          api.stageTownWarCasualty({ soldierId: casualtyTarget.id, x: focusTarget.x + 28, y: focusTarget.y + 34, severity: "serious" });
          api.advanceTownWar({ seconds: 4, tickSeconds: 0.25 });
        }

        snapshot = api.getSnapshot();
        const activeOrder = orderId ? snapshot.war.townWar.orders.find((entry) => entry.id === orderId) : null;
        const assignedCover = activeOrder?.build.supportingSuppressorId
          ? snapshot.war.townWar.soldiers.find((soldier) => soldier.id === activeOrder.build.supportingSuppressorId)
          : null;
        const casualty = casualtyTarget
          ? snapshot.war.townWar.casualties.find((entry) => entry.soldierId === casualtyTarget.id)
          : null;
        const assignedMedic = casualty?.assignedMedicId
          ? snapshot.war.townWar.soldiers.find((soldier) => soldier.id === casualty.assignedMedicId)
          : null;
        const sustainment = snapshot.war.townWar.camps.find((camp) => camp.id === "camp-a")?.sustainment ?? null;

        return {
          allFightersAreWorkers,
          builder: { id: builder.id, name: builder.displayName },
          cover: assignedCover
            ? {
                id: assignedCover.id,
                name: assignedCover.displayName,
                task: assignedCover.task.kind,
                selectedWork: assignedCover.taskDecision.selectedWork
              }
            : null,
          medic: assignedMedic
            ? {
                id: assignedMedic.id,
                name: assignedMedic.displayName,
                task: assignedMedic.task.kind,
                selectedWork: assignedMedic.taskDecision.selectedWork
              }
            : null,
          orderOk: order.ok,
          orderSummary: order.summary,
          buildFeedback: buildReport?.summary ?? null,
          supportId: activeOrder?.build.supportingSuppressorId ?? null,
          casualtyId: casualty?.id ?? null,
          casualtyStatus: casualty?.status ?? null,
          assignedMedicId: casualty?.assignedMedicId ?? null,
          campPriorities: sustainment?.workPriorities ?? null,
          readiness: sustainment?.readiness ?? null,
          focusTarget,
          target
        };
      });

      if (!result.allFightersAreWorkers) {
        throw new Error(`Expected camp-a combatants to be the same soldier objects used by colony work. Result: ${JSON.stringify(result)}`);
      }
      if (!result.orderOk || !result.supportId || !["move", "suppress"].includes(result.cover?.task) || result.cover?.selectedWork !== "Suppress") {
        throw new Error(`Expected a fighting soldier to auto-cover or move into cover for the build order. Result: ${JSON.stringify(result)}`);
      }
      if (!result.casualtyId || !result.assignedMedicId || result.medic?.task !== "heal") {
        throw new Error(`Expected a colony medic to auto-peel from fighting work into rescue. Result: ${JSON.stringify(result)}`);
      }
      if (!result.campPriorities || result.campPriorities.Resupply < 5 || result.campPriorities.Cook < 5 || result.campPriorities.Rest < 4) {
        throw new Error(`Expected camp-a colony priorities to feed the same soldier decisions. Result: ${JSON.stringify(result)}`);
      }

      await page.evaluate((focusPoint) => {
        const api = window.__topdownExtractionAgentApi;
        api.focusTownWarCamera({ x: focusPoint.x, y: focusPoint.y });
      }, result.target ?? result.focusTarget);
      await page.screenshot({ path: `${artifactDir}/02-work-in-motion.png`, fullPage: false });

      const panelOpen = await page.locator("[data-officer-tools-panel]").isVisible().catch(() => false);
      if (!panelOpen) {
        await page.locator("[data-officer-tools-toggle]").click();
      }
      await page.locator('[data-officer-tools-tab="camp"]').click();
      await page.screenshot({ path: `${artifactDir}/03-after-effect-camp-panel.png`, fullPage: false });
      await writeFile(`${artifactDir}/colony-wiring.json`, `${JSON.stringify(result, null, 2)}\n`);

      console.log("Town-war colony wiring smoke passed.");
      console.log(`URL: ${url}`);
      console.log(`Browser proof: ${artifactDir}/01-before-priority.png, ${artifactDir}/02-work-in-motion.png, ${artifactDir}/03-after-effect-camp-panel.png`);
      console.log(`Builder: ${result.builder.name} (${result.builder.id})`);
      console.log(`Build: ${result.buildFeedback}`);
      console.log(`Cover fighter: ${result.cover.name} (${result.cover.id}) task ${result.cover.task}/${result.cover.selectedWork}`);
      console.log(`Medic: ${result.medic.name} (${result.medic.id}) task ${result.medic.task}/${result.medic.selectedWork}`);
      console.log(`Camp priorities: Cook ${result.campPriorities.Cook}, Resupply ${result.campPriorities.Resupply}, Rest ${result.campPriorities.Rest}`);
      console.log(`Readiness: ${Math.round(result.readiness * 100)}%`);
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

runColonyWiringSmoke().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
