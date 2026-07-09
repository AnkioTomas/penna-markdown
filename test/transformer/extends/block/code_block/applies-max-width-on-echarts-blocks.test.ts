import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";
import { buildEchartsImageSrc } from "@/transformer/extends/block/specialCode.js";

const ECHARTS_OPTIONS = '{"series":[{"type":"bar"}]}';

it("applies max-width on echarts blocks", () => {
  const engine = () => createEnhancedEngine();
  const md = '```echarts max-width=50%\n{"series":[{"type":"bar"}]}\n```';
  const html = renderMarkdown(createEnhancedEngine(), md);
  expect(html).toContain('style="max-width:50%"');
});
