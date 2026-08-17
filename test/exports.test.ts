import { describe, expect, it } from "vitest";
import * as core from "@rtl-resolver/core";
import { validateRTLPlugin } from "@rtl-resolver/core/plugin";
import { validateRTLPlugin as validateRootPlugin } from "../src/plugin";
import * as css from "@rtl-resolver/css";
import * as fonts from "@rtl-resolver/fonts";
import * as stylelint from "@rtl-resolver/stylelint";
import * as mui from "@rtl-resolver/mui";
import * as radix from "@rtl-resolver/radix";
import * as headless from "@rtl-resolver/headless-ui";
import * as next from "@rtl-resolver/next";
import * as react from "@rtl-resolver/react";

describe("package exports", () => {
  it("exposes the stable public APIs", () => {
    expect(typeof core.defineRTLConfig).toBe("function");
    expect(typeof validateRTLPlugin).toBe("function");
    expect(typeof validateRootPlugin).toBe("function");
    expect(typeof css.migrateSource).toBe("function");
    expect(typeof fonts.arabicJoiningFont).toBe("function");
    expect(typeof fonts.encodeEmptyTransformedGlyf).toBe("function");
    expect(typeof stylelint.createPlugin).toBe("function");
    expect(typeof mui.MuiDirectionMenu).toBe("function");
    expect(typeof radix.RadixDropdownMenuContent).toBe("function");
    expect(typeof headless.HeadlessMenuItems).toBe("function");
    expect(typeof next.resolveNextDirection).toBe("function");
    expect(typeof react.Bdi).toBe("function");
    expect(typeof react.Bdo).toBe("function");
  });
});
