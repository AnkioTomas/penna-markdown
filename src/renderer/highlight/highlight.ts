import { Theme } from "@/theme/Theme";
import hljs from "highlight.js";
import {HLJS_THEME_DARK, HLJS_THEME_LIGHT} from "@/renderer/highlight/hljsThemes";

export class HighlightJs {
  constructor(
    private el: HTMLElement,
    private theme: Theme,
  ) {
    this.injectHljsTheme(document);
  }

  injectHljsTheme(doc: Document): void {
    const css = this.theme.getTheme().isDark ? HLJS_THEME_DARK : HLJS_THEME_LIGHT;
    const HLJS_THEME_STYLE_ID = "hljsTheme";
    let style = doc.getElementById(HLJS_THEME_STYLE_ID) as HTMLStyleElement | null;
    if (!style) {
      style = doc.createElement("style");
      style.id = HLJS_THEME_STYLE_ID;
      doc.head.appendChild(style);
    }
    // @ts-ignore
    style.textContent = css;
  }

  run() {
    this.el.querySelectorAll(".cherry-code-block__panel code[data-cherry-code]").forEach((codeEl) => {
      if (!("classList" in codeEl)) return;
      const el = codeEl as HTMLElement;
      if (el.dataset.cherryHighlighted === "1") return;

      const langMatch = [...el.classList].find((className) => className.startsWith("language-"));
      const lang = langMatch ? langMatch.slice("language-".length) : "";

      try {
        el.innerHTML = this.highlightCodeHtml(codeEl.textContent, lang);
        el.classList.add("cherry-code-block__highlighted", "hljs");
        if (lang) {
          el.classList.add(`language-${lang}`);
        }
        el.dataset.cherryHighlighted = "1";
      } catch {
        el.dataset.cherryHighlighted = "0";
      }
    });
  }

  highlightCodeHtml(code: string, lang: string): string {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang, ignoreIllegals: true }).value;
    }
    if (code) {
      return hljs.highlightAuto(code).value;
    }
    return "";
  }
}

