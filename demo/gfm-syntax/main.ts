import "../highlight-setup.js";
import "../theme-watch.js";
import { TransformerEngine } from "@/transformer/TransformerEngine.js";
import {
  createExtensionOptions,
  getAvailableExtensions,
} from "@/transformer/extends/extends.js";
import { initSyntaxDemo } from "../syntax-demo.js";
import { gfmSyntaxExamples } from "./examples/index.js";

const transformer = new TransformerEngine(
  createExtensionOptions(getAvailableExtensions()),
);

const demo = initSyntaxDemo({
  examples: gfmSyntaxExamples,
  transformer,
  formatStatus: (time) => `GFM · 全部扩展 · ${time}`,
});

window.cherryGfmSyntaxDemo = { ...demo, transformer };
