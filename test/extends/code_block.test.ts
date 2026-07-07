import { describe, expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../helpers/engine.js";
import { buildEchartsImageSrc } from "@/transformer/extends/block/specialCode.js";

const ECHARTS_OPTIONS = '{"series":[{"type":"bar"}]}';

describe("extends/code_block", () => {
  const engine = () => createEnhancedEngine();

  it("renders header with lang left, title after lang, copy right", () => {
    const md = '```json title="package.json"\n{"name":"plume"}\n```';
    const html = renderMarkdown(engine(), md);
    expect(html).toContain('class="cherry-code-block"');
    expect(html).toContain('data-title="package.json"');
    expect(html).toContain('class="cherry-code-block__header"');
    expect(html).toContain('class="cherry-code-block__meta"');
    expect(html).toContain('class="cherry-code-block__lang">json</span>');
    expect(html).toContain(
      'class="cherry-code-block__title">package.json</span>',
    );
    expect(html).toContain('class="cherry-copy-code-button"');
    expect(html).toContain("data-cherry-code");
    expect(html).not.toContain("code-block-title-bar");
    expect(html).toContain("{&quot;name&quot;:&quot;plume&quot;}");
  });

  it("renders lang on the left and copy on the right without title", () => {
    const html = renderMarkdown(engine(), "```js\nconst a = 1;\n```");
    expect(html).toContain('class="cherry-code-block__lang">js</span>');
    expect(html).not.toContain("cherry-code-block__title");
    expect(html).toContain('class="cherry-copy-code-button"');
    expect(html).toContain("const a = 1;");
  });

  it("falls back to plain GFM code when lang is empty", () => {
    const html = renderMarkdown(engine(), "```\nplain\n```");
    expect(html).toBe("<pre><code>plain\n</code></pre>\n");
    expect(html).not.toContain("cherry-code-block");
  });

  it("parses single-quoted and unquoted title", () => {
    const quoted = renderMarkdown(
      engine(),
      "```bash title='run.sh'\necho hi\n```",
    );
    expect(quoted).toContain('data-title="run.sh"');
    expect(quoted).toContain('class="cherry-code-block__title">run.sh</span>');

    const bare = renderMarkdown(engine(), "```bash title=Makefile\nall:\n```");
    expect(bare).toContain('data-title="Makefile"');
  });

  it("still renders echarts via specialCode when enhanced code enabled", () => {
    const md = '```echarts\n{"series":[{"type":"bar"}]}\n```';
    const html = renderMarkdown(engine(), md);
    expect(html).toContain('<div data-type="echarts"');
    expect(html).toContain(buildEchartsImageSrc(ECHARTS_OPTIONS));
    expect(html).not.toContain("cherry-code-block");
  });

  it("still renders mermaid via specialCode when enhanced code enabled", () => {
    const md = "```mermaid\nflowchart TD\n    A --> B\n```";
    const html = renderMarkdown(engine(), md);
    expect(html).toContain('<figure data-type="mermaid"');
    expect(html).not.toContain("cherry-code-block");
  });

  it("ignores max-width on enhanced code blocks", () => {
    const html = renderMarkdown(
      engine(),
      "```js max-width=720\nconst a = 1;\n```",
    );
    expect(html).toContain('class="cherry-code-block"');
    expect(html).not.toContain('style="max-width:720px"');
  });

  it("applies max-width on mermaid blocks", () => {
    const md = "```mermaid max-width=640\nflowchart TD\n    A --> B\n```";
    const html = renderMarkdown(engine(), md);
    expect(html).toContain('style="max-width:640px"');
  });

  it("applies max-width on echarts blocks", () => {
    const md = '```echarts max-width=50%\n{"series":[{"type":"bar"}]}\n```';
    const html = renderMarkdown(engine(), md);
    expect(html).toContain('style="max-width:50%"');
  });

  it("applies max-width on graph blocks", () => {
    const md = "```graph max-width=720\nflowchart LR\n  A --> B\n```";
    const html = renderMarkdown(engine(), md);
    expect(html).toContain('style="max-width:720px"');
  });

  it("renders line highlights for js{1,4,6-8}", () => {
    const md = [
      "```js{1,4,6-8}",
      "export default {",
      "  data () {",
      "    return {",
      "      msg: 'hi',",
      "    }",
      "  }",
      "}",
      "```",
    ].join("\n");
    const html = renderMarkdown(engine(), md);
    expect(html).toContain('data-cherry-highlight-lines="1,4,6,7,8"');
    expect(html).toContain('class="cherry-code-block__body"');
    expect(html).toContain('class="cherry-code-block__gutter"');
    expect(html).toContain("--cherry-line-count:");
    expect(html).toContain("--cherry-line-highlight-bg:linear-gradient");
    expect(html).toContain("export default {");
    expect(html).toContain('class="cherry-code-block__lang">js</span>');
  });

  it("falls back to plain GFM code when enhancedCode is disabled", () => {
    const html = renderMarkdown(createEngine(), "```js\nconst a = 1;\n```");
    expect(html).toContain('<pre><code class="language-js">');
    expect(html).not.toContain("cherry-code-block");
  });
});
