import type { DialogCallbacks } from "@/editor/commands/DialogCommand.js";

export type FormFieldType =
  "text" | "url" | "search" | "textarea" | "select" | "checkbox";

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

/** 为声明式字段定义提供表单弹窗渲染、校验和结果转换的基类。 */
export abstract class FormDialog<TResult> {
  /**
   * 渲染前合并属性，例如补充字段默认值。
   *
   * @param props 调用方传入的原始弹窗属性。
   * @returns 供渲染表单使用的属性。
   */
  prepareProps(props: Record<string, unknown>): Record<string, unknown> {
    return props;
  }

  /** 获取可选的弹窗标题。 */
  get title(): string | undefined {
    return undefined;
  }

  /** 获取显示在表单顶部的可选提示文本。 */
  get hint(): string | undefined {
    return undefined;
  }

  /** 获取显示在表单顶部的可选帮助链接。 */
  get link(): { text: string; href: string } | undefined {
    return undefined;
  }

  /** 获取提交按钮的显示文本。 */
  get submitText(): string {
    return "插入";
  }

  /** 获取附加到表单根元素的可选 CSS 类名。 */
  get className(): string | undefined {
    return undefined;
  }

  abstract readonly fields: FormFieldDef[];

  /**
   * 校验收集到的字段值。
   *
   * @param _raw 表单字段名与原始值的映射。
   * @returns 校验失败时的错误文本；成功时为 `null`。
   */
  validate(_raw: Record<string, string | boolean>): string | null {
    return null;
  }

  /**
   * 将已校验的表单值转换为弹窗结果。
   *
   * @param raw 表单字段名与原始值的映射。
   * @returns 可提交的结果；无法转换时为 `null`。
   */
  abstract toResult(raw: Record<string, string | boolean>): TResult | null;

  /**
   * 在表单挂载后执行可选的初始化逻辑。
   *
   * @param _form 已挂载的表单元素。
   * @param _props 合并后的弹窗属性。
   * @returns 可选的卸载清理函数。
   */
  onMount(
    _form: HTMLFormElement,
    _props: Record<string, unknown>,
  ): void | (() => void) {}

  /**
   * 在宿主节点中渲染表单，并返回销毁表单的清理函数。
   *
   * @param host 要挂载表单的宿主元素。
   * @param props 调用方传入的弹窗属性。
   * @param callbacks 提交和取消时调用的回调。
   * @returns 移除表单和事件监听的清理函数。
   */
  render(
    host: HTMLElement,
    props: Record<string, unknown>,
    callbacks: DialogCallbacks<TResult>,
  ): () => void {
    const merged = this.prepareProps(props);
    const form = document.createElement("form");
    form.className = ["penna-dialog-form", this.className]
      .filter(Boolean)
      .join(" ");

    const title = this.title;
    if (title) {
      const head = document.createElement("div");
      head.className = "penna-dialog-table-head";
      const titleEl = document.createElement("span");
      titleEl.className = "penna-dialog-table-title";
      titleEl.textContent = title;
      head.append(titleEl);
      form.append(head);
    }

    const scrollArea = document.createElement("div");
    scrollArea.className = "penna-dialog-form-scroll-area";
    form.append(scrollArea);

    const hint = this.hint;
    if (hint) {
      const hintEl = document.createElement("p");
      hintEl.className = "penna-dialog-table-hint";
      hintEl.textContent = hint;
      scrollArea.append(hintEl);
    }

    const linkDef = this.link;
    if (linkDef) {
      const linkEl = document.createElement("a");
      linkEl.className = "penna-dialog-link";
      linkEl.href = linkDef.href;
      linkEl.target = "_blank";
      linkEl.rel = "noopener noreferrer";
      linkEl.textContent = linkDef.text;
      scrollArea.append(linkEl);
    }

    const errEl = document.createElement("p");
    errEl.className = "penna-dialog-yaml-error";
    errEl.hidden = true;
    scrollArea.append(errEl);

    for (const field of this.fields) {
      this.appendField(scrollArea, field, merged);
    }

    const actions = document.createElement("div");
    actions.className = "penna-dialog-actions";
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

  /**
   * 从表单控件读取字段值，并保留复选框的布尔语义。
   *
   * @param form 要读取的表单元素。
   * @returns 字段名到字符串或布尔值的映射。
   */
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

  /**
   * 按调用属性优先、字段静态默认值次之的顺序解析字段初始值。
   *
   * @param field 要解析初始值的字段定义。
   * @param props 合并后的弹窗属性。
   * @returns 字段初始值；不存在时为 `undefined`。
   */
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

  /**
   * 按字段定义创建表单控件并追加到容器。
   *
   * @param form 要追加字段的表单容器。
   * @param field 要渲染的字段定义。
   * @param props 用于填充字段初始值的弹窗属性。
   */
  private appendField(
    form: HTMLElement,
    field: FormFieldDef,
    props: Record<string, unknown>,
  ): void {
    const type = field.type ?? "text";
    const label = document.createElement("label");
    label.className = ["penna-dialog-field", field.className]
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
