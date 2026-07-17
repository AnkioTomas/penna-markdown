/**
 * @vitest-environment jsdom
 */

import { expect, it } from "vitest";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { EditorState } from "@codemirror/state";
import { ensureSyntaxTree } from "@codemirror/language";
import { PennaInlinesExtension } from "@/editor/editor/lezer/pennaInlines.js";

function findAtType(doc: string) {
  const state = EditorState.create({
    doc,
    extensions: [
      markdown({
        base: markdownLanguage,
        extensions: [PennaInlinesExtension],
      }),
    ],
  });
  const found: Array<{ text: string; from: number; to: number }> = [];
  ensureSyntaxTree(state, doc.length, 1000)?.iterate({
    enter: (node) => {
      if (node.name === "PennaAtType") {
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

it("matches @tab:active", () => {
  expect(findAtType("hello\n\n@tab:active B")).toEqual([
    { text: "@tab:active", from: 7, to: 18 },
  ]);
});
