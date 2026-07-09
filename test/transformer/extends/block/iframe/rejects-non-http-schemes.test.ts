import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("rejects non-http schemes", () => {
  const engine = () => createEngine();
  const html = renderMarkdown(
    createEngine(),
    "!iframe[x](javascript:alert(1))\n",
  );
  expect(html).not.toContain("<iframe");
});
