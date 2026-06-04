import { createEditor } from "../../src/editor/index.js";

const mount = document.querySelector("#editor");
const preview = document.querySelector("#preview");

const initial = `# Cherry Markdown Next

试试改这里的 Markdown：  
- 支持列表
- 支持代码块

\`\`\`js
console.log("hello");
\`\`\`
`;

const editor = createEditor({
  mount,
  preview,
  initial,
});

window.cherryEditorDemo = editor;

