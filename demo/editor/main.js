import { createEditor } from "../../src/editor/index.js";
import example from "../test.md?raw";

const mount = document.querySelector("#editor");
const preview = document.querySelector("#preview");

const editor = createEditor({
  mount,
  preview,
  initial: example,
});

window.cherryEditorDemo = editor;

