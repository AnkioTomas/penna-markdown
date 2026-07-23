import { StateEffect, StateField, type Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import type { OnParseFile } from "@/editor/editor/EditorOptions";
import { setPasteState } from "./pasteTooltip";

/**
 * 将剪贴板 HTML 转换为支持的基础 Markdown。
 *
 * @param html 要转换的 HTML 字符串。
 * @returns 转换并规范化后的 Markdown 文本。
 */
function htmlToMarkdown(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  /**
   * 递归转换单个 DOM 节点及其子节点。
   *
   * @param node 当前要转换的 DOM 节点。
   * @returns 节点对应的 Markdown 片段。
   */
  function walk(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent || "";
    if (node.nodeType !== Node.ELEMENT_NODE) return "";

    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();

    if (["script", "style", "iframe", "meta", "link", "noscript"].includes(tag))
      return "";

    // Handle simple tables
    if (tag === "table") {
      return parseTable(el);
    }

    let childrenText = "";
    for (let i = 0; i < el.childNodes.length; i++) {
      childrenText += walk(el.childNodes[i]);
    }

    switch (tag) {
      case "strong":
      case "b":
        return `**${childrenText}**`;
      case "em":
      case "i":
        return `*${childrenText}*`;
      case "a":
        return `[${childrenText}](${el.getAttribute("href") || ""})`;
      case "img":
        return `![${el.getAttribute("alt") || ""}](${
          el.getAttribute("src") || ""
        })`;
      case "code":
        return `\`${childrenText}\``;
      case "pre":
        return `\n\`\`\`\n${childrenText}\n\`\`\`\n`;
      case "p":
      case "div":
        return `\n\n${childrenText}\n\n`;
      case "br":
        return `\n`;
      case "li":
        return `- ${childrenText}\n`;
      case "ul":
      case "ol":
        return `\n${childrenText}\n`;
      case "h1":
        return `\n# ${childrenText}\n`;
      case "h2":
        return `\n## ${childrenText}\n`;
      case "h3":
        return `\n### ${childrenText}\n`;
      case "h4":
        return `\n#### ${childrenText}\n`;
      case "h5":
        return `\n##### ${childrenText}\n`;
      case "h6":
        return `\n###### ${childrenText}\n`;
      default:
        return childrenText;
    }
  }

  /**
   * 将无合并单元格的简单 HTML 表格转换为 Markdown 表格。
   *
   * @param table 要转换的表格元素。
   * @returns Markdown 表格；复杂表格降级为纯文本。
   */
  function parseTable(table: HTMLElement): string {
    // 检查是否是简单表格，拒绝嵌套表格和 colspan/rowspan
    if (
      table.querySelector("table") ||
      table.querySelector("[colspan], [rowspan]")
    ) {
      return table.textContent || ""; // 降级为纯文本
    }

    const rows = Array.from(table.querySelectorAll("tr"));
    if (rows.length === 0) return "";

    let md = "\n";
    let colCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const cells = Array.from(rows[i].querySelectorAll("th, td"));
      if (i === 0) colCount = cells.length;

      const rowText = cells
        .map((cell) => walk(cell).replace(/\n/g, " ").trim())
        .join(" | ");
      md += `| ${rowText} |\n`;

      if (i === 0) {
        md += `| ${cells.map(() => "---").join(" | ")} |\n`;
      }
    }

    return md + "\n";
  }

  return walk(doc.body)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

interface UploadPlaceholder {
  from: number;
  to: number;
  text: string;
}

const addUploadPlaceholder = StateEffect.define<
  UploadPlaceholder & { id: number }
>();
const removeUploadPlaceholder = StateEffect.define<number>();

const uploadPlaceholders = StateField.define<Map<number, UploadPlaceholder>>({
  create: () => new Map(),
  update(placeholders, tr) {
    const next = new Map<number, UploadPlaceholder>();
    for (const [id, placeholder] of placeholders) {
      next.set(id, {
        ...placeholder,
        from: tr.changes.mapPos(placeholder.from, 1),
        to: tr.changes.mapPos(placeholder.to, -1),
      });
    }
    for (const effect of tr.effects) {
      if (effect.is(addUploadPlaceholder)) {
        const { id, ...placeholder } = effect.value;
        next.set(id, placeholder);
      } else if (effect.is(removeUploadPlaceholder)) {
        next.delete(effect.value);
      }
    }
    return next;
  },
});

let nextUploadPlaceholderId = 0;

/**
 * 在占位符仍对应原始文本时，以上传结果或错误提示替换它。
 *
 * @param view 要更新的编辑器视图。
 * @param id 上传占位符的唯一标识。
 * @param replacement 写入占位符位置的文本。
 */
function replaceUploadPlaceholder(
  view: EditorView,
  id: number,
  replacement: string,
): void {
  const placeholder = view.state.field(uploadPlaceholders).get(id);
  if (!placeholder) return;

  if (
    view.state.sliceDoc(placeholder.from, placeholder.to) !== placeholder.text
  ) {
    view.dispatch({ effects: removeUploadPlaceholder.of(id) });
    return;
  }

  view.dispatch({
    changes: {
      from: placeholder.from,
      to: placeholder.to,
      insert: replacement,
    },
    effects: removeUploadPlaceholder.of(id),
  });
}

/**
 * 插入图片上传占位符，并在上传结束后替换为图片 Markdown 或错误提示。
 *
 * @param files 用户粘贴或拖入的文件列表。
 * @param view 要写入文件占位符的编辑器视图。
 * @param onParseFile 可选的文件解析/上传回调。
 */
function handleFiles(
  files: File[],
  view: EditorView,
  onParseFile: OnParseFile | undefined,
) {
  files.forEach((file) => {
    // 这里暂时以图片为主，其他类型的文件逻辑类似
    if (!file.type.startsWith("image/")) return;

    const placeholder = `![Uploading ${file.name}...]()`;
    const { state } = view;
    const { from, to } = state.selection.main;
    const id = ++nextUploadPlaceholderId;

    view.dispatch({
      changes: { from, to, insert: `${placeholder}\n` },
      selection: { anchor: from + placeholder.length + 1 },
      effects: addUploadPlaceholder.of({
        id,
        from,
        to: from + placeholder.length,
        text: placeholder,
      }),
    });

    if (!onParseFile) {
      replaceUploadPlaceholder(
        view,
        id,
        `> 提示: 尚未配置上传接口，无法粘贴图片 (${file.name})`,
      );
      return;
    }

    onParseFile(file)
      .then((res) => {
        replaceUploadPlaceholder(view, id, `![${res.msg}](${res.url})`);
      })
      .catch(() => {
        replaceUploadPlaceholder(view, id, `> 提示: 上传失败 (${file.name})`);
      });
  });
}

/**
 * 创建处理富文本、图片粘贴及文件拖放的 CodeMirror 扩展。
 *
 * @param onParseFile 可选的文件解析/上传回调。
 * @returns 包含占位符状态和 DOM 事件处理器的扩展集合。
 */
export function clipboardExtension(onParseFile?: OnParseFile): Extension {
  return [
    uploadPlaceholders,
    EditorView.domEventHandlers({
      paste(event, view) {
        const { clipboardData } = event;
        if (!clipboardData) return false;

        // 1. 处理文件
        if (clipboardData.files && clipboardData.files.length > 0) {
          handleFiles(Array.from(clipboardData.files), view, onParseFile);
          return true;
        }

        // 2. 处理富文本
        const html = clipboardData.getData("text/html");
        const plain = clipboardData.getData("text/plain");

        if (html && plain) {
          const md = htmlToMarkdown(html);
          if (md && md !== plain) {
            event.preventDefault();

            const from = view.state.selection.main.from;

            view.dispatch({
              changes: {
                from,
                to: view.state.selection.main.to,
                insert: md,
              },
              effects: setPasteState.of({
                from,
                to: from + md.length,
                plainText: plain,
                markdownText: md,
                active: "markdown",
              }),
            });
            return true;
          }
        }

        return false;
      },
      drop(event, view) {
        const { dataTransfer } = event;
        if (
          !dataTransfer ||
          !dataTransfer.files ||
          dataTransfer.files.length === 0
        )
          return false;

        event.preventDefault();

        const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
        if (pos !== null) {
          view.dispatch({ selection: { anchor: pos } });
        }

        handleFiles(Array.from(dataTransfer.files), view, onParseFile);
        return true;
      },
    }),
  ];
}
