import "../../_common/layout.scss";
import "./gfm-test.scss";
import "@/theme/style/transformer.scss";
import { TransformerEngine } from "@/transformer/TransformerEngine.js";
import { requiredEl } from "../../_common/dom.js";
import type { GfmCase, GfmCaseResult } from "../../_common/gfm-case.js";
import allCasesJson from "../../../test/fixtures/gfm/cases.json";

const transformer = new TransformerEngine();

const summaryPass = requiredEl<HTMLElement>("#summary-pass");
const summaryFail = requiredEl<HTMLElement>("#summary-fail");
const summarySkip = requiredEl<HTMLElement>("#summary-skip");
const summaryTotal = requiredEl<HTMLElement>("#summary-total");
const filterInput = requiredEl<HTMLInputElement>("#filter");
const sectionSelect = requiredEl<HTMLSelectElement>("#section-filter");
const statusSelect = requiredEl<HTMLSelectElement>("#status-filter");
const navRoot = requiredEl<HTMLElement>("#nav");
const casesRoot = requiredEl<HTMLElement>("#cases");
const rerunBtn = requiredEl<HTMLButtonElement>("#rerun-btn");
const statusEl = requiredEl<HTMLElement>("#status");

let allCases: GfmCase[] = [];
let sections: string[] = [];
let allResults: { item: GfmCase; result: GfmCaseResult }[] = [];

function normalizeHtml(html: string): string {
  return html.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
}

function compareHtml(actual: string, expected: string): { ok: boolean } {
  if (expected.trim() === "<IGNORE>") return { ok: true };
  return { ok: normalizeHtml(actual) === normalizeHtml(expected) };
}

function renderCase(item: GfmCase, result: GfmCaseResult): HTMLElement {
  const section = document.createElement("section");
  section.className = "case";
  section.id = `case-${item.id}`;
  section.dataset.section = item.section;

  const badgeClass = result.ok ? "pass" : "fail";
  const badgeText = result.ok ? "通过" : "失败";

  section.innerHTML = `
    <div class="case-header">
      <div>
        <h3>Example ${item.example}</h3>
        <div class="meta">${item.section}${item.extensions?.length ? ` · ${item.extensions.join(", ")}` : ""}</div>
      </div>
      <span class="badge ${badgeClass}">${badgeText}</span>
    </div>
    <div class="case-body">
      <div class="panel">
        <h4>Markdown</h4>
        <pre class="source"></pre>
      </div>
      <div class="panel">
        <h4>预览</h4>
        <div class="preview cherry-render"></div>
        ${result.ok ? "" : `<div class="fail-msg"></div>`}
      </div>
      <div class="panel case-expected">
        <h4>期望 HTML (GFM)</h4>
        <pre class="expected"></pre>
      </div>
      <div class="panel case-html">
        <h4>实际 HTML</h4>
        <pre class="actual"></pre>
      </div>
    </div>
  `;

  requiredEl<HTMLPreElement>(".source", section).textContent = item.markdown;
  requiredEl<HTMLElement>(".preview", section).innerHTML = result.actualHtml;
  requiredEl<HTMLPreElement>(".expected", section).textContent = item.html;
  requiredEl<HTMLPreElement>(".actual", section).textContent = result.actualHtml;
  if (!result.ok) {
    requiredEl<HTMLElement>(".fail-msg", section).textContent =
      result.message ?? "与期望 HTML 不一致";
  }

  return section;
}

function buildSectionFilter(): void {
  sectionSelect.innerHTML = '<option value="">全部章节</option>';
  for (const name of sections) {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    sectionSelect.appendChild(opt);
  }
}

function buildNav(
  visibleResults: { item: GfmCase; result: GfmCaseResult }[],
): void {
  navRoot.innerHTML = "";
  const bySection = new Map<string, { item: GfmCase; result: GfmCaseResult }[]>();
  for (const entry of visibleResults) {
    const list = bySection.get(entry.item.section) ?? [];
    list.push(entry);
    bySection.set(entry.item.section, list);
  }

  for (const [sectionName, entries] of bySection) {
    const group = document.createElement("div");
    group.className = "nav-group";
    const pass = entries.filter((e) => e.result.ok).length;
    group.innerHTML = `<h2>${sectionName} <span class="nav-count">${pass}/${entries.length}</span></h2>`;

    for (const { item, result } of entries) {
      const link = document.createElement("a");
      link.href = `#case-${item.id}`;
      const icon = result.ok ? "✓" : "✗";
      const cls = result.ok ? "pass" : "fail";
      link.innerHTML = `#${item.example} <span class="status ${cls}">${icon}</span>`;
      group.appendChild(link);
    }
    navRoot.appendChild(group);
  }
}

interface CaseFilter {
  q: string;
  section: string;
  status: string;
}

function getFilter(): CaseFilter {
  return {
    q: filterInput.value.trim().toLowerCase(),
    section: sectionSelect.value,
    status: statusSelect.value,
  };
}

function matchesFilter(
  item: GfmCase,
  result: GfmCaseResult,
  { q, section, status }: CaseFilter,
): boolean {
  if (status === "pass" && !result.ok) return false;
  if (status === "fail" && result.ok) return false;
  if (section && item.section !== section) return false;
  if (!q) return true;
  return (
    String(item.example).includes(q) ||
    item.section.toLowerCase().includes(q) ||
    item.markdown.toLowerCase().includes(q)
  );
}

function runCase(item: GfmCase): GfmCaseResult {
  try {
    const html = transformer.render(transformer.parse(item.markdown));
    const check = compareHtml(html, item.html);
    return {
      ok: check.ok,
      actualHtml: html,
      message: check.ok ? undefined : "HTML 与 GFM 期望不一致",
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return {
      ok: false,
      actualHtml: "",
      message: `渲染异常: ${message}`,
    };
  }
}

function updateSummary(
  visibleResults: { item: GfmCase; result: GfmCaseResult }[],
): void {
  const totalPass = allResults.filter(({ result }) => result.ok).length;
  const totalFail = allResults.filter(({ result }) => !result.ok).length;
  const visiblePass = visibleResults.filter(({ result }) => result.ok).length;
  const visibleFail = visibleResults.filter(({ result }) => !result.ok).length;

  summaryPass.textContent = `通过 ${totalPass}`;
  summaryFail.textContent = `失败 ${totalFail}`;
  summarySkip.textContent = `显示 ${visibleResults.length}/${allCases.length}`;
  summaryTotal.textContent = `GFM 共 ${allCases.length} 例`;
  summaryFail.className = `fail${totalFail > 0 ? " summary-action" : ""}`;

  const filteringFails = statusSelect.value === "fail";
  summaryFail.classList.toggle("is-active", filteringFails && totalFail > 0);

  if (statusSelect.value || sectionSelect.value || filterInput.value.trim()) {
    statusEl.textContent = `筛选中 · 可见 ${visiblePass} 通过 / ${visibleFail} 失败 · ${new Date().toLocaleTimeString()}`;
  } else {
    statusEl.textContent = `渲染完成 · ${new Date().toLocaleTimeString()}`;
  }
}

function applyFilter(): { item: GfmCase; result: GfmCaseResult }[] {
  const filter = getFilter();
  const visibleResults = allResults.filter(({ item, result }) =>
    matchesFilter(item, result, filter),
  );

  updateSummary(visibleResults);

  casesRoot.replaceChildren();
  const frag = document.createDocumentFragment();
  for (const entry of visibleResults) {
    frag.appendChild(renderCase(entry.item, entry.result));
  }
  casesRoot.appendChild(frag);
  buildNav(visibleResults);

  return visibleResults;
}

function runTests(): { item: GfmCase; result: GfmCaseResult }[] {
  statusEl.textContent = "运行测试中…";
  allResults = allCases.map((item) => ({ item, result: runCase(item) }));
  return applyFilter();
}

async function init(): Promise<void> {
  statusEl.textContent = "加载 GFM 用例…";
  allCases = allCasesJson as GfmCase[];
  if (allCases.length === 0) {
    statusEl.textContent = "用例为空，请先运行: pnpm fetch:gfm";
    return;
  }
  sections = [...new Set(allCases.map((c) => c.section))];
  buildSectionFilter();
  runTests();
}

rerunBtn.addEventListener("click", () => runTests());
filterInput.addEventListener("input", () => applyFilter());
sectionSelect.addEventListener("change", () => applyFilter());
statusSelect.addEventListener("change", () => applyFilter());

summaryFail.addEventListener("click", () => {
  const totalFail = allResults.filter(({ result }) => !result.ok).length;
  if (totalFail === 0) return;
  statusSelect.value = statusSelect.value === "fail" ? "" : "fail";
  applyFilter();
});

init();

declare global {
  interface Window {
    cherryGfmDemo?: {
      transformer: TransformerEngine;
      runTests: typeof runTests;
      applyFilter: typeof applyFilter;
    };
  }
}

window.cherryGfmDemo = { transformer, runTests, applyFilter };
