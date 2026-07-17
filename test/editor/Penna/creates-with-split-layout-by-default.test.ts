/**
 * @vitest-environment jsdom
 */

import { expect, it } from "vitest";
import { createPenna } from "./helpers";

it("creates with split layout by default", () => {
  document.body.innerHTML = '<div id="penna-editor"></div>';
  const penna = createPenna({
    editor: { value: "# Hello\n\nWorld" },
  });

  expect(document.querySelector(".penna-body--split")).toBeTruthy();
  expect(penna.getLayout()).toBe("split");
  expect(penna.getMarkdown()).toBe("# Hello\n\nWorld");
  expect(document.querySelector(".penna")).toBeTruthy();
  expect(document.querySelector(".penna-preview")).toBeTruthy();
  expect(penna.theme.getTheme().id).toBe("default");

  penna.destroy();
});
