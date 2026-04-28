import { spawn, spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";

const host = "127.0.0.1";
const port = 5847;
const baseUrl = `http://${host}:${port}/`;
const url = `${baseUrl}?debugRaid=1`;
const artifactDir = "artifacts/town-war-work-queue";

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

async function runWorkQueueSmoke() {
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

      const result = await page.evaluate(() => {
        const api = window.__topdownExtractionAgentApi;

        const setup = () => {
          api.stageState("town-war");
          api.deployTownWarOfficer({ campId: "camp-a" });
          api.focusTownWarLane({ campId: "camp-a", lane: "mid" });
          const snapshot = api.getSnapshot();
          const focus = snapshot.war.townWar.aiThreats.frontlineFocus.position;
          const soldiers = snapshot.war.townWar.soldiers.filter((soldier) => soldier.faction === "camp-a");
          const sortedBuilders = [...soldiers].sort(
            (left, right) =>
              right.skills.construction + right.skills.engineering * 0.5 - (left.skills.construction + left.skills.engineering * 0.5)
          );
          return { focus, soldiers, highBuilder: sortedBuilders[0], lowBuilder: sortedBuilders[sortedBuilders.length - 1] };
        };

        const first = setup();
        for (const soldier of first.soldiers) {
          api.setTownWarPriority({ soldierId: soldier.id, work: "Build", priority: soldier.id === first.lowBuilder.id ? 5 : 0 });
        }
        const lowPriorityOrder = api.orderTownWarTrench({
          campId: "camp-a",
          x: first.focus.x - 90,
          y: first.focus.y - 72,
          facingAngleRadians: Math.PI
        });

        const second = setup();
        for (const soldier of second.soldiers) {
          api.setTownWarPriority({ soldierId: soldier.id, work: "Build", priority: soldier.id === second.highBuilder.id ? 5 : 0 });
        }
        api.presetTownWarPriority({ soldierId: second.highBuilder.id, preset: "builder" });
        const medic =
          [...second.soldiers]
            .filter((soldier) => soldier.id !== second.highBuilder.id)
            .sort((left, right) => right.skills.medical + right.skills.social * 0.25 - (left.skills.medical + left.skills.social * 0.25))[0] ??
          second.soldiers[1];
        const suppressor =
          second.soldiers.find((soldier) => soldier.id !== second.highBuilder.id && soldier.id !== medic.id && soldier.role === "suppressor") ??
          second.soldiers.find((soldier) => soldier.id !== second.highBuilder.id && soldier.id !== medic.id);
        const casualtyTarget =
          second.soldiers.find((soldier) => soldier.id !== second.highBuilder.id && soldier.id !== medic.id && soldier.id !== suppressor?.id) ??
          second.soldiers.find((soldier) => soldier.id !== medic.id);
        const exhausted =
          second.soldiers.find(
            (soldier) =>
              soldier.id !== second.highBuilder.id &&
              soldier.id !== medic.id &&
              soldier.id !== casualtyTarget?.id &&
              soldier.id !== suppressor?.id
          ) ?? second.soldiers.find((soldier) => soldier.id !== second.highBuilder.id);

        api.presetTownWarPriority({ soldierId: medic.id, preset: "medic" });
        if (suppressor) {
          api.presetTownWarPriority({ soldierId: suppressor.id, preset: "suppressor" });
        }
        if (exhausted) {
          api.setTownWarPriority({ soldierId: exhausted.id, work: "Assault", priority: 5 });
          api.setTownWarPriority({ soldierId: exhausted.id, work: "Rest", priority: 1 });
          api.setTownWarSoldierNeeds({ soldierId: exhausted.id, fatigue: 0.95, hunger: 0.2, morale: 0.55 });
        }

        const highPriorityOrder = api.orderTownWarTrench({
          campId: "camp-a",
          x: second.focus.x - 120,
          y: second.focus.y + 34,
          facingAngleRadians: Math.PI
        });
        api.advanceTownWar({ seconds: 6, tickSeconds: 0.25 });

        if (casualtyTarget) {
          api.stageTownWarCasualty({
            soldierId: casualtyTarget.id,
            x: second.focus.x - 85,
            y: second.focus.y + 92,
            severity: "serious"
          });
          api.advanceTownWar({ seconds: 6, tickSeconds: 0.25 });
        }

        const workQueue = api.getTownWarWorkQueueReport({ campId: "camp-a" }).report;
        const rescueReport = api.getTownWarRescueReport().report;
        const buildReport = highPriorityOrder.order?.orderId
          ? api.getTownWarBuildReport({ orderId: highPriorityOrder.order.orderId }).report
          : null;
        const exhaustedCandidates = exhausted ? api.getTownWarTaskCandidates({ soldierId: exhausted.id }).result.candidates : [];
        const exhaustedQueueEntry = exhausted ? workQueue.entries.find((entry) => entry.soldierId === exhausted.id) : null;
        const activeNames = new Set(workQueue.entries.filter((entry) => entry.state !== "idle").map((entry) => entry.soldierName));

        return {
          lowBuilder: { id: first.lowBuilder.id, name: first.lowBuilder.displayName, construction: first.lowBuilder.skills.construction },
          highBuilder: { id: second.highBuilder.id, name: second.highBuilder.displayName, construction: second.highBuilder.skills.construction },
          medic: { id: medic.id, name: medic.displayName, medical: medic.skills.medical },
          casualtyTarget: casualtyTarget ? { id: casualtyTarget.id, name: casualtyTarget.displayName } : null,
          exhausted: exhausted ? { id: exhausted.id, name: exhausted.displayName } : null,
          lowAssignedSoldierId: lowPriorityOrder.order?.assignedSoldierId ?? null,
          highAssignedSoldierId: highPriorityOrder.order?.assignedSoldierId ?? null,
          highOrderOk: highPriorityOrder.ok,
          highOrderId: highPriorityOrder.order?.orderId ?? null,
          buildReadable: buildReport?.readable ?? null,
          rescueReadable: rescueReport.readable,
          workQueue,
          exhaustedCandidates,
          exhaustedQueueEntry,
          activeNameCount: activeNames.size
        };
      });

      if (result.lowAssignedSoldierId !== result.lowBuilder.id) {
        throw new Error(`Expected Build priority 5 to redirect assignment to low builder. Result: ${JSON.stringify(result, null, 2)}`);
      }
      if (!result.highOrderOk || result.highAssignedSoldierId !== result.highBuilder.id) {
        throw new Error(`Expected high-build soldier with Build priority to receive trench assignment. Result: ${JSON.stringify(result, null, 2)}`);
      }
      const medicEntry = result.workQueue.entries.find((entry) => entry.soldierId === result.medic.id);
      if (!medicEntry || (medicEntry.work !== "Rescue" && medicEntry.work !== "Medic") || medicEntry.targetId === null) {
        throw new Error(`Expected high-rescue medic to own a casualty job. Result: ${JSON.stringify(result, null, 2)}`);
      }
      const buildEntry = result.workQueue.entries.find((entry) => entry.soldierId === result.highBuilder.id);
      if (!buildEntry || buildEntry.work !== "Build" || !buildEntry.consequenceRead.includes("fatigue")) {
        throw new Error(`Expected named builder queue entry with fatigue consequence. Result: ${JSON.stringify(result, null, 2)}`);
      }
      const assaultCandidate = result.exhaustedCandidates.find((entry) => entry.work === "Assault");
      if (!assaultCandidate?.blockedReason && !result.exhaustedQueueEntry?.warning?.includes("exhausted")) {
        throw new Error(`Expected exhausted assault warning or blocked assignment. Result: ${JSON.stringify(result, null, 2)}`);
      }
      if (result.activeNameCount < 2 || result.workQueue.debriefLines.length < 2) {
        throw new Error(`Expected debrief proof with at least two named soldiers. Result: ${JSON.stringify(result, null, 2)}`);
      }

      await page.locator("[data-officer-tools-toggle]").click();
      await page.locator('[data-officer-tools-tab="priorities"]').click();
      await page.screenshot({ path: `${artifactDir}/01-work-queue-priority-pane.png`, fullPage: false });
      await writeFile(`${artifactDir}/work-queue.json`, `${JSON.stringify(result, null, 2)}\n`);

      console.log("Town-war work queue smoke passed.");
      console.log(`URL: ${url}`);
      console.log(`Browser proof: ${artifactDir}/01-work-queue-priority-pane.png`);
      console.log(`Assignment changed by priority: ${result.lowBuilder.name} then ${result.highBuilder.name}`);
      console.log(`Medic rescue owner: ${result.medic.name}`);
      console.log(`Build report: ${result.buildReadable}`);
      console.log(`Work queue: ${result.workQueue.readable}`);
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

runWorkQueueSmoke().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
