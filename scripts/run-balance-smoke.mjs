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
  await page.goto(`${GAME_URL}?run-balance-smoke=${Date.now()}`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.__topdownExtractionAgentApi), null, { timeout: 15000 });

  const snapshot = await page.evaluate(() => window.__topdownExtractionAgentApi.startRaid());
  const onboarding = snapshot.stash?.officerOnboarding;
  assert(snapshot.phase === "raid", `Expected raid phase after startRaid, got ${snapshot.phase}`);
  assert(snapshot.raid?.timerRemaining === 1500, `Expected 25 minute run timer, got ${snapshot.raid?.timerRemaining}`);
  assert(onboarding?.targetSeconds === 300, `Expected 5 minute promotion target, got ${onboarding?.targetSeconds}`);
  assert(
    snapshot.raid.timerRemaining >= onboarding.targetSeconds,
    `Promotion survival target must fit inside the run timer: timer=${snapshot.raid.timerRemaining}, target=${onboarding.targetSeconds}`
  );
  assert(onboarding.squadCommandUnlocked === false, "Command should still start locked before the officer earns promotion.");
  assert(consoleErrors.length === 0, `Console errors during run balance smoke: ${consoleErrors.slice(0, 3).join(" | ")}`);

  console.log(
    `run-balance smoke passed: ${Math.round(snapshot.raid.timerRemaining / 60)} minute run, ${Math.round(
      onboarding.targetSeconds / 60
    )} minute promotion gate.`
  );
} finally {
  await browser.close();
}
