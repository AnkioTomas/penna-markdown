import type { TableDialogResult } from "@/editor/commands/types.js";

export interface TableDialogCallbacks {
  onSubmit: (data: TableDialogResult) => void;
  onCancel: () => void;
}

const GRID_SIZE = 10;

export function renderTableDialog(
  host: HTMLElement,
  callbacks: TableDialogCallbacks,
): () => void {
  const form = document.createElement("form");
  form.className = "cherry-dialog-form cherry-dialog-form--table";
  form.innerHTML = `
    <div class="cherry-dialog-table-head">
      <span class="cherry-dialog-table-title">插入表格</span>
      <span class="cherry-dialog-table-size" aria-live="polite">1 × 1</span>
    </div>
    <p class="cherry-dialog-table-hint">在网格上拖动或点击选择行列，松手后插入</p>
    <div class="cherry-dialog-grid cherry-dialog-grid--10" role="grid" aria-label="表格尺寸"></div>
    <div class="cherry-dialog-actions">
      <button type="button" data-action="cancel">取消</button>
    </div>
  `;

  const grid = form.querySelector(".cherry-dialog-grid") as HTMLElement;
  const sizeLabel = form.querySelector(".cherry-dialog-table-size") as HTMLElement;
  let selRows = 1;
  let selCols = 1;
  let dragging = false;
  const cells: HTMLButtonElement[] = [];

  for (let r = 1; r <= GRID_SIZE; r++) {
    for (let c = 1; c <= GRID_SIZE; c++) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cherry-dialog-grid-cell";
      btn.dataset.rows = String(r);
      btn.dataset.cols = String(c);
      btn.setAttribute("role", "gridcell");
      btn.title = `${r}×${c}`;
      cells.push(btn);
      grid.appendChild(btn);
    }
  }
  grid.style.gridTemplateColumns = `repeat(${GRID_SIZE}, 1fr)`;

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

  const submit = () => {
    callbacks.onSubmit({ rows: selRows, cols: selCols });
  };

  grid.addEventListener("mousedown", (e) => {
    const t = (e.target as HTMLElement).closest(".cherry-dialog-grid-cell") as HTMLButtonElement | null;
    if (!t) return;
    dragging = true;
    pickCell(t);
  });

  grid.addEventListener("mouseover", (e) => {
    if (!dragging) return;
    const t = (e.target as HTMLElement).closest(".cherry-dialog-grid-cell") as HTMLButtonElement | null;
    if (!t) return;
    pickCell(t);
  });

  const stopDrag = () => {
    dragging = false;
  };
  window.addEventListener("mouseup", stopDrag);

  grid.addEventListener("click", (e) => {
    const t = (e.target as HTMLElement).closest(".cherry-dialog-grid-cell") as HTMLButtonElement | null;
    if (!t) return;
    e.preventDefault();
    pickCell(t);
    submit();
  });

  form.querySelector('[data-action="cancel"]')?.addEventListener("click", () => callbacks.onCancel());

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
