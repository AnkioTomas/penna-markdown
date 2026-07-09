import { expect, it } from "vitest";
import { Registry } from "@/transformer/core/Registry.js";

it("Registry exposes Cherry extend inline parsers", () => {
  const registry = new Registry();
  expect(registry.getInlineParser("highlight")?.type).toBe("highlight");
  expect(registry.getInlineParser("spoiler")?.type).toBe("spoiler");
  expect(registry.getInlineParser("frontmatter_var")?.type).toBe(
    "frontmatter_var",
  );
});
