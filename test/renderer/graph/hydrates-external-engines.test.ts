import { afterEach, expect, it, vi } from "vitest";
import { createJsdomRenderer } from "../helpers.js";
import { parseEchartsJson } from "@/transformer/extends/block/specialCode.js";

afterEach(() => {
  delete (globalThis as Record<string, unknown>).katex;
});

const math = {
  renderToString: (tex: string) => `<span class="katex-mock">${tex}</span>`,
};

it("hydrates math from an instance and omits the remote src", async () => {
  const { renderer, mount } = createJsdomRenderer(false, undefined, {
    math,
  });
  renderer.render("行内 $a+b$\n\n$$E=mc^2$$");
  await vi.waitFor(() =>
    expect(mount.querySelectorAll('[data-penna-hydrated="math"]')).toHaveLength(
      2,
    ),
  );
  expect(mount.innerHTML).not.toContain("math-api-delta");
  expect(mount.querySelector(".katex-mock")?.textContent).toBe("a+b");
});

it("resolves loaders returning ES modules and the 'global' source", async () => {
  const a = createJsdomRenderer(false, undefined, {
    math: async () => ({ default: math }),
  });
  a.renderer.render("$x$");
  await vi.waitFor(() =>
    expect(a.mount.querySelector('[data-penna-hydrated="math"]')).toBeTruthy(),
  );

  (globalThis as Record<string, unknown>).katex = math;
  const b = createJsdomRenderer(false, undefined, { math: "global" });
  b.renderer.render("$y$");
  await vi.waitFor(() =>
    expect(b.mount.querySelector('[data-penna-hydrated="math"]')).toBeTruthy(),
  );
});

it("falls back to source text when the engine cannot be resolved", async () => {
  const { renderer, mount } = createJsdomRenderer(false, undefined, {
    math: "global",
  });
  renderer.render("$$z$$");
  await vi.waitFor(() =>
    expect(mount.querySelector("pre.penna-graph-fallback")?.textContent).toBe(
      "z",
    ),
  );
});

it("renders mermaid strictly, serially, and caches by source+theme", async () => {
  const render = vi.fn(async () => ({ svg: "<svg class='m'></svg>" }));
  const initialize = vi.fn();
  const { renderer, mount } = createJsdomRenderer(false, undefined, {
    mermaid: { initialize, render },
  });
  renderer.render("```mermaid\nA-->B\n```");
  await vi.waitFor(() => expect(mount.querySelector("svg.m")).toBeTruthy());
  expect(initialize).toHaveBeenCalledWith(
    expect.objectContaining({ securityLevel: "strict" }),
  );
  renderer.setEngines({ mermaid: { initialize, render } });
  await vi.waitFor(() => expect(mount.querySelector("svg.m")).toBeTruthy());
  expect(mount.innerHTML).not.toContain("mermaid.ink");
});

it("falls back for failing mermaid and leaves no stray nodes", async () => {
  const { renderer, mount, dom } = createJsdomRenderer(false, undefined, {
    mermaid: {
      render: async () => {
        throw new Error("bad");
      },
    },
  });
  renderer.render("```mermaid\nnot valid\n```");
  await vi.waitFor(() =>
    expect(mount.querySelector("pre.penna-graph-fallback")).toBeTruthy(),
  );
  expect(
    dom.window.document.querySelectorAll("[id^='dpenna-mmd']"),
  ).toHaveLength(0);
});

it("re-inits echarts with the new theme and disposes the old chart", async () => {
  const dispose = vi.fn();
  const init = vi.fn(() => ({ setOption: vi.fn(), dispose }));
  const { renderer, mount, theme } = createJsdomRenderer(false, undefined, {
    echarts: { init },
  });
  renderer.render("```echarts\n{series:[{type:'bar',data:[1]}]}\n```");
  await vi.waitFor(() => expect(init).toHaveBeenCalledTimes(1));
  theme.setLightDark("dark");
  await vi.waitFor(() => expect(init).toHaveBeenCalledTimes(2));
  expect(init).toHaveBeenLastCalledWith(expect.anything(), "dark");
  expect(dispose).toHaveBeenCalledTimes(1);
  renderer.destroy();
  expect(dispose).toHaveBeenCalledTimes(2);
  expect(mount).toBeTruthy();
});

it("setEngines(undefined) switches back to remote images", async () => {
  const { renderer, mount } = createJsdomRenderer(false, undefined, { math });
  renderer.render("$$a$$");
  await vi.waitFor(() =>
    expect(mount.querySelector('[data-penna-hydrated="math"]')).toBeTruthy(),
  );
  renderer.setEngines(undefined);
  expect(
    mount.querySelector("img.penna-math-latex")?.getAttribute("src"),
  ).toContain("math-api");
});

it("parses echarts object literals without executing code", () => {
  expect(parseEchartsJson("{a:1,'b':'x',c:[1,2,],}")).toEqual({
    a: 1,
    b: "x",
    c: [1, 2],
  });
  const g = globalThis as Record<string, unknown>;
  expect(parseEchartsJson("{a:(()=>{globalThis.__pwn=1})()}")).toEqual({});
  expect(g.__pwn).toBeUndefined();
});

it("setEngines rebuilds blocks instead of reusing hydrated nodes", async () => {
  const { renderer, mount } = createJsdomRenderer(false, undefined, {
    mermaid: { render: async () => ({ svg: "<svg class='m'></svg>" }) },
  });
  renderer.render("```mermaid\nA-->B\n```");
  await vi.waitFor(() => expect(mount.querySelector("svg.m")).toBeTruthy());
  renderer.setEngines(undefined);
  expect(mount.querySelector("svg.m")).toBeNull();
  expect(
    mount.querySelector("img.penna-mermaid__img")?.getAttribute("src"),
  ).toContain("mermaid.ink");
});
