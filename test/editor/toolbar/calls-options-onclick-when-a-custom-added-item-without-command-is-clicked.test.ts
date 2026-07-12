/**
 * @vitest-environment jsdom
 */

import { expect, it } from "vitest";
import { createTestEventBus } from "../../_helpers/eventBus";
import { Toolbar } from "@/editor/toolbar/Toolbar.js";

it("calls options.onClick when a custom added item without command is clicked", () => {
  const mount = document.createElement("div");
  document.body.appendChild(mount);
  const eventBus = createTestEventBus();
  let clickedId = "";
  const toolbar = new Toolbar(mount, eventBus, {
    items: [{ id: "my-custom-btn", label: "Custom" }],
    onClick: (id) => {
      clickedId = id;
    },
  });

  const btn = mount.querySelector(
    '[data-toolbar-id="my-custom-btn"]',
  ) as HTMLButtonElement;
  expect(btn).toBeTruthy();
  btn?.click();
  expect(clickedId).toBe("my-custom-btn");
  toolbar.destroy();
});
