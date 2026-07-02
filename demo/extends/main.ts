import { demoHighlightSetup } from "../highlight-setup.js";
import "../theme-watch.js";
import { TransformerEngine } from "@/transformer/TransformerEngine.js";
import { initSyntaxDemo } from "../syntax-demo.js";
import { builtinSyntaxExamples } from "./syntax-examples.js";

const transformer = new TransformerEngine();

const demo = initSyntaxDemo({
  examples: builtinSyntaxExamples,
  transformer,
  highlight: demoHighlightSetup,
  listId: "extensions-list",
  formatStatus: (time) => `全部扩展 · ${time}`,
});

window.cherryExtendsDemo = { ...demo, transformer };
