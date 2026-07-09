import { expect, it } from "vitest";
import {
  lineIndexAtPos,
  normalizeMarkdownLines,
} from "@/transformer/utils/markdownLines.js";

it("normalizeMarkdownLines appends trailing newline before split", () => {
  expect(normalizeMarkdownLines("a\nb")).toEqual(["a", "b"]);
  expect(normalizeMarkdownLines("solo")).toEqual(["solo"]);
});
