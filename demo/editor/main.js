import { createEditor } from "@/editor/index.js";
import {
  getAvailableExtensions,
  createTransformerWithExtensions,
} from "@/transformer/index.js";
import example from "../test.md?raw";

const mount = document.querySelector("#editor");
const preview = document.querySelector("#preview");

const editor = createEditor({
  mount,
  preview,
  initial: example,
  transformer: (options) =>
    createTransformerWithExtensions(getAvailableExtensions(), options),
});

window.cherryEditorDemo = editor;
