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

it("extractTocFlat returns headings in document order", () => {
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
  const flat = extractTocFlat(ast);
  expect(flat).toEqual([
    { level: 1, text: "Intro", id: "Intro" },
    { level: 2, text: "Setup", id: "Setup" },
    { level: 2, text: "API", id: "API" },
    { level: 3, text: "Details", id: "Details" },
  ]);
});
