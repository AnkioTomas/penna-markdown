import { expect, it } from "vitest";
import {
  isHttpUrl,
  isSafeUrl,
  renderSafeAnchor,
  renderSafeImage,
} from "@/transformer/utils/safeUrl.js";

it("renderSafeImage drops unsafe src", () => {
  expect(renderSafeImage("javascript:alert(1)", "alt")).toBe("alt");
  expect(renderSafeImage("https://example.com/a.png", "alt")).toContain(
    'src="https://example.com/a.png"',
  );
});
