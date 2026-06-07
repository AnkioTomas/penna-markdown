import { describe, expect, it } from "vitest";
import { createTransformer } from "@/transformer/index.js";
import { createTransformerWithExtensions } from "@/transformer/extends/extends.js";

describe("extended_tasklist extension", () => {
  it("renders basic todo and done items", () => {
    const t = createTransformerWithExtensions(["extended_tasklist"]);
    const md = "- [ ] foo\n- [x] bar\n";
    expect(t.render(md).html).toBe(
      "<ul>\n<li class=\"task-list-item task-list-item-todo\" data-task-state=\"todo\"><input disabled=\"\" type=\"checkbox\"> foo</li>\n<li class=\"task-list-item task-list-item-done\" data-task-state=\"done\"><input checked=\"\" disabled=\"\" type=\"checkbox\"> bar</li>\n</ul>\n",
    );
  });

  it("renders nested task lists", () => {
    const t = createTransformerWithExtensions(["extended_tasklist"]);
    const md = "- [x] foo\n  - [ ] bar\n  - [x] baz\n- [ ] bim\n";
    expect(t.render(md).html).toBe(
      "<ul>\n<li class=\"task-list-item task-list-item-done\" data-task-state=\"done\"><input checked=\"\" disabled=\"\" type=\"checkbox\"> foo\n<ul>\n<li class=\"task-list-item task-list-item-todo\" data-task-state=\"todo\"><input disabled=\"\" type=\"checkbox\"> bar</li>\n<li class=\"task-list-item task-list-item-done\" data-task-state=\"done\"><input checked=\"\" disabled=\"\" type=\"checkbox\"> baz</li>\n</ul>\n</li>\n<li class=\"task-list-item task-list-item-todo\" data-task-state=\"todo\"><input disabled=\"\" type=\"checkbox\"> bim</li>\n</ul>\n",
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
      `<ul>
<li class="task-list-item task-list-item-todo" data-task-state="todo"><input disabled="" type="checkbox"> 待办事项</li>
<li class="task-list-item task-list-item-done" data-task-state="done"><input checked="" disabled="" type="checkbox"> 已完成</li>
<li class="task-list-item task-list-item-in_progress" data-task-state="in_progress"><input disabled="" type="checkbox" data-task-state="in_progress" class="task-checkbox task-checkbox-in_progress"> 进行中</li>
<li class="task-list-item task-list-item-migrated" data-task-state="migrated"><input disabled="" type="checkbox" data-task-state="migrated" class="task-checkbox task-checkbox-migrated"> 延期/迁移到未来</li>
<li class="task-list-item task-list-item-scheduled" data-task-state="scheduled"><input disabled="" type="checkbox" data-task-state="scheduled" class="task-checkbox task-checkbox-scheduled"> 提前排期</li>
<li class="task-list-item task-list-item-cancelled" data-task-state="cancelled"><input disabled="" type="checkbox" data-task-state="cancelled" class="task-checkbox task-checkbox-cancelled"> 取消的任务</li>
<li class="task-list-item task-list-item-urgent" data-task-state="urgent"><input disabled="" type="checkbox" data-task-state="urgent" class="task-checkbox task-checkbox-urgent"> 紧急/高优先级</li>
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
