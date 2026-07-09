import { expect, it } from "vitest";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import { extractToc, extractTocFlat } from "@/renderer/toc/extract.js";

const ast = createNode("document", 0, undefined, [
  createNode(
    "atx_heading",
    10,
    undefined,
    [createNode("text", 5, "Intro", undefined)],
    { level: 1 },
  ),
  createNode("paragraph", 5, undefined, [
    createNode("text", 5, "body", undefined),
  ]),
  createNode(
    "atx_heading",
    8,
    undefined,
    [createNode("text", 4, "Setup", undefined)],
    { level: 2 },
  ),
  createNode(
    "atx_heading",
    7,
    undefined,
    [createNode("text", 3, "API", undefined)],
    { level: 2 },
  ),
  createNode(
    "atx_heading",
    9,
    undefined,
    [createNode("text", 5, "Details", undefined)],
    { level: 3 },
  ),
]);

it("extractToc builds nested tree", () => {
  const toc = extractToc(ast);
  expect(toc).toHaveLength(1);
  expect(toc[0]?.text).toBe("Intro");
  expect(toc[0]?.children).toHaveLength(2);
  expect(toc[0]?.children[0]?.text).toBe("Setup");
  expect(toc[0]?.children[1]?.text).toBe("API");
  expect(toc[0]?.children[1]?.children[0]?.text).toBe("Details");
});
