import { keymap, type KeyBinding } from "@codemirror/view";
import type { Extension } from "@codemirror/state";
import type { EventBus } from "@/core/event/EventBus";
import type { EditorCommandPayload } from "@/editor/events";

/**
 * CodeMirror 键名，例如 `Mod-b`、`Shift-Mod-k`。
 * `Mod` = macOS ⌘ / 其它平台 Ctrl。
 */
export type ShortcutKey = string;

/**
 * 默认编辑命令快捷键。键为命令 id（与工具栏 / 命令表同源）。
 * 对齐 Typora Windows 为主、Obsidian 补缺；避开命令面板 / 重开标签等宿主键。
 * 不含文件/窗口类宿主快捷键——那些不属于编辑器。
 */
export const DEFAULT_SHORTCUTS: Readonly<Record<string, ShortcutKey>> = {
  bold: "Mod-b",
  italic: "Mod-i",
  // Obsidian；Typora 用 Alt-Shift-5 / Control-Shift-`，跨平台不稳
  strikethrough: "Shift-Mod-x",
  // Typora：Ctrl/Cmd-Shift-`（不用 Mod-e，避免和预览切换抢键）
  code: "Shift-Mod-`",
  heading1: "Mod-1",
  heading2: "Mod-2",
  heading3: "Mod-3",
  heading4: "Mod-4",
  heading5: "Mod-5",
  heading6: "Mod-6",
  blockquote: "Shift-Mod-q",
  // Typora Win：Ctrl-Shift-] / [（不用 Shift-Mod-o，避开「打开文件夹」）
  unorderedList: "Shift-Mod-]",
  orderedList: "Shift-Mod-[",
  taskList: "Shift-Mod-c",
  link: "Mod-k",
  image: "Shift-Mod-i",
  // Typora Win：Ctrl-T（不用 Shift-Mod-t，避开「重开关闭标签」）
  table: "Mod-t",
  // Typora：数学块；行内公式无统一默认，宿主可自行加 `math`
  mathBlock: "Shift-Mod-m",
  // Typora Win：Ctrl-Shift-K（不用 Shift-Mod-p，避开命令面板）
  codeBlockBasic: "Shift-Mod-k",
};

/**
 * 快捷键选项：
 * - `false`：关闭默认命令快捷键
 * - 对象：覆盖默认表；值为 `null` / `""` 表示删除该命令绑定
 * - 省略：使用 {@link DEFAULT_SHORTCUTS}
 */
export type ShortcutsOption =
  false | Partial<Record<string, ShortcutKey | null>>;

/**
 * 解析最终快捷键表。
 *
 * @param opt 见 {@link ShortcutsOption}；省略则返回默认表副本。
 */
export function resolveShortcuts(
  opt?: ShortcutsOption,
): Record<string, ShortcutKey> {
  if (opt === false) {
    return {};
  }
  const resolved: Record<string, ShortcutKey> = { ...DEFAULT_SHORTCUTS };
  if (!opt) {
    return resolved;
  }
  for (const [command, key] of Object.entries(opt)) {
    if (key == null || key === "") {
      delete resolved[command];
    } else {
      resolved[command] = key;
    }
  }
  return resolved;
}

const MODIFIER_TO_TAURI: Record<string, string> = {
  Mod: "CmdOrCtrl",
  Cmd: "Cmd",
  Ctrl: "Ctrl",
  Alt: "Alt",
  Shift: "Shift",
  Meta: "Cmd",
};

/** Tauri 加速键修饰符顺序：与现有桌面菜单约定一致（CmdOrCtrl 在前）。 */
const TAURI_MOD_ORDER = ["CmdOrCtrl", "Cmd", "Ctrl", "Alt", "Shift"];

/**
 * 把 CodeMirror 键名转成 Tauri 菜单 `accelerator` 字符串。
 *
 * @example toTauriAccelerator("Mod-b") → "CmdOrCtrl+B"
 * @example toTauriAccelerator("Shift-Mod-x") → "CmdOrCtrl+Shift+X"
 */
export function toTauriAccelerator(cmKey: string): string {
  const parts = cmKey.split("-").filter(Boolean);
  if (parts.length === 0) {
    return cmKey;
  }
  const key = parts[parts.length - 1]!;
  const mods = parts.slice(0, -1).map((part) => {
    const mapped = MODIFIER_TO_TAURI[part];
    if (!mapped) {
      throw new Error(`Unknown modifier in shortcut: ${part} (${cmKey})`);
    }
    return mapped;
  });
  mods.sort((a, b) => TAURI_MOD_ORDER.indexOf(a) - TAURI_MOD_ORDER.indexOf(b));
  const keyLabel = key.length === 1 ? key.toUpperCase() : key;
  return [...mods, keyLabel].join("+");
}

/** 生成命令快捷键绑定（供 keymap 与测试直接调用）。 */
export function createCommandBindings(
  eventBus: EventBus,
  map: Record<string, ShortcutKey>,
): KeyBinding[] {
  return Object.entries(map).map(([command, key]) => ({
    key,
    run() {
      const payload: EditorCommandPayload = { command };
      eventBus.emit("editor:command", payload);
      return true;
    },
  }));
}

/**
 * 注册命令快捷键：命中后发 `editor:command`（走 CommandBridge，带 logger）。
 * 空表返回空扩展，避免无意义 keymap。
 */
export function createCommandKeymap(
  eventBus: EventBus,
  map: Record<string, ShortcutKey>,
): Extension {
  return keymap.of(createCommandBindings(eventBus, map));
}
