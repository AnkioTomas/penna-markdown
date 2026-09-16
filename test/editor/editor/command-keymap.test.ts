/**
 * @vitest-environment jsdom
 */

import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { expect, it } from "vitest";
import { createTestTheme } from "../../_helpers/busTheme";
import {
  createCommandBindings,
  resolveShortcuts,
} from "@/editor/editor/shortcuts.js";

it("command binding emits editor:command", () => {
  const { eventBus } = createTestTheme();
  let command = "";
  eventBus.on("editor:command", (payload) => {
    command = (payload as { command: string }).command;
  });

  const parent = document.createElement("div");
  document.body.append(parent);
  const view = new EditorView({
    state: EditorState.create({ doc: "hello" }),
    parent,
  });

  const [bold] = createCommandBindings(eventBus, { bold: "Mod-b" });
  expect(bold?.run?.(view)).toBe(true);
  expect(command).toBe("bold");
  view.destroy();
});

it("registers nothing when shortcuts are disabled", () => {
  expect(Object.keys(resolveShortcuts(false))).toHaveLength(0);
});
