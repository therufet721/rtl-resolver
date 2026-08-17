import { expect, test } from "@playwright/test";
import { loadApp } from "./load-app";

test("end-to-end fixture wires direction, forms, icons, and paging APIs", async ({ page }) => {
  await loadApp(page, "rtl");
  const result = await page.evaluate(() => {
    const api = window.RtlResolver;
    api.resetRtlScrollTypeCache();
    const scroller = document.getElementById("scroller") as HTMLElement;
    scroller.dir = "rtl";
    api.setLogicalScrollPosition(scroller, 40, "rtl");
    const icon = document.getElementById("forward-icon") as HTMLElement;
    const input = api.formControlAttributes("rtl", "hello", "email");
    return {
      type: api.getRtlScrollType(),
      logical: api.getLogicalScrollPosition(scroller, "rtl"),
      icon: icon.style.transform,
      inputDir: input.dir,
      focus: api.focusSequence(["one", "two"], "rtl" as never),
      locale: api.directionFromLocale("ar"),
    };
  });
  expect(["negative", "default", "reverse"]).toContain(result.type);
  expect(result.logical).toBeGreaterThanOrEqual(39);
  expect(result.logical).toBeLessThanOrEqual(41);
  expect(result.icon).toBe("scaleX(-1)");
  expect(result.inputDir).toBe("ltr");
  expect(result.focus).toEqual(["one", "two"]);
  expect(result.locale).toBe("rtl");
});
