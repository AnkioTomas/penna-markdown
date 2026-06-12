/**
 * @file 代码块复制按钮交互
 * @module renderer/codeCopy
 */

import { readCodeLinesText } from "@/transformer/extends/utils/renderCodeLines.js";

/**
 * @param {ParentNode | null | undefined} container
 * @returns {HTMLElement | null}
 */
function findCherryRoot(container) {
  if (!container || !("querySelector" in container)) return null;
  if (container instanceof HTMLElement && container.classList.contains("cherry")) {
    return container;
  }
  return container.querySelector(".cherry");
}

/**
 * @param {string} text
 * @returns {Promise<void>}
 */
async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

/**
 * 为预览区内的 `.cherry-copy-code-button` 绑定复制逻辑。
 *
 * @param {ParentNode | null | undefined} container
 */
export function hydrateCherryCodeCopy(container) {
  const root = findCherryRoot(container) ?? container;
  if (!root || !("querySelectorAll" in root)) return;

  root.querySelectorAll(".cherry-copy-code-button").forEach((btn) => {
    if (!(btn instanceof HTMLButtonElement)) return;
    if (btn.dataset.cherryCopyBound === "1") return;
    btn.dataset.cherryCopyBound = "1";

    btn.addEventListener("click", async () => {
      const panel = btn.closest(".cherry-code-block__panel");
      const codeEl = panel?.querySelector("code");
      if (!codeEl) return;

      let code = readCodeLinesText(codeEl);
      const stored = codeEl.dataset.cherrySource;
      if (stored) {
        try {
          code = decodeURIComponent(escape(atob(stored)));
        } catch {
          // keep reconstructed text
        }
      }
      if (!code) return;

      try {
        await copyText(code);
      } catch {
        return;
      }

      const copiedLabel = btn.getAttribute("data-copied") || "已复制";
      const originalLabel = btn.getAttribute("aria-label") || "复制代码";
      btn.classList.add("is-copied");
      btn.setAttribute("aria-label", copiedLabel);

      window.setTimeout(() => {
        btn.classList.remove("is-copied");
        btn.setAttribute("aria-label", originalLabel);
      }, 2000);
    });
  });
}
