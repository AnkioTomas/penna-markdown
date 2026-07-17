import { expect, it } from "vitest";
import { Registry } from "@/transformer/core/Registry.js";

it("Registry exposes Penna extend block parsers", () => {
  const registry = new Registry();
  expect(registry.getBlockParser("alert")?.type).toBe("alert");
  expect(registry.getBlockParser("frontmatter")?.type).toBe("frontmatter");
  expect(registry.getBlockParser("list")?.type).toBe("list");
});
