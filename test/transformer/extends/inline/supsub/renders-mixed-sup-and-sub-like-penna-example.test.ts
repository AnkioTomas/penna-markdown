import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("renders mixed sup and sub like penna example", () => {
  const engine = () => createEngine();
  const html = renderMarkdown(createEngine(), "大头 ^儿子^ 和小头 ~爸爸~");
  expect(html).toBe("<p>大头 <sup>儿子</sup> 和小头 <sub>爸爸</sub></p>\n");
});
