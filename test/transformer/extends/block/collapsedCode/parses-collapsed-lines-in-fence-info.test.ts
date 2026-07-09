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

it("parses :collapsed-lines in fence info", () => {
  const engine = () => createEnhancedEngine();
  const meta = parseFenceMeta("```css :collapsed-lines");
  expect(meta?.lang).toBe("css");
  expect(meta?.collapsedLines).toBe(true);
});
