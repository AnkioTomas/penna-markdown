import type { ToolbarOptions } from "@/editor/toolbar/ToolbarOptions";
import type { Theme } from "@/theme/Theme";

export interface ToolbarParams {
  mount: HTMLElement;
  theme: Theme;
  options: ToolbarOptions;
}

/** 工具栏容器（MVP：内容置空） */
export class Toolbar {
  constructor({ mount }: ToolbarParams) {
    mount.replaceChildren();
  }

  destroy(): void {}
}
