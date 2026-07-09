/**
 * @vitest-environment jsdom
 */

import { expect, it } from "vitest";
import { Theme } from "@/theme/Theme";
import { requestDialog } from "@/editor/dialog/requestDialog.js";
import { validateFrontmatterYaml } from "@/editor/commands/groups/FrontmatterCommand.js";

it("accepts simple yaml", () => {
  expect(validateFrontmatterYaml("title: 标题\ndescription: 描述")).toBeNull();
});
