import { Cherry } from "@/editor/Cherry.js";
import { THEME_EVENT_LIGHT_DARK, THEME_EVENT_SKIN } from "@/theme/Theme.js";
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
  sidebar: {
    fetchFiles: async () => {
      // 模拟一点网络延迟
      await new Promise(r => setTimeout(r, 400));
      return [
        {
          id: "simple",
          title: "Cherry 语法速览",
          updateTime: "刚刚",
          summary: "完整演示 · 精简篇幅。快速体验 Cherry Markdown Next 的全量基础语法功能。"
        },
        {
          id: "test",
          title: "压力测试长文档",
          updateTime: "2小时前",
          summary: "边界/压力/回归测试文档，包含复杂语法嵌套与海量文本渲染用例。"
        }
      ];
    },
    onFileClick: (id) => {
      if (id === "test" || id === "simple") {
        setEditorDemoDoc(id);
        editor.setMarkdown(DOC_SOURCES[id]);
      }
    }
  },
});

const themeSelect = document.getElementById("editor-theme-select") as HTMLSelectElement | null;
const appearanceSelect = document.getElementById("editor-appearance-select") as HTMLSelectElement | null;

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

function syncDemoChrome() {
  document.body.classList.toggle("demo-dark", editor.theme.getTheme().isDark);
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
}

function applyResolvedAppearance() {
  editor.theme.setLightDark(resolveAppearance(appearance));
  try {
    localStorage.setItem(APPEARANCE_STORAGE_KEY, appearance);
  } catch {
    /* ignore */
  }
}

function toggleAppearance() {
  appearance = editor.theme.getTheme().isDark ? "light" : "dark";
  applyResolvedAppearance();
}

editor.theme.on(THEME_EVENT_LIGHT_DARK, syncDemoChrome);
editor.theme.on(THEME_EVENT_SKIN, syncDemoChrome);
editor.theme.setLightDark(resolveAppearance(appearance));

populateThemeSelect();
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

window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
  if (appearance !== "auto") return;
  editor.theme.setLightDark(resolveAppearance("auto"));
});

editor.theme.on("editor:layout", ({ mode }) => {
  console.log("[editor:layout]", mode);
});

export { editor, DOC_SOURCES };
