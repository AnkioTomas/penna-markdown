import { expect, it } from "vitest";
import { TransformerEngine } from "@/transformer/TransformerEngine.js";
import { extractTocFlat } from "@/renderer/toc/extract.js";
import type { ParserStore } from "@/transformer/core/ParserStore.js";

it("extractTocFlat returns headings in document order", () => {
  const engine = new TransformerEngine({
    syntaxOptions: { atx_heading: { slug: true } },
  });
  const ast = engine.parse(
    "# Intro\n\nbody\n\n## Setup\n\n## API\n\n### Details\n",
  );
  const store = ast.props?.store as ParserStore;
  const ctx = engine.createRenderContext(store);
  const flat = extractTocFlat(ast, ctx);
  expect(flat).toEqual([
    { level: 1, text: "Intro", id: "Intro" },
    { level: 2, text: "Setup", id: "Setup" },
    { level: 2, text: "API", id: "API" },
    { level: 3, text: "Details", id: "Details" },
  ]);
});
