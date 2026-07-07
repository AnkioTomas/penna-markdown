/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, afterEach } from "vitest";
import { Theme } from "@/theme/Theme.js";
import { Toolbar } from "@/editor/toolbar/Toolbar.js";

describe("Toolbar render", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders grouped buttons and layout controls", () => {
    const mount = document.createElement("div");
    document.body.appendChild(mount);
    const theme = new Theme();
    const toolbar = new Toolbar({ mount, theme, options: {}, getLayout: () => "split" });

    expect(mount.querySelector(".cherry-toolbar-scroll")).toBeTruthy();
    expect(mount.querySelectorAll(".cherry-toolbar-group").length).toBeGreaterThan(0);
    expect(mount.querySelector(".cherry-toolbar-layout")).toBeTruthy();
    expect(mount.querySelector('[title="加粗"]')).toBeTruthy();

    toolbar.destroy();
  });

  it("renders nested heading menu", () => {
    const mount = document.createElement("div");
    document.body.appendChild(mount);
    const theme = new Theme();
    const toolbar = new Toolbar({ mount, theme, options: {}, getLayout: () => "split" });

    const headingMenu = mount.querySelector(".cherry-toolbar-menu");
    expect(headingMenu).toBeTruthy();
    const trigger = headingMenu?.querySelector(".cherry-toolbar-menu-trigger") as HTMLButtonElement;
    trigger?.click();
    expect(headingMenu?.classList.contains("is-open")).toBe(true);
    expect(headingMenu?.querySelectorAll(".cherry-toolbar-menu-item").length).toBe(6);

    toolbar.destroy();
  });

  it("emits editor:command when bold is clicked", () => {
    const mount = document.createElement("div");
    document.body.appendChild(mount);
    const theme = new Theme();
    let command = "";
    theme.on("editor:command", (payload) => {
      command = (payload as { command: string }).command;
    });
    const toolbar = new Toolbar({ mount, theme, options: {}, getLayout: () => "split" });
    const boldBtn = mount.querySelector('[title="加粗"]') as HTMLButtonElement;
    boldBtn?.click();
    expect(command).toBe("bold");
    toolbar.destroy();
  });
});
