/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi } from "vitest";
import { Theme } from "@/theme/Theme";
import { requestDialog } from "@/editor/dialog/requestDialog.js";

import { validateFrontmatterYaml } from "@/editor/dialog/FrontmatterDialog.js";

describe("validateFrontmatterYaml", () => {
  it("accepts simple yaml", () => {
    expect(validateFrontmatterYaml("title: 标题\ndescription: 描述")).toBeNull();
  });

  it("rejects invalid line", () => {
    expect(validateFrontmatterYaml("title 标题")).toMatch(/无效/);
  });
});

describe("requestDialog", () => {
  it("resolves with dialog data", async () => {
    const theme = new Theme();
    let id = "";
    theme.on("editor:dialog:open", (payload) => {
      id = (payload as { id: string }).id;
    });
    const p = requestDialog(theme, "link", { text: "a", url: "b" });
    await Promise.resolve();
    theme.emit("editor:dialog:result", {
      id,
      data: { text: "T", url: "https://x.test" },
    });
    const result = await p;
    expect(result).toEqual({ text: "T", url: "https://x.test" });
  });

  it("resolves null when cancelled", async () => {
    const theme = new Theme();
    let id = "";
    theme.on("editor:dialog:open", (payload) => {
      id = (payload as { id: string }).id;
    });
    const p = requestDialog(theme, "table");
    await Promise.resolve();
    theme.emit("editor:dialog:result", { id, cancelled: true });
    expect(await p).toBeNull();
  });
});
