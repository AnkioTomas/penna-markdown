import { expect, it } from "vitest";
import { TransformerEngine } from "@/transformer/TransformerEngine.js";
import { extractTocFlat } from "@/renderer/toc/extract.js";
import type { ParserStore } from "@/transformer/core/ParserStore.js";

it("extractTocFlat skips headings nested in containers", () => {
  const engine = new TransformerEngine({
    syntaxOptions: { atx_heading: { slug: true } },
  });
  const ast = engine.parse(
    [
      "# Root",
      "",
      "> ## Quoted",
      "",
      "- ### InList",
      "",
      "## AlsoRoot",
      "",
    ].join("\n"),
  );
  const store = ast.props?.store as ParserStore;
  const flat = extractTocFlat(ast, engine.createRenderContext(store));

  expect(flat.map((item) => item.text)).toEqual(["Root", "AlsoRoot"]);
});
