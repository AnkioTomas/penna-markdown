/**
 * @vitest-environment jsdom
 */

import { expect, it } from "vitest";
import { Theme } from "@/theme/Theme";
import { requestDialog } from "@/editor/dialog/requestDialog.js";
import { validateFrontmatterYaml } from "@/editor/commands/groups/FrontmatterCommand.js";

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
