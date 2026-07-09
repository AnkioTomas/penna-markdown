import { expect, it } from "vitest";
import { DEFAULT_TOOLBAR_ITEMS } from "@/editor/toolbar/defaults.js";
import { resolveToolbarItems } from "@/editor/toolbar/resolve.js";

it("hides items with hidden=true", () => {
  const items = resolveToolbarItems({
    items: [{ id: "textFormat", hidden: true, label: "格式" }],
  });
  expect(items.some((i) => i.id === "textFormat")).toBe(false);
});
