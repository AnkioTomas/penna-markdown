import { expect, it } from "vitest";
import {
  isHttpUrl,
  isSafeUrl,
  renderSafeAnchor,
  renderSafeImage,
} from "@/transformer/utils/safeUrl.js";

it("allows empty href (GFM example 169)", () => {
  expect(isSafeUrl("")).toBe(true);
  expect(renderSafeAnchor("", "foo")).toBe('<a href="">foo</a>');
});
