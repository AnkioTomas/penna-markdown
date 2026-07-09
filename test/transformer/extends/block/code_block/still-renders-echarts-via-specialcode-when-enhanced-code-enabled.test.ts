import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";
import { buildEchartsImageSrc } from "@/transformer/extends/block/specialCode.js";

const ECHARTS_OPTIONS = '{"series":[{"type":"bar"}]}';

it("still renders echarts via specialCode when enhanced code enabled", () => {
  const engine = () => createEnhancedEngine();
  const md = '```echarts\n{"series":[{"type":"bar"}]}\n```';
  const html = renderMarkdown(createEnhancedEngine(), md);
  expect(html).toContain('<div data-type="echarts"');
  expect(html).toContain(buildEchartsImageSrc(ECHARTS_OPTIONS));
  expect(html).not.toContain("cherry-code-block");
});
