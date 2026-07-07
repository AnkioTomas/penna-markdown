import { createEngineWithExtensions } from "../helpers/engine.js";
import { createEngine, renderMarkdown } from "../helpers/engine.js";

const transformer = createEngineWithExtensions(["html_attrs"]);

console.log("Testing: **bold**{highlight}");
const html = renderMarkdown(transformer, "**bold**{highlight}");
console.log("Result:", html);
console.log('Expected: <p><strong class="highlight">bold</strong></p>');
