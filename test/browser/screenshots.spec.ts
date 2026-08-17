import { expect, test } from "@playwright/test";
import { loadApp } from "./load-app";

test.describe("visual baselines", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "Screenshot baselines are Chromium-only");

  test("accessible structure is stable across directions", async ({ page }) => {
    await loadApp(page, "rtl");
    await expect(page.locator("#app")).toMatchAriaSnapshot(`
      - banner: rtl-resolver
      - navigation:
        - button "One"
        - button "Two"
        - button "Three"
      - main:
        - text: menu none Name
        - textbox "Name"
        - text: Arabic
        - textbox "Arabic": مرحبا
        - table:
          - rowgroup:
            - row "Name City":
              - columnheader "Name"
              - columnheader "City"
          - rowgroup:
            - row "Ada London":
              - cell "Ada"
              - cell "London"
        - paragraph: John Smith محمد علي
        - button "Open"
      - contentinfo: footer
    `);
  });

  for (const direction of ["ltr", "rtl"] as const) {
    test(`start-edge pixel baseline ${direction}`, async ({ page }) => {
      await page.setViewportSize({ width: 800, height: 500 });
      await loadApp(page, direction);
      await expect(page.locator("#start-edge")).toHaveScreenshot(`start-edge-${direction}.png`, {
        animations: "disabled",
        maxDiffPixelRatio: 0.05,
      });
    });
  }
});
