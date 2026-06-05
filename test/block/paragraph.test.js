import { describe, expect, it } from "vitest";
import { createEngine } from "../helpers/engine.js";

describe("block/paragraph", () => {
  it("indented code does NOT interrupt paragraph", () => {
    const input = "foo\n    bar";
    const { html } = createEngine().render(input);
    expect(html).toBe("<p>foo\nbar</p>\n");
  });
});
