import { expect, it } from "vitest";
import { DEFAULT_TOOLBAR_ITEMS } from "@/editor/toolbar/defaults.js";
import { resolveToolbarItems } from "@/editor/toolbar/Toolbar.js";

it("overwrites custom items by id", () => {
  const items = resolveToolbarItems({
    items: [{ id: "textFormat", label: "Format" }],
  });
  const format = items.find((i) => i.id === "textFormat");
  expect((format as any)?.label).toBe("Format");
  expect((format as any)?.children).toBeUndefined(); // It completely replaced it
});
