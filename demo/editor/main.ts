import { Cherry } from "@/editor/Cherry.js";
import REGISTERED_THEMES from "@/theme/ThemeRegister.js";
import simple from "../simple.md?raw";
import test from "../test.md?raw";

export type EditorDemoDoc = "test" | "simple";
type AppearanceMode = "light" | "dark" | "auto";

const DOC_STORAGE_KEY = "cherry-editor-demo-doc";
const THEME_STORAGE_KEY = "cherry-editor-demo-theme";
const APPEARANCE_STORAGE_KEY = "cherry-editor-demo-appearance";

const THEME_LABELS: Record<string, string> = {
  default: "Default",
  claude: "Claude",
  github: "GitHub",
  morandi: "Morandi",
  latex: "LaTeX",
  vue: "Vue",
  gitbook: "GitBook",
  notion: "Notion",
};

const DOC_SOURCES: Record<EditorDemoDoc, string> = {
  test,
  simple,
};

function readDocFromUrl(): EditorDemoDoc | null {
  const raw = new URLSearchParams(location.search).get("doc");
  if (raw === "test" || raw === "simple") return raw;
  return null;
}

function readStoredDoc(): EditorDemoDoc {
  try {
    const v = localStorage.getItem(DOC_STORAGE_KEY);
    if (v === "test" || v === "simple") return v;
  } catch {
    /* ignore */
  }
  return "test";
}

function persistDoc(doc: EditorDemoDoc) {
  try {
    localStorage.setItem(DOC_STORAGE_KEY, doc);
  } catch {
    /* ignore */
  }
}

function syncDocUrl(doc: EditorDemoDoc) {
  const url = new URL(location.href);
  url.searchParams.set("doc", doc);
  history.replaceState(null, "", url);
}

export function getEditorDemoDoc(): EditorDemoDoc {
  return readDocFromUrl() ?? readStoredDoc();
}

export function setEditorDemoDoc(doc: EditorDemoDoc) {
  persistDoc(doc);
  syncDocUrl(doc);
}

function readAppearance(): AppearanceMode {
  try {
    const saved = localStorage.getItem(APPEARANCE_STORAGE_KEY);
    if (saved === "dark" || saved === "auto") return saved;
  } catch {
    /* ignore */
  }
  return "light";
}

function resolveAppearance(mode: AppearanceMode): "light" | "dark" {
  if (mode === "auto") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return mode;
}

function readThemeId(): string {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved && (REGISTERED_THEMES as readonly string[]).includes(saved)) return saved;
  } catch {
    /* ignore */
  }
  return "default";
}

const initialDoc = getEditorDemoDoc();
persistDoc(initialDoc);
syncDocUrl(initialDoc);

let appearance = readAppearance();

const editor = new Cherry(document.querySelector("#cherry-editor")!!, {
  debug: true,
  themeId: readThemeId(),
  editor: { value: DOC_SOURCES[initialDoc] },
  preview: {},
  transformer: {},
  sidebar: false,
});

editor.theme.setLightDark(resolveAppearance(appearance));

const themeSelect = document.getElementById("editor-theme-select") as HTMLSelectElement | null;
const appearanceSelect = document.getElementById("editor-appearance-select") as HTMLSelectElement | null;
const themeBtn = document.getElementById("editor-theme-btn") as HTMLButtonElement | null;
const docSelect = document.getElementById("editor-doc-select") as HTMLSelectElement | null;

function populateThemeSelect() {
  if (!themeSelect) return;
  themeSelect.replaceChildren(
    ...editor.theme.list().map((id) => {
      const option = document.createElement("option");
      option.value = id;
      option.textContent = THEME_LABELS[id] ?? id;
      return option;
    }),
  );
}

function syncThemeSelect() {
  if (themeSelect) themeSelect.value = editor.theme.getTheme().id;
}

function syncAppearanceSelect() {
  if (appearanceSelect) appearanceSelect.value = appearance;
}

function syncThemeButton() {
  if (!themeBtn) return;
  const { isDark } = editor.theme.getTheme();
  themeBtn.textContent = isDark ? "白天模式" : "夜间模式";
  themeBtn.setAttribute("aria-pressed", isDark ? "true" : "false");
}

function syncDemoChrome() {
  document.body.classList.toggle("demo-dark", editor.theme.getTheme().isDark);
  syncThemeButton();
  syncAppearanceSelect();
  syncThemeSelect();
}

function applyThemeId(next: string) {
  if (!editor.theme.list().includes(next as ReturnType<typeof editor.theme.list>[number])) return;
  const { render, root } = editor.theme.getTheme();
  if (!render || !root) return;
  editor.theme.setTheme(next, render, root);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch {
    /* ignore */
  }
  syncDemoChrome();
}

function applyResolvedAppearance() {
  editor.theme.setLightDark(resolveAppearance(appearance));
  try {
    localStorage.setItem(APPEARANCE_STORAGE_KEY, appearance);
  } catch {
    /* ignore */
  }
  syncDemoChrome();
}

function toggleAppearance() {
  appearance = editor.theme.getTheme().isDark ? "light" : "dark";
  applyResolvedAppearance();
}

editor.theme.on("appearance", syncDemoChrome);
editor.theme.on("change", syncDemoChrome);

populateThemeSelect();
if (docSelect) docSelect.value = initialDoc;
syncDemoChrome();

if (themeSelect) {
  themeSelect.addEventListener("change", () => applyThemeId(themeSelect.value));
}

if (appearanceSelect) {
  appearanceSelect.addEventListener("change", () => {
    appearance = appearanceSelect.value as AppearanceMode;
    applyResolvedAppearance();
  });
}

if (themeBtn) {
  themeBtn.addEventListener("click", toggleAppearance);
}

if (docSelect) {
  docSelect.addEventListener("change", () => {
    const doc = docSelect.value as EditorDemoDoc;
    if (doc !== "test" && doc !== "simple") return;
    setEditorDemoDoc(doc);
    editor.setMarkdown(DOC_SOURCES[doc]);
  });
}

window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
  if (appearance !== "auto") return;
  editor.theme.setLightDark(resolveAppearance("auto"));
  syncDemoChrome();
});

editor.theme.on("editor:layout", ({ mode }) => {
  console.log("[editor:layout]", mode);
});

export { editor, DOC_SOURCES };
