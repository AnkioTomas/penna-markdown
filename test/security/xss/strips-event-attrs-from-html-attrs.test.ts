import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../helpers/engine.js";

it("strips event attrs from html_attrs", () => {
  const engine = () => createEngine();
  const md = '**x**{onclick="alert(1)"}';
  const html = renderMarkdown(createEngine(), md);
  expect(html).not.toContain("onclick");
  expect(html).toBe("<p><strong>x</strong></p>\n");
});
