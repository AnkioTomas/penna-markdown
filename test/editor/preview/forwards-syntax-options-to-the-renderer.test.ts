/**
 * @vitest-environment jsdom
 */

import { expect, it } from "vitest";
import { EventBus } from "@/core/event/EventBus";
import { Log } from "@/core/Log";
import { Theme } from "@/theme/Theme";
import { Preview } from "@/editor/preview/Preview";

it("forwards syntax options to the renderer", () => {
  document.body.innerHTML = "";
  const shell = document.createElement("div");
  shell.className = "penna-preview";
  const mount = document.createElement("div");
  mount.className = "penna-render";
  shell.append(mount);
  document.body.append(shell);

  const log = new Log(false);
  const eventBus = new EventBus(false, "[test]", log);
  const theme = new Theme(eventBus, log, document.body, []);
  const preview = new Preview(mount, theme, eventBus, log, {
    transformerEngineOptions: {
      syntaxOptions: { code: { wrap: true, lineNumbers: false } },
    },
  });

  eventBus.emit("editor:change", { markdown: "```js\nconst x = 1;\n```" });

  const block = mount.querySelector(".penna-code-block")!;
  expect(block.classList.contains("penna-code-wrap")).toBe(true);
  expect(block.classList.contains("penna-code-no-line-numbers")).toBe(true);
  // 渲染器默认值没有被整体覆盖：高亮仍然生效
  expect(mount.querySelector("code[data-penna-highlighted]")).not.toBeNull();

  preview.destroy();
});
