/**
 * @vitest-environment jsdom
 */

import { expect, it } from "vitest";
import { Theme } from "@/theme/Theme";
import { requestDialog } from "@/editor/dialog/requestDialog.js";
import { validateFrontmatterYaml } from "@/editor/commands/groups/FrontmatterCommand.js";

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
