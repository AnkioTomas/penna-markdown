import { describe, expect, it } from "vitest";
import { createTransformer } from "@/transformer/index.js";
import { createTransformerWithExtensions } from "@/transformer/extends/extends.js";

describe("extends/iframe", () => {
  const engine = () => createTransformerWithExtensions(["iframe"]);

  it("renders !iframe[title](url) as styled embed", () => {
    const { html } = engine().render("!iframe[演示](https://example.com)\n");
    expect(html).toBe(
      '<figure class="cherry-media cherry-iframe"><div class="cherry-iframe__frame"><iframe src="https://example.com" title="演示" loading="lazy" allowfullscreen sandbox="allow-scripts allow-same-origin allow-popups allow-forms"></iframe></div><figcaption class="cherry-media__caption">演示</figcaption></figure>\n',
    );
  });

  it("supports link title attribute", () => {
    const { html } = engine().render(
      '!iframe[演示](https://example.com "页面说明")\n',
    );
    expect(html).toContain('title="页面说明"');
  });

  it("supports query strings in url", () => {
    const { html } = engine().render(
      "!iframe[演示](https://example.com/path?q=1&x=2)\n",
    );
    expect(html).toContain('src="https://example.com/path?q=1&amp;x=2"');
    expect(html).toContain("<iframe");
  });

  it("supports indented iframe line", () => {
    const { html } = engine().render("  !iframe[演示](https://example.com)\n");
    expect(html).toContain('src="https://example.com"');
  });

  it("does not treat inline !iframe as block embed", () => {
    const { html } = engine().render(
      "see !iframe[演示](https://example.com) here\n",
    );
    expect(html).not.toContain("<iframe");
    expect(html).toContain("!iframe");
  });

  it("rejects non-http schemes", () => {
    const { html } = engine().render("!iframe[x](javascript:alert(1))\n");
    expect(html).not.toContain("<iframe");
  });

  it("is disabled without extension", () => {
    const { html } = createTransformer().render(
      "!iframe[演示](https://example.com)\n",
    );
    expect(html).not.toContain("<iframe");
    expect(html).toContain("!iframe");
  });
});
