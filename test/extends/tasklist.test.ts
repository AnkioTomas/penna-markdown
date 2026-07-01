import { describe, expect, it } from "vitest";
import { createEngine, renderMarkdown } from "../helpers/engine.js";

const STATE_CLASS = { in_progress: "progress" };

function taskClass(state: string) {
  const cls = STATE_CLASS[state as keyof typeof STATE_CLASS] ?? state;
  return `task-item ${cls}`;
}

function taskMarker(label: string) {
  return `<span class="marker" role="img" aria-label="${label}"></span>`;
}

describe("tasklist extension", () => {
  const engine = createEngine();

  it("renders basic todo and done items", () => {
    const md = "- [ ] foo\n- [x] bar\n";
    expect(renderMarkdown(engine, md)).toBe(
      `<ul class="task-list">
<li class="${taskClass("todo")}" data-state="todo">${taskMarker("To-do")} foo</li>
<li class="${taskClass("done")}" data-state="done">${taskMarker("Done")} bar</li>
</ul>
`,
    );
  });

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

  const md = `- [ ] 待办事项
- [x] 已完成
- [/] 进行中
- [>] 延期/迁移到未来
- [<] 提前排期
- [-] 取消的任务
- [!] 紧急/高优先级
`;

  it("renders all extended task states", () => {
    expect(renderMarkdown(engine, md)).toBe(
      `<ul class="task-list">
<li class="${taskClass("todo")}" data-state="todo">${taskMarker("To-do")} 待办事项</li>
<li class="${taskClass("done")}" data-state="done">${taskMarker("Done")} 已完成</li>
<li class="${taskClass("in_progress")}" data-state="in_progress">${taskMarker("In progress")} 进行中</li>
<li class="${taskClass("migrated")}" data-state="migrated">${taskMarker("Migrated")} 延期/迁移到未来</li>
<li class="${taskClass("scheduled")}" data-state="scheduled">${taskMarker("Scheduled")} 提前排期</li>
<li class="${taskClass("cancelled")}" data-state="cancelled">${taskMarker("Cancelled")} 取消的任务</li>
<li class="${taskClass("urgent")}" data-state="urgent">${taskMarker("Urgent")} 紧急/高优先级</li>
</ul>
`,
    );
  });

  it("does not affect regular unordered lists", () => {
    expect(renderMarkdown(engine, "- plain item\n")).toBe(
      "<ul>\n<li>plain item</li>\n</ul>\n",
    );
  });
});
