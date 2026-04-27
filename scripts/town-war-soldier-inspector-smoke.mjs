import { spawn, spawnSync } from "node:child_process";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";

const host = "127.0.0.1";
const port = 5847;
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

async function runSoldierInspectorSmoke() {
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
    try {
      const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
      const pageErrors = [];
      page.on("pageerror", (error) => pageErrors.push(error.stack || error.message));
      page.on("console", (message) => {
        if (message.type() === "error") {
          pageErrors.push(message.text());
        }
      });

      await page.goto(url, { waitUntil: "networkidle" });
      await page.waitForFunction(() => Boolean(window.__topdownExtractionAgentApi), null, { timeout: 15000 });
      const staged = await page.evaluate(() => {
        const api = window.__topdownExtractionAgentApi;
        api.stageState("town-war");
        api.deployTownWarOfficer({ campId: "camp-a" });
        const snapshot = api.getSnapshot();
        const soldier = snapshot.war.townWar.soldiers.find((entry) => entry.faction === "camp-a" && entry.health.current > 0);
        return { soldierName: soldier?.displayName ?? null };
      });

      if (!staged.soldierName) {
        throw new Error("Expected at least one living Russian soldier for the inspector smoke.");
      }

      const campArtToggle = page.locator("[data-camp-art-toggle]");
      await campArtToggle.waitFor({ state: "visible", timeout: 5000 });
      await page.evaluate(() => document.querySelector("[data-camp-art-toggle]")?.click());
      const campArtStatusOff = (await page.locator("[data-camp-art-status]").innerText()).trim().toLowerCase();
      await page.evaluate(() => document.querySelector("[data-camp-art-toggle]")?.click());
      const campArtStatusOn = (await page.locator("[data-camp-art-status]").innerText()).trim().toLowerCase();

      await page.locator("[data-officer-tools-toggle]").click();
      await page.locator('[data-officer-tools-tab="priorities"]').click();
      const bridge = page.locator(".officer-priority-bridge").first();
      await bridge.waitFor({ state: "visible", timeout: 5000 });
      const bridgeText = (await bridge.innerText()).toLowerCase();
      await page.evaluate(() => document.querySelector('[data-officer-work-lens="fight"]')?.click());
      const fightRows = await page.locator(".officer-soldier-row").count();
      await page.evaluate(() => document.querySelector('[data-officer-work-lens="all"]')?.click());
      await page.evaluate(() => document.querySelector("[data-officer-select-soldier]")?.click());
      const priorityNudgeRows = await page.locator(".officer-priority-nudge-row").count();
      await page.evaluate(() => document.querySelector('[data-officer-priority-adjust="Build"][data-officer-priority-delta="1"]')?.click());

      const inspector = page.locator(".officer-soldier-inspector").first();
      await inspector.waitFor({ state: "visible", timeout: 5000 });
      const text = await inspector.innerText();
      const rowCount = await page.locator(".officer-soldier-row").count();
      const decisionRows = await page.locator(".officer-decision-row").count();
      const panelBox = await page.locator("[data-officer-tools-panel]").boundingBox();

      const normalizedText = text.toLowerCase();
      const pageText = (await page.locator("[data-officer-tools-panel]").innerText()).toLowerCase();
      if (!normalizedText.includes("selected russian soldier")) {
        throw new Error(`Inspector did not show selected Russian soldier. Text: ${text}`);
      }
      if (!normalizedText.includes("job") || !normalizedText.includes("cover") || !normalizedText.includes("fatigue")) {
        throw new Error(`Inspector is missing expected job/cover/needs readouts. Text: ${text}`);
      }
      if (!normalizedText.includes("map") || !normalizedText.includes("tracked")) {
        throw new Error(`Inspector is missing the selected soldier map tracking readout. Text: ${text}`);
      }
      if (!bridgeText.includes("work lens") || !bridgeText.includes("build") || !bridgeText.includes("fight") || !bridgeText.includes("wounded")) {
        throw new Error(`Priority bridge is missing work lens/labor/need readouts. Text: ${bridgeText}`);
      }
      if (campArtStatusOff !== "off" || campArtStatusOn !== "on") {
        throw new Error(`Russian camp art toggle did not flip cleanly. Off read: ${campArtStatusOff}; on read: ${campArtStatusOn}.`);
      }
      if (priorityNudgeRows < 6 || !pageText.includes("build priority")) {
        throw new Error(`Selected soldier priority nudges did not render or did not affect action readout. Rows: ${priorityNudgeRows}; Text: ${pageText}`);
      }
      if (decisionRows < 1 || !normalizedText.includes("decision stack")) {
        throw new Error(`Selected soldier decision stack did not render. Rows: ${decisionRows}; Text: ${text}`);
      }
      if (rowCount < 1) {
        throw new Error("Priority board did not render soldier rows.");
      }
      if (fightRows < 1) {
        throw new Error("Fight work lens filtered out every soldier; expected at least one combat-capable Russian soldier.");
      }
      if (!panelBox || panelBox.width > 440 || panelBox.height > 780) {
        throw new Error(`Officer tools panel is no longer subtle enough: ${JSON.stringify(panelBox)}`);
      }
      if (pageErrors.length > 0) {
        throw new Error(`Browser page errors detected:\n${pageErrors.join("\n\n")}`);
      }

      console.log("Town-war soldier inspector smoke passed.");
      console.log(`Selected ${staged.soldierName}; rendered ${rowCount} priority rows in a ${Math.round(panelBox.width)}x${Math.round(panelBox.height)} panel.`);
    } finally {
      await browser.close();
    }
  } catch (error) {
    const message = error instanceof Error ? error.stack || error.message : String(error);
    throw new Error(`${message}\n\nDev server output:\n${server?.output ?? "(existing server)"}`);
  } finally {
    cleanup();
  }
}

runSoldierInspectorSmoke().catch((error) => {
  console.error(error);
  process.exit(1);
});
