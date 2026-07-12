import { expect, it } from "vitest";
import { flattenImageAlt } from "@/transformer/utils/linkReference.js";

it("flattenImageAlt joins nested text nodes for image alt text", () => {
  const alt = flattenImageAlt([
    { type: "text", length: 1, value: "a" },
    {
      type: "emphasis",
      length: 1,
      children: [{ type: "text", length: 1, value: "b" }],
    },
  ]);

  expect(alt).toBe("ab");
});
