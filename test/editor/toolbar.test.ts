import { describe, expect, it } from "vitest";
import { DEFAULT_TOOLBAR_ITEMS } from "@/editor/toolbar/defaults.js";
import { resolveToolbarItems } from "@/editor/toolbar/resolve.js";

describe("resolveToolbarItems", () => {
  it("returns defaults when no options", () => {
    const items = resolveToolbarItems();
    expect(items.length).toBe(DEFAULT_TOOLBAR_ITEMS.length);
    expect(items[0]?.id).toBe("textFormat");
  });

  it("overwrites custom items by id", () => {
    const items = resolveToolbarItems({
      items: [{ id: "textFormat", label: "Format" }],
    });
    const format = items.find((i) => i.id === "textFormat");
    expect((format as any)?.label).toBe("Format");
    expect((format as any)?.children).toBeUndefined(); // It completely replaced it
  });

  it("hides items with hidden=true", () => {
    const items = resolveToolbarItems({
      items: [{ id: "textFormat", hidden: true, label: "格式" }],
    });
    expect(items.some((i) => i.id === "textFormat")).toBe(false);
  });

  it("adds new custom item", () => {
    const items = resolveToolbarItems({
      items: [
        { id: "custom", label: "C", command: "insertText", payload: "x" },
      ],
    });
    expect(items.some((i) => i.id === "custom")).toBe(true);
  });
});
