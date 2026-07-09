import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../helpers/engine.js";

it("strips script block HTML at render", () => {
  const engine = () => createEngine();
  const md = "<script>alert(1)</script>\n\nok";
  const html = renderMarkdown(createEngine(), md);
  expect(html).not.toContain("<script");
  expect(html).toContain("<p>ok</p>");
});
