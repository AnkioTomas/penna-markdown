import { describe, expect, it } from "vitest";
import { createEngine } from "../helpers/engine.js";

describe("block/heading", () => {
  it("Example 40: ATX heading not interrupting paragraph due to indentation", () => {
    const input = "foo\n    # bar";
    const { html } = createEngine().render(input);
    expect(html).toBe("<p>foo\n# bar</p>\n");
  });
});
