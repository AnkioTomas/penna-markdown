import { expect, it } from "vitest";
import { EventBus } from "@/core/event/EventBus";
import { Log } from "@/core/Log";
import { Theme } from "@/theme/Theme.js";

async function createRenderTree() {
  const dom = new (await import("jsdom")).JSDOM(
    `<div id="root"><div id="render"></div></div>`,
  );
  const root = dom.window.document.getElementById("root")! as HTMLElement;
  const render = dom.window.document.getElementById("render")! as HTMLElement;
  return { root, render };
}

it("setLightDark toggles penna-dark on root, not render", async () => {
  const { root, render } = await createRenderTree();
  const log = new Log(false);
  const eventBus = new EventBus(false, "[penna]", log);
  const theme = new Theme(eventBus, log, root);

  theme.setTheme("default");
  theme.setLightDark("dark");

  expect(root.classList.contains("penna-dark")).toBe(true);
  expect(render.classList.contains("penna-dark")).toBe(false);
  expect(theme.getTheme().isDark).toBe(true);
});
