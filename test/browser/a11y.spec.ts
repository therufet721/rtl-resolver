import { expect, test } from "@playwright/test";
import { loadApp } from "./load-app";

test("focus order follows DOM in both directions", async ({ page }) => {
  for (const direction of ["ltr", "rtl"] as const) {
    await loadApp(page, direction);
    await page.locator("#focus-one").focus();
    const order: string[] = [];
    for (let index = 0; index < 3; index++) {
      order.push(await page.evaluate(() => document.activeElement?.id ?? ""));
      await page.keyboard.press("Tab");
    }
    expect(order).toEqual(["focus-one", "focus-two", "focus-three"]);
    const reverse = await page.evaluate(() => window.RtlResolver.shouldReverseDomOrder().reverse);
    expect(reverse).toBe(false);
  }
});

test("exposes dialog semantics and table header DOM order", async ({ page }) => {
  await loadApp(page, "rtl");
  await expect(page.locator("#confirm-dialog")).toHaveAttribute("role", "dialog");
  await expect(page.locator("#confirm-dialog")).toHaveAttribute("aria-modal", "true");
  const headers = await page.locator("thead th").allTextContents();
  expect(headers).toEqual(["Name", "City"]);
  const snapshot = await page.locator("#app").ariaSnapshot();
  expect(snapshot).toMatch(/banner|navigation|main|contentinfo/i);
});

test("does not reverse landmark or mixed-name source order", async ({ page }) => {
  await loadApp(page, "rtl");
  const text = await page.locator("main p").innerText();
  expect(text.indexOf("John Smith")).toBeLessThan(text.indexOf("محمد علي"));
});

test("exposes navigation, table, and dialog roles without reversing DOM", async ({ page }) => {
  await loadApp(page, "rtl");
  await expect(page.getByRole("navigation")).toBeVisible();
  await expect(page.getByRole("banner")).toBeVisible();
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByRole("contentinfo")).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Name" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "City" })).toBeVisible();
  const dialog = page.getByRole("dialog", { name: "Confirm", includeHidden: true });
  await expect(dialog).toHaveAttribute("aria-modal", "true");
  const buttons = await page.getByRole("navigation").getByRole("button").allTextContents();
  expect(buttons).toEqual(["One", "Two", "Three"]);
});
