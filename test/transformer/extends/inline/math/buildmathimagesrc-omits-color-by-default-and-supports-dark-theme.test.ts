import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";
import mathBlockParser from "@/transformer/extends/block/mathBlock.js";

it("buildMathImageSrc omits color by default and supports dark theme", () => {
  expect(mathBlockParser.buildMathImageSrc("x^2", { inline: true })).toBe(
    "https://math-api-delta.vercel.app/?inline=x%5E2",
  );
  expect(mathBlockParser.buildMathImageSrc("x^2", { color: "white" })).toBe(
    "https://math-api-delta.vercel.app/?from=x%5E2&color=white",
  );
});
