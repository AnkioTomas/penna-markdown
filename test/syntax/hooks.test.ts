import { describe, expect, it } from "vitest";
import { createEngine, renderMarkdown } from "../helpers/engine.js";

describe("syntax/hooks", () => {
  it("uses beforeRender to override default rendering", () => {
    const engine = createEngine({
      beforeRender: ({ name, node }) => {
        if (name === "code") {
          return `<custom-code>${node.content}</custom-code>`;
        }
      },
    });
    const html = renderMarkdown(engine, "```\nhello\n```");
    expect(html).toBe("<custom-code>hello</custom-code>\n");
  });

  it("uses afterRender to post-process html", () => {
    const engine = createEngine({
      afterRender: ({ name, html }) => {
        if (name === "code") {
          return html.replace("<code>", '<code class="processed">');
        }
      },
    });
    const html = renderMarkdown(engine, "```\nhello\n```");
    expect(html).toBe('<pre><code class="processed">hello\n</code></pre>\n');
  });

  it("works with inline hooks", () => {
    const engine = createEngine({
      afterRender: ({ name, html }) => {
        if (name === "text") {
          return html.toUpperCase();
        }
      },
    });
    const html = renderMarkdown(engine, "hello");
    expect(html).toBe("<p>HELLO</p>\n");
  });
});
