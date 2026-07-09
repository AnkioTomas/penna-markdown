import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("renders empty blockquote (CommonMark #241-242)", () => {
  expect(renderMarkdown(createEngine(), ">\n")).toBe(
    "<blockquote>\n</blockquote>\n",
  );
  expect(renderMarkdown(createEngine(), ">\n>  \n> \n")).toBe(
    "<blockquote>\n</blockquote>\n",
  );
});
