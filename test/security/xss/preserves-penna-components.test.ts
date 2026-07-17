import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../helpers/engine.js";

it("preserves penna components", () => {
  const engine = () => createEngine();
  const md = "- [ ] todo\n\n```js\nconst a = 1;\n```";
  const html = renderMarkdown(createEnhancedEngine(), md);
  expect(html).toContain('class="task-list"');
  expect(html).toContain("penna-code-block");
  expect(html).toContain('data-state="todo"');
});
