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

it("list / setTheme / getTheme", async () => {
  const { root, render } = await createRenderTree();
  const theme = new Theme();

  expect(theme.list()).toEqual([
    "default",
    "claude",
    "github",
    "morandi",
    "latex",
    "vue",

    "notion",
    "pollinations",
  ]);

  theme.setTheme("default", render, root);
  expect(render.classList.contains("cherry-render")).toBe(true);
  expect(root.classList.contains("cherry-theme-default")).toBe(true);
  expect(render.classList.contains("cherry-theme-default")).toBe(false);

  theme.setTheme("claude", render, root);
  expect(root.classList.contains("cherry-theme-default")).toBe(false);
  expect(root.classList.contains("cherry-theme-claude")).toBe(true);
  expect(render.classList.contains("cherry-theme-claude")).toBe(false);
  expect(theme.getTheme().id).toBe("claude");

  theme.setTheme("github", render, root);
  expect(root.classList.contains("cherry-theme-claude")).toBe(false);
  expect(root.classList.contains("cherry-theme-github")).toBe(true);
  expect(render.classList.contains("cherry-theme-github")).toBe(false);
  expect(theme.getTheme().id).toBe("github");

  theme.setTheme("morandi", render, root);
  expect(root.classList.contains("cherry-theme-github")).toBe(false);
  expect(root.classList.contains("cherry-theme-morandi")).toBe(true);
  expect(render.classList.contains("cherry-theme-morandi")).toBe(false);
  expect(theme.getTheme().id).toBe("morandi");

  theme.setTheme("latex", render, root);
  expect(root.classList.contains("cherry-theme-morandi")).toBe(false);
  expect(root.classList.contains("cherry-theme-latex")).toBe(true);
  expect(render.classList.contains("cherry-theme-latex")).toBe(false);
  expect(theme.getTheme().id).toBe("latex");

  theme.setTheme("vue", render, root);
  expect(root.classList.contains("cherry-theme-latex")).toBe(false);
  expect(root.classList.contains("cherry-theme-vue")).toBe(true);
  expect(render.classList.contains("cherry-theme-vue")).toBe(false);
  expect(theme.getTheme().id).toBe("vue");

  theme.setTheme("notion", render, root);
  expect(root.classList.contains("cherry-theme-vue")).toBe(false);
  expect(root.classList.contains("cherry-theme-notion")).toBe(true);
  expect(render.classList.contains("cherry-theme-notion")).toBe(false);
  expect(theme.getTheme().id).toBe("notion");

  theme.setTheme("pollinations", render, root);
  expect(root.classList.contains("cherry-theme-notion")).toBe(false);
  expect(root.classList.contains("cherry-theme-pollinations")).toBe(true);
  expect(render.classList.contains("cherry-theme-pollinations")).toBe(false);
  expect(theme.getTheme().id).toBe("pollinations");
});
