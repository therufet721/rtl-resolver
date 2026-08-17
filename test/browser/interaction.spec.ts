import { expect, test } from "@playwright/test";
import { loadApp } from "./load-app";

test("places the logical start edge and overlay on the inline-start side", async ({ page }) => {
  for (const direction of ["ltr", "rtl"] as const) {
    await loadApp(page, direction);
    const edge = await page.locator("#start-edge").boundingBox();
    const popover = await page.locator("#popover").boundingBox();
    const viewport = page.viewportSize();
    expect(edge).toBeTruthy();
    expect(popover).toBeTruthy();
    expect(viewport).toBeTruthy();
    if (direction === "ltr") {
      expect(edge!.x).toBeLessThan(24);
      expect(popover!.x).toBeLessThan(24);
    } else {
      expect(edge!.x).toBeGreaterThan(viewport!.width / 2);
      expect(popover!.x).toBeGreaterThan(viewport!.width / 2);
    }
    const side = await page.locator("#popover").getAttribute("data-side");
    expect(side).toBe(direction === "rtl" ? "right" : "left");
  }
});

test("normalizes pointer swipes and viewport inline size", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await loadApp(page, "rtl");
  const width = await page.evaluate(() => window.RtlResolver.getViewportInlineSize());
  expect(width).toBeGreaterThan(300);
  expect(width).toBeLessThanOrEqual(390);

  const box = await page.locator("#swipe-pad").boundingBox();
  expect(box).toBeTruthy();
  await page.mouse.move(box!.x + 140, box!.y + 20);
  await page.mouse.down();
  await page.mouse.move(box!.x + 20, box!.y + 20, { steps: 10 });
  await page.mouse.up();
  await expect(page.locator("#swipe-status")).toHaveText("next");
});

test("keeps logical arrow keys independent of physical coordinates", async ({ page }) => {
  await loadApp(page, "rtl");
  const action = await page.evaluate(() => window.RtlResolver.resolveArrowNavigation("ArrowLeft", "rtl", "logical"));
  expect(action).toBe("next");
});
