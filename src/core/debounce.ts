export type Debounced<F extends (...args: never) => void> = ((
  ...args: Parameters<F>
) => void) & {
  cancel: () => void;
};

/**
 * 创建防抖函数：连续调用时只在上次调用结束 {@link ms} 毫秒后执行一次。
 *
 * @param fn 要防抖的函数。
 * @param ms 延迟毫秒数。
 * @returns 防抖后的函数，附带 {@link cancel} 用于取消待执行任务。
 */
// `any[]` 用于兼容具体参数类型的回调；返回类型仍由 Parameters<F> 精确推导
export function debounce<F extends (...args: any[]) => void>(
  fn: F,
  ms: number,
): Debounced<F> {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const debounced = ((...args: Parameters<F>) => {
    if (timer != null) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn(...args);
    }, ms);
  }) as Debounced<F>;

  debounced.cancel = () => {
    if (timer != null) clearTimeout(timer);
    timer = null;
  };

  return debounced;
}
