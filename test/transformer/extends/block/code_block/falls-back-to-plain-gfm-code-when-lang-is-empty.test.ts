import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";
import { buildEchartsImageSrc } from "@/transformer/extends/block/specialCode.js";

const ECHARTS_OPTIONS = '{"series":[{"type":"bar"}]}';

it("falls back to plain GFM code when lang is empty", () => {
  const engine = () => createEnhancedEngine();
  const html = renderMarkdown(createEngine(), "```\nplain\n```");
  expect(html).toBe("<pre><code>plain\n</code></pre>\n");
  expect(html).not.toContain("penna-code-block");
});
