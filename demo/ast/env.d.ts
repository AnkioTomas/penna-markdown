/// <reference types="vite/client" />

import type { TransformerEngine } from "@/transformer/TransformerEngine.js";
import type { AstTreeView } from "./tree-view.js";

declare global {
  interface Window {
    cherryAstDemo?: {
      transformer: TransformerEngine;
      renderNow: () => void;
      treeView: AstTreeView;
    };
  }
}

export {};
