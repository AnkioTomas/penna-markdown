import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("removes multi-line comment block", () => {
  const engine = () => createEngine();
  const html = renderMarkdown(
    engine(),
    "1\n\n%%%\nthis is a comment\nacross multiple lines\n%%%\n\n2",
  );
  expect(html).toBe("<p>1</p>\n<p>2</p>\n");
});
