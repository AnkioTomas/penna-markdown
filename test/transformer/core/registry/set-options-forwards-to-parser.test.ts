import { expect, it } from "vitest";
import { Registry } from "@/transformer/core/Registry.js";

it("Registry setOptions forwards options to parser instance", () => {
  const registry = new Registry();
  registry.setOptions({
    math_block: { apiHost: "https://math.example.test" },
  });
  expect(registry.getBlockParser("math_block")?.getOptions()).toEqual({
    apiHost: "https://math.example.test",
  });
});
