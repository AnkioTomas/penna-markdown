/**
 * 表格插入命令。
 * 使用自定义 10×10 网格弹窗选择行列（非表单），生成 GFM 表格骨架。
 */
import type { EditorView } from "@codemirror/view";
import { requestDialog } from "@/editor/dialog/requestDialog.js";
import {
  Command,
  insertSnippet,
  type CommandContext,
} from "@/editor/commands/Command";
import type {
  DialogCallbacks,
  DialogCapableCommand,
} from "@/editor/commands/DialogCommand";
import type { DialogType } from "@/editor/commands/dialogTypes";

/** `table` 弹窗提交结果：行数与列数。 */
export interface TableDialogResult {
  rows: number;
  cols: number;
}

const GRID_SIZE = 10;

function renderTableDialog(
  host: HTMLElement,
  _props: Record<string, unknown>,
  callbacks: DialogCallbacks<TableDialogResult>,
): () => void {
  const form = document.createElement("form");
  form.className = "cherry-dialog-form cherry-dialog-form--table";
  form.innerHTML = `
    <div class="cherry-dialog-table-head">
      <span class="cherry-dialog-table-title">插入表格</span>
      <span class="cherry-dialog-table-size" aria-live="polite">1 × 1</span>
    </div>
    <div class="cherry-dialog-form-scroll-area">
      <p class="cherry-dialog-table-hint">在网格上拖动或点击选择行列，松手后插入</p>
      <div class="cherry-dialog-grid cherry-dialog-grid--10" role="grid" aria-label="表格尺寸"></div>
    </div>
    <div class="cherry-dialog-actions">
      <button type="button" data-action="cancel">取消</button>
    </div>
  `;

  const grid = form.querySelector(".cherry-dialog-grid") as HTMLElement;
  const sizeLabel = form.querySelector(
    ".cherry-dialog-table-size",
  ) as HTMLElement;
  let selRows = 1;
  let selCols = 1;
  let dragging = false;
  let buttonsHTML = "";
  for (let r = 1; r <= GRID_SIZE; r++) {
    for (let c = 1; c <= GRID_SIZE; c++) {
      buttonsHTML += `<button type="button" class="cherry-dialog-grid-cell" data-rows="${r}" data-cols="${c}" role="gridcell" title="${r}×${c}"></button>`;
    }
  }
  grid.innerHTML = buttonsHTML;
  grid.style.gridTemplateColumns = `repeat(${GRID_SIZE}, 1fr)`;

  const cells = Array.from(
    grid.querySelectorAll(".cherry-dialog-grid-cell"),
  ) as HTMLButtonElement[];

  const sync = () => {
    sizeLabel.textContent = `${selRows} × ${selCols}`;
    for (const btn of cells) {
      const r = Number(btn.dataset.rows);
      const c = Number(btn.dataset.cols);
      btn.classList.toggle("is-active", r <= selRows && c <= selCols);
    }
  };

  const pickCell = (target: HTMLButtonElement) => {
    selRows = Number(target.dataset.rows);
    selCols = Number(target.dataset.cols);
    sync();
  };

  let submitted = false;
  const submit = () => {
    if (submitted) return;
    submitted = true;
    callbacks.onSubmit({ rows: selRows, cols: selCols });
  };

  grid.addEventListener("mousedown", (e) => {
    const t = (e.target as HTMLElement).closest(
      ".cherry-dialog-grid-cell",
    ) as HTMLButtonElement | null;
    if (!t) return;
    dragging = true;
    pickCell(t);
  });

  grid.addEventListener("mouseover", (e) => {
    if (!dragging) return;
    const t = (e.target as HTMLElement).closest(
      ".cherry-dialog-grid-cell",
    ) as HTMLButtonElement | null;
    if (!t) return;
    pickCell(t);
  });

  const stopDrag = () => {
    if (dragging) {
      dragging = false;
      submit();
    }
  };
  window.addEventListener("mouseup", stopDrag);

  grid.addEventListener("click", (e) => {
    const t = (e.target as HTMLElement).closest(
      ".cherry-dialog-grid-cell",
    ) as HTMLButtonElement | null;
    if (!t) return;
    e.preventDefault();
    pickCell(t);
    submit();
  });

  form
    .querySelector('[data-action="cancel"]')
    ?.addEventListener("click", () => callbacks.onCancel());

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    submit();
  });

  host.appendChild(form);
  sync();

  return () => {
    window.removeEventListener("mouseup", stopDrag);
    form.remove();
  };
}

function buildTableMarkdown(rows: number, cols: number): string {
  const safeRows = Math.max(2, rows);
  const safeCols = Math.max(1, cols);
  const cell = () => "| " + Array(safeCols).fill(" ").join(" | ") + " |";
  const sep = () => "| " + Array(safeCols).fill("---").join(" | ") + " |";
  const lines = [cell(), sep()];
  for (let r = 2; r < safeRows; r++) lines.push(cell());
  return `\n${lines.join("\n")}\n\n`;
}

/**
 * `table` — 打开网格选择器插入空表格。
 * 至少 2 行（表头 + 分隔行），列数 ≥ 1。
 */
export class TableCommand implements Command, DialogCapableCommand {
  readonly dialogType: DialogType = "table";

  renderDialog = renderTableDialog;

  async execute(
    view: EditorView,
    _payload: unknown,
    ctx: CommandContext,
  ): Promise<boolean> {
    if (!ctx?.theme) return false;
    const data = await requestDialog(ctx.theme, "table");
    if (!data) return false;

    const rows = Math.max(1, Math.min(10, data.rows));
    const cols = Math.max(1, Math.min(10, data.cols));
    const text = buildTableMarkdown(rows, cols);

    insertSnippet(view, text, 3, 3);
    return true;
  }
}

/** `table` 命令实例 */
export const tableCommand = new TableCommand();
