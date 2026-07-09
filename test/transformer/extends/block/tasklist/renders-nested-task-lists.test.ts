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

it("renders nested task lists", () => {
  const md = "- [x] foo\n  - [ ] bar\n  - [x] baz\n- [ ] bim\n";
  expect(renderMarkdown(engine, md)).toBe(
    `<ul class="task-list">
<li class="${taskClass("done")}" data-state="done">${taskMarker("Done")} foo
<ul class="task-list">
<li class="${taskClass("todo")}" data-state="todo">${taskMarker("To-do")} bar</li>
<li class="${taskClass("done")}" data-state="done">${taskMarker("Done")} baz</li>
</ul>
</li>
<li class="${taskClass("todo")}" data-state="todo">${taskMarker("To-do")} bim</li>
</ul>
`,
  );
});
