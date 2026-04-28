import { chromium } from "playwright";

const GAME_URL = process.env.FRONTLINE_OFFICER_URL ?? "http://127.0.0.1:5847/";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const consoleErrors = [];

page.on("console", (message) => {
  if (message.type() === "error") {
    consoleErrors.push(message.text());
  }
});
page.on("pageerror", (error) => consoleErrors.push(error.message));

async function getRackWeaponActions(weaponId) {
  await page.locator(`[data-stash-tile-id="rack-weapon-${weaponId}"]`).dispatchEvent("contextmenu", {
    bubbles: true,
    cancelable: true,
    clientX: 960,
    clientY: 520
  });
  await page.waitForFunction(
    () => {
      const menu = document.querySelector("[data-stash-context-menu]");
      return menu && !menu.classList.contains("hidden") && menu.querySelector("[data-stash-action]");
    },
    null,
    { timeout: 5000 }
  );
  return page.locator("[data-stash-context-menu] [data-stash-action]").evaluateAll((buttons) =>
    buttons.map((button) => ({
      id: button.getAttribute("data-stash-action"),
      label: button.textContent?.trim() ?? ""
    }))
  );
}

async function clickRackWeaponAction(weaponId, actionId) {
  const actions = await getRackWeaponActions(weaponId);
  const action = actions.find((entry) => entry.id === actionId);
  assert(action, `Missing ${actionId} action for ${weaponId}. Actions: ${actions.map((entry) => entry.label).join(", ")}`);
  await page.locator(`[data-stash-context-menu] [data-stash-action="${actionId}"]`).dispatchEvent("click", {
    bubbles: true,
    cancelable: true
  });
}

function getActiveAmmo(raidPlayer) {
  return raidPlayer.weaponSlots.find((slot) => slot.slotId === raidPlayer.activeWeaponSlotId)?.ammoInMag ?? raidPlayer.ammoInMag;
}

try {
  await page.goto(`${GAME_URL}?dual-primary-smoke=${Date.now()}`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.__topdownExtractionAgentApi), null, { timeout: 15000 });

  await page.evaluate(() => window.__topdownExtractionAgentApi.configureNextRaid({ ammoPacks: 2, secondaryWeaponId: null }));
  const rpgActions = await getRackWeaponActions("rpg");
  assert(
    rpgActions.some((action) => action.id === "stage-weapon" && action.label === "Equip On Sling 1"),
    `RPG context menu missing Equip On Sling 1. Actions: ${rpgActions.map((action) => action.label).join(", ")}`
  );
  assert(
    rpgActions.some((action) => action.id === "stage-back-weapon" && action.label === "Equip On Sling 2"),
    `RPG context menu missing Equip On Sling 2. Actions: ${rpgActions.map((action) => action.label).join(", ")}`
  );

  await clickRackWeaponAction("worn-ak", "stage-weapon");
  await clickRackWeaponAction("rpg", "stage-back-weapon");

  let snapshot = await page.evaluate(() => window.__topdownExtractionAgentApi.getSnapshot());

  assert(snapshot.stash.selectedWeapon === "worn-ak", `Expected Worn AK on Sling 1, got ${snapshot.stash.selectedWeapon}`);
  assert(snapshot.stash.secondaryWeapon === "rpg", `Expected RPG on Sling 2, got ${snapshot.stash.secondaryWeapon}`);

  snapshot = await page.evaluate(() => window.__topdownExtractionAgentApi.startRaid());
  assert(snapshot.raid, "Raid did not start.");
  assert(snapshot.raid.player.weaponId === "worn-ak", `Expected active Worn AK, got ${snapshot.raid.player.weaponId}`);
  assert(snapshot.raid.player.activeWeaponSlotId === "primary", `Expected primary active, got ${snapshot.raid.player.activeWeaponSlotId}`);
  assert(
    snapshot.raid.player.weaponSlots.some((slot) => slot.slotId === "secondary" && slot.weaponId === "rpg"),
    "RPG was not carried as the secondary long gun."
  );

  snapshot = await page.evaluate(() => window.__topdownExtractionAgentApi.switchWeaponSlot("secondary"));
  assert(snapshot.raid.player.weaponId === "rpg", `Expected RPG after swap, got ${snapshot.raid.player.weaponId}`);
  assert(snapshot.raid.player.activeWeaponSlotId === "secondary", `Expected secondary active, got ${snapshot.raid.player.activeWeaponSlotId}`);

  const ammoBeforeRpg = getActiveAmmo(snapshot.raid.player);
  const playerPosition = snapshot.raid.player.position;
  await page.evaluate(
    (target) => window.__topdownExtractionAgentApi.setAimTarget(target),
    { x: playerPosition.x + 960, y: playerPosition.y }
  );
  await page.evaluate(() => window.__topdownExtractionAgentApi.setTriggerHeld(true));
  snapshot = await page.evaluate(() => window.__topdownExtractionAgentApi.advanceRaid({ seconds: 0.75, tickSeconds: 0.05 }));
  await page.evaluate(() => window.__topdownExtractionAgentApi.setTriggerHeld(false));
  snapshot = await page.evaluate(() => window.__topdownExtractionAgentApi.advanceRaid({ seconds: 0.25, tickSeconds: 0.05 }));
  const ammoAfterRpg = getActiveAmmo(snapshot.raid.player);
  assert(ammoAfterRpg < ammoBeforeRpg, `RPG ammo did not change after firing. before=${ammoBeforeRpg}, after=${ammoAfterRpg}`);

  snapshot = await page.evaluate(() => window.__topdownExtractionAgentApi.switchWeaponSlot("primary"));
  assert(snapshot.raid.player.weaponId === "worn-ak", `Expected Worn AK after swap back, got ${snapshot.raid.player.weaponId}`);
  assert(snapshot.raid.player.activeWeaponSlotId === "primary", `Expected primary active after swap back, got ${snapshot.raid.player.activeWeaponSlotId}`);
  assert(consoleErrors.length === 0, `Console errors during dual-primary smoke: ${consoleErrors.slice(0, 3).join(" | ")}`);

  console.log(
    JSON.stringify(
      {
        ok: true,
        activeWeapon: snapshot.raid.player.weaponId,
        activeSlot: snapshot.raid.player.activeWeaponSlotId,
        combat: {
          activeTracerCount: snapshot.combat.activeTracerCount,
          activeImpactCount: snapshot.combat.activeImpactCount
        },
        weaponSlots: snapshot.raid.player.weaponSlots
      },
      null,
      2
    )
  );
} finally {
  await browser.close();
}
