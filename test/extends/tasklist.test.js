import { describe, expect, it } from "vitest";
import { createTransformer } from "@/transformer/index.js";
import { createTransformerWithExtensions } from "@/transformer/extends/extends.js";

const STATE_CLASS = { in_progress: "progress" };

function taskClass(state) {
  const cls = STATE_CLASS[state] ?? state;
  return `task-item ${cls}`;
}

function taskMarker(label) {
  return `<span class="marker" role="img" aria-label="${label}"></span>`;
}

describe("tasklist extension", () => {
  it("renders basic todo and done items", () => {
    const t = createTransformerWithExtensions(["tasklist"]);
    const md = "- [ ] foo\n- [x] bar\n";
    expect(t.render(md).html).toBe(
      `<ul class="task-list">
<li class="${taskClass("todo")}" data-state="todo">${taskMarker("To-do")} foo</li>
<li class="${taskClass("done")}" data-state="done">${taskMarker("Done")} bar</li>
</ul>
`,
    );
  });

  it("renders nested task lists", () => {
    const t = createTransformerWithExtensions(["tasklist"]);
    const md = "- [x] foo\n  - [ ] bar\n  - [x] baz\n- [ ] bim\n";
    expect(t.render(md).html).toBe(
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
    const t = createTransformerWithExtensions(["tasklist"]);
    expect(t.render(md).html).toBe(
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

  it("does not affect lists without extension", () => {
    const t = createTransformer();
    expect(t.render("- [ ] foo\n").html).toBe("<ul>\n<li>[ ] foo</li>\n</ul>\n");
    expect(t.render("- [/] 进行中\n").html).toBe("<ul>\n<li>[/] 进行中</li>\n</ul>\n");
  });
});
