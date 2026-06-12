/**
 * @file 解析过程共享存储
 * @module transformer/core/ParserStore
 */

export type InlineFrame = Record<string, unknown>;

export class ParserStore {
  private readonly lines: string[];
  private store: Record<string, unknown>;

  constructor(lines: string[]) {
    this.lines = lines;
    this.store = {};
  }

  /**
   * 获取指定索引的行数据
   * @param index 数组索引
   * @returns 对应行的字符串，超出索引时返回 null
   */
  getLine(index: number): string | null {
    return this.lines[index] ?? null;
  }

  /**
   * 判断 store 中是否存在指定的键
   * @param key 键名
   */
  has(key: string): boolean {
    return Object.prototype.hasOwnProperty.call(this.store, key);
  }

  /**
   * 从 store 中获取共享数据
   * @param key 键名
   * @returns 存储的值
   */
  get<T = unknown>(key: string): T | undefined {
    return this.store[key] as T | undefined;
  }

  /**
   * 向 store 中存入共享数据
   * @param key 键名
   * @param value 对应的值
   */
  set(key: string, value: unknown): void {
    this.store[key] = value;
  }

  /**
   * 删除 store 中的指定数据
   * @param key 键名
   * @returns 是否成功删除（存在该键并删除返回 true，否则返回 false）
   */
  delete(key: string): boolean {
    if (this.has(key)) {
      delete this.store[key];
      return true;
    }
    return false;
  }

  /**
   * 清空 store 中的所有共享数据
   */
  clear(): void {
    this.store = {};
  }
}