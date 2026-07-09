import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

const STATE_CLASS = { in_progress: "progress" };

function taskClass(state: string) {
  const cls = STATE_CLASS[state as keyof typeof STATE_CLASS] ?? state;
  return `task-item ${cls}`;
}

function taskMarker(label: string) {
  return `<span class="marker" role="img" aria-label="${label}"></span>`;
}

const engine = createEngine();

it("does not affect regular unordered lists", () => {
  expect(renderMarkdown(engine, "- plain item\n")).toBe(
    "<ul>\n<li>plain item</li>\n</ul>\n",
  );
});
