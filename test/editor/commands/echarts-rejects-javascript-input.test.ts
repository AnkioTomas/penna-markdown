import { expect, it } from "vitest";
import { validateEchartsJson } from "@/editor/commands/groups/EchartsCommand.js";

it("accepts JSON and rejects JavaScript expressions without evaluating them", () => {
  expect(validateEchartsJson('{"series": []}')).toBeNull();
  expect(validateEchartsJson("({ x: globalThis.alert(1) })")).toBe(
    "无效的 JSON 格式",
  );
});
