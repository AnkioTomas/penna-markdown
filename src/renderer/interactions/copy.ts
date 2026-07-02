import { readCodeLinesText } from "@/transformer/extends/block/enhancedCode.js";
import { registerPreviewClickDelegation } from "../delegate.js";

async function copyText(text: string, doc: Document): Promise<void> {
  const nav = doc.defaultView?.navigator;
  if (nav?.clipboard?.writeText) {
    await nav.clipboard.writeText(text);
    return;
  }

  const textarea = doc.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  doc.body.appendChild(textarea);
  textarea.select();
  doc.execCommand("copy");
  doc.body.removeChild(textarea);
}

async function handleCopyClick(btn: HTMLButtonElement): Promise<void> {
  const doc = btn.ownerDocument;
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
    await copyText(code, doc);
  } catch {
    return;
  }

  const copiedLabel = btn.getAttribute("data-copied") || "已复制";
  const originalLabel = btn.getAttribute("aria-label") || "复制代码";
  btn.classList.add("is-copied");
  btn.setAttribute("aria-label", copiedLabel);

  const timer = doc.defaultView?.setTimeout ?? setTimeout;
  timer(() => {
    btn.classList.remove("is-copied");
    btn.setAttribute("aria-label", originalLabel);
  }, 2000);
}

registerPreviewClickDelegation(".cherry-copy-code-button", (event, target) => {
  event.preventDefault();
  void handleCopyClick(target as HTMLButtonElement);
});
