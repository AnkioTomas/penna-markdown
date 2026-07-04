/// <reference types="vite/client" />

import type { Renderer } from "@/renderer/Renderer.js";
import type { Theme } from "@/theme/Theme.js";

declare global {
  interface Window {
    cherryRendererDemo?: {
      theme: Theme;
      renderer: Renderer;
      renderNow: () => void;
    };
  }
}

export {};
