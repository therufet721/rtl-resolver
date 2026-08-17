import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

declare global {
  interface Window {
    RtlResolverBrowser: {
      resetRtlScrollTypeCache(): void;
      getRtlScrollType(): "negative" | "default" | "reverse";
      setLogicalScrollPosition(element: HTMLElement, position: number, direction: "ltr" | "rtl"): void;
      getLogicalScrollPosition(element: HTMLElement, direction: "ltr" | "rtl"): number;
    };
  }
}

function readBundle(): string {
  const directory = resolve(process.cwd(), "test/browser/public");
  const file = readdirSync(directory).find((name) => name.endsWith(".js"));
  if (!file) throw new Error("Browser fixture bundle was not generated");
  return readFileSync(resolve(directory, file), "utf8");
}

test.beforeEach(async ({ page }) => {
  await page.setContent(`<!DOCTYPE html>
    <html>
      <body>
        <div id="ltr" style="width:80px;height:40px;overflow:auto;">
          <div style="width:400px;height:1px"></div>
        </div>
        <div id="rtl" dir="rtl" style="width:80px;height:40px;overflow:auto;">
          <div style="width:400px;height:1px"></div>
        </div>
      </body>
    </html>`);
  await page.addScriptTag({ content: readBundle() });
});

test("classifies RTL scrollLeft and round-trips logical positions", async ({ page }) => {
  const result = await page.evaluate(() => {
    const api = window.RtlResolverBrowser;
    api.resetRtlScrollTypeCache();
    const rtl = document.getElementById("rtl") as HTMLElement;
    const ltr = document.getElementById("ltr") as HTMLElement;
    const type = api.getRtlScrollType();
    api.setLogicalScrollPosition(rtl, 40, "rtl");
    api.setLogicalScrollPosition(ltr, 40, "ltr");
    return {
      type,
      rtlLogical: api.getLogicalScrollPosition(rtl, "rtl"),
      ltrLogical: api.getLogicalScrollPosition(ltr, "ltr"),
      ltrPhysical: ltr.scrollLeft,
    };
  });

  expect(["negative", "default", "reverse"]).toContain(result.type);
  expect(result.ltrPhysical).toBe(40);
  expect(result.ltrLogical).toBe(40);
  expect(result.rtlLogical).toBeGreaterThanOrEqual(39);
  expect(result.rtlLogical).toBeLessThanOrEqual(41);
});
