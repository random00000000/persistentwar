import { spawn } from "node:child_process";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";
import viewportModule from "../automation-artifacts/playwright-viewport.cjs";

const host = "127.0.0.1";
const port = 4173;
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

async function runSmoke() {
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
      server.kill();
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
      const page = await browser.newPage({
        viewport: DESKTOP_VIEWPORT
      });
      const pageErrors = [];

      page.on("pageerror", (error) => {
        pageErrors.push(error.stack || error.message);
      });

      await page.goto(url, { waitUntil: "networkidle" });
      await page.waitForTimeout(1500);

      if (pageErrors.length > 0) {
        throw new Error(`Browser page errors detected:\n${pageErrors.join("\n\n")}`);
      }

      const canvasCount = await page.locator("canvas").count();
      if (canvasCount < 1) {
        throw new Error("Expected the Phaser canvas to render, but none was found.");
      }

      const rackWeapon = page.locator('[data-drag-kind="weapon"][data-drag-source="rack"]').first();
      const onSlingDropzone = page.locator('[data-equipment-dropzone="on-sling"]');
      const equipmentFigure = page.locator(".stash-paperdoll-figure");
      const bottomRail = page.locator(".stash-bottom-rail");
      const rackWeaponBox = await rackWeapon.boundingBox();
      const onSlingBox = await onSlingDropzone.boundingBox();
      const equipmentFigureBox = await equipmentFigure.boundingBox();
      const bottomRailBox = await bottomRail.boundingBox();

      if (!rackWeaponBox || !onSlingBox) {
        throw new Error("Expected both a rack weapon and the On Sling dropzone to render in the stash UI.");
      }

      const viewportHeight = page.viewportSize()?.height ?? 0;
      const rackWeaponVisible = rackWeaponBox.y >= 0 && rackWeaponBox.y + rackWeaponBox.height <= viewportHeight;
      const onSlingVisible = onSlingBox.y >= 0 && onSlingBox.y + onSlingBox.height <= viewportHeight;

      if (!rackWeaponVisible || !onSlingVisible) {
        throw new Error(
          `Expected the stash rack weapon and On Sling dropzone to be visible together without scrolling. rackY=${rackWeaponBox.y.toFixed(1)} onSlingY=${onSlingBox.y.toFixed(1)} viewportH=${viewportHeight}`
        );
      }

      if (bottomRailBox) {
        const overlapsBottomRail =
          onSlingBox.x < bottomRailBox.x + bottomRailBox.width &&
          onSlingBox.x + onSlingBox.width > bottomRailBox.x &&
          onSlingBox.y < bottomRailBox.y + bottomRailBox.height &&
          onSlingBox.y + onSlingBox.height > bottomRailBox.y;

        if (overlapsBottomRail) {
          throw new Error(
            `Expected the On Sling dropzone to stay clear of the bottom rail. onSlingY=${onSlingBox.y.toFixed(1)} railY=${bottomRailBox.y.toFixed(1)}`
          );
        }
      }

      if (equipmentFigureBox) {
        const onSlingWithinFigure =
          onSlingBox.x >= equipmentFigureBox.x &&
          onSlingBox.y >= equipmentFigureBox.y &&
          onSlingBox.x + onSlingBox.width <= equipmentFigureBox.x + equipmentFigureBox.width &&
          onSlingBox.y + onSlingBox.height <= equipmentFigureBox.y + equipmentFigureBox.height;

        if (!onSlingWithinFigure) {
          throw new Error(
            `Expected the On Sling dropzone to stay inside the paper-doll figure. onSling=(${onSlingBox.x.toFixed(1)},${onSlingBox.y.toFixed(1)}) figure=(${equipmentFigureBox.x.toFixed(1)},${equipmentFigureBox.y.toFixed(1)},${equipmentFigureBox.width.toFixed(1)},${equipmentFigureBox.height.toFixed(1)})`
          );
        }
      }

      const hudText = (await page.locator("[data-route-title]").textContent())?.trim() ?? "";
      if (!hudText) {
        throw new Error("Expected the raid HUD route title to render, but it was empty.");
      }

      const promptText = (await page.locator("[data-prompt]").textContent())?.trim() ?? "";
      if (!promptText) {
        throw new Error("Expected the interaction prompt to render, but it was empty.");
      }

      console.log("Smoke test passed.");
      console.log(`Route HUD: ${hudText}`);
      console.log(`Prompt: ${promptText}`);
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

runSmoke().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
