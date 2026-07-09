import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("renders badge with variant and position via html_attrs", () => {
  const html = renderMarkdown(createEngine(), "核心库 [必须]{.important .top}");
  expect(html).toBe(
    '<p>核心库 <span class="cherry-badge important top">必须</span></p>\n',
  );
});
