import { expect, it } from "vitest";
import REGISTERED_THEMES from "@/theme/ThemeRegister.js";
import { resolveToolbarItems } from "@/editor/toolbar/Toolbar.js";

it("shows all registered themes by default", () => {
  const items = resolveToolbarItems();
  const themeMenu = items.find((item) => item.id === "themeMenu");
  expect(themeMenu?.type).toBe("menu");
  if (themeMenu?.type !== "menu") return;
  expect(themeMenu.children.map((child) => child.id)).toEqual(
    REGISTERED_THEMES.map((id) => `theme-${id}`),
  );
});

it("shows only whitelisted themes when themes is provided", () => {
  const items = resolveToolbarItems(undefined, ["github"]);
  const themeMenu = items.find((item) => item.id === "themeMenu");
  expect(themeMenu?.type).toBe("menu");
  if (themeMenu?.type !== "menu") return;
  expect(themeMenu.children).toHaveLength(1);
  expect(themeMenu.children[0]?.id).toBe("theme-github");
});
