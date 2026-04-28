import { spawn, spawnSync } from "node:child_process";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";

const host = "127.0.0.1";
const port = 5847;
const baseUrl = `http://${host}:${port}/`;
const url = baseUrl;

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
      const bridgeRoundTrip = await page.evaluate(() => {
        const api = window.__topdownExtractionAgentApi;
        api.stageState("stash");
        api.completeOfficerSoloSurvival();
        const snapshot = api.getSnapshot();
        const unifiedSoldier =
          snapshot.war?.townWar.unifiedSoldiers.find((entry) => entry.faction === "camp-a" && entry.squad.assignable) ?? null;
        if (!unifiedSoldier) {
          return { found: false };
        }
        const assigned = api.assignUnifiedSoldierToSquad({ unifiedSoldierId: unifiedSoldier.id });
        const assignedSoldier = assigned.war?.townWar.unifiedSoldiers.find((entry) => entry.id === unifiedSoldier.id) ?? null;
        const unassigned = api.unassignUnifiedSoldierFromSquad({ unifiedSoldierId: unifiedSoldier.id });
        const unassignedSoldier = unassigned.war?.townWar.unifiedSoldiers.find((entry) => entry.id === unifiedSoldier.id) ?? null;
        return {
          found: true,
          unifiedSoldierId: unifiedSoldier.id,
          soldierId: unifiedSoldier.soldierId,
          assignOk: assigned.ok,
          assignSummary: assigned.summary,
          assignedStatus: assignedSoldier?.squad.status ?? null,
          assignedRosterId: assignedSoldier?.squad.legacySquadMateId ?? null,
          assignedAssignable: assignedSoldier?.squad.assignable ?? null,
          unassignOk: unassigned.ok,
          unassignSummary: unassigned.summary,
          unassignedStatus: unassignedSoldier?.squad.status ?? null,
          unassignedAssignable: unassignedSoldier?.squad.assignable ?? null
        };
      });
      if (
        !bridgeRoundTrip.found ||
        !bridgeRoundTrip.assignOk ||
        bridgeRoundTrip.assignedStatus !== "assigned" ||
        !bridgeRoundTrip.assignedRosterId ||
        bridgeRoundTrip.assignedAssignable !== false ||
        !bridgeRoundTrip.unassignOk ||
        bridgeRoundTrip.unassignedStatus !== "camp" ||
        bridgeRoundTrip.unassignedAssignable !== true
      ) {
        throw new Error(`Unified soldier squad bridge did not round-trip through the operator roster: ${JSON.stringify(bridgeRoundTrip)}`);
      }

      const raidMenuSwap = await page.evaluate(({ unifiedSoldierId }) => {
        const api = window.__topdownExtractionAgentApi;
        api.stageState("stash");
        api.completeOfficerSoloSurvival();
        const recruit =
          api.getSnapshot().war?.townWar.unifiedSoldiers.find((entry) => entry.id === unifiedSoldierId && entry.squad.assignable) ??
          api.getSnapshot().war?.townWar.unifiedSoldiers.find((entry) => entry.faction === "camp-a" && entry.squad.assignable) ??
          null;
        api.startRaid();
        const before = api.getSnapshot();
        return {
          recruitId: recruit?.id ?? null,
          recruitName: recruit?.displayName ?? null,
          activeBefore: before.raid.squadMates.map((mate) => mate.id)
        };
      }, bridgeRoundTrip);
      if (!raidMenuSwap.recruitId || raidMenuSwap.activeBefore.length !== 0) {
        throw new Error(`Unified soldier raid menu swap setup failed: ${JSON.stringify(raidMenuSwap)}`);
      }

      await page.click("[data-raid-squad-toggle]");
      const raidMenuSwapButton = page.locator(`[data-raid-squad-body] [data-unified-squad-assign="${raidMenuSwap.recruitId}"]`).first();
      const raidMenuSwapButtonText = (await raidMenuSwapButton.textContent())?.trim() ?? "";
      await raidMenuSwapButton.click();
      const raidMenuSwapAfter = await page.evaluate((recruitId) => {
        const snapshot = window.__topdownExtractionAgentApi.getSnapshot();
        const soldier = snapshot.war?.townWar.unifiedSoldiers.find((entry) => entry.id === recruitId) ?? null;
        const rosterId = soldier?.squad.legacySquadMateId ?? null;
        const activeMate = rosterId ? snapshot.raid.squadMates.find((mate) => mate.id === rosterId) ?? null : null;
        const liveCombatant = rosterId ? snapshot.raid.friendlyCombatants.find((combatant) => combatant.squadMateId === rosterId) ?? null : null;
        return {
          rosterId,
          squadStatus: soldier?.squad.status ?? null,
          squadSlot: soldier?.squad.squadSlot ?? null,
          selectedSquadMateId: snapshot.raid.selectedSquadMateId,
          activeIds: snapshot.raid.squadMates.map((mate) => mate.id),
          activeName: activeMate?.name ?? null,
          command: activeMate?.command.orderId ?? null,
          hasCombatant: Boolean(activeMate?.combatant),
          combatantName: liveCombatant?.name ?? null,
          message: snapshot.message
        };
      }, raidMenuSwap.recruitId);
      if (
        raidMenuSwapButtonText !== "Assign" ||
        !raidMenuSwapAfter.rosterId ||
        raidMenuSwapAfter.squadStatus !== "assigned" ||
        raidMenuSwapAfter.squadSlot === null ||
        raidMenuSwapAfter.selectedSquadMateId !== raidMenuSwapAfter.rosterId ||
        !raidMenuSwapAfter.activeIds.includes(raidMenuSwapAfter.rosterId) ||
        raidMenuSwapAfter.command !== "follow" ||
        !raidMenuSwapAfter.hasCombatant ||
        raidMenuSwapAfter.combatantName !== raidMenuSwapAfter.activeName
      ) {
        throw new Error(
          `Unified soldier raid menu did not swap directly into the live squad: ${JSON.stringify({
            raidMenuSwap,
            raidMenuSwapButtonText,
            raidMenuSwapAfter
          })}`
        );
      }
      await page.reload({ waitUntil: "networkidle" });
      await page.waitForFunction(() => Boolean(window.__topdownExtractionAgentApi), null, { timeout: 15000 });

      const raidProjectionSwap = await page.evaluate(() => {
        const api = window.__topdownExtractionAgentApi;
        api.stageState("stash");
        api.completeOfficerSoloSurvival();
        api.startRaid();
        const before = api.getSnapshot();
        const projection =
          before.raid.friendlyCombatants.find((combatant) => combatant.ownerKind === "town-war-soldier" && /olek/i.test(combatant.name)) ??
          before.raid.friendlyCombatants.find((combatant) => combatant.ownerKind === "town-war-soldier") ??
          null;
        if (!projection) {
          return { ok: false, reason: "missing-town-war-projection" };
        }
        const unifiedSoldier =
          before.war?.townWar.unifiedSoldiers.find(
            (entry) => entry.soldierId === projection.ownerId || entry.id === `unified-${projection.ownerId}`
          ) ?? null;
        if (!unifiedSoldier) {
          return { ok: false, reason: "missing-unified-soldier", projection };
        }
        api.assignUnifiedSoldierToSquad({ unifiedSoldierId: unifiedSoldier.id });
        const after = api.getSnapshot();
        const matchingBodies = after.raid.friendlyCombatants
          .filter(
            (combatant) =>
              combatant.ownerId === unifiedSoldier.soldierId ||
              combatant.squadMateId === unifiedSoldier.soldierId ||
              combatant.ownerId === unifiedSoldier.id ||
              combatant.squadMateId === unifiedSoldier.id
          )
          .map((combatant) => ({
            ownerKind: combatant.ownerKind,
            ownerId: combatant.ownerId,
            squadMateId: combatant.squadMateId,
            name: combatant.name
          }));
        return {
          ok: true,
          unifiedSoldierId: unifiedSoldier.id,
          soldierId: unifiedSoldier.soldierId,
          displayName: unifiedSoldier.displayName,
          matchingBodies
        };
      });
      if (
        !raidProjectionSwap.ok ||
        raidProjectionSwap.matchingBodies.length !== 1 ||
        raidProjectionSwap.matchingBodies[0].ownerKind !== "squadmate" ||
        raidProjectionSwap.matchingBodies[0].squadMateId !== raidProjectionSwap.unifiedSoldierId ||
        raidProjectionSwap.matchingBodies[0].name !== raidProjectionSwap.displayName
      ) {
        throw new Error(`Unified soldier assignment left duplicate raid bodies: ${JSON.stringify(raidProjectionSwap)}`);
      }

      const raidProjectionReturn = await page.evaluate((unifiedSoldierId) => {
        const api = window.__topdownExtractionAgentApi;
        api.unassignUnifiedSoldierFromSquad({ unifiedSoldierId });
        const after = api.getSnapshot();
        const unifiedSoldier = after.war?.townWar.unifiedSoldiers.find((entry) => entry.id === unifiedSoldierId) ?? null;
        if (!unifiedSoldier) {
          return { ok: false, reason: "missing-unified-soldier" };
        }
        const matchingBodies = after.raid.friendlyCombatants
          .filter(
            (combatant) =>
              combatant.ownerId === unifiedSoldier.soldierId ||
              combatant.squadMateId === unifiedSoldier.soldierId ||
              combatant.ownerId === unifiedSoldier.id ||
              combatant.squadMateId === unifiedSoldier.id
          )
          .map((combatant) => ({
            ownerKind: combatant.ownerKind,
            ownerId: combatant.ownerId,
            squadMateId: combatant.squadMateId,
            name: combatant.name
          }));
        return {
          ok: true,
          unifiedSoldierId: unifiedSoldier.id,
          soldierId: unifiedSoldier.soldierId,
          displayName: unifiedSoldier.displayName,
          squadStatus: unifiedSoldier.squad.status,
          assignable: unifiedSoldier.squad.assignable,
          matchingBodies
        };
      }, raidProjectionSwap.unifiedSoldierId);
      if (
        !raidProjectionReturn.ok ||
        !raidProjectionReturn.assignable ||
        raidProjectionReturn.matchingBodies.length !== 1 ||
        raidProjectionReturn.matchingBodies[0].ownerKind !== "town-war-soldier" ||
        raidProjectionReturn.matchingBodies[0].ownerId !== raidProjectionReturn.soldierId ||
        raidProjectionReturn.matchingBodies[0].name !== raidProjectionReturn.displayName
      ) {
        throw new Error(`Unified soldier unassignment did not return the town-war raid body: ${JSON.stringify(raidProjectionReturn)}`);
      }
      await page.reload({ waitUntil: "networkidle" });
      await page.waitForFunction(() => Boolean(window.__topdownExtractionAgentApi), null, { timeout: 15000 });

      const unifiedBuildBridge = await page.evaluate(({ unifiedSoldierId, soldierId }) => {
        const api = window.__topdownExtractionAgentApi;
        api.stageState("stash");
        api.completeOfficerSoloSurvival();
        api.assignUnifiedSoldierToSquad({ unifiedSoldierId });
        api.stageState("town-war");
        const stagedSnapshot = api.getSnapshot();
        const focus = stagedSnapshot.war.townWar.aiThreats.frontlineFocus.position;
        for (const soldier of stagedSnapshot.war.townWar.soldiers.filter((entry) => entry.faction === "camp-a")) {
          api.setTownWarPriority({ soldierId: soldier.id, work: "Build", priority: soldier.id === soldierId ? 5 : 0 });
        }
        api.setTownWarPriority({ soldierId: unifiedSoldierId, work: "Build", priority: 5 });
        const order = api.orderTownWarTrench({
          campId: "camp-a",
          x: focus.x - 96,
          y: focus.y - 48,
          facingAngleRadians: Math.PI
        });
        const buildReport = order.order?.orderId ? api.getTownWarBuildReport({ orderId: order.order.orderId }).report : null;
        const workQueue = api.getTownWarWorkQueueReport({ campId: "camp-a" }).report;
        const after = api.getSnapshot();
        const unifiedSoldier = after.war.townWar.unifiedSoldiers.find((entry) => entry.id === unifiedSoldierId) ?? null;
        const queueEntry = workQueue.entries.find((entry) => entry.soldierId === soldierId) ?? null;
        return {
          orderOk: order.ok,
          assignedSoldierId: order.order?.assignedSoldierId ?? null,
          expectedSoldierId: soldierId,
          unifiedStatus: unifiedSoldier?.squad.status ?? null,
          unifiedTaskKind: unifiedSoldier?.colonist.task.kind ?? null,
          unifiedBuildPriority: unifiedSoldier?.colonist.workPriorities.Build ?? null,
          legacySquadMateId: unifiedSoldier?.squad.legacySquadMateId ?? null,
          buildReadable: buildReport?.readable ?? null,
          queueWork: queueEntry?.work ?? null,
          queueState: queueEntry?.state ?? null,
          queueRead: queueEntry?.consequenceRead ?? null
        };
      }, bridgeRoundTrip);
      if (
        !unifiedBuildBridge.orderOk ||
        unifiedBuildBridge.assignedSoldierId !== unifiedBuildBridge.expectedSoldierId ||
        unifiedBuildBridge.unifiedStatus !== "assigned" ||
        unifiedBuildBridge.unifiedTaskKind !== "build" ||
        unifiedBuildBridge.unifiedBuildPriority !== 5 ||
        unifiedBuildBridge.legacySquadMateId !== bridgeRoundTrip.unifiedSoldierId ||
        unifiedBuildBridge.queueWork !== "Build" ||
        !unifiedBuildBridge.queueRead?.toLowerCase().includes("build")
      ) {
        throw new Error(`Unified soldier did not carry squad identity into trench build work: ${JSON.stringify(unifiedBuildBridge)}`);
      }

      const unifiedFireBridge = await page.evaluate(({ unifiedSoldierId }) => {
        const api = window.__topdownExtractionAgentApi;
        api.stageState("town-war");
        api.completeOfficerSoloSurvival();
        api.assignUnifiedSoldierToSquad({ unifiedSoldierId });
        const snapshot = api.getSnapshot().war.townWar;
        const enemy = snapshot.soldiers
          .filter((soldier) => soldier.faction === "camp-b" && soldier.health.current > 0)
          .sort((left, right) => right.position.x - left.position.x)[0];
        if (!enemy) {
          return { ok: false, reason: "enemy-missing" };
        }
        const trenchPosition = {
          x: enemy.position.x + 260,
          y: enemy.position.y
        };
        const trench = api.placeDebugTownWarTrench({
          campId: "camp-a",
          x: trenchPosition.x,
          y: trenchPosition.y,
          facingAngleRadians: Math.PI
        });
        const coverSlotId = trench.result?.coverSlot?.id ?? null;
        if (!trench.ok || !coverSlotId) {
          return { ok: false, reason: "trench-missing", trench };
        }
        const staged = api.stageTownWarSoldierInCover({
          soldierId: unifiedSoldierId,
          coverSlotId,
          kind: "hold"
        });
        const ammo = api.setTownWarSoldierAmmo({
          soldierId: unifiedSoldierId,
          inMag: 30,
          reserve: 90,
          maxMag: 30
        });
        const before = api.getSnapshot().war.townWar;
        const beforeUnified = before.unifiedSoldiers.find((soldier) => soldier.id === unifiedSoldierId) ?? null;
        const beforeEnemy = before.soldiers.find((soldier) => soldier.id === enemy.id) ?? null;
        api.advanceTownWar({ seconds: 8, tickSeconds: 0.25 });
        const after = api.getSnapshot().war.townWar;
        const afterUnified = after.unifiedSoldiers.find((soldier) => soldier.id === unifiedSoldierId) ?? null;
        const afterEnemy = after.soldiers.find((soldier) => soldier.id === enemy.id) ?? null;
        return {
          ok: true,
          trenchOk: trench.ok,
          stagedOk: staged.ok,
          ammoOk: ammo.ok,
          enemyId: enemy.id,
          beforeAmmo: beforeUnified ? beforeUnified.combat.ammo.inMag + beforeUnified.combat.ammo.reserve : null,
          afterAmmo: afterUnified ? afterUnified.combat.ammo.inMag + afterUnified.combat.ammo.reserve : null,
          beforeEnemyHealth: beforeEnemy?.health.current ?? null,
          afterEnemyHealth: afterEnemy?.health.current ?? 0,
          commandId: afterUnified?.combat.command.orderId ?? null,
          commandAnchorLabel: afterUnified?.combat.command.anchorLabel ?? null,
          tacticalActionStatus: afterUnified?.combat.tacticalAction?.status ?? null,
          tacticalActionSource: afterUnified?.combat.tacticalAction?.source ?? null,
          targetKind: afterUnified?.combat.targetIntent.targetKind ?? null,
          targetReason: afterUnified?.combat.targetIntent.reason ?? null,
          squadStatus: afterUnified?.squad.status ?? null,
          taskKind: afterUnified?.colonist.task.kind ?? null,
          liveBodyId: afterUnified?.runtime.liveBodyId ?? null
        };
      }, bridgeRoundTrip);
      if (
        !unifiedFireBridge.ok ||
        !unifiedFireBridge.trenchOk ||
        !unifiedFireBridge.stagedOk ||
        !unifiedFireBridge.ammoOk ||
        unifiedFireBridge.commandId !== "brace-watch" ||
        unifiedFireBridge.tacticalActionStatus !== "executing" ||
        !unifiedFireBridge.tacticalActionSource?.startsWith("trench:") ||
        unifiedFireBridge.targetKind === "none" ||
        unifiedFireBridge.afterAmmo >= unifiedFireBridge.beforeAmmo ||
        unifiedFireBridge.afterEnemyHealth >= unifiedFireBridge.beforeEnemyHealth ||
        (unifiedFireBridge.squadStatus !== "assigned" && unifiedFireBridge.squadStatus !== "wounded") ||
        unifiedFireBridge.liveBodyId !== bridgeRoundTrip.soldierId
      ) {
        throw new Error(`Unified soldier did not shoot from a trench through the consolidated read model: ${JSON.stringify(unifiedFireBridge)}`);
      }

      const staged = await page.evaluate(() => {
        const api = window.__topdownExtractionAgentApi;
        api.stageState("town-war");
        api.deployTownWarOfficer({ campId: "camp-a" });
        const snapshot = api.getSnapshot();
        const soldier = snapshot.war.townWar.soldiers.find((entry) => entry.faction === "camp-a" && entry.health.current > 0);
        const unifiedSoldier = snapshot.war.townWar.unifiedSoldiers.find((entry) => entry.faction === "camp-a" && entry.combat.health.current > 0);
        return {
          soldierName: soldier?.displayName ?? null,
          unifiedSoldier: unifiedSoldier
            ? {
                id: unifiedSoldier.id,
                displayName: unifiedSoldier.displayName,
                source: unifiedSoldier.source,
                soldierId: unifiedSoldier.soldierId,
                squadStatus: unifiedSoldier.squad.status,
                operatorMenuVisible: unifiedSoldier.squad.operatorMenuVisible,
                weaponId: unifiedSoldier.combat.weaponId,
                commandId: unifiedSoldier.combat.command.orderId,
                buildPriority: unifiedSoldier.colonist.workPriorities.Build,
                currentNeed: unifiedSoldier.colonist.currentNeed,
                readable: unifiedSoldier.readable
              }
            : null
        };
      });

      if (!staged.soldierName) {
        throw new Error("Expected at least one living Russian soldier for the inspector smoke.");
      }
      if (!staged.unifiedSoldier) {
        throw new Error("Expected at least one living unified Russian soldier in the town-war snapshot.");
      }
      if (
        staged.unifiedSoldier.source !== "town-war-soldier" ||
        (staged.unifiedSoldier.squadStatus !== "camp" && staged.unifiedSoldier.squadStatus !== "assigned") ||
        staged.unifiedSoldier.operatorMenuVisible !== true ||
        staged.unifiedSoldier.commandId !== "follow" ||
        typeof staged.unifiedSoldier.buildPriority !== "number" ||
        !staged.unifiedSoldier.weaponId ||
        !staged.unifiedSoldier.readable.toLowerCase().includes("unified soldier")
      ) {
        throw new Error(`Unified soldier read model is incomplete: ${JSON.stringify(staged.unifiedSoldier)}`);
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
      console.log(
        `Selected ${staged.soldierName}; unified ${staged.unifiedSoldier.displayName} has ${staged.unifiedSoldier.weaponId}/${staged.unifiedSoldier.commandId}; rendered ${rowCount} priority rows in a ${Math.round(panelBox.width)}x${Math.round(panelBox.height)} panel.`
      );
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
