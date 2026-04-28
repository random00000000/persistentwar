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

try {
  await page.goto(`${GAME_URL}?dual-primary-smoke=${Date.now()}`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.__topdownExtractionAgentApi), null, { timeout: 15000 });

  let snapshot = await page.evaluate(() =>
    window.__topdownExtractionAgentApi.configureNextRaid({
      weaponId: "worn-ak",
      secondaryWeaponId: "rpg",
      ammoPacks: 2
    })
  );

  assert(snapshot.stash.selectedWeapon === "worn-ak", `Expected Worn AK on sling, got ${snapshot.stash.selectedWeapon}`);
  assert(snapshot.stash.secondaryWeapon === "rpg", `Expected RPG on back, got ${snapshot.stash.secondaryWeapon}`);

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

  const getActiveAmmo = (raidPlayer) =>
    raidPlayer.weaponSlots.find((slot) => slot.slotId === raidPlayer.activeWeaponSlotId)?.ammoInMag ?? raidPlayer.ammoInMag;
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
