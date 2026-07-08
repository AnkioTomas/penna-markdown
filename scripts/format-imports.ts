import fs from "fs";
import path from "path";

// Simple regex to find imports that end with .js
// e.g. import { Command } from "../Command.js";
const importRegex = /from\s+['"](\.\.?\/[^'"]+)\.js['"]/g;

function getFiles(dir: string, fileList: string[] = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getFiles(filePath, fileList);
    } else if (filePath.endsWith(".ts")) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

function formatImports() {
  const files = getFiles("src");
  let count = 0;

  for (const file of files) {
    const content = fs.readFileSync(file, "utf-8");
    let modified = false;

    const newContent = content.replace(importRegex, (match, importPath) => {
      modified = true;

      // Resolve the absolute path
      const fileDir = path.dirname(file);
      const absoluteImportPath = path.resolve(fileDir, importPath);

      // Convert to @/ alias
      const srcDir = path.resolve("src");
      if (absoluteImportPath.startsWith(srcDir)) {
        const relativeToSrc = path.relative(srcDir, absoluteImportPath);
        // Replace backslashes on Windows
        const posixPath = relativeToSrc.split(path.sep).join("/");
        return `from "@/${posixPath}"`;
      }

      // If it's outside src (unlikely), just remove .js
      return `from "${importPath}"`;
    });

    if (modified) {
      fs.writeFileSync(file, newContent, "utf-8");
      count++;
    }
  }

  if (count > 0) {
    console.log(
      `[Format] Rewrote relative imports to absolute aliases in ${count} files.`,
    );
  }
}

formatImports();
