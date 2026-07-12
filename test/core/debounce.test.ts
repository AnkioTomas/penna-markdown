import { expect, it, vi } from "vitest";
import { debounce } from "@/core/debounce";

it("runs only once after delay when called repeatedly", () => {
  vi.useFakeTimers();
  const fn = vi.fn();
  const run = debounce(fn, 100);

  run();
  run();
  run();
  expect(fn).not.toHaveBeenCalled();

  vi.advanceTimersByTime(100);
  expect(fn).toHaveBeenCalledTimes(1);

  vi.useRealTimers();
});

it("passes the latest arguments to the debounced function", () => {
  vi.useFakeTimers();
  const fn = vi.fn();
  const run = debounce(fn, 50);

  run("a");
  run("b");
  vi.advanceTimersByTime(50);
  expect(fn).toHaveBeenCalledWith("b");

  vi.useRealTimers();
});

it("cancel prevents a pending invocation", () => {
  vi.useFakeTimers();
  const fn = vi.fn();
  const run = debounce(fn, 50);

  run();
  run.cancel();
  vi.advanceTimersByTime(50);
  expect(fn).not.toHaveBeenCalled();

  vi.useRealTimers();
});
