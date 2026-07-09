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

it("analyzes marker-based collapse", () => {
  const engine = () => createEnhancedEngine();
  const content = ["html {", "}", "", "... more code", "body {}"].join("\n");
  const analysis = analyzeCollapsedCode(content, { enabled: true });
  expect(analysis.hasMore).toBe(true);
  expect(analysis.visibleCount).toBe(3);
  expect(analysis.markerLine).toBe(4);
});
