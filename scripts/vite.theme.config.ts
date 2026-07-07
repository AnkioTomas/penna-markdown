import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import REGISTERED_THEMES from "../src/theme/ThemeRegister.js";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = resolve(rootDir, "dist");
const themesDir = resolve(rootDir, "src/theme/themes");
const transformerDir = resolve(rootDir, "src/transformer");

const scssLoadPaths = [
  transformerDir,
  resolve(transformerDir, "gfm"),
  resolve(transformerDir, "extends"),
];

function themeStyleInputs(): Record<string, string> {
  const input: Record<string, string> = {
    "cherry-editor-base": resolve(rootDir, "src/theme/style/cherry.scss"),
    "cherry-render": resolve(rootDir, "src/theme/style/transformer.scss"),
  };

  for (const themeId of REGISTERED_THEMES) {
    for (const kind of ["render", "editor"] as const) {
      const entry = resolve(themesDir, themeId, `${kind}.scss`);
      if (existsSync(entry)) {
        input[`cherry-theme-${themeId}-${kind}`] = entry;
      }
    }
  }

  return input;
}

/** CSS entry 会附带空 JS chunk，构建后删掉 */
function dropCssEntryJs(): Plugin {
  return {
    name: "drop-css-entry-js",
    generateBundle(_options, bundle) {
      for (const fileName of Object.keys(bundle)) {
        if (fileName.endsWith(".js")) delete bundle[fileName];
      }
    },
  };
}

export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: {
        loadPaths: scssLoadPaths,
      },
    },
  },
  build: {
    outDir: distDir,
    emptyOutDir: false,
    cssMinify: true,
    rollupOptions: {
      input: themeStyleInputs(),
      output: {
        assetFileNames: "[name].min.css",
      },
    },
  },
  plugins: [dropCssEntryJs()],
});
