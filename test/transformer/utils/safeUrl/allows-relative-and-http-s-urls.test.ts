import { expect, it } from "vitest";
import {
  isHttpUrl,
  isSafeUrl,
  renderSafeAnchor,
  renderSafeImage,
} from "@/transformer/utils/safeUrl.js";

it("allows relative and http(s) URLs", () => {
  expect(isSafeUrl("/path")).toBe(true);
  expect(isSafeUrl("#anchor")).toBe(true);
  expect(isSafeUrl("https://example.com")).toBe(true);
  expect(isSafeUrl("mailto:a@b.c")).toBe(true);
});
