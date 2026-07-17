import { expect, it, vi } from "vitest";
import {
  createDefaultStorage,
  createLocalStorageAdapter,
  createMemoryStorage,
} from "@/core/StorageAPI.js";

it("createMemoryStorage reads and writes values", () => {
  const storage = createMemoryStorage();
  storage.setItem("a", "1");
  expect(storage.getItem("a")).toBe("1");
  expect(storage.getItem("missing")).toBeNull();
});

it("createMemoryStorage accepts seed values", () => {
  const storage = createMemoryStorage({ theme: "github" });
  expect(storage.getItem("theme")).toBe("github");
});

it("createDefaultStorage returns a working storage implementation", () => {
  const storage = createDefaultStorage();
  storage.setItem("penna-test", "ok");
  expect(storage.getItem("penna-test")).toBe("ok");
});

it("createLocalStorageAdapter mirrors localStorage when available", () => {
  const store: Record<string, string> = {};
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
  });

  const storage = createLocalStorageAdapter();
  storage.setItem("penna-test-local", "yes");
  expect(storage.getItem("penna-test-local")).toBe("yes");

  vi.unstubAllGlobals();
});
