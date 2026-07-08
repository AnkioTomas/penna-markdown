import type { DialogCallbacks } from "@/editor/commands/DialogCommand.js";

export type FormFieldType =
  | "text"
  | "url"
  | "search"
  | "textarea"
  | "select"
  | "checkbox";

export interface FormFieldOption {
  value: string;
  label: string;
}

export interface FormFieldDef {
  name: string;
  label: string;
  type?: FormFieldType;
  required?: boolean;
  placeholder?: string;
  rows?: number;
  options?: FormFieldOption[];
  /** 静态默认值；若 props 中有同名字段则优先使用 props */
  defaultValue?: string | boolean;
  hidden?: boolean;
  className?: string;
}

export abstract class FormDialog<TResult> {
  /** 渲染前合并 props（如补默认值） */
  prepareProps(props: Record<string, unknown>): Record<string, unknown> {
    return props;
  }

  get title(): string | undefined {
    return undefined;
  }

  get hint(): string | undefined {
    return undefined;
  }

  get submitText(): string {
    return "插入";
  }

  get className(): string | undefined {
    return undefined;
  }

  abstract readonly fields: FormFieldDef[];

  validate(_raw: Record<string, string | boolean>): string | null {
    return null;
  }

  abstract toResult(raw: Record<string, string | boolean>): TResult | null;

  onMount(
    _form: HTMLFormElement,
    _props: Record<string, unknown>,
  ): void | (() => void) {}

  render(
    host: HTMLElement,
    props: Record<string, unknown>,
    callbacks: DialogCallbacks<TResult>,
  ): () => void {
    const merged = this.prepareProps(props);
    const form = document.createElement("form");
    form.className = ["cherry-dialog-form", this.className]
      .filter(Boolean)
      .join(" ");

    const title = this.title;
    if (title) {
      const head = document.createElement("div");
      head.className = "cherry-dialog-table-head";
      const titleEl = document.createElement("span");
      titleEl.className = "cherry-dialog-table-title";
      titleEl.textContent = title;
      head.append(titleEl);
      form.append(head);
    }

    const scrollArea = document.createElement("div");
    scrollArea.className = "cherry-dialog-form-scroll-area";
    form.append(scrollArea);

    const hint = this.hint;
    if (hint) {
      const hintEl = document.createElement("p");
      hintEl.className = "cherry-dialog-table-hint";
      hintEl.textContent = hint;
      scrollArea.append(hintEl);
    }

    const errEl = document.createElement("p");
    errEl.className = "cherry-dialog-yaml-error";
    errEl.hidden = true;
    scrollArea.append(errEl);

    for (const field of this.fields) {
      this.appendField(scrollArea, field, merged);
    }

    const actions = document.createElement("div");
    actions.className = "cherry-dialog-actions";
    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.dataset.action = "cancel";
    cancelBtn.textContent = "取消";
    const submitBtn = document.createElement("button");
    submitBtn.type = "submit";
    submitBtn.className = "is-primary";
    submitBtn.textContent = this.submitText;
    actions.append(cancelBtn, submitBtn);
    form.append(actions);

    const showError = (message: string | null) => {
      if (!message) {
        errEl.hidden = true;
        errEl.textContent = "";
        return;
      }
      errEl.hidden = false;
      errEl.textContent = message;
    };

    cancelBtn.addEventListener("click", () => callbacks.onCancel());

    const onSubmit = (e: Event) => {
      e.preventDefault();
      const raw = FormDialog.readValues(form);
      const err = this.validate(raw);
      if (err) {
        showError(err);
        return;
      }
      showError(null);
      const result = this.toResult(raw);
      if (result === null) return;
      callbacks.onSubmit(result);
    };
    form.addEventListener("submit", onSubmit);

    const mountCleanup = this.onMount(form, merged);
    host.appendChild(form);

    return () => {
      mountCleanup?.();
      form.removeEventListener("submit", onSubmit);
      form.remove();
    };
  }

  private static readValues(
    form: HTMLFormElement,
  ): Record<string, string | boolean> {
    const fd = new FormData(form);
    const raw: Record<string, string | boolean> = {};
    for (const field of form.elements) {
      if (!(field instanceof HTMLInputElement)) continue;
      if (field.type === "checkbox") {
        raw[field.name] = field.checked;
        continue;
      }
      if (field.name) raw[field.name] = String(fd.get(field.name) ?? "");
    }
    for (const field of form.elements) {
      if (!(field instanceof HTMLSelectElement && field.name)) continue;
      raw[field.name] = String(fd.get(field.name) ?? "");
    }
    for (const field of form.elements) {
      if (!(field instanceof HTMLTextAreaElement && field.name)) continue;
      raw[field.name] = String(fd.get(field.name) ?? "");
    }
    return raw;
  }

  private resolveFieldValue(
    field: FormFieldDef,
    props: Record<string, unknown>,
  ): string | boolean | undefined {
    if (field.name in props) {
      const v = props[field.name];
      if (typeof v === "boolean") return v;
      if (v != null) return String(v);
    }
    if (field.defaultValue !== undefined) return field.defaultValue;
    return undefined;
  }

  private appendField(
    form: HTMLElement,
    field: FormFieldDef,
    props: Record<string, unknown>,
  ): void {
    const type = field.type ?? "text";
    const label = document.createElement("label");
    label.className = ["cherry-dialog-field", field.className]
      .filter(Boolean)
      .join(" ");
    if (field.hidden) label.hidden = true;

    if (type === "checkbox") {
      const input = document.createElement("input");
      input.name = field.name;
      input.type = "checkbox";
      const checked = this.resolveFieldValue(field, props);
      if (checked === true || checked === "true" || checked === "on") {
        input.checked = true;
      }
      label.append(input, ` ${field.label}`);
      form.append(label);
      return;
    }

    label.append(field.label);

    if (type === "select") {
      const select = document.createElement("select");
      select.name = field.name;
      if (field.required) select.required = true;
      for (const opt of field.options ?? []) {
        const option = document.createElement("option");
        option.value = opt.value;
        option.textContent = opt.label;
        select.append(option);
      }
      const value = this.resolveFieldValue(field, props);
      if (value !== undefined) select.value = String(value);
      label.append(select);
      form.append(label);
      return;
    }

    if (type === "textarea") {
      const textarea = document.createElement("textarea");
      textarea.name = field.name;
      textarea.rows = field.rows ?? 4;
      if (field.required) textarea.required = true;
      if (field.placeholder) textarea.placeholder = field.placeholder;
      const value = this.resolveFieldValue(field, props);
      if (value !== undefined) textarea.value = String(value);
      label.append(textarea);
      form.append(label);
      return;
    }

    const input = document.createElement("input");
    input.name = field.name;
    input.type = type;
    if (field.required) input.required = true;
    if (field.placeholder) input.placeholder = field.placeholder;
    const value = this.resolveFieldValue(field, props);
    if (value !== undefined) input.value = String(value);
    label.append(input);
    form.append(label);
  }
}
