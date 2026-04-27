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

async function runRussianDialogueSmoke() {
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

      const result = await page.evaluate(() => {
        const api = window.__topdownExtractionAgentApi;
        api.stageState("town-war");
        api.prepareTownWarOperation({ ammo: 260, build: 280, food: 180, med: 120 });
        api.startNextTownWarOperation();
        api.deployTownWarOfficer({ campId: "camp-a" });

        const initial = api.getSnapshot();
        const focus = initial.war.townWar.aiThreats.frontlineFocus.position;
        const enemyCamp = initial.war.townWar.camps.find((camp) => camp.id === "camp-b");
        const trenchTarget = { x: focus.x + 180, y: focus.y - 44 };
        const dugoutTarget = { x: focus.x + 252, y: focus.y + 24 };
        const enemyAngle = Math.atan2(
          (enemyCamp?.spawn.position.y ?? focus.y) - trenchTarget.y,
          (enemyCamp?.spawn.position.x ?? focus.x - 420) - trenchTarget.x
        );

        api.orderTownWarTrench({
          campId: "camp-a",
          x: trenchTarget.x,
          y: trenchTarget.y,
          facingAngleRadians: enemyAngle + Math.PI / 2
        });
        api.orderTownWarDugout({
          campId: "camp-a",
          x: dugoutTarget.x,
          y: dugoutTarget.y,
          facingAngleRadians: Math.PI
        });
        api.advanceTownWar({ seconds: 75, tickSeconds: 0.25 });

        const afterBuild = api.getSnapshot();
        const dugout = afterBuild.war.townWar.dugouts.find((entry) => entry.faction === "camp-a");
        if (dugout) {
          api.damageTownWarDugout({ dugoutId: dugout.id, amount: 20 });
          api.advanceTownWar({ seconds: 2, tickSeconds: 0.25 });
        }

        const afterDrama = api.getSnapshot();
        const campADrama = afterDrama.war.townWar.dialogue.recentDramaEvents
          .filter((event) => event.faction === "camp-a" && event.text && event.speaker)
          .map((event) => ({
            kind: event.kind,
            speaker: event.speaker,
            channel: event.channel,
            text: event.text
          }));
        const campAChatter = afterDrama.war.townWar.chatter
          .filter((entry) => entry.faction === "camp-a" && entry.tags.includes("drama"))
          .map((entry) => ({
            channel: entry.channel,
            text: entry.text,
            tags: entry.tags
          }));
        const aliveRussianSoldiers = afterDrama.war.townWar.soldiers
          .filter((soldier) => soldier.faction === "camp-a" && soldier.health.current > 0)
          .map((soldier) => soldier.displayName);

        return { campADrama, campAChatter, aliveRussianSoldiers };
      });

      const inheritedNames = new Set(["Rook", "Yara", "Makar", "Enemy Net"]);
      if (result.campADrama.length <= 0) {
        throw new Error(`Expected Russian camp drama lines. Result: ${JSON.stringify(result)}`);
      }
      const badDrama = result.campADrama.filter((entry) => inheritedNames.has(entry.speaker) || !entry.speaker.includes("Rus-"));
      if (badDrama.length > 0) {
        throw new Error(`Expected camp-a drama speakers to be live Russian soldiers. Bad lines: ${JSON.stringify(badDrama)}`);
      }
      const badChatter = result.campAChatter.filter(
        (entry) => inheritedNames.has(entry.channel) || !entry.channel.includes("Rus-")
      );
      if (badChatter.length > 0) {
        throw new Error(`Expected Russian drama chatter to use live soldier channels. Bad chatter: ${JSON.stringify(badChatter)}`);
      }

      console.log("Russian dialogue smoke passed");
      console.log(
        JSON.stringify(
          {
            dramaLines: result.campADrama.slice(0, 5),
            chatterLines: result.campAChatter.slice(0, 5),
            aliveRussianSoldiers: result.aliveRussianSoldiers.slice(0, 5)
          },
          null,
          2
        )
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

runRussianDialogueSmoke().catch((error) => {
  console.error(error);
  process.exit(1);
});
