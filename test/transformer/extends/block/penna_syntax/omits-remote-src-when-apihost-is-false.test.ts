import { expect, it } from "vitest";
import mathBlockParser from "@/transformer/extends/block/mathBlock.js";
import {
  buildEchartsImageSrc,
  buildMermaidImageSrc,
  renderEchartsBlock,
  renderMermaidBlock,
} from "@/transformer/extends/block/specialCode.js";

it("buildMathImageSrc returns empty when apiHost is false", () => {
  expect(mathBlockParser.buildMathImageSrc("x^2", { apiHost: false })).toBe("");
  expect(mathBlockParser.buildMathImageSrc("x^2", { apiHost: "" })).toBe("");
});

it("mermaid/echarts builders return empty when apiHost is false", () => {
  expect(buildMermaidImageSrc("flowchart TD\nA-->B", { apiHost: false })).toBe(
    "",
  );
  expect(buildEchartsImageSrc('{"series":[]}', { apiHost: false })).toBe("");
});

it("renders placeholders without src when apiHost is false", () => {
  const mermaid = renderMermaidBlock("flowchart TD\nA-->B", {
    apiHost: false,
  });
  expect(mermaid).toContain("data-mermaid=");
  expect(mermaid).not.toContain("src=");

  const echarts = renderEchartsBlock('{"series":[{"type":"bar"}]}', {
    apiHost: false,
  });
  expect(echarts).toContain("data-echarts=");
  expect(echarts).not.toContain("src=");
});
