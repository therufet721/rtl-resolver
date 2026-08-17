import { describe, expect, it } from "vitest";
import { decodeCodePoints } from "../../packages/core/src/bidi/codepoints.js";
import { resolveParagraphs } from "../../packages/core/src/bidi/paragraphs.js";
import { resolveExplicit } from "../../packages/core/src/bidi/explicit.js";
import { buildActiveLinks } from "../../packages/core/src/bidi/active.js";

describe("active position links", () => {
  it("links around X9-removed formatting positions in one linear pass", () => {
    const paragraph = resolveParagraphs(decodeCodePoints("a\u202Bb\u202Cc"))[0];
    const state = resolveExplicit(paragraph);
    const links = buildActiveLinks(state);

    expect([...links.indices]).toEqual([0, 2, 4]);
    expect(links.next[0]).toBe(2);
    expect(links.previous[4]).toBe(2);
    expect(links.next[4]).toBe(-1);
  });
});
