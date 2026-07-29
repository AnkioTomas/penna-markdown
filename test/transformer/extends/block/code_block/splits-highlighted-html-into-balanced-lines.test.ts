import { expect, it } from "vitest";
import { splitHighlightedHtml } from "@/transformer/extends/block/enhancedCode.js";

it("splits highlighted html into balanced lines", () => {
  const html = [
    '<span class="hljs-comment">/* one',
    "two */</span>",
    '<span class="hljs-keyword">const</span> x = 1;',
  ].join("\n");

  expect(splitHighlightedHtml(html)).toEqual([
    '<span class="hljs-comment">/* one</span>',
    '<span class="hljs-comment">two */</span>',
    '<span class="hljs-keyword">const</span> x = 1;',
  ]);
});
