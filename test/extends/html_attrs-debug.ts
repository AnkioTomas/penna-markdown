import { createTransformerWithExtensions } from "@/transformer/extends/extends.js";
import { createEngine, renderMarkdown } from "../helpers/engine.js";

const transformer = createTransformerWithExtensions(["html_attrs"]);

console.log("Testing: **bold**{highlight}");
const html = renderMarkdown(transformer, '**bold**{highlight}');
console.log("Result:", html);
console.log("Expected: <p><strong class=\"highlight\">bold</strong></p>");
