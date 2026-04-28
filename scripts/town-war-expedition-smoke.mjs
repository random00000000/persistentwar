import { spawn, spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";

const host = "127.0.0.1";
const port = 5847;
const baseUrl = `http://${host}:${port}/`;
const url = `${baseUrl}?debugRaid=1`;
const artifactDir = "artifacts/town-war-expedition";

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

async function runExpeditionSmoke() {
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
        api.stageState("town-war");
        api.deployTownWarOfficer({ campId: "camp-a" });
        api.focusTownWarLane({ campId: "camp-a", lane: "mid" });
        const order = api.orderTownWarExpedition({ campId: "camp-a", objective: "probe-enemy-approach" });
        api.advanceTownWar({ seconds: 5, tickSeconds: 0.25 });
        const reportBeforeRetreat = api.getTownWarExpeditionReport({ expeditionId: order.result.expedition?.id }).report;
        const expeditionId = reportBeforeRetreat.latestExpedition?.id ?? order.result.expedition?.id;
        const retreat = api.requestTownWarExpeditionRetreat({ expeditionId });
        api.advanceTownWar({ seconds: 2, tickSeconds: 0.25 });
        const reportAfterRetreat = api.getTownWarExpeditionReport({ expeditionId }).report;
        const snapshot = api.getSnapshot();
        const expedition = reportAfterRetreat.latestExpedition;
        const assigned = expedition
          ? expedition.assignedSoldierIds.map((soldierId) => snapshot.war.townWar.soldiers.find((soldier) => soldier.id === soldierId)).filter(Boolean)
          : [];

        return {
          orderOk: order.ok,
          orderSummary: order.summary,
          retreatOk: retreat.ok,
          before: reportBeforeRetreat,
          after: reportAfterRetreat,
          assignedCount: assigned.length,
          assignedNames: assigned.map((soldier) => soldier.displayName),
          assignedFactions: assigned.map((soldier) => soldier.faction),
          tasks: assigned.map((soldier) => ({ id: soldier.id, task: soldier.task })),
          routeScars: reportAfterRetreat.routeScars.map((scar) => ({ label: scar.label, tags: scar.tags }))
        };
      });

      if (!result.orderOk) {
        throw new Error(`Expected expedition order to succeed. Result: ${JSON.stringify(result, null, 2)}`);
      }
      if (result.assignedCount < 4 || result.assignedCount > 6) {
        throw new Error(`Expected four to six Russian soldiers assigned. Result: ${JSON.stringify(result, null, 2)}`);
      }
      if (result.assignedFactions.some((faction) => faction !== "camp-a")) {
        throw new Error(`Expected expedition to use Russian camp-a soldiers only. Result: ${JSON.stringify(result, null, 2)}`);
      }
      const beforeBeatKinds = result.before.latestExpedition?.beats.map((beat) => beat.kind) ?? [];
      if (beforeBeatKinds.length < 2 || !beforeBeatKinds.includes("spotted") || !beforeBeatKinds.includes("pinned")) {
        throw new Error(`Expected at least spotted and pinned route beats before retreat. Result: ${JSON.stringify(result, null, 2)}`);
      }
      const afterBeatKinds = result.after.latestExpedition?.beats.map((beat) => beat.kind) ?? [];
      if (!result.retreatOk || !afterBeatKinds.includes("retreating")) {
        throw new Error(`Expected retreat order to create retreating route beat. Result: ${JSON.stringify(result, null, 2)}`);
      }
      if (result.routeScars.length < 1) {
        throw new Error(`Expected expedition route scars. Result: ${JSON.stringify(result, null, 2)}`);
      }

      await page.locator("[data-officer-tools-toggle]").click();
      await page.locator('[data-officer-tools-tab="push"]').click();
      await page.screenshot({ path: `${artifactDir}/01-push-pane.png`, fullPage: false });
      await writeFile(`${artifactDir}/expedition-report.json`, JSON.stringify(result, null, 2));

      await browser.close();
      return result;
    } catch (error) {
      await browser.close();
      throw error;
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

runExpeditionSmoke()
  .then((result) => {
    console.log(
      `town-war-expedition smoke passed: ${result.assignedNames.join(", ")} | before ${result.before.readable} | after ${result.after.readable}`
    );
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
