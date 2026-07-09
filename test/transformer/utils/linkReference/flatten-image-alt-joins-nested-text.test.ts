import { expect, it } from "vitest";
import { flattenImageAlt } from "@/transformer/utils/linkReference.js";

it("flattenImageAlt joins nested text nodes for image alt text", () => {
  const alt = flattenImageAlt([
    { type: "text", value: "a" },
    {
      type: "emphasis",
      children: [{ type: "text", value: "b" }],
    },
  ]);

  expect(alt).toBe("ab");
});
