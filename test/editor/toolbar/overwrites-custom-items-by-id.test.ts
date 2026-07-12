import { expect, it } from "vitest";
import { resolveToolbarItems } from "@/editor/toolbar/Toolbar.js";

it("uses provided items as full replacement", () => {
  const items = resolveToolbarItems({
    items: [{ id: "textFormat", label: "Format" }],
  });
  expect(items).toHaveLength(1);
  const format = items.find((i) => i.id === "textFormat");
  expect((format as { label?: string } | undefined)?.label).toBe("Format");
  expect(
    (format as { children?: unknown } | undefined)?.children,
  ).toBeUndefined();
});

it("allows empty toolbar via items: []", () => {
  const items = resolveToolbarItems({ items: [] });
  expect(items).toEqual([]);
});
