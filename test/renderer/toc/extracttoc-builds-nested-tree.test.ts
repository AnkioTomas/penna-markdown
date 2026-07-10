import { expect, it } from "vitest";
import { TransformerEngine } from "@/transformer/TransformerEngine.js";
import { extractToc, extractTocFlat } from "@/renderer/toc/extract.js";
import type { ParserStore } from "@/transformer/core/ParserStore.js";

function parseWithSlug(markdown: string) {
  const engine = new TransformerEngine({
    syntaxOptions: { atx_heading: { slug: true } },
  });
  const ast = engine.parse(markdown);
  const store = ast.props?.store as ParserStore;
  const ctx = engine.createRenderContext(store);
  return { ast, ctx };
}

it("extractToc builds nested tree", () => {
  const { ast, ctx } = parseWithSlug(
    "# Intro\n\nbody\n\n## Setup\n\n## API\n\n### Details\n",
  );
  const toc = extractToc(ast, ctx);
  expect(toc).toHaveLength(1);
  expect(toc[0]?.text).toBe("Intro");
  expect(toc[0]?.children).toHaveLength(2);
  expect(toc[0]?.children[0]?.text).toBe("Setup");
  expect(toc[0]?.children[1]?.text).toBe("API");
  expect(toc[0]?.children[1]?.children[0]?.text).toBe("Details");
});

it("extractToc uses rendered inline text", () => {
  const { ast, ctx } = parseWithSlug("# **Bold** [Link](https://x.test)\n");
  const flat = extractTocFlat(ast, ctx);
  expect(flat[0]?.text).toBe("Bold Link");
});
