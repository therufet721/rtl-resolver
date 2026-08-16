import { describe, expect, it } from "vitest";
import {
  directionFromLocale, directionFromText, inlineSides, isolate,
  languageOf, resolveDirection
} from "../src/index.js";

describe("locale direction", () => {
  it("normalizes locales", () => expect(languageOf(" AR_EG ")).toBe("ar"));
  it("recognizes RTL locales", () => {
    expect(directionFromLocale("ar-EG")).toBe("rtl");
    expect(directionFromLocale("he-IL")).toBe("rtl");
    expect(directionFromLocale("en-US")).toBe("ltr");
  });
});

describe("text direction", () => {
  it("uses the first strong character", () => {
    expect(directionFromText("123 مرحبا hello")).toBe("rtl");
    expect(directionFromText("123 hello مرحبا")).toBe("ltr");
  });
  it("uses fallback for neutral text", () => expect(directionFromText("123!", "rtl")).toBe("rtl"));
});

describe("resolution", () => {
  it("honors explicit direction", () => expect(resolveDirection({ direction: "rtl", text: "hello" })).toBe("rtl"));
  it("prefers text over locale in auto mode", () => expect(resolveDirection({ text: "hello", locale: "ar" })).toBe("ltr"));
  it("falls back to locale for neutral text", () => expect(resolveDirection({ text: "123", locale: "ar" })).toBe("rtl"));
});

describe("helpers", () => {
  it("resolves logical sides", () => expect(inlineSides("rtl")).toEqual({ start: "right", end: "left" }));
  it("adds bidi isolation controls", () => expect(isolate("مرحبا", "rtl")).toBe("\u2067مرحبا\u2069"));
});
