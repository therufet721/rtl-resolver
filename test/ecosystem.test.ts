import { describe, expect, it } from "vitest";
import { bdiAttributes, bdoAttributes, defineRTLConfig, detectDirection, detectScript, directionFromLocale, getDirection, isLTR, isRTL, isolateIfNeeded, needsIsolation, resolveAutoDirection, resolveContextDirection, resolveDirectionDetailed } from "@rtl-resolver/core";
import { attachPointerSwipe, createSwipeRecognizer, getLogicalArrowKey, getLogicalNavigationAction, getLogicalPageDelta, getNextDirection, isNextSwipe, logicalPagingState, nextRovingIndex, resolveArrowNavigation, getLogicalSwipeDirection, nextLogicalPage, normalizePointerDelta, previousLogicalPage, scrollByLogical } from "@rtl-resolver/browser";
import { analyzeCss, analyzeSource, extractCssTaggedTemplates, migrateCss } from "@rtl-resolver/css";
import { iconAttributes, iconPolicy, requiresIconPolicy, shouldMirrorIcon } from "@rtl-resolver/icons";
import { framerFade, framerSlide, isDirectionNeutralAnimation, logicalFade, logicalKeyframes, logicalTransition, logicalTranslateX } from "@rtl-resolver/motion";
import { analyzeFontCoverage, analyzeShapingRequirements, detectScript as detectFontScript } from "@rtl-resolver/fonts";
import { accessibleTableModel, FOCUS_FIXTURES, focusSequence, floatingUiPlacement, formControlAttributes, headlessUiDirectionProps, mixedAccessibleName, muiDialogProps, muiEmotionCacheOptions, muiThemeOptions, overlayPlacementOrder, physicalPlacement, radixDirectionProps, resolveFormDirection, resolveInputDirection, SEARCH_FIXTURES, semanticColumnOrder, shouldReverseDomOrder, sliderKeys, stickyColumnModel, stickyColumnStyle, tableDirectionModel, tabIndexList, visualColumnOrder } from "@rtl-resolver/adapters";
import { assertPageDirection, browserDirectionTest, createDirectionDecorator, createStorybookGlobalDecorator, directionMatrix, directionTest, expectedDocumentAttributes, rtlTest, SCRIPT_FIXTURES, screenshotId, visualRegressionMatrix } from "@rtl-resolver/testing";
import { DirectionProvider, DirectionStoryDecorator, getDirectionAttributes, parsePersistedDirection } from "@rtl-resolver/react";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

describe("workspace package contracts", () => {
  function arabicCmapFont(): Uint8Array {
    const bytes = new Uint8Array(80);
    const view = new DataView(bytes.buffer);
    view.setUint16(4, 1);
    bytes.set([0x63, 0x6d, 0x61, 0x70], 12);
    view.setUint32(20, 28);
    view.setUint32(24, 52);
    view.setUint16(28, 0);
    view.setUint16(30, 1);
    view.setUint16(32, 3);
    view.setUint16(34, 10);
    view.setUint32(36, 12);
    view.setUint16(40, 12);
    view.setUint32(44, 28);
    view.setUint32(52, 1);
    view.setUint32(56, 0x600);
    view.setUint32(60, 0x6ff);
    return bytes;
  }

  it("shares direction and configuration semantics", () => {
    expect(directionFromLocale("ar-SA")).toBe("rtl");
    expect(defineRTLConfig({ locales: { ar: "rtl" } }).locales?.ar).toBe("rtl");
    expect(getDirection("fa-IR")).toBe("rtl");
    expect(isRTL("he")).toBe(true);
    expect(isLTR("en")).toBe(true);
    expect(detectDirection("שלום")).toBe("rtl");
    expect(detectScript("العربية")).toBe("arabic");
    expect(detectScript("فارسی")).toBe("persian");
    expect(detectScript("ٹیسٹ")).toBe("urdu");
    expect(resolveDirectionDetailed({ text: "שלום", locale: "en" })).toMatchObject({ direction: "rtl", source: "text", confidence: "high" });
    expect(resolveDirectionDetailed({ locale: "ar" })).toMatchObject({ direction: "rtl", source: "locale", confidence: "medium" });
    expect(resolveContextDirection({ context: "ui", locale: "ar" })).toMatchObject({ direction: "rtl", source: "locale" });
    expect(resolveContextDirection({ context: "content", text: "hello", locale: "ar" })).toMatchObject({ direction: "ltr", source: "text" });
    expect(detectScript("\uFB50")).toBe("arabic");
    expect(detectScript("\uFB1D")).toBe("hebrew");
    expect(detectScript("hello مرحبا")).toBe("arabic");
    expect(needsIsolation("John Smith", "rtl")).toBe(true);
    expect(isolateIfNeeded("مرحبا", "rtl")).toBe("مرحبا");
    expect(resolveAutoDirection("עברית")).toBe("rtl");
    expect(bdiAttributes()).toEqual({ dir: "auto" });
    expect(bdoAttributes("rtl")).toEqual({ dir: "rtl" });
  });

  it("normalizes browser interaction direction", () => {
    expect(getLogicalArrowKey("ArrowRight", "ltr")).toBe("next");
    expect(getLogicalArrowKey("ArrowRight", "rtl")).toBe("previous");
    expect(getLogicalSwipeDirection(20, "rtl")).toBe("previous");
    expect(getLogicalNavigationAction("ArrowLeft", "rtl", "horizontal")).toBe("next");
    expect(getLogicalNavigationAction("ArrowUp", "rtl", "vertical")).toBe("up");
    expect(getNextDirection("rtl")).toBe("left");
    expect(getLogicalPageDelta("rtl", 100)).toBe(100);
    expect(isNextSwipe(-30, "rtl")).toBe(true);
    expect(resolveArrowNavigation("ArrowLeft", "rtl", "physical")).toBe("previous");
    expect(nextRovingIndex(0, 3, "next")).toBe(1);
    expect(logicalPagingState(0, 3)).toMatchObject({ atStart: true, nextIndex: 1 });
    expect(normalizePointerDelta(10, 30, "rtl")).toBe(-20);
    const swipes: string[] = [];
    const recognizer = createSwipeRecognizer({ direction: "rtl", threshold: 10, onSwipe: (value) => swipes.push(value) });
    recognizer.start(100);
    expect(recognizer.end(70)).toBe("next");
    expect(swipes).toEqual(["next"]);
    expect(expectedDocumentAttributes("rtl", "ar")).toEqual({ dir: "rtl", lang: "ar" });
    expect(createDirectionDecorator("rtl")(() => "fixture")).toBe("fixture");
    expect(getDirectionAttributes({ locale: "ar-EG" })).toEqual({ dir: "rtl", lang: "ar-EG" });
  });

  it("exposes logical paging primitives without owning a component", () => {
    const element = { clientWidth: 100, scrollWidth: 300, scrollLeft: 0 } as HTMLElement;
    expect(nextLogicalPage(element, "ltr")).toBe(100);
    expect(previousLogicalPage(element, "ltr")).toBe(0);
    expect(scrollByLogical(element, 50, "ltr")).toBe(50);
  });

  it("analyzes safe CSS migrations", () => {
    const source = ".card { margin-left: 1rem; text-align: left; }";
    expect(analyzeCss(source)).toHaveLength(2);
    expect(migrateCss(source).output).toContain("margin-inline-start");
    expect(migrateCss(source).output).toContain("text-align: start");
    expect(analyzeSource(`const style = { marginLeft: 4 };`, "Card.tsx")[0].replacement).toBe("margin-inline-start");
    expect(analyzeSource(`<div dir="ltr" onKeyDown={ArrowRight} />`, "Card.tsx")).toHaveLength(2);
    expect(analyzeSource(".card { right: 0; }", "Card.css")).toHaveLength(1);
    expect(analyzeCss(".card { float: right; background: linear-gradient(to left, red, blue); }")).toHaveLength(2);
    expect(analyzeCss(".card { right: 0; }")[0].kind).toBe("manual-review");
    expect(migrateCss(".card { left: 20px; }").changed).toBe(0);
    expect(extractCssTaggedTemplates("const Box = styled.div`margin-left: 1rem;`")).toHaveLength(1);
    expect(analyzeSource("const Box = styled.div`margin-left: 1rem;`", "Box.tsx").some((finding) => finding.property === "margin-left")).toBe(true);
  });

  it("keeps icon, motion, font, adapter, and matrix APIs directional", () => {
    expect(shouldMirrorIcon("arrow-forward", "rtl")).toBe(true);
    expect(iconAttributes("arrow-forward", "rtl").style?.transform).toBe("scaleX(-1)");
    expect(logicalTranslateX("start", 10, "rtl")).toBe("translateX(-10px)");
    expect(logicalTransition("start", "rtl", { reducedMotion: true }).transition).toBe("none");
    expect(logicalKeyframes("start", "rtl").keyframes[0].transform).toBe("translateX(-100px)");
    expect(iconPolicy("refresh")).toBe("neverMirrors");
    expect(requiresIconPolicy({ name: "custom", directional: true })).toBe(true);
    expect(detectFontScript("שלום")).toBe("hebrew");
    expect(detectFontScript("فارسی")).toBe("persian");
    expect(detectFontScript("\uFB50")).toBe("arabic");
    expect(analyzeFontCoverage(arabicCmapFont())).toMatchObject({ format: "sfnt" });
    expect(analyzeFontCoverage(arabicCmapFont()).scripts).toContain("arabic");
    expect(analyzeFontCoverage(arabicCmapFont()).marks.arabic).toBe("yes");
    expect(shouldMirrorIcon("logo", "rtl")).toBe(false);
    expect(isDirectionNeutralAnimation("fade")).toBe(true);
    expect(logicalFade().to.opacity).toBe(1);
    expect(framerSlide("start", "rtl").initial.x).toBe(-24);
    expect(framerFade().animate.opacity).toBe(1);
    expect(focusSequence(["a", "b"], "rtl")).toEqual(["a", "b"]);
    expect(tabIndexList(1, 3)).toEqual([-1, 0, -1]);
    expect(stickyColumnStyle("start", 8).insetInlineStart).toBe("8px");
    expect(accessibleTableModel(["name", "age"], "rtl").headers).toEqual(["name", "age"]);
    expect(overlayPlacementOrder("start", "rtl")[0]).toBe("right");
    expect(sliderKeys("rtl").increase).toBe("ArrowLeft");
    expect(FOCUS_FIXTURES.dialog.reverseDom).toBe(false);
    expect(attachPointerSwipe).toEqual(expect.any(Function));
    expect(shouldReverseDomOrder().reverse).toBe(false);
    expect(mixedAccessibleName([{ text: "Name", lang: "en" }, { text: "اسم", lang: "ar" }]).isolate).toBe(true);
    expect(stickyColumnModel(4, 1, 1).reverseDom).toBe(false);
    expect(formControlAttributes("rtl", "a@b.com", "email").autoComplete).toBe("email");
    expect(SEARCH_FIXTURES.arabicQuery).toContain("م");
    expect(physicalPlacement("start", "rtl")).toBe("right");
    expect(directionMatrix()).toHaveLength(3);
    expect(resolveInputDirection("rtl", "hello")).toBe("ltr");
    expect(resolveInputDirection("ltr", "مرحبا")).toBe("rtl");
    expect(semanticColumnOrder(["a", "b"])).toEqual(["a", "b"]);
    expect(visualColumnOrder(["a", "b"], "rtl")).toEqual(["b", "a"]);
    expect(resolveFormDirection("rtl", "hello", "email").direction).toBe("ltr");
    expect(tableDirectionModel(3, "rtl").domOrder).toEqual([0, 1, 2]);
    expect(tableDirectionModel(3, "rtl").visualOrder).toEqual([2, 1, 0]);
    expect(muiThemeOptions("rtl")).toEqual({ direction: "rtl" });
    expect(muiEmotionCacheOptions("rtl").stylisPlugins).toEqual(["stylis-plugin-rtl"]);
    expect(radixDirectionProps("rtl")).toEqual({ dir: "rtl" });
    expect(headlessUiDirectionProps("ltr")).toEqual({ dir: "ltr" });
    expect(floatingUiPlacement("start", "rtl")).toBe("right");
    expect(muiDialogProps("rtl").PaperProps.dir).toBe("rtl");
    expect(analyzeShapingRequirements("فارسی").joining).toBe(true);
    expect(analyzeFontCoverage(arabicCmapFont()).shaping).toBe("cmap-only");
  });

  it("runs reusable direction matrices and page assertions", async () => {
    expect((await directionTest(({ direction }) => direction))).toEqual(["ltr", "rtl", "auto"]);
    expect((await rtlTest(({ name }) => name))).toEqual(["rtl"]);
    expect((await browserDirectionTest(({ name }) => name, [{ name: "mobile-rtl", direction: "rtl", mobile: true }]))).toEqual(["mobile-rtl"]);
    expect(visualRegressionMatrix({ tablet: true })).toHaveLength(6);
    expect(screenshotId("Card", visualRegressionMatrix()[1])).toBe("Card.desktop-rtl.png");
    expect(SCRIPT_FIXTURES.persian).toContain("س");
    expect(createStorybookGlobalDecorator()(() => "story", { globals: { direction: "rtl" } })).toBe("story");
    const page = { evaluate: async <T,>(callback: () => T) => callback() };
    await assertPageDirection(page, "rtl").catch((error: Error) => expect(error.message).toContain("received empty"));
  });

  it("renders the React provider with SSR-safe direction attributes", () => {
    const markup = renderToStaticMarkup(React.createElement(
      DirectionProvider,
      { locale: "ar-EG", children: React.createElement("span", null, "مرحبا") },
    ));
    expect(markup).toContain('dir="rtl"');
    expect(markup).toContain('lang="ar-EG"');
    const nested = renderToStaticMarkup(React.createElement(
      DirectionProvider,
      { locale: "en", children: React.createElement(DirectionProvider, { locale: "ar", children: "inner" }) },
    ));
    expect(nested).toContain('dir="ltr"');
    expect(nested).toContain('dir="rtl"');
    expect(parsePersistedDirection(JSON.stringify({ locale: "he", direction: "rtl" }))).toEqual({ locale: "he", direction: "rtl" });
    expect(parsePersistedDirection("not-json")).toBeNull();
    const story = renderToStaticMarkup(DirectionStoryDecorator(
      () => React.createElement("span", null, "story"),
      { globals: { direction: "rtl" } },
    ) as React.ReactElement);
    expect(story).toContain('dir="rtl"');
  });
});
