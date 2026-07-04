import { describe, expect, it } from "vitest";
import { DEFAULT_TOOLBAR_ITEMS } from "@/editor/toolbar/defaults.js";
import { resolveToolbarItems } from "@/editor/toolbar/resolve.js";

describe.skip("resolveToolbarItems", () => {
  it("returns defaults when no options", () => {
    const items = resolveToolbarItems();
    expect(items.length).toBe(DEFAULT_TOOLBAR_ITEMS.length);
    expect(items[0]?.id).toBe("bold");
  });

  it("sorts top-level items by order", () => {
    const items = resolveToolbarItems({
      order: ["layout", "bold", "italic"],
    });
    expect(items.map((i) => i.id)).toEqual([
      "layout",
      "bold",
      "italic",
      "strikethrough",
      "code",
      "heading",
      "blockquote",
      "unorderedList",
      "orderedList",
      "taskList",
      "link",
      "image",
      "codeBlock",
      "horizontalRule",
    ]);
  });

  it("merges custom items by id", () => {
    const items = resolveToolbarItems({
      items: [{ id: "bold", label: "Bold", title: "Custom bold" }],
    });
    const bold = items.find((i) => i.id === "bold");
    expect(bold && "label" in bold && bold.label).toBe("Bold");
  });

  it("hides items with hidden=true", () => {
    const items = resolveToolbarItems({
      items: [{ id: "bold", hidden: true, label: "B" }],
    });
    expect(items.some((i) => i.id === "bold")).toBe(false);
  });

  it("sorts menu children via orderMap", () => {
    const items = resolveToolbarItems({
      orderMap: { heading: ["heading3", "heading1", "heading2"] },
    });
    const heading = items.find((i) => i.id === "heading");
    expect(heading?.type).toBe("menu");
    if (heading?.type === "menu") {
      expect(heading.children.slice(0, 3).map((c) => c.id)).toEqual([
        "heading3",
        "heading1",
        "heading2",
      ]);
    }
  });

  it("adds new custom item", () => {
    const items = resolveToolbarItems({
      items: [{ id: "custom", label: "C", command: "insertText", payload: "x" }],
    });
    expect(items.some((i) => i.id === "custom")).toBe(true);
  });
});
