import { expect, it, vi } from "vitest";
import { createJsdomRenderer } from "../helpers.js";
import type { GraphEngines } from "@/renderer/graph/graph.js";

it("hydrates math with local MathEngine and skips remote src", () => {
  const engines: GraphEngines = {
    math: {
      renderToString: (tex, opts) =>
        `<span class="katex-mock" data-display="${opts?.displayMode ? 1 : 0}">${tex}</span>`,
    },
  };
  const { renderer, mount } = createJsdomRenderer(false, undefined, {
    engines,
  });

  renderer.render("$$E=mc^2$$");

  const hydrated = mount.querySelector(
    '.penna-math-latex[data-penna-hydrated="math"]',
  );
  expect(hydrated).toBeTruthy();
  expect(hydrated?.innerHTML).toContain("katex-mock");
  expect(hydrated?.innerHTML).toContain("E=mc^2");
  expect(mount.querySelector("img.penna-math-latex")).toBeNull();
  expect(mount.innerHTML).not.toContain("math-api-delta.vercel.app");
});

it("hydrates mermaid with local MermaidEngine", async () => {
  const engines: GraphEngines = {
    mermaid: {
      initialize: vi.fn(),
      render: vi.fn(async () => ({
        svg: '<svg class="mermaid-mock" xmlns="http://www.w3.org/2000/svg"></svg>',
      })),
    },
  };
  const { renderer, mount } = createJsdomRenderer(false, undefined, {
    engines,
  });

  renderer.render("```mermaid\nflowchart TD\nA-->B\n```");

  await vi.waitFor(() => {
    expect(
      mount.querySelector('.penna-mermaid__img[data-penna-hydrated="mermaid"]'),
    ).toBeTruthy();
  });

  expect(mount.querySelector("svg.mermaid-mock")).toBeTruthy();
  expect(mount.innerHTML).not.toContain("mermaid.ink");
  expect(engines.mermaid!.render).toHaveBeenCalled();
});

it("hydrates echarts with local EchartsEngine", () => {
  const setOption = vi.fn();
  const dispose = vi.fn();
  const engines: GraphEngines = {
    echarts: {
      init: vi.fn(() => ({ setOption, dispose })),
    },
  };

  const { renderer, mount } = createJsdomRenderer(false, undefined, {
    engines,
  });

  renderer.render('```echarts\n{"series":[{"type":"bar"}]}\n```');

  expect(
    mount.querySelector('.penna-echarts__img[data-penna-hydrated="echarts"]'),
  ).toBeTruthy();
  expect(engines.echarts!.init).toHaveBeenCalled();
  expect(setOption).toHaveBeenCalled();
  expect(mount.innerHTML).not.toContain("echarts-api.vercel.app");

  renderer.destroy();
  expect(dispose).toHaveBeenCalled();
});

it("keeps remote API img when engines are not provided", () => {
  const { renderer, mount } = createJsdomRenderer();
  renderer.render("$$E=mc^2$$");
  expect(mount.innerHTML).toContain("math-api-delta.vercel.app");
});
