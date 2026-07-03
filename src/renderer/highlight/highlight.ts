import hljs from "highlight.js";

export class HighlightJs {
  constructor(private el: HTMLElement) {}

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
