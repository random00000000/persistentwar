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
  await page.goto(`${GAME_URL}?rpg-four-hit-smoke=${Date.now()}`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.__topdownExtractionAgentApi), null, { timeout: 15000 });

  let snapshot = await page.evaluate(() => window.__topdownExtractionAgentApi.resetTownWar());
  let enemyCamp = snapshot.war?.camps.find((camp) => camp.id === "camp-b") ?? null;
  assert(enemyCamp, "Enemy camp missing after town war reset.");
  assert(enemyCamp.health === 1000, `Unexpected enemy camp starting health: ${enemyCamp.health}`);

  const hitResults = [];
  for (let hitIndex = 1; hitIndex <= 4; hitIndex += 1) {
    const hit = await page.evaluate(
      ({ x, y }) =>
        window.__topdownExtractionAgentApi.applyTownWarExplosiveDamage({
          attackerFaction: "camp-a",
          targetCampId: "camp-b",
          x,
          y,
          radius: 128,
          tool: "rpg"
        }),
      enemyCamp.spawn.position
    );
    hitResults.push({
      hitIndex,
      ok: hit.ok,
      campDamage: hit.result?.campDamage ?? 0,
      destroyed: Boolean(hit.result?.destroyed),
      matchEnded: Boolean(hit.result?.matchEnded),
      readable: hit.result?.readable ?? hit.summary
    });
    assert(hit.result?.campDamage === 250, `Expected each RPG to deal 250 camp damage, got ${hit.result?.campDamage}`);
    snapshot = await page.evaluate(() => window.__topdownExtractionAgentApi.getSnapshot());
    enemyCamp = snapshot.war?.camps.find((camp) => camp.id === "camp-b") ?? null;
    assert(enemyCamp, `Enemy camp missing after RPG hit ${hitIndex}.`);

    if (hitIndex < 4) {
      assert(!enemyCamp.destroyed, `Enemy camp destroyed too early after ${hitIndex} RPG hits.`);
      assert(snapshot.war?.match.status === "active", `Match ended too early after ${hitIndex} RPG hits.`);
    }
  }

  assert(enemyCamp.destroyed, `Enemy camp still alive after 4 RPG hits, health=${enemyCamp.health}`);
  assert(snapshot.war?.match.status === "ended", `War match did not end after enemy camp destruction: ${snapshot.war?.match.status}`);
  assert(snapshot.war?.match.winner === "camp-a", `Wrong winner after enemy camp destruction: ${snapshot.war?.match.winner}`);
  assert(snapshot.war?.match.reason === "camp-destroyed", `Wrong match reason: ${snapshot.war?.match.reason}`);
  assert(snapshot.ui?.overlays?.warVictoryReady === true, "War victory overlay did not become ready after enemy camp destruction.");
  assert(consoleErrors.length === 0, `Console errors during RPG camp smoke: ${consoleErrors.slice(0, 3).join(" | ")}`);

  console.log(
    JSON.stringify(
      {
        ok: true,
        enemyCampHealth: enemyCamp.health,
        match: snapshot.war.match,
        warVictoryReady: snapshot.ui.overlays.warVictoryReady,
        hits: hitResults
      },
      null,
      2
    )
  );
} finally {
  await browser.close();
}
