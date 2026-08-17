import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MuiDirectionMenu, MuiDirectionPopover, MuiDirectionProvider, MuiDirectionSelect } from "@rtl-resolver/mui";
import { RadixDirectionProvider, RadixDropdownMenuContent, RadixPopoverContent, RadixSelectContent } from "@rtl-resolver/radix";
import { HeadlessListboxOptions, HeadlessMenuItems, HeadlessPopoverPanel, HeadlessUiDirectionProvider } from "@rtl-resolver/headless-ui";
import { EcosystemApp } from "./fixtures/wrappers/EcosystemApp.js";
import { Bdi, Bdo } from "@rtl-resolver/react";

describe("library direction wrappers", () => {
  it("renders MUI, Radix, and Headless UI providers without reversing DOM", () => {
    const child = React.createElement("span", null, "One", React.createElement("b", null, "Two"));
    const mui = renderToStaticMarkup(React.createElement(MuiDirectionProvider, { locale: "ar", children: child }));
    const radix = renderToStaticMarkup(React.createElement(RadixDirectionProvider, { locale: "he", children: child }));
    const headless = renderToStaticMarkup(React.createElement(HeadlessUiDirectionProvider, { locale: "fa", children: child }));
    for (const markup of [mui, radix, headless]) {
      expect(markup).toContain('dir="rtl"');
      expect(markup).toContain('data-rtl-reverse-dom="false"');
      expect(markup.indexOf("One")).toBeLessThan(markup.indexOf("Two"));
    }
  });

  it("keeps overlay/select wrappers in DOM order", () => {
    expect(typeof MuiDirectionMenu).toBe("function");
    expect(typeof MuiDirectionPopover).toBe("function");
    expect(typeof MuiDirectionSelect).toBe("function");
    expect(typeof RadixDropdownMenuContent).toBe("function");
    expect(typeof RadixPopoverContent).toBe("function");
    expect(typeof RadixSelectContent).toBe("function");
    expect(typeof HeadlessMenuItems).toBe("function");
    expect(typeof HeadlessPopoverPanel).toBe("function");
    expect(typeof HeadlessListboxOptions).toBe("function");
    expect(typeof RadixDirectionProvider).toBe("function");
    expect(typeof HeadlessUiDirectionProvider).toBe("function");
  });

  it("renders a fixture that mounts all three component-library peers", () => {
    const markup = renderToStaticMarkup(React.createElement(EcosystemApp));
    expect(markup.match(/dir="rtl"/g)?.length).toBeGreaterThanOrEqual(3);
    expect(markup).toContain("MUI direction fixture");
    expect(markup).toContain("Radix closed menu");
    expect(markup).toContain("Headless closed listbox");
  });

  it("renders escaping-safe semantic bdi and bdo elements", () => {
    const markup = renderToStaticMarkup(
      React.createElement("p", null,
        React.createElement(Bdi, null, "<script>שלום</script>"),
        React.createElement(Bdo, { direction: "rtl" }, "abc"),
      ),
    );
    expect(markup).toContain('<bdi dir="auto">&lt;script&gt;שלום&lt;/script&gt;</bdi>');
    expect(markup).toContain('<bdo dir="rtl">abc</bdo>');
    expect(markup).not.toContain("<script>");
  });
});
