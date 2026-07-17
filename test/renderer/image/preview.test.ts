/**
 * @vitest-environment jsdom
 */
import { expect, it } from "vitest";
import { JSDOM } from "jsdom";
import {
  ImageListener,
  applyPreviewImageSize,
  isPreviewableImage,
  isPreviewableSvg,
} from "@/renderer/image/image.js";

it("opens lightbox when clicking previewable images", () => {
  const dom = new JSDOM(
    `<div id="preview" class="penna-render">
      <p><img src="https://example.com/photo.jpg" alt="示例图片"></p>
    </div>`,
    { url: "https://example.com" },
  );
  const { document } = dom.window;
  const preview = document.getElementById("preview") as HTMLElement;
  const listener = new ImageListener(preview);

  const img = preview.querySelector("img") as HTMLImageElement;
  img.click();

  const overlay = document.querySelector(".penna-image-preview");
  const media = document.querySelector(
    ".penna-image-preview__media",
  ) as HTMLImageElement;
  expect(overlay).not.toBeNull();
  expect(media?.tagName).toBe("IMG");
  expect(media?.alt).toBe("示例图片");
  expect(
    document.querySelector(".penna-image-preview__caption")?.textContent,
  ).toBe("示例图片");

  listener.destroy();
  expect(document.querySelector(".penna-image-preview")).toBeNull();
});

it("opens lightbox when clicking inline svg", () => {
  const dom = new JSDOM(
    `<div id="preview" class="penna-render">
      <svg viewBox="0 0 10 10" aria-label="矢量图"><title>标题</title><circle cx="5" cy="5" r="4"></circle></svg>
    </div>`,
    { url: "https://example.com" },
  );
  const { document } = dom.window;
  const preview = document.getElementById("preview") as HTMLElement;
  const listener = new ImageListener(preview);

  const circle = preview.querySelector("circle") as SVGCircleElement;
  circle.dispatchEvent(
    new dom.window.MouseEvent("click", { bubbles: true, cancelable: true }),
  );

  const previewSvg = document.querySelector(
    ".penna-image-preview__media",
  ) as SVGSVGElement;
  expect(previewSvg?.tagName.toLowerCase()).toBe("svg");
  expect(previewSvg?.querySelector("circle")).not.toBeNull();
  expect(
    document.querySelector(".penna-image-preview__caption")?.textContent,
  ).toBe("矢量图");

  listener.destroy();
});

it("applies source dimensions to preview image", () => {
  const dom = new JSDOM(
    `<div id="preview" class="penna-render"><img src="https://example.com/a.png" alt=""></div>`,
    { url: "https://example.com" },
  );
  const { document } = dom.window;
  const preview = document.getElementById("preview") as HTMLElement;
  const source = preview.querySelector("img") as HTMLImageElement;
  const target = document.createElement("img");

  Object.defineProperty(source, "naturalWidth", {
    value: 640,
    configurable: true,
  });
  Object.defineProperty(source, "naturalHeight", {
    value: 480,
    configurable: true,
  });
  Object.defineProperty(source, "complete", {
    value: true,
    configurable: true,
  });

  applyPreviewImageSize(target, source);
  expect(target.width).toBe(640);
  expect(target.height).toBe(480);
});

it("opens lightbox for mermaid diagram images", () => {
  const dom = new JSDOM(
    `<div id="preview" class="penna-render">
      <figure data-type="mermaid" class="penna-mermaid-block">
        <img class="penna-mermaid__img" src="https://mermaid.ink/svg/test" alt="" loading="lazy">
      </figure>
    </div>`,
    { url: "https://example.com" },
  );
  const { document } = dom.window;
  const preview = document.getElementById("preview") as HTMLElement;
  const listener = new ImageListener(preview);
  const img = preview.querySelector(".penna-mermaid__img") as HTMLImageElement;
  Object.defineProperty(img, "naturalWidth", {
    value: 800,
    configurable: true,
  });
  Object.defineProperty(img, "naturalHeight", {
    value: 600,
    configurable: true,
  });
  Object.defineProperty(img, "complete", { value: true, configurable: true });

  expect(isPreviewableImage(img)).toBe(true);
  img.click();
  const media = document.querySelector(
    ".penna-image-preview__media",
  ) as HTMLImageElement;
  expect(media).not.toBeNull();
  expect(media.width).toBe(800);
  expect(media.height).toBe(600);

  listener.destroy();
});

it("skips math and badge images", () => {
  const dom = new JSDOM(
    `<div id="preview" class="penna-render">
      <img class="penna-math-latex" src="https://example.com/math.png" alt="math">
      <img class="penna-repo-card__shield-img" src="https://example.com/badge.svg" alt="badge">
    </div>`,
    { url: "https://example.com" },
  );
  const { document } = dom.window;
  const preview = document.getElementById("preview") as HTMLElement;
  const listener = new ImageListener(preview);

  expect(
    isPreviewableImage(
      preview.querySelector(".penna-math-latex") as HTMLImageElement,
    ),
  ).toBe(false);
  expect(
    isPreviewableImage(
      preview.querySelector(".penna-repo-card__shield-img") as HTMLImageElement,
    ),
  ).toBe(false);

  preview
    .querySelector(".penna-math-latex")
    ?.dispatchEvent(
      new dom.window.MouseEvent("click", { bubbles: true, cancelable: true }),
    );
  expect(document.querySelector(".penna-image-preview")).toBeNull();

  listener.destroy();
});

it("closes lightbox on escape", () => {
  const dom = new JSDOM(
    `<div id="preview" class="penna-render"><img src="https://example.com/a.png" alt=""></div>`,
    { url: "https://example.com" },
  );
  const { document } = dom.window;
  const preview = document.getElementById("preview") as HTMLElement;
  const listener = new ImageListener(preview);

  preview.querySelector("img")?.click();
  expect(document.querySelector(".penna-image-preview")).not.toBeNull();

  document.dispatchEvent(
    new dom.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
  );
  expect(document.querySelector(".penna-image-preview")).toBeNull();

  listener.destroy();
});

it("closes lightbox when clicking backdrop", () => {
  const dom = new JSDOM(
    `<div id="preview" class="penna-render"><img src="https://example.com/a.png" alt=""></div>`,
    { url: "https://example.com" },
  );
  const { document } = dom.window;
  const listener = new ImageListener(
    document.getElementById("preview") as HTMLElement,
  );

  document.querySelector("img")?.click();
  expect(document.querySelector(".penna-image-preview")).not.toBeNull();

  (
    document.querySelector(".penna-image-preview__backdrop") as HTMLElement
  ).click();
  expect(document.querySelector(".penna-image-preview")).toBeNull();

  listener.destroy();
});

it("destroy without open does not clear body overflow", () => {
  const dom = new JSDOM(
    `<div id="preview" class="penna-render"><img src="https://example.com/a.png" alt=""></div>`,
    { url: "https://example.com" },
  );
  const { document } = dom.window;
  document.body.style.overflow = "hidden";
  const listener = new ImageListener(
    document.getElementById("preview") as HTMLElement,
  );

  listener.destroy();
  expect(document.body.style.overflow).toBe("hidden");
});

it("skips decorative svg icons", () => {
  const dom = new JSDOM(
    `<div id="preview" class="penna-render">
      <svg viewBox="0 0 10 10" aria-hidden="true"><circle cx="5" cy="5" r="4"></circle></svg>
    </div>`,
    { url: "https://example.com" },
  );
  const svg = dom.window.document.querySelector("svg") as SVGSVGElement;
  expect(isPreviewableSvg(svg)).toBe(false);
});
