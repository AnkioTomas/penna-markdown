import { describe, expect, it } from "vitest";
import { createEngine } from "../helpers/engine.js";

describe("block/blockquote", () => {
  it("renders paragraph inside blockquote", () => {
    const { html } = createEngine().render("> foo\n");
    expect(html).toBe("<blockquote>\n<p>foo</p>\n</blockquote>\n");
  });

  it("renders nested blockquote", () => {
    const { html } = createEngine().render(">> bar\n");
    expect(html).toBe(
      "<blockquote>\n<blockquote>\n<p>bar</p>\n</blockquote>\n</blockquote>\n",
    );
  });

  it("merges lazy continuation lines with fewer markers (CommonMark #253)", () => {
    const { html } = createEngine().render(">>> foo\n> bar\n>>baz\n");
    expect(html).toBe(
      "<blockquote>\n<blockquote>\n<blockquote>\n<p>foo\nbar\nbaz</p>\n</blockquote>\n</blockquote>\n</blockquote>\n",
    );
  });

  it("merges lazy continuation without markers (CommonMark #252)", () => {
    const { html } = createEngine().render("> > > foo\nbar\n");
    expect(html).toBe(
      "<blockquote>\n<blockquote>\n<blockquote>\n<p>foo\nbar</p>\n</blockquote>\n</blockquote>\n</blockquote>\n",
    );
  });

  it("renders empty blockquote (CommonMark #241-242)", () => {
    expect(createEngine().render(">\n").html).toBe("<blockquote>\n</blockquote>\n");
    expect(createEngine().render(">\n>  \n> \n").html).toBe(
      "<blockquote>\n</blockquote>\n",
    );
  });

  it("paragraph interrupted by blockquote (CommonMark #247)", () => {
    expect(createEngine().render("foo\n> bar\n").html).toBe(
      "<p>foo</p>\n<blockquote>\n<p>bar</p>\n</blockquote>\n",
    );
  });

  it("blank marker line splits paragraphs (CommonMark #246)", () => {
    expect(createEngine().render("> foo\n>\n> bar\n").html).toBe(
      "<blockquote>\n<p>foo</p>\n<p>bar</p>\n</blockquote>\n",
    );
  });
});
