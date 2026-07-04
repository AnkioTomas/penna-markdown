import { describe, expect, it } from "vitest";
import { TransformerEngine } from "@/transformer/TransformerEngine";
import {
  SOURCE_END_LINE_ATTR,
  SOURCE_LINE_ATTR,
} from "@/transformer/utils/sourceLine.js";

describe("transformer/sourceLineMap", () => {
  it("tags top-level blocks with source line attrs", () => {
    const engine = new TransformerEngine({
      renderOptions: { sourceLineMap: true },
    });
    const html = engine.render(engine.parse("# Hello\n\nWorld\n"));
    expect(html).toContain(`${SOURCE_LINE_ATTR}="0"`);
    expect(html).toContain(`${SOURCE_END_LINE_ATTR}="1"`);
    expect(html).toContain(`${SOURCE_LINE_ATTR}="2"`);
    expect(html).toContain(`${SOURCE_END_LINE_ATTR}="3"`);
  });

  it("does not tag when sourceLineMap is disabled", () => {
    const engine = new TransformerEngine();
    const html = engine.render(engine.parse("# Hello\n"));
    expect(html).not.toContain(SOURCE_LINE_ATTR);
  });
});
