import { createTransformer } from "@/transformer/index.js";

export function createEngine(options = {}) {
  return createTransformer(options);
}
