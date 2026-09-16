import { describe, expect, it } from "vitest";
import {
  DEFAULT_SHORTCUTS,
  resolveShortcuts,
  toTauriAccelerator,
} from "@/editor/editor/shortcuts.js";

describe("resolveShortcuts", () => {
  it("returns a copy of defaults when omitted", () => {
    const resolved = resolveShortcuts();
    expect(resolved).toEqual({ ...DEFAULT_SHORTCUTS });
    expect(resolved).not.toBe(DEFAULT_SHORTCUTS);
  });

  it("keeps host-safe mainstream defaults", () => {
    expect(DEFAULT_SHORTCUTS.code).toBe("Shift-Mod-`");
    expect(DEFAULT_SHORTCUTS.codeBlockBasic).toBe("Shift-Mod-k");
    expect(DEFAULT_SHORTCUTS.table).toBe("Mod-t");
    expect(DEFAULT_SHORTCUTS.orderedList).toBe("Shift-Mod-[");
    expect(DEFAULT_SHORTCUTS.unorderedList).toBe("Shift-Mod-]");
    expect(DEFAULT_SHORTCUTS.mathBlock).toBe("Shift-Mod-m");
    expect(DEFAULT_SHORTCUTS.math).toBeUndefined();
    expect(DEFAULT_SHORTCUTS.heading6).toBe("Mod-6");
  });

  it("returns empty map when disabled", () => {
    expect(resolveShortcuts(false)).toEqual({});
  });

  it("overrides and deletes entries", () => {
    const resolved = resolveShortcuts({
      bold: "Mod-Shift-b",
      italic: null,
      link: "",
      custom: "Mod-y",
      math: "Shift-Mod-4",
    });
    expect(resolved.bold).toBe("Mod-Shift-b");
    expect(resolved.italic).toBeUndefined();
    expect(resolved.link).toBeUndefined();
    expect(resolved.custom).toBe("Mod-y");
    expect(resolved.math).toBe("Shift-Mod-4");
    expect(resolved.code).toBe(DEFAULT_SHORTCUTS.code);
  });
});

describe("toTauriAccelerator", () => {
  it("maps Mod and Shift-Mod keys", () => {
    expect(toTauriAccelerator("Mod-b")).toBe("CmdOrCtrl+B");
    expect(toTauriAccelerator("Shift-Mod-x")).toBe("CmdOrCtrl+Shift+X");
    expect(toTauriAccelerator("Alt-Mod-1")).toBe("CmdOrCtrl+Alt+1");
    expect(toTauriAccelerator("Shift-Mod-`")).toBe("CmdOrCtrl+Shift+`");
    expect(toTauriAccelerator("Shift-Mod-[")).toBe("CmdOrCtrl+Shift+[");
  });

  it("rejects unknown modifiers", () => {
    expect(() => toTauriAccelerator("Foo-b")).toThrow(/Unknown modifier/);
  });
});
