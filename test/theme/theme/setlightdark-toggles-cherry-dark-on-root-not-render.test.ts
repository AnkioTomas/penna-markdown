import { expect, it } from "vitest";
import { Theme, THEME_EVENT_SKIN } from "@/theme/Theme.js";

async function createRenderTree() {
  const dom = new (await import("jsdom")).JSDOM(
    `<div id="root"><div id="render"></div></div>`,
  );
  const root = dom.window.document.getElementById("root")! as HTMLElement;
  const render = dom.window.document.getElementById("render")! as HTMLElement;
  return { root, render };
}

it("setLightDark toggles cherry-dark on root, not render", async () => {
  const { root, render } = await createRenderTree();
  const theme = new Theme();

  theme.setTheme("default", render, root);
  theme.setLightDark("dark");

  expect(root.classList.contains("cherry-dark")).toBe(true);
  expect(render.classList.contains("cherry-dark")).toBe(false);
  expect(theme.getTheme().isDark).toBe(true);
});
