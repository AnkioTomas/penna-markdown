/**
 * @vitest-environment jsdom
 */

import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { expect, it, vi } from "vitest";
import { clipboardExtension } from "@/editor/editor/clipboard.js";
import type { OnParseFile } from "@/editor/PennaOptions.js";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

function pasteFiles(view: EditorView, files: File[]): void {
  const event = new Event("paste", { bubbles: true, cancelable: true });
  Object.defineProperty(event, "clipboardData", {
    value: { files, getData: () => "" },
  });
  view.contentDOM.dispatchEvent(event);
}

it("keeps same-name uploads associated with their original placeholders", async () => {
  const first = deferred<{ url: string; msg: string }>();
  const second = deferred<{ url: string; msg: string }>();
  const onParseFile = vi
    .fn<OnParseFile>()
    .mockReturnValueOnce(first.promise)
    .mockReturnValueOnce(second.promise);
  const view = new EditorView({
    state: EditorState.create({
      extensions: [clipboardExtension(onParseFile)],
    }),
    parent: document.body,
  });
  const files = [
    new File(["first"], "image.png", { type: "image/png" }),
    new File(["second"], "image.png", { type: "image/png" }),
  ];

  pasteFiles(view, files);
  second.resolve({ url: "https://example.com/second.png", msg: "image.png" });
  await Promise.resolve();
  first.resolve({ url: "https://example.com/first.png", msg: "image.png" });
  await Promise.resolve();

  expect(view.state.doc.toString()).toBe(
    "![image.png](https://example.com/first.png)\n![image.png](https://example.com/second.png)\n",
  );
  view.destroy();
});

it("does not replace a placeholder that the user has edited", async () => {
  const uploadResult = deferred<{ url: string; msg: string }>();
  const onParseFile = vi
    .fn<OnParseFile>()
    .mockReturnValue(uploadResult.promise);
  const view = new EditorView({
    state: EditorState.create({
      extensions: [clipboardExtension(onParseFile)],
    }),
    parent: document.body,
  });

  pasteFiles(view, [new File(["image"], "image.png", { type: "image/png" })]);
  view.dispatch({
    changes: {
      from: 0,
      to: "![Uploading image.png...]()".length,
      insert: "edited",
    },
  });
  uploadResult.resolve({
    url: "https://example.com/image.png",
    msg: "image.png",
  });
  await Promise.resolve();

  expect(view.state.doc.toString()).toBe("edited\n");
  view.destroy();
});
