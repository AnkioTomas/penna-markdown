import type { SideBarOptions } from "./SideBarOptions";
import type { Theme } from "@/theme/Theme";

/** 侧边栏容器（MVP：内容置空，无 TOC） */
export class SideBar {
  constructor(
    mount: HTMLElement,
    _theme: Theme,
    options: SideBarOptions = {},
  ) {
    mount.replaceChildren();
    if (options.hidden) {
      mount.style.display = "none";
    }
  }

  destroy(): void {}
}
