import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";
import { buildEchartsImageSrc } from "@/transformer/extends/block/specialCode.js";

const ECHARTS_OPTIONS = '{"series":[{"type":"bar"}]}';

it("still renders mermaid via specialCode when enhanced code enabled", () => {
  const engine = () => createEnhancedEngine();
  const md = "```mermaid\nflowchart TD\n    A --> B\n```";
  const html = renderMarkdown(createEnhancedEngine(), md);
  expect(html).toContain('<figure data-type="mermaid"');
  expect(html).not.toContain("penna-code-block");
});
