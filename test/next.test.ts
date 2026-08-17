import { describe, expect, it } from "vitest";
import { createNextDirectionResolver, resolveNextDirection } from "@rtl-resolver/next";

describe("Next.js App Router direction adapter", () => {
  it("supports promised Next 16 route params", async () => {
    await expect(resolveNextDirection({ params: Promise.resolve({ lang: "ar-EG" }) })).resolves.toEqual({
      dir: "rtl",
      lang: "ar-EG",
      source: "params",
    });
  });

  it("falls through to an async locale cookie", async () => {
    const cookies = Promise.resolve({
      get: (name: string) => name === "site-locale" ? { value: "he" } : undefined,
    });
    await expect(resolveNextDirection({ cookies, cookieName: "site-locale" })).resolves.toEqual({
      dir: "rtl",
      lang: "he",
      source: "cookie",
    });
  });

  it("uses explicit values before request data and supports configured defaults", async () => {
    const resolve = createNextDirectionResolver({ localeParam: "locale", defaultDirection: "rtl" });
    await expect(resolve({ direction: "ltr", params: { locale: "ar" } })).resolves.toEqual({
      dir: "ltr",
      source: "explicit",
    });
    await expect(resolve()).resolves.toEqual({ dir: "rtl", source: "fallback" });
  });
});
