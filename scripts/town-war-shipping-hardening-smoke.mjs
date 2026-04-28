import { spawn, spawnSync } from "node:child_process";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";

const host = "127.0.0.1";
const port = 5857;
const url = `http://${host}:${port}/`;
const viewport = { width: 1920, height: 1080 };

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
      // Vite is still starting.
    }
    await delay(250);
  }

  throw new Error(`Timed out waiting for ${serverUrl}`);
}

function assertSmoke(condition, message, details = null) {
  if (condition) {
    return;
  }

  const suffix = details ? `\n${JSON.stringify(details, null, 2)}` : "";
  throw new Error(`${message}${suffix}`);
}

function distance(left, right) {
  return Math.hypot(left.x - right.x, left.y - right.y);
}

async function openAgentPage(browser) {
  const page = await browser.newPage({ viewport });
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.stack || error.message));
  page.on("console", (message) => {
    if (message.type() === "error") {
      pageErrors.push(message.text());
    }
  });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForFunction(() => Boolean(window.__topdownExtractionAgentApi), null, { timeout: 15000 });
  return { page, pageErrors };
}

function assertNoPageErrors(pageErrors, label) {
  assertSmoke(pageErrors.length === 0, `${label} produced browser errors.`, pageErrors);
}

async function runFactionAndResetScenario(browser) {
  const { page, pageErrors } = await openAgentPage(browser);
  try {
    const start = await page.evaluate(() => {
      const api = window.__topdownExtractionAgentApi;
      const snapshot = api.stageState("town-war");
      const townWar = snapshot.war.townWar;
      const russianCamp = townWar.camps.find((camp) => camp.id === "camp-a");
      const ukrainianCamp = townWar.camps.find((camp) => camp.id === "camp-b");
      const contactX = (russianCamp.spawn.position.x + ukrainianCamp.spawn.position.x) / 2;
      const russianSoldiers = townWar.soldiers.filter((soldier) => soldier.faction === "camp-a");
      const ukrainianSoldiers = townWar.soldiers.filter((soldier) => soldier.faction === "camp-b");
      return {
        officerFaction: townWar.officer.faction,
        russianCamp: {
          label: russianCamp.label,
          x: russianCamp.spawn.position.x,
          spawnedSoldiers: russianSoldiers.length
        },
        ukrainianCamp: {
          label: ukrainianCamp.label,
          x: ukrainianCamp.spawn.position.x,
          spawnedSoldiers: ukrainianSoldiers.length
        },
        contactX,
        russianWrongSpawn: russianSoldiers
          .filter((soldier) => soldier.spawnedFromCampId !== "camp-a")
          .map((soldier) => ({ id: soldier.id, from: soldier.spawnedFromCampId })),
        ukrainianWrongSpawn: ukrainianSoldiers
          .filter((soldier) => soldier.spawnedFromCampId !== "camp-b")
          .map((soldier) => ({ id: soldier.id, from: soldier.spawnedFromCampId })),
        ukrainiansBehindRussianLine: ukrainianSoldiers
          .filter((soldier) => soldier.position.x > contactX)
          .map((soldier) => ({ id: soldier.id, x: soldier.position.x, task: soldier.task.kind })),
        orders: townWar.orders.length,
        crates: townWar.ammoCrates.length,
        trenchSlots: townWar.aiTactics.coverSlots.filter((slot) => slot.sourceKind === "trench").length
      };
    });

    assertSmoke(start.officerFaction === "camp-a", "Expected Russian player officer faction to be camp-a.", start);
    assertSmoke(/Russian/i.test(start.russianCamp.label), "Expected camp-a to be labeled Russian Camp.", start);
    assertSmoke(/Ukrainian/i.test(start.ukrainianCamp.label), "Expected camp-b to be labeled Ukrainian Enemy Camp.", start);
    assertSmoke(start.russianCamp.x > start.ukrainianCamp.x, "Expected Russian camp to be on the right side.", start);
    assertSmoke(start.russianCamp.spawnedSoldiers >= 5, "Expected seeded Russian soldiers at Russian camp.", start);
    assertSmoke(start.ukrainianCamp.spawnedSoldiers >= 5, "Expected seeded Ukrainian soldiers at Ukrainian camp.", start);
    assertSmoke(start.russianWrongSpawn.length === 0, "Expected Russian soldiers to spawn from camp-a only.", start);
    assertSmoke(start.ukrainianWrongSpawn.length === 0, "Expected Ukrainian soldiers to spawn from camp-b only.", start);
    assertSmoke(start.ukrainiansBehindRussianLine.length === 0, "Expected Ukrainian town-war soldiers to start on their side.", start);

    const dirty = await page.evaluate(() => {
      const api = window.__topdownExtractionAgentApi;
      const townWar = api.getSnapshot().war.townWar;
      const focus = townWar.aiThreats.frontlineFocus.position;
      const order = api.orderTownWarTrench({ campId: "camp-a", x: focus.x + 40, y: focus.y, facingAngleRadians: Math.PI / 2 });
      api.orderTownWarAmmoCrate({ campId: "camp-a", x: focus.x + 130, y: focus.y + 20 });
      api.advanceTownWar({ seconds: 20, tickSeconds: 0.25 });
      const after = api.getSnapshot().war.townWar;
      return {
        orderOk: order.ok,
        orders: after.orders.length,
        crates: after.ammoCrates.length,
        trenchSlots: after.aiTactics.coverSlots.filter((slot) => slot.sourceKind === "trench").length
      };
    });
    assertSmoke(dirty.orderOk && (dirty.orders > 0 || dirty.trenchSlots > 0), "Expected dirty state before reset smoke.", dirty);

    await page.reload({ waitUntil: "networkidle" });
    await page.waitForFunction(() => Boolean(window.__topdownExtractionAgentApi), null, { timeout: 15000 });
    const reset = await page.evaluate(() => {
      const api = window.__topdownExtractionAgentApi;
      const snapshot = api.stageState("town-war");
      const townWar = snapshot.war.townWar;
      return {
        orders: townWar.orders.length,
        crates: townWar.ammoCrates.length,
        trenchSlots: townWar.aiTactics.coverSlots.filter((slot) => slot.sourceKind === "trench").length,
        russianSoldiers: townWar.soldiers.filter((soldier) => soldier.faction === "camp-a").length,
        ukrainianSoldiers: townWar.soldiers.filter((soldier) => soldier.faction === "camp-b").length,
        officerFaction: townWar.officer.faction
      };
    });

    assertSmoke(reset.orders === 0, "Expected page reload + town-war stage to clear build orders.", { dirty, reset });
    assertSmoke(reset.crates === 0, "Expected page reload + town-war stage to clear ammo crates.", { dirty, reset });
    assertSmoke(reset.trenchSlots === 0, "Expected page reload + town-war stage to clear trench slots.", { dirty, reset });
    assertSmoke(reset.russianSoldiers === start.russianCamp.spawnedSoldiers, "Expected Russian soldier count to reset cleanly.", { start, reset });
    assertSmoke(reset.ukrainianSoldiers === start.ukrainianCamp.spawnedSoldiers, "Expected Ukrainian soldier count to reset cleanly.", { start, reset });
    assertSmoke(reset.officerFaction === "camp-a", "Expected reset to preserve Russian-side player ownership.", reset);
    assertNoPageErrors(pageErrors, "Faction and reset scenario");

    return { start, dirty, reset };
  } finally {
    await page.close();
  }
}

async function runTrenchAmmoScenario(browser) {
  const { page, pageErrors } = await openAgentPage(browser);
  try {
    const result = await page.evaluate(() => {
      const api = window.__topdownExtractionAgentApi;
      api.stageState("town-war");
      api.deployTownWarOfficer({ campId: "camp-a" });
      const focus = api.focusTownWarLane({ campId: "camp-a", lane: "mid" });
      const focusSnapshot = api.getSnapshot().war.townWar;
      const holdAssignment = focus.focus.assignments.find((assignment) => assignment.task?.targetPosition);
      const target = holdAssignment?.task?.targetPosition ?? focusSnapshot.aiThreats.frontlineFocus.position;
      const enemyCamp = focusSnapshot.camps.find((camp) => camp.id === "camp-b");
      const enemyPosition = enemyCamp?.spawn?.position ?? { x: target.x - 500, y: target.y };
      const enemyAngle = Math.atan2(enemyPosition.y - target.y, enemyPosition.x - target.x);
      const trenchAngle = enemyAngle + Math.PI / 2;
      const trenchOrder = api.orderTownWarTrench({
        campId: "camp-a",
        x: target.x,
        y: target.y,
        facingAngleRadians: trenchAngle
      });
      const trenchOrderId = trenchOrder.order?.orderId ?? null;
      api.advanceTownWar({ seconds: 30, tickSeconds: 0.25 });
      const midBuildReport = trenchOrderId ? api.getTownWarBuildReport({ orderId: trenchOrderId }) : null;

      const summarizeFire = () => {
        const townWar = api.getSnapshot().war.townWar;
        const occupiedSlots = townWar.aiTactics.coverSlots.filter(
          (slot) => slot.faction === "camp-a" && slot.sourceKind === "trench" && slot.occupiedBySoldierId !== null
        );
        const soldiers = occupiedSlots
          .map((slot) => townWar.soldiers.find((soldier) => soldier.id === slot.occupiedBySoldierId) ?? null)
          .filter(Boolean);
        const targets = soldiers
          .map((soldier) => townWar.combatants.find((combatant) => combatant.id === soldier.targetIntent.targetId) ?? null)
          .filter(Boolean);
        return {
          occupiedCount: occupiedSlots.length,
          soldierAmmo: Object.fromEntries(soldiers.map((soldier) => [soldier.id, soldier.ammo.inMag + soldier.ammo.reserve])),
          targetHealth: Object.fromEntries(targets.map((targetEntry) => [targetEntry.id, targetEntry.health.current])),
          targetPressure: Object.fromEntries(targets.map((targetEntry) => [targetEntry.id, targetEntry.morale.pressure])),
          targetIds: [...new Set(targets.map((targetEntry) => targetEntry.id))],
          targetReasons: soldiers.map((soldier) => soldier.targetIntent.reason)
        };
      };

      for (let step = 0; step < 24; step += 1) {
        if (summarizeFire().occupiedCount >= 2) {
          break;
        }
        api.advanceTownWar({ seconds: 2, tickSeconds: 0.25 });
      }

      const fireBefore = summarizeFire();
      api.advanceTownWar({ seconds: 8, tickSeconds: 0.25 });
      const fireAfter = summarizeFire();
      const sharedShooterIds = Object.keys(fireBefore.soldierAmmo).filter((id) =>
        Object.prototype.hasOwnProperty.call(fireAfter.soldierAmmo, id)
      );
      const sharedTargetIds = fireBefore.targetIds.filter((id) => Object.prototype.hasOwnProperty.call(fireAfter.targetHealth, id));
      const trenchFireProof = {
        ammoSpent: sharedShooterIds.reduce(
          (total, id) => total + Math.max(0, (fireBefore.soldierAmmo[id] ?? 0) - (fireAfter.soldierAmmo[id] ?? 0)),
          0
        ),
        targetHealthLoss: sharedTargetIds.reduce(
          (total, id) => total + Math.max(0, (fireBefore.targetHealth[id] ?? 0) - (fireAfter.targetHealth[id] ?? 0)),
          0
        ),
        targetPressureGain: sharedTargetIds.reduce(
          (total, id) => total + Math.max(0, (fireAfter.targetPressure[id] ?? 0) - (fireBefore.targetPressure[id] ?? 0)),
          0
        ),
        before: fireBefore,
        after: fireAfter
      };

      const ammoOrder = api.orderTownWarAmmoCrate({
        campId: "camp-a",
        x: target.x + 120,
        y: target.y
      });
      const ammoOrderId = ammoOrder.order?.orderId ?? null;
      api.advanceTownWar({ seconds: 40, tickSeconds: 0.25 });

      let townWar = api.getSnapshot().war.townWar;
      const occupiedSlots = townWar.aiTactics.coverSlots.filter(
        (slot) => slot.faction === "camp-a" && slot.sourceKind === "trench" && slot.occupiedBySoldierId !== null
      );
      const occupiedSlotReads = occupiedSlots.map((slot) => {
        const soldier = townWar.soldiers.find((entry) => entry.id === slot.occupiedBySoldierId) ?? null;
        return {
          slotId: slot.id,
          slotPosition: slot.position,
          occupiedBySoldierId: slot.occupiedBySoldierId,
          soldierExists: Boolean(soldier),
          soldierFaction: soldier?.faction ?? null,
          role: soldier?.role ?? null,
          health: soldier?.health?.current ?? null,
          coverSlotId: soldier?.coverIntent?.coverSlotId ?? null,
          coverState: soldier?.coverIntent?.state ?? null,
          targetReason: soldier?.targetIntent?.reason ?? null,
          distanceToSlot: soldier ? Math.hypot(soldier.position.x - slot.position.x, soldier.position.y - slot.position.y) : null
        };
      });
      const trenchClaimReads = townWar.soldiers
        .map((soldier) => {
          const slot = soldier.coverIntent?.coverSlotId
            ? townWar.aiTactics.coverSlots.find((entry) => entry.id === soldier.coverIntent.coverSlotId) ?? null
            : null;
          if (!slot || slot.sourceKind !== "trench" || soldier.coverIntent?.state !== "occupying") {
            return null;
          }
          return {
            soldierId: soldier.id,
            slotId: slot.id,
            slotOccupantId: slot.occupiedBySoldierId,
            distanceToSlot: Math.hypot(soldier.position.x - slot.position.x, soldier.position.y - slot.position.y)
          };
        })
        .filter(Boolean);
      const duplicateClaimSlotIds = trenchClaimReads
        .map((read) => read.slotId)
        .filter((slotId, index, ids) => ids.indexOf(slotId) !== index);
      const unownedTrenchClaims = trenchClaimReads.filter((read) => read.slotOccupantId !== read.soldierId);
      let minOccupiedSlotSpacing = Number.POSITIVE_INFINITY;
      for (let leftIndex = 0; leftIndex < occupiedSlots.length; leftIndex += 1) {
        for (let rightIndex = leftIndex + 1; rightIndex < occupiedSlots.length; rightIndex += 1) {
          minOccupiedSlotSpacing = Math.min(
            minOccupiedSlotSpacing,
            Math.hypot(
              occupiedSlots[leftIndex].position.x - occupiedSlots[rightIndex].position.x,
              occupiedSlots[leftIndex].position.y - occupiedSlots[rightIndex].position.y
            )
          );
        }
      }

      const liveCrates = townWar.ammoCrates.filter((crate) => crate.faction === "camp-a" && crate.destroyedAtSeconds === null && crate.ammo > 0);
      const bestCrate = liveCrates
        .map((crate) => ({
          crate,
          fedSlots: occupiedSlots.filter((slot) => Math.hypot(slot.position.x - crate.position.x, slot.position.y - crate.position.y) <= 240),
          distances: occupiedSlots.map((slot) => Math.hypot(slot.position.x - crate.position.x, slot.position.y - crate.position.y))
        }))
        .sort((left, right) => right.fedSlots.length - left.fedSlots.length)[0] ?? null;

      const feedCandidates = occupiedSlotReads
        .map((read) => townWar.soldiers.find((soldier) => soldier.id === read.occupiedBySoldierId) ?? null)
        .filter((soldier) => soldier && soldier.role !== "builder")
        .slice(0, 2);
      const ammoBeforeSet = Object.fromEntries(feedCandidates.map((soldier) => [soldier.id, soldier.ammo.inMag + soldier.ammo.reserve]));
      for (const soldier of feedCandidates) {
        api.setTownWarSoldierAmmo({ soldierId: soldier.id, inMag: 0, reserve: 0 });
      }
      const beforeFeed = api.getSnapshot().war.townWar;
      const crateBeforeFeed =
        bestCrate !== null ? beforeFeed.ammoCrates.find((crate) => crate.id === bestCrate.crate.id) ?? null : null;
      api.advanceTownWar({ seconds: 3, tickSeconds: 0.25 });
      townWar = api.getSnapshot().war.townWar;
      const crateAfterFeed =
        bestCrate !== null ? townWar.ammoCrates.find((crate) => crate.id === bestCrate.crate.id) ?? null : null;
      const feedAfter = feedCandidates.map((candidate) => {
        const soldier = townWar.soldiers.find((entry) => entry.id === candidate.id) ?? null;
        return {
          id: candidate.id,
          role: candidate.role,
          ammoBeforeSet: ammoBeforeSet[candidate.id],
          ammoAfter: soldier ? soldier.ammo.inMag + soldier.ammo.reserve : null,
          inMag: soldier?.ammo.inMag ?? null,
          reserve: soldier?.ammo.reserve ?? null
        };
      });
      const resupplyStories = townWar.frontlineStories.filter(
        (story) => story.kind === "resupply" && feedCandidates.some((candidate) => candidate.id === story.soldierId)
      );

      return {
        trenchOrderOk: trenchOrder.ok,
        trenchOrderSummary: trenchOrder.summary,
        ammoOrderOk: ammoOrder.ok,
        ammoOrderSummary: ammoOrder.summary,
        midBuildReadable: midBuildReport?.summary ?? null,
        trenchCount: townWar.aiTactics.coverSlots.filter((slot) => slot.faction === "camp-a" && slot.sourceKind === "trench").length,
        occupiedTrenchCount: occupiedSlots.length,
        occupiedSlotReads,
        trenchClaimReads,
        duplicateClaimSlotIds,
        unownedTrenchClaims,
        minOccupiedSlotSpacing: Number.isFinite(minOccupiedSlotSpacing) ? minOccupiedSlotSpacing : null,
        trenchFireProof,
        bestCrate: bestCrate
          ? {
              id: bestCrate.crate.id,
              ammo: bestCrate.crate.ammo,
              maxAmmo: bestCrate.crate.maxAmmo,
              distances: bestCrate.distances,
              fedSlotCount: bestCrate.fedSlots.length
            }
          : null,
        ammoFeedProof: {
          ammoOrderId,
          feedCandidateCount: feedCandidates.length,
          crateAmmoBefore: crateBeforeFeed?.ammo ?? null,
          crateAmmoAfter: crateAfterFeed?.ammo ?? null,
          feedAfter,
          resupplyStoryCount: resupplyStories.length
        }
      };
    });

    assertSmoke(result.trenchOrderOk, "Expected Russian trench order to succeed.", result);
    assertSmoke(result.trenchCount >= 3, "Expected trench order to create three trench firing slots.", result);
    assertSmoke(result.occupiedTrenchCount >= 2, "Expected Russian soldiers to occupy multiple trench slots.", result);
    const invalidOccupants = result.occupiedSlotReads.filter(
      (read) =>
        !read.soldierExists ||
        read.soldierFaction !== "camp-a" ||
        (read.health ?? 0) <= 0 ||
        read.coverSlotId !== read.slotId ||
        read.coverState !== "occupying" ||
        (read.distanceToSlot ?? Number.POSITIVE_INFINITY) > 42
    );
    assertSmoke(invalidOccupants.length === 0, "Expected trench slots to hold real living Russian soldiers.", { invalidOccupants, result });
    assertSmoke(result.duplicateClaimSlotIds.length === 0, "Expected no duplicate trench slot claims.", result);
    assertSmoke(result.unownedTrenchClaims.length === 0, "Expected no unowned trench slot claims.", result);
    assertSmoke((result.minOccupiedSlotSpacing ?? 0) >= 38, "Expected trench occupants to have physical separation.", result);
    assertSmoke(
      result.trenchFireProof.ammoSpent > 0 &&
        result.trenchFireProof.targetHealthLoss + result.trenchFireProof.targetPressureGain > 0,
      "Expected occupied trench soldiers to spend ammo and affect enemy targets.",
      result
    );
    assertSmoke(result.ammoOrderOk, "Expected Russian ammo crate order to succeed.", result);
    assertSmoke(result.bestCrate?.fedSlotCount >= 2, "Expected a live ammo crate to support nearby occupied trench slots.", result);
    assertSmoke(
      result.ammoFeedProof.feedCandidateCount >= 2 &&
        (result.ammoFeedProof.crateAmmoAfter ?? Number.POSITIVE_INFINITY) < (result.ammoFeedProof.crateAmmoBefore ?? 0) &&
        (result.ammoFeedProof.feedAfter.some((read) => (read.ammoAfter ?? 0) > 0) || result.ammoFeedProof.resupplyStoryCount > 0),
      "Expected nearby ammo crate to actually feed low-ammo trench occupants.",
      result
    );
    assertNoPageErrors(pageErrors, "Trench and ammo scenario");

    return result;
  } finally {
    await page.close();
  }
}

async function runDownedExtractionScenario(browser) {
  const { page, pageErrors } = await openAgentPage(browser);
  try {
    const staged = await page.evaluate(() => {
      const snapshot = window.__topdownExtractionAgentApi.stageShowcase("blue-carried-extract-success");
      return {
        phase: snapshot.phase,
        casualtyState: snapshot.raid?.casualtyState ?? null,
        commandRestrictionMode: snapshot.raid?.commandRestrictionMode ?? null,
        activeRescueTask: snapshot.raid?.activeRescueTask ?? null,
        casualtyExtractActive: snapshot.raid?.casualtyExtractActive ?? null,
        casualtyExtractMode: snapshot.raid?.casualtyExtractMode ?? null,
        casualtyExtractOwner: snapshot.raid?.casualtyExtractOwner ?? null,
        extractionHoldTimer: snapshot.raid?.extractionHoldTimer ?? null
      };
    });
    assertSmoke(staged.phase === "raid", "Expected downed extraction showcase to enter raid.", staged);
    assertSmoke(staged.casualtyState === "downed", "Expected player to be downed before delegated extraction.", staged);
    assertSmoke(staged.commandRestrictionMode === "downed", "Expected downed player input to be command-restricted.", staged);
    assertSmoke(staged.activeRescueTask?.task === "carry", "Expected a squadmate carry task for the downed player.", staged);
    assertSmoke(staged.casualtyExtractActive === true, "Expected casualty extract to be active under squad ownership.", staged);
    assertSmoke(staged.extractionHoldTimer > 0, "Expected extraction hold timer to be live for the squad.", staged);

    await page.waitForTimeout(2400);
    const final = await page.evaluate(() => {
      const snapshot = window.__topdownExtractionAgentApi.getSnapshot();
      return {
        phase: snapshot.phase,
        lastRaidResult: snapshot.lastRaidSummary?.result ?? null,
        lastRaidReason: snapshot.lastRaidSummary?.reason ?? null,
        extractedAtLabel: snapshot.lastRaidSummary?.extractedAtLabel ?? null
      };
    });
    assertSmoke(final.phase === "stash", "Expected delegated downed extraction to resolve back to stash.", { staged, final });
    assertSmoke(final.lastRaidResult === "success", "Expected delegated downed extraction to end as success.", { staged, final });
    assertSmoke(/downed/i.test(final.lastRaidReason ?? ""), "Expected last raid summary to record a downed extract.", { staged, final });
    assertSmoke(typeof final.extractedAtLabel === "string" && final.extractedAtLabel.length > 0, "Expected extraction label proof.", {
      staged,
      final
    });
    assertNoPageErrors(pageErrors, "Downed extraction scenario");

    return { staged, final };
  } finally {
    await page.close();
  }
}

async function runEnemySpawnSideScenario(browser) {
  const { page, pageErrors } = await openAgentPage(browser);
  try {
    const result = await page.evaluate(() => {
      const api = window.__topdownExtractionAgentApi;
      api.configureNextRaid({ routeId: "broken-signal", weaponId: "rifle" });
      const snapshot = api.stageState("raid");
      const camps = snapshot.war?.townWar?.camps ?? [];
      const russianCamp = camps.find((camp) => camp.id === "camp-a");
      const ukrainianCamp = camps.find((camp) => camp.id === "camp-b");
      if (!russianCamp || !ukrainianCamp) {
        return { ok: false, reason: "missing-camps", camps };
      }

      const contactLineX = (russianCamp.spawn.position.x + ukrainianCamp.spawn.position.x) / 2;
      const maxUkrainianSpawnX = Math.min(russianCamp.spawn.position.x - 360, contactLineX + 180);
      const enemies = snapshot.raid?.enemies ?? [];
      const offenders = enemies.filter((enemy) => enemy.position.x > maxUkrainianSpawnX + 1);
      return {
        ok: offenders.length === 0 && enemies.length > 0,
        reason: offenders.length > 0 ? "enemy-spawned-behind-russian-side" : enemies.length > 0 ? "ok" : "no-enemies",
        russianCampX: russianCamp.spawn.position.x,
        ukrainianCampX: ukrainianCamp.spawn.position.x,
        maxUkrainianSpawnX,
        enemyCount: enemies.length,
        rightmostEnemyX: enemies.reduce((max, enemy) => Math.max(max, enemy.position.x), Number.NEGATIVE_INFINITY),
        offenders: offenders.map((enemy) => ({
          id: enemy.id,
          squadId: enemy.squadId,
          role: enemy.squadRole,
          x: enemy.position.x,
          y: enemy.position.y
        }))
      };
    });

    assertSmoke(result.ok, "Expected Ukrainian raid enemies to spawn from their side, not behind Russian camp.", result);
    assertNoPageErrors(pageErrors, "Enemy spawn side scenario");
    return result;
  } finally {
    await page.close();
  }
}

async function runTownWarShippingHardeningSmoke() {
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
      if (process.platform === "win32" && server.pid) {
        spawnSync("taskkill", ["/pid", String(server.pid), "/t", "/f"], { stdio: "ignore", shell: false });
      } else {
        server.kill();
      }
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
      const factionReset = await runFactionAndResetScenario(browser);
      const trenchAmmo = await runTrenchAmmoScenario(browser);
      const downedExtraction = await runDownedExtractionScenario(browser);
      const enemySpawn = await runEnemySpawnSideScenario(browser);

      console.log("Town-war shipping hardening smoke passed.");
      console.log(
        `Faction proof: ${factionReset.start.russianCamp.label} camp-a x${factionReset.start.russianCamp.x.toFixed(1)} vs ${factionReset.start.ukrainianCamp.label} camp-b x${factionReset.start.ukrainianCamp.x.toFixed(1)}.`
      );
      console.log(
        `Reset proof: dirty orders ${factionReset.dirty.orders}, crates ${factionReset.dirty.crates}, trenches ${factionReset.dirty.trenchSlots}; reset orders ${factionReset.reset.orders}, crates ${factionReset.reset.crates}, trenches ${factionReset.reset.trenchSlots}.`
      );
      console.log(
        `Trench proof: ${trenchAmmo.occupiedTrenchCount}/${trenchAmmo.trenchCount} slots occupied by ${trenchAmmo.occupiedSlotReads.map((read) => `${read.occupiedBySoldierId}:${read.role}`).join(", ")}; spacing ${Math.round(trenchAmmo.minOccupiedSlotSpacing ?? 0)}px.`
      );
      console.log(
        `Fire proof: ammo spent ${Math.round(trenchAmmo.trenchFireProof.ammoSpent)}; target health loss ${trenchAmmo.trenchFireProof.targetHealthLoss.toFixed(2)}; pressure gain ${trenchAmmo.trenchFireProof.targetPressureGain.toFixed(2)}.`
      );
      console.log(
        `Ammo proof: crate ${trenchAmmo.bestCrate.id} feeds ${trenchAmmo.bestCrate.fedSlotCount} occupied slots; ammo ${trenchAmmo.ammoFeedProof.crateAmmoBefore}->${trenchAmmo.ammoFeedProof.crateAmmoAfter}; soldiers ${trenchAmmo.ammoFeedProof.feedAfter.map((read) => `${read.id}:${read.inMag}/${read.reserve}`).join(", ")}.`
      );
      console.log(
        `Downed extraction proof: ${downedExtraction.staged.activeRescueTask.rescuerName} carried Blue; final ${downedExtraction.final.lastRaidResult} at ${downedExtraction.final.extractedAtLabel}; reason "${downedExtraction.final.lastRaidReason}".`
      );
      console.log(
        `Enemy spawn proof: ${enemySpawn.enemyCount} Ukrainians; rightmost x ${enemySpawn.rightmostEnemyX.toFixed(1)} <= side limit ${enemySpawn.maxUkrainianSpawnX.toFixed(1)}.`
      );
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

runTownWarShippingHardeningSmoke().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
