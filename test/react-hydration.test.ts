/** @vitest-environment jsdom */
import { afterEach, describe, expect, it } from "vitest";
import React, { act } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { DirectionProvider } from "@rtl-resolver/react";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("React jsdom hydration", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    window.localStorage.clear();
  });

  it("hydrates SSR direction markup without changing dir or lang", async () => {
    const element = React.createElement(
      DirectionProvider,
      { locale: "ar-EG", children: React.createElement("span", { id: "label" }, "مرحبا") },
    );
    const html = renderToString(element);
    document.body.innerHTML = `<div id="root">${html}</div>`;
    const root = document.getElementById("root");
    if (!root) throw new Error("missing root");
    expect(root.querySelector("[dir='rtl']")).not.toBeNull();
    expect(root.querySelector("[lang='ar-EG']")).not.toBeNull();
    await act(async () => {
      hydrateRoot(root, element);
    });
    expect(root.querySelector("[dir='rtl']")).not.toBeNull();
    expect(root.querySelector("[lang='ar-EG']")).not.toBeNull();
    expect(document.getElementById("label")?.textContent).toBe("مرحبا");
  });

  it("keeps persisted locale off the SSR markup and applies it after mount", async () => {
    window.localStorage.setItem("rtl-dir", JSON.stringify({ locale: "he", direction: "rtl" }));
    const element = React.createElement(
      DirectionProvider,
      { persistKey: "rtl-dir", defaultDirection: "ltr", children: "x" },
    );
    const html = renderToString(element);
    expect(html).toContain('dir="ltr"');
    expect(html).not.toContain('dir="rtl"');
    document.body.innerHTML = `<div id="root">${html}</div>`;
    const root = document.getElementById("root");
    if (!root) throw new Error("missing root");
    await act(async () => {
      hydrateRoot(root, element);
    });
    expect(root.querySelector("[dir='rtl']")).not.toBeNull();
  });
});
