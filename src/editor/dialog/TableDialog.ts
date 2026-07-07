import type { TableDialogResult } from "@/editor/commands/types.js";

export interface TableDialogCallbacks {
  onSubmit: (data: TableDialogResult) => void;
  onCancel: () => void;
}

export function renderTableDialog(
  host: HTMLElement,
  callbacks: TableDialogCallbacks,
): () => void {
  const form = document.createElement("form");
  form.className = "cherry-dialog-form";
  form.innerHTML = `
    <label class="cherry-dialog-field">行数<input name="rows" type="number" min="2" max="20" value="3" /></label>
    <label class="cherry-dialog-field">列数<input name="cols" type="number" min="1" max="10" value="3" /></label>
    <div class="cherry-dialog-grid" aria-label="表格尺寸"></div>
    <div class="cherry-dialog-actions">
      <button type="button" data-action="cancel">取消</button>
      <button type="submit">插入</button>
    </div>
  `;

  const grid = form.querySelector(".cherry-dialog-grid") as HTMLElement;
  let selRows = 3;
  let selCols = 3;
  const cells: HTMLButtonElement[] = [];
  for (let r = 1; r <= 3; r++) {
    for (let c = 1; c <= 3; c++) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cherry-dialog-grid-cell";
      btn.dataset.rows = String(r);
      btn.dataset.cols = String(c);
      btn.title = `${r}×${c}`;
      cells.push(btn);
      grid.appendChild(btn);
    }
  }
  grid.style.gridTemplateColumns = "repeat(3, 1fr)";

  const sync = () => {
    for (const btn of cells) {
      const r = Number(btn.dataset.rows);
      const c = Number(btn.dataset.cols);
      btn.classList.toggle("is-active", r <= selRows && c <= selCols);
    }
    (form.elements.namedItem("rows") as HTMLInputElement).value = String(selRows);
    (form.elements.namedItem("cols") as HTMLInputElement).value = String(selCols);
  };

  grid.addEventListener("click", (e) => {
    const t = (e.target as HTMLElement).closest(".cherry-dialog-grid-cell") as HTMLButtonElement | null;
    if (!t) return;
    selRows = Number(t.dataset.rows);
    selCols = Number(t.dataset.cols);
    sync();
  });

  form.addEventListener("input", () => {
    selRows = Number((form.elements.namedItem("rows") as HTMLInputElement).value) || 2;
    selCols = Number((form.elements.namedItem("cols") as HTMLInputElement).value) || 1;
    sync();
  });

  form.querySelector('[data-action="cancel"]')?.addEventListener("click", () => callbacks.onCancel());
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    callbacks.onSubmit({ rows: selRows, cols: selCols });
  });

  host.appendChild(form);
  sync();
  return () => form.remove();
}
