const isBrowser =
  typeof globalThis !== "undefined" &&
  typeof (globalThis as { document?: unknown }).document !== "undefined";

/** 调试：浏览器 → console.info；Node → console.log(stdout) */
export function logD(...args: unknown[]): void {
  if (isBrowser) {
    console.info(...args);
  } else {
    console.log(...args);
  }
}

/** 警告 */
export function logW(...args: unknown[]): void {
  console.warn(...args);
}

/** 错误 */
export function logE(...args: unknown[]): void {
  console.error(...args);
}
