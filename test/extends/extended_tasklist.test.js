import { describe, expect, it } from "vitest";
import { createTransformer } from "@/transformer/index.js";
import { createTransformerWithExtensions } from "@/transformer/extends/extends.js";

function taskMarker(state, label) {
  return `<span class="task-marker task-marker-${state}" role="img" aria-label="${label}"></span>`;
}

describe("extended_tasklist extension", () => {
  it("renders basic todo and done items", () => {
    const t = createTransformerWithExtensions(["extended_tasklist"]);
    const md = "- [ ] foo\n- [x] bar\n";
    expect(t.render(md).html).toBe(
      `<ul class="contains-task-list">
<li class="task-list-item task-list-item-todo" data-task-state="todo">${taskMarker("todo", "To-do")} foo</li>
<li class="task-list-item task-list-item-done" data-task-state="done">${taskMarker("done", "Done")} bar</li>
</ul>
`,
    );
  });

  it("renders nested task lists", () => {
    const t = createTransformerWithExtensions(["extended_tasklist"]);
    const md = "- [x] foo\n  - [ ] bar\n  - [x] baz\n- [ ] bim\n";
    expect(t.render(md).html).toBe(
      `<ul class="contains-task-list">
<li class="task-list-item task-list-item-done" data-task-state="done">${taskMarker("done", "Done")} foo
<ul class="contains-task-list">
<li class="task-list-item task-list-item-todo" data-task-state="todo">${taskMarker("todo", "To-do")} bar</li>
<li class="task-list-item task-list-item-done" data-task-state="done">${taskMarker("done", "Done")} baz</li>
</ul>
</li>
<li class="task-list-item task-list-item-todo" data-task-state="todo">${taskMarker("todo", "To-do")} bim</li>
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
    const t = createTransformerWithExtensions(["extended_tasklist"]);
    expect(t.render(md).html).toBe(
      `<ul class="contains-task-list">
<li class="task-list-item task-list-item-todo" data-task-state="todo">${taskMarker("todo", "To-do")} 待办事项</li>
<li class="task-list-item task-list-item-done" data-task-state="done">${taskMarker("done", "Done")} 已完成</li>
<li class="task-list-item task-list-item-in_progress" data-task-state="in_progress">${taskMarker("in_progress", "In progress")} 进行中</li>
<li class="task-list-item task-list-item-migrated" data-task-state="migrated">${taskMarker("migrated", "Migrated")} 延期/迁移到未来</li>
<li class="task-list-item task-list-item-scheduled" data-task-state="scheduled">${taskMarker("scheduled", "Scheduled")} 提前排期</li>
<li class="task-list-item task-list-item-cancelled" data-task-state="cancelled">${taskMarker("cancelled", "Cancelled")} 取消的任务</li>
<li class="task-list-item task-list-item-urgent" data-task-state="urgent">${taskMarker("urgent", "Urgent")} 紧急/高优先级</li>
</ul>
`,
    );
  });

  it("does not affect lists without extension", () => {
    const t = createTransformer();
    expect(t.render("- [ ] foo\n").html).toBe("<ul>\n<li>[ ] foo</li>\n</ul>\n");
    expect(t.render("- [/] 进行中\n").html).toBe("<ul>\n<li>[/] 进行中</li>\n</ul>\n");
  });
});
