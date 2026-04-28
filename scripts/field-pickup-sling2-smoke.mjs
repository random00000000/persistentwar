import { chromium } from "playwright";

const GAME_URL = process.env.FRONTLINE_OFFICER_URL ?? "http://127.0.0.1:5847/";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function getSlot(player, slotId) {
  return player.weaponSlots.find((slot) => slot.slotId === slotId) ?? null;
}

async function pickUpStagedWeapon(weaponId, expectedActiveSlotId) {
  let snapshot = await page.evaluate(
    (nextWeaponId) => window.__topdownExtractionAgentApi.stageRaidWeaponLoot({ weaponId: nextWeaponId }),
    weaponId
  );
  assert(snapshot.raid, "Raid snapshot missing after staging field weapon.");

  await page.evaluate(() => window.__topdownExtractionAgentApi.queueRaidAction("interact"));
  for (let attempt = 0; attempt < 10; attempt += 1) {
    snapshot = await page.evaluate(() =>
      window.__topdownExtractionAgentApi.advanceRaid({ seconds: 0.12, tickSeconds: 0.04 })
    );
    if (snapshot.raid?.player.weaponId === weaponId && snapshot.raid?.player.activeWeaponSlotId === expectedActiveSlotId) {
      break;
    }
  }

  assert(snapshot.raid, `Raid ended before ${weaponId} pickup could complete.`);
  assert(
    snapshot.raid.player.activeWeaponSlotId === expectedActiveSlotId,
    `Expected ${expectedActiveSlotId} active after picking up ${weaponId}, got ${snapshot.raid.player.activeWeaponSlotId}`
  );
  assert(snapshot.raid.player.weaponId === weaponId, `Expected picked ${weaponId} active, got ${snapshot.raid.player.weaponId}`);
  return snapshot;
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
  await page.goto(`${GAME_URL}?field-pickup-sling2-smoke=${Date.now()}`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.__topdownExtractionAgentApi), null, { timeout: 15000 });

  await page.evaluate(() =>
    window.__topdownExtractionAgentApi.configureNextRaid({
      weaponId: "worn-ak",
      secondaryWeaponId: null,
      ammoPacks: 1
    })
  );

  let snapshot = await page.evaluate(() => window.__topdownExtractionAgentApi.startRaid());
  assert(snapshot.raid, "Raid did not start.");
  assert(snapshot.raid.player.weaponId === "worn-ak", `Expected Worn AK active, got ${snapshot.raid.player.weaponId}`);
  assert(snapshot.raid.player.activeWeaponSlotId === "primary", `Expected primary active, got ${snapshot.raid.player.activeWeaponSlotId}`);
  assert(getSlot(snapshot.raid.player, "secondary") === null, "Sling 2 should start empty for this smoke.");

  snapshot = await pickUpStagedWeapon("smg", "secondary");
  assert(getSlot(snapshot.raid.player, "primary")?.weaponId === "worn-ak", "Original Worn AK should remain on Sling 1.");
  assert(getSlot(snapshot.raid.player, "secondary")?.weaponId === "smg", "Picked weapon should be mounted on Sling 2.");

  const swapLabelAfterPickup = await page.locator("[data-weapon-swap-label]").textContent();
  assert(
    swapLabelAfterPickup?.trim() === "Sling 1: Worn AK",
    `Expected swap button to target Sling 1 Worn AK, got "${swapLabelAfterPickup?.trim()}"`
  );

  await page.locator("[data-weapon-swap]").click();
  snapshot = await page.evaluate(() => window.__topdownExtractionAgentApi.getSnapshot());
  assert(snapshot.raid.player.activeWeaponSlotId === "primary", `Expected primary after swap back, got ${snapshot.raid.player.activeWeaponSlotId}`);
  assert(snapshot.raid.player.weaponId === "worn-ak", `Expected Worn AK after swap back, got ${snapshot.raid.player.weaponId}`);

  snapshot = await pickUpStagedWeapon("shotgun", "primary");
  assert(getSlot(snapshot.raid.player, "primary")?.weaponId === "shotgun", "Picking up a weapon while Sling 1 is active should replace Sling 1.");
  assert(getSlot(snapshot.raid.player, "secondary")?.weaponId === "smg", "Picking up a weapon while Sling 1 is active should leave Sling 2 alone.");

  await page.locator("[data-weapon-swap]").click();
  snapshot = await page.evaluate(() => window.__topdownExtractionAgentApi.getSnapshot());
  assert(snapshot.raid.player.activeWeaponSlotId === "secondary", `Expected secondary before Sling 2 replacement, got ${snapshot.raid.player.activeWeaponSlotId}`);
  assert(snapshot.raid.player.weaponId === "smg", `Expected SMG before Sling 2 replacement, got ${snapshot.raid.player.weaponId}`);

  snapshot = await pickUpStagedWeapon("rifle", "secondary");
  assert(getSlot(snapshot.raid.player, "primary")?.weaponId === "shotgun", "Picking up a weapon while Sling 2 is active should leave Sling 1 alone.");
  assert(getSlot(snapshot.raid.player, "secondary")?.weaponId === "rifle", "Picking up a weapon while Sling 2 is active should replace Sling 2.");

  assert(consoleErrors.length === 0, `Console errors during field pickup smoke: ${consoleErrors.slice(0, 3).join(" | ")}`);

  console.log(
    JSON.stringify(
      {
        ok: true,
        activeWeapon: snapshot.raid.player.weaponId,
        activeSlot: snapshot.raid.player.activeWeaponSlotId,
        weaponSlots: snapshot.raid.player.weaponSlots
      },
      null,
      2
    )
  );
} finally {
  await browser.close();
}
