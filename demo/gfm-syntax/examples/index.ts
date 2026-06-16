import type { SyntaxExample } from "../../syntax-example.js";
import typical from "./typical.js";
import heading from "./heading.js";
import setext from "./setext.js";
import emphasis from "./emphasis.js";
import strikethrough from "./strikethrough.js";
import links from "./links.js";
import images from "./images.js";
import lists from "./lists.js";
import tasklist from "./tasklist.js";
import blockquote from "./blockquote.js";
import code from "./code.js";
import table from "./table.js";
import hr from "./hr.js";
import linkReference from "./linkReference.js";
import html from "./html.js";
import entity from "./entity.js";

/** GFM 内置语法演示（对应 transformer/gfm/builtin） */
export const gfmSyntaxExamples: SyntaxExample[] = [
  typical,
  heading,
  setext,
  emphasis,
  strikethrough,
  links,
  images,
  lists,
  tasklist,
  blockquote,
  code,
  table,
  hr,
  linkReference,
  html,
  entity,
];
