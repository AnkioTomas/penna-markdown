export class Log {
  constructor(protected debug: boolean = false) {}
  /** 调试：浏览器 → console.info；Node → console.log(stdout) */
  logD(...args: unknown[]): void {
    if (!this.debug) return;
    console.info(...args);
  }

  /** 警告 */
  logW(...args: unknown[]): void {
    console.warn(...args);
  }

  /** 错误 */
  logE(...args: unknown[]): void {
    console.error(...args);
  }
}
