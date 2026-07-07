import { resolve, dirname } from "node:path";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)));

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(rootDir, "src"),
    },
  },
  plugins: [
    {
      name: "css-text",
      enforce: "pre",
      transform(_code, id) {
        const [filePath, query] = id.split("?");
        if (!filePath.endsWith(".css")) return;
        const css = readFileSync(filePath, "utf8");
        return {
          code: `export default ${JSON.stringify(css)}`,
          map: null,
        };
      },
    },
  ],
  test: {
    server: {
      deps: {
        inline: [/highlight\.js/],
      },
    },
    environment: "node",
    include: ["test/**/*.test.ts"],
    exclude: [
      "test/editor/cmSyntax.test.ts",
      "test/editor/cmDecorations.test.ts",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.ts"],
    },
  },
});
