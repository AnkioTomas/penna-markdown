/**
 * @vitest-environment jsdom
 */

import { Penna } from "@/editor/Penna";
import type { PennaOptions } from "@/editor/PennaOptions";

export function createPenna(options: PennaOptions = {}): Penna {
  const mount = document.getElementById("penna-editor")!;
  return new Penna(mount, { toolbar: false, ...options });
}
