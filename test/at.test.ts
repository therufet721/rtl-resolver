import { describe, expect, it } from "vitest";
import { assistiveTechnologyReady, hostAssistiveTechnology, requestedAssistiveTechnology } from "@rtl-resolver/testing";

describe("assistive technology detection", () => {
  it("does not claim NVDA or VoiceOver on Linux", () => {
    if (process.platform === "linux") {
      expect(hostAssistiveTechnology()).toBeUndefined();
      expect(assistiveTechnologyReady("voiceover").ready).toBe(false);
      expect(assistiveTechnologyReady("nvda").ready).toBe(false);
    }
  });

  it("requires RTL_AT before reporting a reader as ready", () => {
    const previous = process.env.RTL_AT;
    delete process.env.RTL_AT;
    expect(requestedAssistiveTechnology()).toBeUndefined();
    const voiceOver = assistiveTechnologyReady("voiceover");
    const nvda = assistiveTechnologyReady("nvda");
    expect(voiceOver.ready).toBe(false);
    expect(nvda.ready).toBe(false);
    if (process.platform === "darwin") expect(voiceOver.reason).toMatch(/RTL_AT/);
    else expect(voiceOver.reason).toMatch(/macOS/);
    if (process.platform === "win32") expect(nvda.reason).toMatch(/RTL_AT/);
    else expect(nvda.reason).toMatch(/Windows/);
    if (previous === undefined) delete process.env.RTL_AT;
    else process.env.RTL_AT = previous;
  });
});
