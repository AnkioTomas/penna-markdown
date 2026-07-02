import {
  parseHighlightLinesAttr,
  readCodeLinesText,
} from "@/transformer/extends/block/enhancedCode.js";
import { findCherryRoot } from "../container.js";

import type { CollapsedCodeAnalysis } from "@/transformer/extends/block/enhancedCode.js";

export interface CodeHighlightContext {
  dark?: boolean;
  panel?: HTMLElement | null;
  highlightLines?: number[];
  collapse?: CollapsedCodeAnalysis | null;
}

export interface CodeHighlightAdapter {
  highlight(
    code: string,
    lang: string,
    ctx?: CodeHighlightContext,
  ): Promise<string> | string;
}

export interface CodeHighlightSetup {
  cdn?: string;
  css?: string | boolean;
  load?: () => Promise<CodeHighlightAdapter>;
  highlight?: CodeHighlightAdapter["highlight"];
  register?: (hljs: unknown) => void | Promise<void>;
}

let registeredLoader: (() => Promise<CodeHighlightAdapter>) | null = null;

export function registerCherryCodeHighlightLoader(
  load: () => Promise<CodeHighlightAdapter>,
): void {
  registeredLoader = load;
}

export function getCherryCodeHighlightLoader(): (() => Promise<CodeHighlightAdapter>) | null {
  return registeredLoader;
}

function encodeSource(text: string): string {
  return btoa(unescape(encodeURIComponent(text)));
}

function decodeSource(encoded: string): string {
  return decodeURIComponent(escape(atob(encoded)));
}

function readCodeSource(codeEl: HTMLElement): string {
  const stored = codeEl.dataset.cherrySource;
  if (stored) return decodeSource(stored);

  const text = readCodeLinesText(codeEl);
  codeEl.dataset.cherrySource = encodeSource(text);
  return text;
}

function applyHighlightHtml(codeEl: HTMLElement, html: string): void {
  const pre = codeEl.closest("pre");
  if (!html) return;

  if (html.includes("<pre")) {
    const tpl = document.createElement("template");
    tpl.innerHTML = html.trim();
    const newPre = tpl.content.querySelector("pre");
    if (!newPre || !pre) return;

    newPre.classList.add("cherry-code-block__pre");
    const newCode = newPre.querySelector("code");
    if (newCode) {
      newCode.dataset.cherryCode = "";
      newCode.dataset.cherryHighlighted = "1";
      if (codeEl.dataset.cherrySource) {
        newCode.dataset.cherrySource = codeEl.dataset.cherrySource;
      }
      const panel = pre.closest(".cherry-code-block__panel");
      if (panel && "dataset" in panel && (panel as HTMLElement).dataset.cherryHighlightLines) {
        newCode.dataset.cherryHighlightLines = (panel as HTMLElement).dataset.cherryHighlightLines;
      }
      for (const cls of codeEl.classList) {
        newCode.classList.add(cls);
      }
    }
    pre.replaceWith(newPre);
    return;
  }

  codeEl.innerHTML = html;
  codeEl.classList.add("cherry-code-block__highlighted", "hljs");
  codeEl.dataset.cherryHighlighted = "1";
}

export function resetCherryCodeHighlightTheme(container: ParentNode | null | undefined): void {
  const root = findCherryRoot(container) ?? container;
  if (!root || !("querySelectorAll" in root)) return;

  root
    .querySelectorAll("code[data-cherry-code], code.cherry-code-block__highlighted")
    .forEach((codeEl) => {
      if (!("dataset" in codeEl)) return;
      delete (codeEl as HTMLElement).dataset.cherryHighlighted;
      delete (codeEl as HTMLElement).dataset.cherryHighlightTheme;
    });
}

export async function hydrateCherryCodeHighlight(
  container: ParentNode | null | undefined,
  options: {
    getAdapter?: () => Promise<CodeHighlightAdapter>;
    isDark?: (container: ParentNode) => boolean;
  } = {},
): Promise<void> {
  const load = options.getAdapter ?? registeredLoader;
  if (!load) return;

  const root = findCherryRoot(container) ?? container;
  if (!root || !("querySelectorAll" in root)) return;

  const adapter = await load();
  const dark = options.isDark?.(container ?? root) ?? false;
  const themeKey = dark ? "dark" : "light";

  const codes = root.querySelectorAll(".cherry-code-block__panel code[data-cherry-code]");
  await Promise.all(
    [...codes].map(async (codeEl) => {
      if (!("classList" in codeEl)) return;
      const el = codeEl as HTMLElement;

      const panel = el.closest(".cherry-code-block__panel");
      if (!panel) return;

      if (el.dataset.cherryHighlighted === "1" && el.dataset.cherryHighlightTheme === themeKey) {
        return;
      }

      const langMatch = [...el.classList].find((c) => c.startsWith("language-"));
      const lang = langMatch ? langMatch.slice("language-".length) : "";
      const source = readCodeSource(el);
      const panelEl = panel as HTMLElement;
      const highlightLines: number[] = parseHighlightLinesAttr(
        panelEl.dataset.cherryHighlightLines ?? el.dataset.cherryHighlightLines,
      );

      try {
        const html = await adapter.highlight(source, lang, { dark, panel: panelEl, highlightLines });
        applyHighlightHtml(el, html);
        const active = panel.querySelector("code[data-cherry-code], code.cherry-code-block__highlighted");
        if (active && "dataset" in active) {
          (active as HTMLElement).dataset.cherryHighlightTheme = themeKey;
        }
      } catch {
        el.dataset.cherryHighlighted = "0";
      }
    }),
  );
}

export function setupCherryCodeHighlight(setup: CodeHighlightSetup | null | undefined): void {
  if (!setup) return;

  if (typeof setup.highlight === "function") {
    const highlight = setup.highlight;
    registerCherryCodeHighlightLoader(async () => ({ highlight }));
    return;
  }

  if (typeof setup.load === "function") {
    registerCherryCodeHighlightLoader(setup.load);
    return;
  }

  if (setup.cdn) {
    registerCherryCodeHighlightLoader(async () => {
      const { loadHighlightJsFromCdn } = await import("./adapters/highlightjsCdn.js");
      return loadHighlightJsFromCdn({
        cdn: setup.cdn,
        css: setup.css,
        register: setup.register,
      });
    });
  }
}
