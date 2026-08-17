import { nvdaTest as test } from "@guidepup/playwright";
import { expect } from "@playwright/test";
import { assistiveTechnologyReady } from "../../packages/testing/src/at";
import { loadApp } from "../browser/load-app";

const ready = assistiveTechnologyReady("nvda");

test.skip(!ready.ready, ready.reason);

test("NVDA keeps landmark and control names in DOM order", async ({ page, nvda }) => {
  await loadApp(page, "rtl");
  await expect(page.getByRole("navigation")).toBeVisible();
  await nvda.navigateToWebContent();
  const phrases: string[] = [];
  for (let index = 0; index < 16; index++) {
    phrases.push((await nvda.lastSpokenPhrase()) ?? "");
    await nvda.next();
  }
  const spoken = phrases.join(" ");
  expect(spoken).toMatch(/One|Two|navigation|banner|button/i);
  const one = spoken.search(/One/i);
  const two = spoken.search(/Two/i);
  if (one >= 0 && two >= 0) expect(one).toBeLessThan(two);
});
