/**
 * @vitest-environment jsdom
 */

import { Cherry } from "@/editor/Cherry";
import type { CherryOptions } from "@/editor/CherryOptions";

export function createCherry(options: CherryOptions = {}): Cherry {
  const mount = document.getElementById("cherry-editor")!;
  return new Cherry(mount, { toolbar: false, ...options });
}
