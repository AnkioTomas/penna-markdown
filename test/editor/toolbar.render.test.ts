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

  it("renders grouped menus without layout controls", () => {
    const mount = document.createElement("div");
    document.body.appendChild(mount);
    const theme = new Theme();
    const toolbar = new Toolbar(mount, theme, {});

    expect(mount.querySelector(".cherry-toolbar-scroll")).toBeTruthy();
    expect(mount.querySelector(".cherry-toolbar-layout")).toBeFalsy();
    expect(mount.querySelector('[data-toolbar-id="themeMenu"]')).toBeTruthy();

    toolbar.destroy();
  });

  it("renders nested heading menu under structure", () => {
    const mount = document.createElement("div");
    document.body.appendChild(mount);
    const theme = new Theme();
    const toolbar = new Toolbar(mount, theme, {});

    const structureMenu = mount.querySelector('[data-toolbar-id="structure"]');
    expect(structureMenu).toBeTruthy();
    const trigger = structureMenu?.querySelector(
      ".cherry-toolbar-menu-trigger",
    ) as HTMLButtonElement;
    trigger?.click();
    expect(structureMenu?.classList.contains("is-open")).toBe(true);

    const headingMenu = structureMenu?.querySelector(
      '[data-toolbar-id="heading"]',
    );
    expect(headingMenu).toBeTruthy();
    expect(
      headingMenu?.querySelectorAll(".cherry-toolbar-menu-item").length,
    ).toBe(6);

    toolbar.destroy();
  });

  it("shows icon and label together in menu items", () => {
    const mount = document.createElement("div");
    document.body.appendChild(mount);
    const theme = new Theme();
    const toolbar = new Toolbar(mount, theme, {});

    const formatMenu = mount.querySelector('[data-toolbar-id="textFormat"]');
    const trigger = formatMenu?.querySelector(
      ".cherry-toolbar-menu-trigger",
    ) as HTMLButtonElement;
    trigger?.click();

    expect(trigger?.querySelector("svg")).toBeTruthy();
    expect(
      trigger?.querySelector(".cherry-toolbar-btn-label")?.textContent,
    ).toBe("格式");

    const boldItem = formatMenu?.querySelector('[data-toolbar-id="bold"]');
    expect(boldItem?.querySelector("svg")).toBeTruthy();
    expect(
      boldItem?.querySelector(".cherry-toolbar-btn-label")?.textContent,
    ).toBe("加粗");

    toolbar.destroy();
  });

  it("shows footnote submenu under insert", () => {
    const mount = document.createElement("div");
    document.body.appendChild(mount);
    const theme = new Theme();
    const toolbar = new Toolbar(mount, theme, {});

    const insertMenu = mount.querySelector('[data-toolbar-id="insert"]');
    (
      insertMenu?.querySelector(
        ".cherry-toolbar-menu-trigger",
      ) as HTMLButtonElement
    )?.click();
    expect(
      insertMenu?.querySelector('[data-toolbar-id="footnoteMenu"]'),
    ).toBeTruthy();

    toolbar.destroy();
  });

  it("emits editor:command when bold is clicked from format menu", () => {
    const mount = document.createElement("div");
    document.body.appendChild(mount);
    const theme = new Theme();
    let command = "";
    theme.on("editor:command", (payload) => {
      command = (payload as { command: string }).command;
    });
    const toolbar = new Toolbar(mount, theme, {});

    const formatMenu = mount.querySelector('[data-toolbar-id="textFormat"]');
    (
      formatMenu?.querySelector(
        ".cherry-toolbar-menu-trigger",
      ) as HTMLButtonElement
    )?.click();
    const boldBtn = formatMenu?.querySelector(
      '[data-toolbar-id="bold"]',
    ) as HTMLButtonElement;
    boldBtn?.click();
    expect(command).toBe("bold");
    toolbar.destroy();
  });

  it("calls options.onClick when a custom added item without command is clicked", () => {
    const mount = document.createElement("div");
    document.body.appendChild(mount);
    const theme = new Theme();
    let clickedId = "";
    const toolbar = new Toolbar(mount, theme, {
      items: [{ id: "my-custom-btn", label: "Custom" }],
      onClick: (id) => {
        clickedId = id;
      },
    });

    const btn = mount.querySelector('[data-toolbar-id="my-custom-btn"]') as HTMLButtonElement;
    expect(btn).toBeTruthy();
    btn?.click();
    expect(clickedId).toBe("my-custom-btn");
    toolbar.destroy();
  });
});
