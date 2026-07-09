/**
 * @vitest-environment jsdom
 */

import { expect, it, vi } from "vitest";
import { Cherry } from "@/editor/Cherry";

function createCherry(options: Parameters<typeof Cherry>[1] = {}) {
  const mount = document.getElementById("cherry-editor")!;
  return new Cherry(mount, options);
}

it("setLayout switches to edit-only", () => {
  document.body.innerHTML = '<div id="cherry-editor"></div>';
  const handler = vi.fn();
  const cherry = createCherry({
    id: "cherry-editor",
    editor: { value: "test" },
  });
  cherry.theme.on("editor:layout", handler);

  cherry.setLayout("edit");

  expect(cherry.getLayout()).toBe("edit");
  expect(document.querySelector(".cherry-body--edit")).toBeTruthy();
  expect(handler).toHaveBeenCalledWith({ mode: "edit", prev: "split" });

  cherry.destroy();
});
