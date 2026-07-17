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

it("renders collapsible code block with expand button", () => {
  const engine = () => createEnhancedEngine();
  const md = [
    "```css :collapsed-lines",
    "html {",
    "  margin: 0;",
    "}",
    "",
    "... more code",
    "body {",
    "  color: red;",
    "}",
    "```",
  ].join("\n");
  const html = renderMarkdown(createEnhancedEngine(), md);
  expect(html).toContain("penna-code-block__panel--collapsible");
  expect(html).toContain("penna-code-block__panel--collapsed");
  expect(html).toContain('class="penna-code-block__expand"');
  expect(html).toContain('data-penna-collapsed="1"');
  expect(html).toContain('class="penna-code-block__body"');
  expect(html).toContain('class="penna-code-block__gutter"');
  expect(html).toContain("--penna-collapsed-visible:4");
  expect(html).not.toContain("... more code");
  expect(html).toContain("body {");
});
