import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";
import {
  analyzeCollapsedCode,
  isCollapseMarkerLine,
  parseFenceMeta,
} from "@/transformer/extends/block/enhancedCode.js";

it("parses :collapsed-lines=5", () => {
  const engine = () => createEnhancedEngine();
  const meta = parseFenceMeta("```css :collapsed-lines=5");
  expect(meta?.collapsedMaxLines).toBe(5);
});
