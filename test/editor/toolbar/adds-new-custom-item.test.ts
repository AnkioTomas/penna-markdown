import { expect, it } from "vitest";
import { DEFAULT_TOOLBAR_ITEMS } from "@/editor/toolbar/defaults.js";
import { resolveToolbarItems } from "@/editor/toolbar/Toolbar.js";

it("replaces entire toolbar when items is provided", () => {
  const items = resolveToolbarItems({
    items: [{ id: "custom", label: "C" }],
  });
  expect(items).toHaveLength(1);
  expect(items[0]?.id).toBe("custom");
  expect(items.some((i) => i.id === DEFAULT_TOOLBAR_ITEMS[0]?.id)).toBe(false);
});
