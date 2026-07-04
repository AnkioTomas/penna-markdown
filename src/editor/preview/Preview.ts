import { Renderer } from "@/renderer/Renderer";
import type { PreviewOptions } from "./PreviewOptions";
import {
  THEME_EVENT_LIGHT_DARK,
  THEME_EVENT_SKIN,
  type Theme,
} from "@/theme/Theme";

export class Preview {
  private readonly theme: Theme;
  private readonly renderer: Renderer;
  private lastMarkdown = "";
  private readonly offs = new Set<() => void>();

  constructor(
    mount: HTMLElement,
    theme: Theme,
    options: PreviewOptions = {},
  ) {
    this.theme = theme;
    this.renderer = new Renderer({
      mount,
      theme,
      inlineParsers: options.inlineParsers,
      blockParsers: options.blockParsers,
    });

    this.offs.add(theme.on("editor:change", (payload) => {
      this.lastMarkdown = (payload as { markdown: string }).markdown;
      this.renderFromMarkdown(this.lastMarkdown);
    }));
    this.offs.add(theme.on(THEME_EVENT_LIGHT_DARK, () => {
      if (this.lastMarkdown) this.renderFromMarkdown(this.lastMarkdown);
    }));
    this.offs.add(theme.on(THEME_EVENT_SKIN, () => {
      if (this.lastMarkdown) this.renderFromMarkdown(this.lastMarkdown);
    }));
  }

  render(markdown: string): void {
    this.lastMarkdown = markdown;
    this.renderFromMarkdown(markdown);
  }

  private renderFromMarkdown(markdown: string): void {
    const { html, ast } = this.renderer.render(markdown);
    this.theme.emit("preview:rendered", { markdown, html, ast });
  }

  destroy(): void {
    for (const off of this.offs) off();
    this.offs.clear();
    this.renderer.destroy();
  }
}
