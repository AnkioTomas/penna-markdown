import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";
import { buildEchartsImageSrc } from "@/transformer/extends/block/specialCode.js";

const ECHARTS_OPTIONS = '{"series":[{"type":"bar"}]}';

it("renders header with lang left, title after lang, copy right", () => {
  const engine = () => createEnhancedEngine();
  const md = '```json title="package.json"\n{"name":"plume"}\n```';
  const html = renderMarkdown(createEnhancedEngine(), md);
  expect(html).toContain('class="penna-code-block"');
  expect(html).toContain('data-title="package.json"');
  expect(html).toContain('class="penna-code-block__header"');
  expect(html).toContain('class="penna-code-block__meta"');
  expect(html).toContain('class="penna-code-block__lang">json</span>');
  expect(html).toContain('class="penna-code-block__title">package.json</span>');
  expect(html).toContain('class="penna-copy-code-button"');
  expect(html).toContain("data-penna-code");
  expect(html).not.toContain("code-block-title-bar");
  expect(html).toContain("{&quot;name&quot;:&quot;plume&quot;}");
});
