import { expect, it } from "vitest";
import { DEFAULT_TOOLBAR_ITEMS } from "@/editor/toolbar/defaults.js";
import { resolveToolbarItems } from "@/editor/toolbar/Toolbar.js";

it("returns defaults when no options", () => {
  const items = resolveToolbarItems();
  expect(items.length).toBe(DEFAULT_TOOLBAR_ITEMS.length);
  expect(items[0]?.id).toBe("textFormat");
});
