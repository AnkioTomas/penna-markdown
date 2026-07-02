import { demoHighlightSetup } from "../highlight-setup.js";
import { createEditor } from "@/editor/index.js";
import { requiredEl } from "../dom.js";
import example from "../test.md?raw";

const mount = requiredEl<HTMLElement>("#editor");
const preview = requiredEl<HTMLElement>("#preview");

const editor = createEditor({
  mount,
  preview,
  initial: example,
  rendererOptions: { highlight: demoHighlightSetup },
});

window.cherryEditorDemo = editor;
