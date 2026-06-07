import { CherryTransformer } from "../../src/transformer/index.js";

const transformer = new CherryTransformer();

const summaryPass = document.querySelector("#summary-pass");
const summaryFail = document.querySelector("#summary-fail");
const summarySkip = document.querySelector("#summary-skip");
const summaryTotal = document.querySelector("#summary-total");
const filterInput = document.querySelector("#filter");
const sectionSelect = document.querySelector("#section-filter");
const statusSelect = document.querySelector("#status-filter");
const navRoot = document.querySelector("#nav");
const casesRoot = document.querySelector("#cases");
const rerunBtn = document.querySelector("#rerun-btn");
const statusEl = document.querySelector("#status");

let allCases = [];
let sections = [];
/** @type {{ item: object, result: object }[]} */
let allResults = [];

function normalizeHtml(html) {
  return String(html).replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
}

function compareHtml(actual, expected) {
  if (expected.trim() === "<IGNORE>") return { ok: true };
  return { ok: normalizeHtml(actual) === normalizeHtml(expected) };
}

function renderCase(item, result) {
  const section = document.createElement("section");
  section.className = "case";
  section.id = `case-${item.id}`;
  section.dataset.section = item.section;

  const badgeClass = result.skipped ? "skip" : result.ok ? "pass" : "fail";
  const badgeText = result.skipped ? "跳过" : result.ok ? "通过" : "失败";

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
        <div class="preview"></div>
        ${result.ok || result.skipped ? "" : `<div class="fail-msg"></div>`}
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

  section.querySelector(".source").textContent = item.markdown;
  section.querySelector(".preview").innerHTML = result.actualHtml ?? "";
  section.querySelector(".expected").textContent = item.html;
  section.querySelector(".actual").textContent = result.actualHtml ?? "";
  if (!result.ok && !result.skipped) {
    section.querySelector(".fail-msg").textContent = result.message ?? "与期望 HTML 不一致";
  }

  return section;
}

function buildSectionFilter() {
  sectionSelect.innerHTML = '<option value="">全部章节</option>';
  for (const name of sections) {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    sectionSelect.appendChild(opt);
  }
}

function buildNav(visibleResults) {
  navRoot.innerHTML = "";
  const bySection = new Map();
  for (const { item, result } of visibleResults) {
    if (!bySection.has(item.section)) bySection.set(item.section, []);
    bySection.get(item.section).push({ item, result });
  }

  for (const [section, entries] of bySection) {
    const group = document.createElement("div");
    group.className = "nav-group";
    const pass = entries.filter((e) => e.result.ok).length;
    group.innerHTML = `<h2>${section} <span class="nav-count">${pass}/${entries.length}</span></h2>`;

    for (const { item, result } of entries) {
      const link = document.createElement("a");
      link.href = `#case-${item.id}`;
      const icon = result.skipped ? "○" : result.ok ? "✓" : "✗";
      const cls = result.skipped ? "skip" : result.ok ? "pass" : "fail";
      link.innerHTML = `#${item.example} <span class="status ${cls}">${icon}</span>`;
      group.appendChild(link);
    }
    navRoot.appendChild(group);
  }
}

function getFilter() {
  return {
    q: filterInput.value.trim().toLowerCase(),
    section: sectionSelect.value,
    status: statusSelect.value,
  };
}

function matchesFilter(item, result, { q, section, status }) {
  if (status === "pass" && !result.ok) return false;
  if (status === "fail" && (result.ok || result.skipped)) return false;
  if (status === "skip" && !result.skipped) return false;
  if (section && item.section !== section) return false;
  if (!q) return true;
  return (
    String(item.example).includes(q) ||
    item.section.toLowerCase().includes(q) ||
    item.markdown.toLowerCase().includes(q)
  );
}

function runCase(item) {
  const { html } = transformer.render(item.markdown, {
    extensions: item.extensions ?? [],
  });
  const check = compareHtml(html, item.html);
  return {
    ok: check.ok,
    skipped: false,
    actualHtml: html,
    message: check.ok ? undefined : "HTML 与 GFM 期望不一致",
  };
}

function updateSummary(visibleResults) {
  const totalPass = allResults.filter(({ result }) => result.ok).length;
  const totalFail = allResults.filter(({ result }) => !result.ok && !result.skipped).length;
  const visiblePass = visibleResults.filter(({ result }) => result.ok).length;
  const visibleFail = visibleResults.filter(({ result }) => !result.ok && !result.skipped).length;

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

function applyFilter() {
  const filter = getFilter();
  const visibleResults = allResults.filter(({ item, result }) =>
    matchesFilter(item, result, filter),
  );

  updateSummary(visibleResults);

  casesRoot.innerHTML = "";
  const frag = document.createDocumentFragment();
  for (const entry of visibleResults) {
    frag.appendChild(renderCase(entry.item, entry.result));
  }
  casesRoot.appendChild(frag);
  buildNav(visibleResults);

  return visibleResults;
}

function runTests() {
  statusEl.textContent = "运行测试中…";
  allResults = allCases.map((item) => ({ item, result: runCase(item) }));
  return applyFilter();
}

async function init() {
  statusEl.textContent = "加载 GFM 用例…";
  const res = await fetch(new URL("../../test/fixtures/gfm/cases.json", import.meta.url));
  if (!res.ok) {
    statusEl.textContent = "未找到 cases.json，请先运行: pnpm fetch:gfm";
    return;
  }
  allCases = await res.json();
  sections = [...new Set(allCases.map((c) => c.section))];
  buildSectionFilter();
  runTests();
}

rerunBtn.addEventListener("click", () => runTests());
filterInput.addEventListener("input", () => applyFilter());
sectionSelect.addEventListener("change", () => applyFilter());
statusSelect.addEventListener("change", () => applyFilter());

summaryFail.addEventListener("click", () => {
  const totalFail = allResults.filter(({ result }) => !result.ok && !result.skipped).length;
  if (totalFail === 0) return;
  statusSelect.value = statusSelect.value === "fail" ? "" : "fail";
  applyFilter();
});

init();

window.cherryGfmDemo = { transformer, runTests, applyFilter };
