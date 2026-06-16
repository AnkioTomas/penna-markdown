import { describe, expect, it } from "vitest";
import { createEngine, renderMarkdown } from "../helpers/engine.js";
import { createTransformerWithExtensions } from "@/transformer/extends/extends.js";
import {
  buildEchartsImageSrc,
} from "@/transformer/extends/utils/cherryApi.js";

const ECHARTS_OPTIONS = '{"series":[{"type":"bar"}]}';

describe("extends/code_block", () => {
  const engine = () => createTransformerWithExtensions(["code_block"]);
  const both = () => createTransformerWithExtensions(["cherry_syntax", "code_block"]);
  const base = () => createEngine();

  it("renders header with lang left, title after lang, copy right", () => {
    const md = '```json title="package.json"\n{"name":"plume"}\n```';
    const html = renderMarkdown(engine(), md);
    expect(html).toContain('class="cherry-code-block"');
    expect(html).toContain('data-title="package.json"');
    expect(html).toContain('class="cherry-code-block__header"');
    expect(html).toContain('class="cherry-code-block__meta"');
    expect(html).toContain('class="cherry-code-block__lang">json</span>');
    expect(html).toContain('class="cherry-code-block__title">package.json</span>');
    expect(html).toContain('class="cherry-copy-code-button"');
    expect(html).toContain('data-cherry-code');
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

  it("renders copy button without language label when lang is empty", () => {
    const html = renderMarkdown(engine(), "```\nplain\n```");
    expect(html).toContain('class="cherry-copy-code-button"');
    expect(html).not.toContain("cherry-code-block__lang");
    expect(html).toContain("plain");
  });

  it("parses single-quoted and unquoted title", () => {
    const quoted = renderMarkdown(engine(), "```bash title='run.sh'\necho hi\n```");
    expect(quoted).toContain('data-title="run.sh"');
    expect(quoted).toContain('class="cherry-code-block__title">run.sh</span>');

    const bare = renderMarkdown(engine(), "```bash title=Makefile\nall:\n```");
    expect(bare).toContain('data-title="Makefile"');
  });

  it("falls back to plain GFM code when extension disabled", () => {
    const html = renderMarkdown(base(), "```js\nconst a = 1;\n```");
    expect(html).toBe('<pre><code class="language-js">const a = 1;\n</code></pre>\n');
  });

  it("still renders echarts via cherry_syntax when both enabled", () => {
    const md = "```echarts\n{\"series\":[{\"type\":\"bar\"}]}\n```";
    const html = renderMarkdown(both(), md);
    expect(html).toContain('<div data-type="echarts"');
    expect(html).toContain(buildEchartsImageSrc(ECHARTS_OPTIONS));
    expect(html).not.toContain("cherry-code-block");
  });

  it("still renders mermaid via cherry_syntax when both enabled", () => {
    const md = "```mermaid\nflowchart TD\n    A --> B\n```";
    const html = renderMarkdown(both(), md);
    expect(html).toContain('<figure data-type="mermaid"');
    expect(html).not.toContain("cherry-code-block");
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
    expect(html).toContain('class="line cherry-code-block__line--highlighted" data-line="1"');
    expect(html).toContain('class="line cherry-code-block__line--highlighted" data-line="4"');
    expect(html).toContain('class="line cherry-code-block__line--highlighted" data-line="6"');
    expect(html).toContain('class="line cherry-code-block__line--highlighted" data-line="7"');
    expect(html).toContain('class="line" data-line="2"');
    expect(html).toContain('class="cherry-code-block__lang">js</span>');
  });
});
