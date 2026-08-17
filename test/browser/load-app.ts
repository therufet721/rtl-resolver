import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import type { Page } from "@playwright/test";

export type FixtureDirection = "ltr" | "rtl";

declare global {
  interface Window {
    RtlResolver: {
      bootFixture(): void;
      getLogicalScrollPosition(element: HTMLElement, direction: FixtureDirection): number;
      setLogicalScrollPosition(element: HTMLElement, position: number, direction: FixtureDirection): void;
      getRtlScrollType(): "negative" | "default" | "reverse";
      resetRtlScrollTypeCache(): void;
      getViewportInlineSize(): number;
      physicalPlacement(placement: "start" | "end" | "top" | "bottom", direction: FixtureDirection): string;
      resolveArrowNavigation(key: string, direction: FixtureDirection, mode?: string): string;
      iconAttributes(name: string, direction: FixtureDirection): { style?: { transform: string } };
      shouldReverseDomOrder(): { reverse: false };
      formControlAttributes(direction: FixtureDirection, value?: string, kind?: string): { dir: FixtureDirection };
      focusSequence(items: string[], direction?: FixtureDirection): string[];
      directionFromLocale(locale: string): FixtureDirection;
    };
    RtlResolverBrowser: Window["RtlResolver"] & {
      getRtlScrollType(): "negative" | "default" | "reverse";
    };
    __lastSwipe: "previous" | "next" | "none";
  }
}

function readGenerated(prefix: string): string {
  const directory = resolve(process.cwd(), "test/browser/public");
  const file = readdirSync(directory).find((name) => name.startsWith(prefix) && name.endsWith(".js"));
  if (!file) throw new Error(`Missing generated bundle ${prefix}`);
  return readFileSync(resolve(directory, file), "utf8");
}

export async function loadApp(page: Page, direction: FixtureDirection = "ltr"): Promise<void> {
  const html = readFileSync(resolve(process.cwd(), "test/browser/app.html"), "utf8");
  await page.setContent(html);
  await page.addScriptTag({ content: readGenerated("rtl-e2e") });
  await page.evaluate((nextDirection) => {
    document.documentElement.dir = nextDirection;
    document.documentElement.lang = nextDirection === "rtl" ? "ar" : "en";
    const app = document.getElementById("app");
    if (app) app.setAttribute("dir", nextDirection);
    window.RtlResolver.bootFixture();
  }, direction);
}

export function readBrowserBundle(): string {
  return readGenerated("rtl-browser");
}
