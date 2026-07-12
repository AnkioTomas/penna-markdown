import { expect, it } from "vitest";
import { DEFAULT_TOOLBAR_ITEMS } from "@/editor/toolbar/defaults.js";
import { resolveToolbarItems } from "@/editor/toolbar/Toolbar.js";

it("adds new custom item", () => {
  const items = resolveToolbarItems({
    items: [{ id: "custom", label: "C" }],
  });
  expect(items.some((i) => i.id === "custom")).toBe(true);
});
