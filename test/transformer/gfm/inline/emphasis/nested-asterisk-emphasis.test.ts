import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("nested asterisk emphasis", () => {
  const html = renderMarkdown(createEngine(), "*outer *inner* outer*");
  expect(html).toBe("<p><em>outer <em>inner</em> outer</em></p>\n");
});
