import { expect, it } from "vitest";
import { createEngine, renderMarkdown } from "../../../../helpers/engine.js";

const MD = ["```js", "const x = 1;", "```"].join("\n");

it("still honours the deprecated enable alias", () => {
  const legacy = renderMarkdown(
    createEngine({ syntaxOptions: { code: { enable: true } } }),
    MD,
  );
  expect(legacy).toContain('class="penna-code-block"');

  // enhanced 优先于旧名，可以显式关掉增强渲染
  const overridden = renderMarkdown(
    createEngine({
      syntaxOptions: { code: { enable: true, enhanced: false } },
    }),
    MD,
  );
  expect(overridden).not.toContain("penna-code-block");
  expect(overridden).toContain('<pre><code class="language-js">');
});
