import "../highlight-setup.js";
import { createEditor } from "@/editor/index.js";
import { TransformerEngine } from "@/transformer/TransformerEngine.js";
import {
  createExtensionOptions,
  getAvailableExtensions,
} from "@/transformer/extends/extends.js";
import { requiredEl } from "../dom.js";
import example from "../test.md?raw";

const mount = requiredEl<HTMLElement>("#editor");
const preview = requiredEl<HTMLElement>("#preview");

const editor = createEditor({
  mount,
  preview,
  initial: example,
  transformer: (options) =>
    new TransformerEngine(createExtensionOptions(getAvailableExtensions(), options)),
});

window.cherryEditorDemo = editor;
