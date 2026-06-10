import { createTransformerWithExtensions } from "@/transformer/extends/extends.js";

const transformer = createTransformerWithExtensions(["html_attrs"]);

console.log("Testing: **bold**{highlight}");
const { html } = transformer.render('**bold**{highlight}');
console.log("Result:", html);
console.log("Expected: <p><strong class=\"highlight\">bold</strong></p>");
