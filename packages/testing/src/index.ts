import type { Direction, DirectionPreference } from "@rtl-resolver/core";
export {
  assistiveTechnologyReady,
  hostAssistiveTechnology,
  requestedAssistiveTechnology,
  type AssistiveTechnology,
} from "./at.js";
export interface DirectionCase { name: string; direction: DirectionPreference; }
export const DEFAULT_DIRECTION_MATRIX: readonly DirectionCase[] = [
  { name: "ltr", direction: "ltr" }, { name: "rtl", direction: "rtl" }, { name: "auto", direction: "auto" },
];
export function directionMatrix(extra: readonly DirectionCase[] = []): DirectionCase[] {
  return [...DEFAULT_DIRECTION_MATRIX, ...extra];
}
export function withDirection<T>(direction: Direction, fn: () => T): T {
  if (typeof document !== "undefined") document.documentElement.dir = direction;
  return fn();
}

export interface DirectionFixtureOptions {
  /** Apply the direction to the document while the fixture callback runs. */
  direction?: Direction;
  /** Optional language to apply alongside the direction. */
  lang?: string;
}

/** Run a callback against a deterministic document direction fixture. */
export function withDirectionFixture<T>(options: DirectionFixtureOptions, fn: () => T): T {
  if (typeof document === "undefined") return fn();
  const root = document.documentElement;
  const previousDir = root.dir;
  const previousLang = root.lang;
  if (options.direction) root.dir = options.direction;
  if (options.lang !== undefined) root.lang = options.lang;
  try {
    return fn();
  } finally {
    root.dir = previousDir;
    root.lang = previousLang;
  }
}

/** Async equivalent that restores the fixture after the promise settles. */
export async function withDirectionFixtureAsync<T>(options: DirectionFixtureOptions, fn: () => T | Promise<T>): Promise<T> {
  if (typeof document === "undefined") return fn();
  const root = document.documentElement;
  const previousDir = root.dir;
  const previousLang = root.lang;
  if (options.direction) root.dir = options.direction;
  if (options.lang !== undefined) root.lang = options.lang;
  try {
    return await fn();
  } finally {
    root.dir = previousDir;
    root.lang = previousLang;
  }
}

export type DirectionCaseRunner<T> = (testCase: DirectionCase) => T | Promise<T>;

/** Run one test body for every direction case without importing a test runner. */
export async function directionTest<T>(runner: DirectionCaseRunner<T>, cases: readonly DirectionCase[] = directionMatrix()): Promise<T[]> {
  const results: T[] = [];
  for (const testCase of cases) results.push(await runner(testCase));
  return results;
}

export function rtlTest<T>(runner: DirectionCaseRunner<T>): Promise<T[]> {
  return directionTest(runner, [{ name: "rtl", direction: "rtl" }]);
}

export function ltrTest<T>(runner: DirectionCaseRunner<T>): Promise<T[]> {
  return directionTest(runner, [{ name: "ltr", direction: "ltr" }]);
}

/** Playwright-friendly assertion helper without importing Playwright. */
export function expectedDocumentAttributes(direction: Direction, lang?: string): Record<string, string> {
  return lang === undefined ? { dir: direction } : { dir: direction, lang };
}

/** Storybook-compatible decorator factory without a Storybook dependency. */
export function createDirectionDecorator(direction: Direction) {
  return function directionDecorator(Story: () => unknown): unknown {
    return withDirectionFixture({ direction }, Story);
  };
}

export interface DirectionPageLike {
  evaluate<T>(callback: () => T): Promise<T>;
}

/** Playwright-compatible assertion helper without importing Playwright. */
export async function readPageDirection(page: DirectionPageLike): Promise<Direction | ""> {
  return page.evaluate(() => (typeof document === "undefined" ? "" : document.documentElement.dir as Direction));
}

export async function assertPageDirection(page: DirectionPageLike, expected: Direction): Promise<void> {
  const actual = await readPageDirection(page);
  if (actual !== expected) throw new Error(`Expected document direction ${expected}, received ${actual || "empty"}`);
}

export interface BrowserDirectionCase extends DirectionCase {
  viewport?: { width: number; height: number };
  mobile?: boolean;
}

export const DEFAULT_BROWSER_MATRIX: readonly BrowserDirectionCase[] = [
  { name: "desktop-ltr", direction: "ltr", viewport: { width: 1280, height: 800 } },
  { name: "desktop-rtl", direction: "rtl", viewport: { width: 1280, height: 800 } },
  { name: "mobile-ltr", direction: "ltr", viewport: { width: 390, height: 844 }, mobile: true },
  { name: "mobile-rtl", direction: "rtl", viewport: { width: 390, height: 844 }, mobile: true },
];

/** Run browser cases through a caller-provided Playwright/page factory. */
export async function browserDirectionTest<T>(
  runner: (testCase: BrowserDirectionCase) => T | Promise<T>,
  cases: readonly BrowserDirectionCase[] = DEFAULT_BROWSER_MATRIX,
): Promise<T[]> {
  const results: T[] = [];
  for (const testCase of cases) results.push(await runner(testCase));
  return results;
}

export const SCRIPT_FIXTURES = {
  arabic: "مرحبا بالعالم",
  hebrew: "שלום עולם",
  persian: "سلام دنیا",
  urdu: "ہیلو دنیا",
} as const;

export function visualRegressionMatrix(options: { tablet?: boolean } = {}): BrowserDirectionCase[] {
  const cases = [...DEFAULT_BROWSER_MATRIX];
  if (options.tablet) {
    cases.push(
      { name: "tablet-ltr", direction: "ltr", viewport: { width: 768, height: 1024 } },
      { name: "tablet-rtl", direction: "rtl", viewport: { width: 768, height: 1024 } },
    );
  }
  return cases;
}

export function screenshotId(component: string, testCase: BrowserDirectionCase): string {
  return `${component}.${testCase.name}.png`;
}

export const storybookDirectionToolbar = {
  direction: {
    description: "Reading direction",
    defaultValue: "ltr",
    toolbar: { items: ["ltr", "rtl", "auto"], title: "Direction" },
  },
} as const;

export function createStorybookGlobalDecorator() {
  return function directionDecorator(Story: () => unknown, context?: { globals?: { direction?: Direction } }): unknown {
    const direction = context?.globals?.direction ?? "ltr";
    return withDirectionFixture({ direction }, Story);
  };
}
