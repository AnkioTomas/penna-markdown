/**
 * @vitest-environment jsdom
 */

import { expect, it } from "vitest";
import { createTestTheme } from "../../_helpers/busTheme";
import { Toolbar } from "@/editor/toolbar/Toolbar.js";

it("still emits editor:command when options.onClick is set", () => {
  const mount = document.createElement("div");
  document.body.appendChild(mount);
  const { eventBus } = createTestTheme();
  let command = "";
  let clickedId = "";
  eventBus.on("editor:command", (payload) => {
    command = (payload as { command: string }).command;
  });
  const toolbar = new Toolbar(mount, eventBus, {
    onClick: (id) => {
      clickedId = id;
    },
  });

  const formatMenu = mount.querySelector('[data-toolbar-id="textFormat"]');
  (
    formatMenu?.querySelector(
      ".cherry-toolbar-menu-trigger",
    ) as HTMLButtonElement
  )?.click();
  (
    formatMenu?.querySelector('[data-toolbar-id="bold"]') as HTMLButtonElement
  )?.click();

  expect(command).toBe("bold");
  expect(clickedId).toBe("bold");
  toolbar.destroy();
});
