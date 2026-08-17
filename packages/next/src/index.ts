import { directionFromLocale, type Direction } from "@rtl-resolver/core";

export type NextRouteParams = Record<string, string | readonly string[] | undefined>;

export interface NextCookieStore {
  get(name: string): { value: string } | undefined;
}

export interface NextDirectionOptions {
  /** Highest-precedence locale, typically supplied by application configuration. */
  locale?: string;
  /** Next 15/16 App Router params may be a promise. */
  params?: NextRouteParams | PromiseLike<NextRouteParams>;
  localeParam?: string;
  /** Pass `cookies()` from `next/headers`; async stores are supported. */
  cookies?: NextCookieStore | PromiseLike<NextCookieStore>;
  cookieName?: string;
  direction?: Direction;
  defaultDirection?: Direction;
}

export interface NextDirectionResult {
  dir: Direction;
  lang?: string;
  source: "explicit" | "locale" | "params" | "cookie" | "fallback";
}

function first(value: string | readonly string[] | undefined): string | undefined {
  return typeof value === "string" || value === undefined ? value : value[0];
}

/**
 * Resolve attributes for a Next.js App Router root layout. The helper accepts
 * async params/cookies without importing `next/headers`, keeping it usable in
 * static layouts and straightforward to unit test.
 */
export async function resolveNextDirection(options: NextDirectionOptions = {}): Promise<NextDirectionResult> {
  if (options.direction) {
    return { dir: options.direction, ...(options.locale ? { lang: options.locale } : {}), source: "explicit" };
  }

  if (options.locale) {
    return { dir: directionFromLocale(options.locale, options.defaultDirection), lang: options.locale, source: "locale" };
  }

  if (options.params) {
    const params = await options.params;
    const locale = first(params[options.localeParam ?? "lang"]);
    if (locale) return { dir: directionFromLocale(locale, options.defaultDirection), lang: locale, source: "params" };
  }

  if (options.cookies) {
    const store = await options.cookies;
    const locale = store.get(options.cookieName ?? "locale")?.value;
    if (locale) return { dir: directionFromLocale(locale, options.defaultDirection), lang: locale, source: "cookie" };
  }

  return { dir: options.defaultDirection ?? "ltr", source: "fallback" };
}

export function createNextDirectionResolver(defaults: NextDirectionOptions = {}) {
  return (options: NextDirectionOptions = {}) => resolveNextDirection({ ...defaults, ...options });
}
