/** 键值本地存储契约，默认由 {@link createDefaultStorage} 适配 `localStorage` */
export interface StorageAPI {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/** 使用浏览器 `localStorage` 的存储适配器 */
export function createLocalStorageAdapter(): StorageAPI {
  return {
    getItem(key: string) {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    setItem(key: string, value: string) {
      try {
        localStorage.setItem(key, value);
      } catch {
        // 忽略隐私模式、配额超限等写入失败
      }
    },
  };
}

/** 内存存储，用于无 `localStorage` 环境或测试 */
export function createMemoryStorage(
  seed: Record<string, string> = {},
): StorageAPI {
  const store = new Map(Object.entries(seed));
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value);
    },
  };
}

/** 默认存储：优先 `localStorage`，不可用时回退到内存 */
export function createDefaultStorage(): StorageAPI {
  if (typeof localStorage !== "undefined") {
    return createLocalStorageAdapter();
  }
  return createMemoryStorage();
}
