import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("renders ==text== as mark", () => {
  const t = createEngine();
  expect(renderMarkdown(createEngine(), "==hello==")).toBe(
    '<p><mark class="penna-mark">hello</mark></p>\n',
  );
});
