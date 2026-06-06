import { describe, expect, it } from "vitest";
import { createTransformer } from "../../src/transformer/index.js";

describe("inline/images", () => {
  const transformer = createTransformer();

  it("Example 581: shortcut reference image with emphasis in alt", () => {
    const markdown = '![foo *bar*]\n\n[foo *bar*]: train.jpg "train & tracks"\n';
    const { html } = transformer.render(markdown);
    expect(html).toBe(
      '<p><img src="train.jpg" alt="foo bar" title="train &amp; tracks" /></p>\n',
    );
  });

  it("Example 582: nested image in alt text", () => {
    const markdown = "![foo ![bar](/url)](/url2)\n";
    const { html } = transformer.render(markdown);
    expect(html).toBe('<p><img src="/url2" alt="foo bar" /></p>\n');
  });

  it("Example 583: nested link in alt text", () => {
    const markdown = "![foo [bar](/url)](/url2)\n";
    const { html } = transformer.render(markdown);
    expect(html).toBe('<p><img src="/url2" alt="foo bar" /></p>\n');
  });

  it("Example 584: collapsed reference image", () => {
    const markdown = '![foo *bar*][]\n\n[foo *bar*]: train.jpg "train & tracks"\n';
    const { html } = transformer.render(markdown);
    expect(html).toBe(
      '<p><img src="train.jpg" alt="foo bar" title="train &amp; tracks" /></p>\n',
    );
  });

  it("Example 585: full reference image with case-insensitive label", () => {
    const markdown = '![foo *bar*][foobar]\n\n[FOOBAR]: train.jpg "train & tracks"\n';
    const { html } = transformer.render(markdown);
    expect(html).toBe(
      '<p><img src="train.jpg" alt="foo bar" title="train &amp; tracks" /></p>\n',
    );
  });
});
