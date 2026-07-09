/**
 * @vitest-environment jsdom
 */

import { expect, it } from "vitest";
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

it("matches @tab at document start", () => {
  expect(findAtType("@tab 标题 1")).toEqual([{ text: "@tab", from: 0, to: 4 }]);
});
