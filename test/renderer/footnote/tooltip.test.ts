/**
 * @vitest-environment jsdom
 */
import { expect, it } from "vitest";
import { JSDOM } from "jsdom";
import { FootnoteListener } from "@/renderer/footnote/footnote.js";

function mountFootnotePreview(domHtml: string) {
  const dom = new JSDOM(domHtml, { url: "https://example.com" });
  const { document } = dom.window;
  const preview = document.getElementById("preview") as HTMLElement;
  const listener = new FootnoteListener(preview);
  return { dom, document, preview, listener };
}

function hoverRef(document: Document, ref: Element) {
  ref.dispatchEvent(
    new document.defaultView!.MouseEvent("mouseover", {
      bubbles: true,
      cancelable: true,
      relatedTarget: null,
    }),
  );
}

it("appends tooltip to document.body like image preview", () => {
  const { document, preview, listener } = mountFootnotePreview(`<!DOCTYPE html>
<html><body>
  <div id="preview" class="penna-render">
    <p>词<sup class="penna-footnote-ref"><a href="#footnote-1" id="footnote-ref-1">1</a></sup></p>
    <div class="penna-footnotes">
      <ol>
        <li id="footnote-1" class="penna-footnote-item">
          <p>出自 <strong>《过零丁洋》</strong> 与 <code>code</code>
            <a href="#footnote-ref-1" class="penna-footnote-backref">↩︎</a>
          </p>
        </li>
      </ol>
    </div>
  </div>
</body></html>`);

  const ref = preview.querySelector("sup.penna-footnote-ref a") as HTMLElement;
  hoverRef(document, ref);

  const tooltip = document.querySelector(
    ".penna-footnote-tooltip",
  ) as HTMLElement;
  expect(tooltip).not.toBeNull();
  expect(tooltip.parentElement).toBe(document.body);
  expect(tooltip.classList.contains("penna-render")).toBe(true);

  const body = tooltip.querySelector(".penna-footnote-tooltip__body");
  expect(body?.innerHTML).toContain("<strong>《过零丁洋》</strong>");
  expect(body?.innerHTML).toContain("<code>code</code>");
  expect(body?.querySelector(".penna-footnote-backref")).toBeNull();

  listener.destroy();
  expect(document.querySelector(".penna-footnote-tooltip")).toBeNull();
});

it("syncs penna-dark onto body tooltip from mount ancestor", () => {
  const { document, preview, listener } = mountFootnotePreview(`<!DOCTYPE html>
<html><body>
  <div class="penna penna-dark">
    <div id="preview" class="penna-render">
      <p>词<sup class="penna-footnote-ref"><a href="#footnote-1" id="footnote-ref-1">1</a></sup></p>
      <li id="footnote-1" class="penna-footnote-item"><p>暗色</p></li>
    </div>
  </div>
</body></html>`);

  const ref = preview.querySelector("sup.penna-footnote-ref a") as HTMLElement;
  hoverRef(document, ref);

  const tooltip = document.querySelector(".penna-footnote-tooltip");
  expect(tooltip?.parentElement).toBe(document.body);
  expect(tooltip?.classList.contains("penna-dark")).toBe(true);

  listener.destroy();
});
