/**
 * @vitest-environment jsdom
 */

import { expect, it } from "vitest";
import { Theme } from "@/theme/Theme.js";
import { Toolbar } from "@/editor/toolbar/Toolbar.js";

it("emits editor:command when bold is clicked from format menu", () => {
  const mount = document.createElement("div");
  document.body.appendChild(mount);
  const theme = new Theme();
  let command = "";
  theme.on("editor:command", (payload) => {
    command = (payload as { command: string }).command;
  });
  const toolbar = new Toolbar(mount, theme, {});

  const formatMenu = mount.querySelector('[data-toolbar-id="textFormat"]');
  (
    formatMenu?.querySelector(
      ".cherry-toolbar-menu-trigger",
    ) as HTMLButtonElement
  )?.click();
  const boldBtn = formatMenu?.querySelector(
    '[data-toolbar-id="bold"]',
  ) as HTMLButtonElement;
  boldBtn?.click();
  expect(command).toBe("bold");
  toolbar.destroy();
});
