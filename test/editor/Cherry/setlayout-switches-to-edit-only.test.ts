/**
 * @vitest-environment jsdom
 */

import { expect, it, vi } from "vitest";
import { createCherry } from "./helpers";

it("setLayout switches to edit-only", () => {
  document.body.innerHTML = '<div id="cherry-editor"></div>';
  const handler = vi.fn();
  const cherry = createCherry({
    editor: { value: "test" },
  });
  cherry.eventBus.on("editor:layout", handler);

  cherry.setLayout("edit");

  expect(cherry.getLayout()).toBe("edit");
  expect(document.querySelector(".cherry-body--edit")).toBeTruthy();
  expect(handler).toHaveBeenCalledWith({ mode: "edit", prev: "split" });

  cherry.destroy();
});
