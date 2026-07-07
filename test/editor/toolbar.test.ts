import { describe, expect, it } from "vitest";
import { DEFAULT_TOOLBAR_GROUPS, DEFAULT_TOOLBAR_ITEMS } from "@/editor/toolbar/defaults.js";
import {
  groupToolbarItems,
  resolveToolbarGroups,
  resolveToolbarItems,
} from "@/editor/toolbar/resolve.js";

describe("resolveToolbarItems", () => {
  it("returns defaults when no options", () => {
    const items = resolveToolbarItems();
    expect(items.length).toBe(DEFAULT_TOOLBAR_ITEMS.length);
    expect(items[0]?.id).toBe("textFormat");
  });

  it("sorts top-level items by order", () => {
    const items = resolveToolbarItems({
      order: ["themeMenu", "textFormat", "insert"],
    });
    expect(items.map((i) => i.id)).toEqual([
      "themeMenu",
      "textFormat",
      "insert",
      "structure",
      "blocks",
      "advanced",
    ]);
  });

  it("merges custom items by id", () => {
    const items = resolveToolbarItems({
      items: [{ id: "textFormat", label: "Format", title: "Custom format" }],
    });
    const format = items.find((i) => i.id === "textFormat");
    expect(format?.type).toBe("menu");
    if (format?.type === "menu") {
      expect(format.label).toBe("Format");
    }
  });

  it("hides items with hidden=true", () => {
    const items = resolveToolbarItems({
      items: [{ id: "textFormat", hidden: true, label: "格式" }],
    });
    expect(items.some((i) => i.id === "textFormat")).toBe(false);
  });

  it("sorts menu children via orderMap", () => {
    const items = resolveToolbarItems({
      orderMap: { heading: ["heading3", "heading1", "heading2"] },
    });
    const structure = items.find((i) => i.id === "structure");
    expect(structure?.type).toBe("menu");
    if (structure?.type === "menu") {
      const heading = structure.children.find((c) => c.id === "heading");
      expect(heading?.type).toBe("menu");
      if (heading?.type === "menu") {
        expect(heading.children.slice(0, 3).map((c) => c.id)).toEqual([
          "heading3",
          "heading1",
          "heading2",
        ]);
      }
    }
  });

  it("adds new custom item", () => {
    const items = resolveToolbarItems({
      items: [{ id: "custom", label: "C", command: "insertText", payload: "x" }],
    });
    expect(items.some((i) => i.id === "custom")).toBe(true);
  });
});

describe("groupToolbarItems", () => {
  it("groups items by groups option", () => {
    const items = resolveToolbarItems();
    const groups = groupToolbarItems(items, [["textFormat", "structure"], ["insert", "blocks"]]);
    expect(groups[0]?.map((i) => i.id)).toEqual(["textFormat", "structure"]);
    expect(groups[1]?.map((i) => i.id).slice(0, 2)).toEqual(["insert", "blocks"]);
    expect(groups[1]?.length).toBeGreaterThan(2);
  });

  it("appends ungrouped items to the last group", () => {
    const items = resolveToolbarItems();
    const groups = groupToolbarItems(items, [["textFormat"]]);
    expect(groups[0]?.map((i) => i.id).slice(0, 1)).toEqual(["textFormat"]);
    expect(groups[0]!.length).toBeGreaterThan(1);
  });

  it("does not include layout item", () => {
    const items = resolveToolbarItems();
    expect(items.some((i) => i.type === "layout")).toBe(false);
    const groups = groupToolbarItems(items, DEFAULT_TOOLBAR_GROUPS);
    expect(groups.flat().some((i) => i.type === "layout")).toBe(false);
  });
});

describe("resolveToolbarGroups", () => {
  it("returns grouped menus without trailing layout", () => {
    const groups = resolveToolbarGroups();
    expect(groups.length).toBeGreaterThan(0);
    const items = groups.flatMap((g) => g.items);
    expect(items.some((i) => i.type === "layout")).toBe(false);
    expect(items.some((i) => i.id === "themeMenu")).toBe(true);
  });
});
