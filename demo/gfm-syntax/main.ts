import { createDemoTheme } from "../theme.js";
import { initSyntaxDemo } from "../syntax-demo.js";
import { gfmSyntaxExamples } from "./examples/index.js";

const theme = createDemoTheme();

const demo = initSyntaxDemo({
  examples: gfmSyntaxExamples,
  theme,
  formatStatus: (time) => `GFM · 全部扩展 · ${time}`,
});

window.cherryGfmSyntaxDemo = { ...demo, theme };
