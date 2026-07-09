import { expect, it } from "vitest";
import {
  isHttpUrl,
  isSafeUrl,
  renderSafeAnchor,
  renderSafeImage,
} from "@/transformer/utils/safeUrl.js";

it("isHttpUrl requires http(s)", () => {
  expect(isHttpUrl("https://example.com")).toBe(true);
  expect(isHttpUrl("javascript:alert(1)")).toBe(false);
});
