import { expect, it } from "vitest";
import {
  isHttpUrl,
  isSafeUrl,
  renderSafeAnchor,
  renderSafeImage,
} from "@/transformer/utils/safeUrl.js";

it("allows GFM autolink schemes (examples 606/607/609)", () => {
  expect(renderSafeAnchor("a+b+c:d", "a+b+c:d")).toBe(
    '<a href="a+b+c:d">a+b+c:d</a>',
  );
  expect(
    renderSafeAnchor("made-up-scheme://foo,bar", "made-up-scheme://foo,bar"),
  ).toBe('<a href="made-up-scheme://foo,bar">made-up-scheme://foo,bar</a>');
  expect(renderSafeAnchor("localhost:5001/foo", "localhost:5001/foo")).toBe(
    '<a href="localhost:5001/foo">localhost:5001/foo</a>',
  );
});
