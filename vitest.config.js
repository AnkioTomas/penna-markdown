// Vitest 配置：jsdom 环境，测试目录 test 下所有 .test.js 文件

import { defineConfig } from "vitest/config";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)));

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(rootDir, "src"),
    },
  },
  test: {
    environment: "node",
    include: ["test/**/*.test.js"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.js"],
    },
  },
});
