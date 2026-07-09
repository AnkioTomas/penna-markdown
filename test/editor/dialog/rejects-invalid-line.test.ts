/**
 * @vitest-environment jsdom
 */

import { expect, it } from "vitest";
import { Theme } from "@/theme/Theme";
import { requestDialog } from "@/editor/dialog/requestDialog.js";
import { validateFrontmatterYaml } from "@/editor/commands/groups/FrontmatterCommand.js";

it("rejects invalid line", () => {
  expect(validateFrontmatterYaml("title 标题")).toMatch(/无效/);
});
