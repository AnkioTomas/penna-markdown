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

it("detects collapse marker lines", () => {
  const engine = () => createEnhancedEngine();
  expect(isCollapseMarkerLine("... more code")).toBe(true);
  expect(isCollapseMarkerLine("  ...")).toBe(true);
  expect(isCollapseMarkerLine("not marker")).toBe(false);
});
