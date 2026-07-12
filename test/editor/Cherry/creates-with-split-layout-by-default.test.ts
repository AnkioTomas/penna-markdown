/**
 * @vitest-environment jsdom
 */

import { expect, it } from "vitest";
import { createCherry } from "./helpers";

it("creates with split layout by default", () => {
  document.body.innerHTML = '<div id="cherry-editor"></div>';
  const cherry = createCherry({
    editor: { value: "# Hello\n\nWorld" },
  });

  expect(document.querySelector(".cherry-body--split")).toBeTruthy();
  expect(cherry.getLayout()).toBe("split");
  expect(cherry.getMarkdown()).toBe("# Hello\n\nWorld");
  expect(document.querySelector(".cherry")).toBeTruthy();
  expect(document.querySelector(".cherry-preview")).toBeTruthy();
  expect(cherry.theme.getTheme().id).toBe("default");

  cherry.destroy();
});
