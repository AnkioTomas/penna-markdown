import { expect, it } from "vitest";
import { TransformerEngine } from "@/transformer/TransformerEngine";
import {
  SOURCE_END_LINE_ATTR,
  SOURCE_LINE_ATTR,
} from "@/transformer/utils/sourceLine.js";

it("does not tag when sourceLineMap is disabled", () => {
  const engine = new TransformerEngine();
  const html = engine.render(engine.parse("# Hello\n"));
  expect(html).not.toContain(SOURCE_LINE_ATTR);
});
