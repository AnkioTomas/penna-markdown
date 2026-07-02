import { describe, expect, it } from "vitest";
import { isHttpUrl, isSafeUrl, renderSafeAnchor, renderSafeImage } from "@/transformer/utils/safeUrl.js";

describe("utils/safeUrl", () => {
  it("allows relative and http(s) URLs", () => {
    expect(isSafeUrl("/path")).toBe(true);
    expect(isSafeUrl("#anchor")).toBe(true);
    expect(isSafeUrl("https://example.com")).toBe(true);
    expect(isSafeUrl("mailto:a@b.c")).toBe(true);
  });

  it("allows empty href (GFM example 169)", () => {
    expect(isSafeUrl("")).toBe(true);
    expect(renderSafeAnchor("", "foo")).toBe('<a href="">foo</a>');
  });

  it("blocks javascript and data URLs", () => {
    expect(isSafeUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
    expect(isSafeUrl("vbscript:msgbox(1)")).toBe(false);
    expect(isSafeUrl("file:///etc/passwd")).toBe(false);
  });

  it("allows GFM autolink schemes (examples 606/607/609)", () => {
    expect(renderSafeAnchor("a+b+c:d", "a+b+c:d")).toBe(
      '<a href="a+b+c:d">a+b+c:d</a>',
    );
    expect(renderSafeAnchor("made-up-scheme://foo,bar", "made-up-scheme://foo,bar")).toBe(
      '<a href="made-up-scheme://foo,bar">made-up-scheme://foo,bar</a>',
    );
    expect(renderSafeAnchor("localhost:5001/foo", "localhost:5001/foo")).toBe(
      '<a href="localhost:5001/foo">localhost:5001/foo</a>',
    );
  });

  it("renderSafeAnchor drops unsafe href", () => {
    expect(renderSafeAnchor("javascript:alert(1)", "x")).toBe("x");
    expect(renderSafeAnchor("https://example.com", "x")).toBe(
      '<a href="https://example.com">x</a>',
    );
  });

  it("renderSafeImage drops unsafe src", () => {
    expect(renderSafeImage("javascript:alert(1)", "alt")).toBe("alt");
    expect(renderSafeImage("https://example.com/a.png", "alt")).toContain('src="https://example.com/a.png"');
  });

  it("isHttpUrl requires http(s)", () => {
    expect(isHttpUrl("https://example.com")).toBe(true);
    expect(isHttpUrl("javascript:alert(1)")).toBe(false);
  });
});
