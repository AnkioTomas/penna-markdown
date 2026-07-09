import { EditorView } from "@codemirror/view";
import type { Extension } from "@codemirror/state";
import type { StorageAPI } from "@/editor/CherryOptions";
import { setPasteState } from "./pasteTooltip";

function htmlToMarkdown(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

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

function handleFiles(
  files: File[],
  view: EditorView,
  storage: StorageAPI | undefined,
  source: "paste" | "drag",
) {
  files.forEach((file) => {
    // 这里暂时以图片为主，其他类型的文件逻辑类似
    if (!file.type.startsWith("image/")) return;

    const placeholder = `![Uploading ${file.name}...]()`;
    const { state } = view;
    let from = state.selection.main.from;

    view.dispatch(state.replaceSelection(placeholder + "\n"));
    const placeholderLen = placeholder.length;

    if (!storage?.upload) {
      const docStr = view.state.doc.toString();
      const pos = docStr.indexOf(placeholder);
      if (pos !== -1) {
        // 替换为提示信息
        view.dispatch({
          changes: {
            from: pos,
            to: pos + placeholderLen,
            insert: `> 提示: 尚未配置上传接口，无法粘贴图片 (${file.name})`,
          },
        });
      }
      return;
    }

    storage
      .upload(file, { source, dialogType: "image" })
      .then((res) => {
        const docStr = view.state.doc.toString();
        const pos = docStr.indexOf(placeholder);
        if (pos !== -1) {
          view.dispatch({
            changes: {
              from: pos,
              to: pos + placeholderLen,
              insert: `![${file.name}](${res.url})`,
            },
          });
        }
      })
      .catch(() => {
        const docStr = view.state.doc.toString();
        const pos = docStr.indexOf(placeholder);
        if (pos !== -1) {
          view.dispatch({
            changes: {
              from: pos,
              to: pos + placeholderLen,
              insert: `> 提示: 上传失败 (${file.name})`,
            },
          });
        }
      });
  });
}

export function clipboardExtension(storage?: StorageAPI): Extension {
  return EditorView.domEventHandlers({
    paste(event, view) {
      const { clipboardData } = event;
      if (!clipboardData) return false;

      // 1. 处理文件
      if (clipboardData.files && clipboardData.files.length > 0) {
        handleFiles(Array.from(clipboardData.files), view, storage, "paste");
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

      handleFiles(Array.from(dataTransfer.files), view, storage, "drag");
      return true;
    },
  });
}
