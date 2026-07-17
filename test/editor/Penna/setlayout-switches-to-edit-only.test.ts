/**
 * @vitest-environment jsdom
 */

import { expect, it, vi } from "vitest";
import { createPenna } from "./helpers";

it("setLayout switches to edit-only", () => {
  document.body.innerHTML = '<div id="penna-editor"></div>';
  const handler = vi.fn();
  const penna = createPenna({
    editor: { value: "test" },
  });
  penna.eventBus.on("editor:layout", handler);

  penna.setLayout("edit");

  expect(penna.getLayout()).toBe("edit");
  expect(document.querySelector(".penna-body--edit")).toBeTruthy();
  expect(handler).toHaveBeenCalledWith({ mode: "edit", prev: "split" });

  penna.destroy();
});
