/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from "vitest";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { EditorState } from "@codemirror/state";
import { ensureSyntaxTree } from "@codemirror/language";
import { CherryInlinesExtension } from "@/editor/editor/lezer/cherryInlines.js";

function findAtType(doc: string) {
  const state = EditorState.create({
    doc,
    extensions: [
      markdown({
        base: markdownLanguage,
        extensions: [CherryInlinesExtension],
      }),
    ],
  });
  const found: Array<{ text: string; from: number; to: number }> = [];
  ensureSyntaxTree(state, doc.length, 1000)?.iterate({
    enter: (node) => {
      if (node.name === "CherryAtType") {
        found.push({
          text: doc.slice(node.from, node.to),
          from: node.from,
          to: node.to,
        });
      }
    },
  });
  return found;
}

describe("CherryAtType @tab highlighting", () => {
  it("matches @tab at document start", () => {
    expect(findAtType("@tab 标题 1")).toEqual([
      { text: "@tab", from: 0, to: 4 },
    ]);
  });

  it("matches @tab after other blocks", () => {
    expect(findAtType("::: tabs\n\n@tab A\n\n:::")).toEqual([
      { text: "@tab", from: 10, to: 14 },
    ]);
  });

  it("matches @tab:active", () => {
    expect(findAtType("hello\n\n@tab:active B")).toEqual([
      { text: "@tab:active", from: 7, to: 18 },
    ]);
  });
});
