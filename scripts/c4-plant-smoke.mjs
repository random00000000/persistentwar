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
  await page.goto(`${GAME_URL}?c4-smoke=${Date.now()}`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.__topdownExtractionAgentApi), null, { timeout: 15000 });

  const c4TileId = await page.evaluate(
    () =>
      [...document.querySelectorAll("[data-stash-tile-id]")]
        .find((node) => node.getAttribute("data-stash-tile-id")?.includes("c4"))
        ?.getAttribute("data-stash-tile-id") ?? null
  );
  assert(c4TileId === "rack-weapon-c4", `C4 stash tile missing, got ${String(c4TileId)}`);

  let snapshot = await page.evaluate(() => window.__topdownExtractionAgentApi.configureNextRaid({ weaponId: "c4" }));
  assert(snapshot.stash?.selectedWeapon === "c4", `C4 was not staged, got ${snapshot.stash?.selectedWeapon}`);

  snapshot = await page.evaluate(() => window.__topdownExtractionAgentApi.startRaid());
  assert(snapshot.raid?.weaponId === "c4", `Raid did not start with C4, got ${snapshot.raid?.weaponId}`);

  const startPosition = snapshot.raid.position;
  await page.evaluate((target) => window.__topdownExtractionAgentApi.setAimTarget(target), {
    x: startPosition.x + 120,
    y: startPosition.y
  });
  await page.evaluate(() => window.__topdownExtractionAgentApi.setTriggerHeld(true));
  snapshot = await page.evaluate(() => window.__topdownExtractionAgentApi.advanceRaid({ seconds: 0.25, tickSeconds: 0.05 }));
  await page.evaluate(() => window.__topdownExtractionAgentApi.setTriggerHeld(false));

  assert(snapshot.raid?.ammoInMag === 0, `C4 did not consume its charge, ammo=${snapshot.raid?.ammoInMag}`);
  assert(snapshot.raid?.plantedCharges?.length === 1, `Expected one planted charge, got ${snapshot.raid?.plantedCharges?.length}`);
  assert(String(snapshot.message).includes("C4 armed"), `C4 countdown did not appear, message=${snapshot.message}`);

  const plantedCharge = snapshot.raid.plantedCharges[0];
  snapshot = await page.evaluate(() =>
    window.__topdownExtractionAgentApi.advanceRaid({ seconds: 2.5, tickSeconds: 0.05, move: { x: -1, y: 0 } })
  );
  const distanceFromCharge = Math.hypot(snapshot.raid.position.x - plantedCharge.position.x, snapshot.raid.position.y - plantedCharge.position.y);
  assert(distanceFromCharge > plantedCharge.radius, `Officer did not clear the blast radius, distance=${distanceFromCharge.toFixed(1)}`);
  assert(String(snapshot.message).includes("clear"), `C4 safety readout did not switch to clear, message=${snapshot.message}`);

  snapshot = await page.evaluate(() =>
    window.__topdownExtractionAgentApi.advanceRaid({ seconds: 4.1, tickSeconds: 0.05, move: { x: -1, y: 0 } })
  );
  assert(snapshot.phase === "raid", `Officer should survive the moved-away C4 plant, phase=${snapshot.phase}`);
  assert(snapshot.raid?.plantedCharges?.length === 0, `C4 charge did not detonate, charges=${snapshot.raid?.plantedCharges?.length}`);
  assert(consoleErrors.length === 0, `Console errors during C4 smoke: ${consoleErrors.slice(0, 3).join(" | ")}`);

  console.log(
    JSON.stringify(
      {
        ok: true,
        c4TileId,
        phase: snapshot.phase,
        distanceFromCharge: Number(distanceFromCharge.toFixed(1)),
        message: snapshot.message
      },
      null,
      2
    )
  );
} finally {
  await browser.close();
}
