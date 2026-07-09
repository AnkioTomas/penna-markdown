import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../helpers/engine.js";

it("rejects javascript iframe embed", () => {
  const engine = () => createEngine();
  const md = "!iframe[x](javascript:alert(1))\n";
  const html = renderMarkdown(createEngine(), md);
  expect(html).not.toContain("<iframe");
});
