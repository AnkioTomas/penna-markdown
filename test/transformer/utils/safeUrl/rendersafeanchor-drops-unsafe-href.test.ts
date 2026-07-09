import { expect, it } from "vitest";
import {
  isHttpUrl,
  isSafeUrl,
  renderSafeAnchor,
  renderSafeImage,
} from "@/transformer/utils/safeUrl.js";

it("renderSafeAnchor drops unsafe href", () => {
  expect(renderSafeAnchor("javascript:alert(1)", "x")).toBe("x");
  expect(renderSafeAnchor("https://example.com", "x")).toBe(
    '<a href="https://example.com">x</a>',
  );
});
