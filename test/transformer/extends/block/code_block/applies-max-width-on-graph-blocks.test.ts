import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";
import { buildEchartsImageSrc } from "@/transformer/extends/block/specialCode.js";

const ECHARTS_OPTIONS = '{"series":[{"type":"bar"}]}';

it("applies max-width on graph blocks", () => {
  const engine = () => createEnhancedEngine();
  const md = "```graph max-width=720\nflowchart LR\n  A --> B\n```";
  const html = renderMarkdown(createEnhancedEngine(), md);
  expect(html).toContain('style="max-width:720px"');
});
