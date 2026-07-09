import { expect, it } from "vitest";
import { decodeHtmlEntities } from "@/transformer/utils/htmlEntities.js";

it("decodeHtmlEntities replaces valid entities and leaves unknown names intact", () => {
  expect(decodeHtmlEntities("a &amp; b &lt;c&gt;")).toBe("a & b <c>");
  expect(decodeHtmlEntities("&notanentity;")).toBe("&notanentity;");
});
