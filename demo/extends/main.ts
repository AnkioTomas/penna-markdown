import { createDemoTheme } from "../theme.js";
import { initSyntaxDemo } from "../syntax-demo.js";
import { builtinSyntaxExamples } from "./syntax-examples.js";

const theme = createDemoTheme();

const demo = initSyntaxDemo({
  examples: builtinSyntaxExamples,
  theme,
  listId: "extensions-list",
  formatStatus: (time) => `全部扩展 · ${time}`,
});

window.cherryExtendsDemo = { ...demo, theme };
