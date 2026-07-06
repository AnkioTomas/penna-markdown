import type { Theme } from "@/theme/Theme";

/** 侧边栏容器（MVP：内容置空，无 TOC） */
export class SideBar {
  constructor(
    mount: HTMLElement,
    _theme: Theme,
  ) {
    mount.replaceChildren();
  }

  destroy(): void {}
}
