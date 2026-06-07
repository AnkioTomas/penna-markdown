import { describe, expect, it } from "vitest";
import { createTransformer } from "../../src/transformer/index.js";

describe("inline/emphasis GFM", () => {
  const t = createTransformer();

  const cases = [
    [362, 'a*"foo"*', "<p>a*&quot;foo&quot;*</p>\n"],
    [377, "*(*foo)", "<p>*(*foo)</p>\n"],
    [378, "*(*foo*)*", "<p><em>(<em>foo</em>)</em></p>\n"],
    [385, "_foo_bar_baz_", "<p><em>foo_bar_baz</em></p>\n"],
    [389, 'a**"foo"**', "<p>a**&quot;foo&quot;**</p>\n"],
    [395, "foo__bar__", "<p>foo__bar__</p>\n"],
    [398, "__foo, __bar__, baz__", "<p><strong>foo, bar, baz</strong></p>\n"],
    [426, "foo******bar*********baz", "<p>foo<strong>bar</strong>***baz</p>\n"],
    [434, "__foo __bar__ baz__", "<p><strong>foo bar baz</strong></p>\n"],
    [435, "____foo__ bar__", "<p><strong>foo bar</strong></p>\n"],
    [436, "**foo **bar****", "<p><strong>foo bar</strong></p>\n"],
    [420, "*foo**bar**baz*", "<p><em>foo<strong>bar</strong>baz</em></p>\n"],
    [476, "***foo***", "<p><em><strong>foo</strong></em></p>\n"],
    [473, "****foo****", "<p><strong>foo</strong></p>\n"],
    [474, "____foo____", "<p><strong>foo</strong></p>\n"],
    [475, "******foo******", "<p><strong>foo</strong></p>\n"],
    [477, "_____foo_____", "<p><em><strong>foo</strong></em></p>\n"],
    [487, "*a `*`*", "<p><em>a <code>*</code></em></p>\n"],
  ];

  it.each(cases)("example %i", (id, md, html) => {
    expect(t.render(md).html).toBe(html);
  });
});
