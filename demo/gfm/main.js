import { CherryTransformer } from "../../src/transformer/index.js";

const transformer = new CherryTransformer();

const summaryPass = document.querySelector("#summary-pass");
const summaryFail = document.querySelector("#summary-fail");
const summarySkip = document.querySelector("#summary-skip");
const summaryTotal = document.querySelector("#summary-total");
const filterInput = document.querySelector("#filter");
const sectionSelect = document.querySelector("#section-filter");
const navRoot = document.querySelector("#nav");
const casesRoot = document.querySelector("#cases");
const rerunBtn = document.querySelector("#rerun-btn");
const statusEl = document.querySelector("#status");

let allCases = [];
let sections = [];

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
  const q = filterInput.value.trim().toLowerCase();
  const section = sectionSelect.value;
  return { q, section };
}

function matchesFilter(item, { q, section }) {
  if (section && item.section !== section) return false;
  if (!q) return true;
  return (
    String(item.example).includes(q) ||
    item.section.toLowerCase().includes(q) ||
    item.markdown.toLowerCase().includes(q)
  );
}

function runCase(item) {
  const { html } = transformer.render(item.markdown);
  const check = compareHtml(html, item.html);
  return {
    ok: check.ok,
    skipped: false,
    actualHtml: html,
    message: check.ok ? undefined : "HTML 与 GFM 期望不一致",
  };
}

function runAll({ renderDom = true } = {}) {
  const filter = getFilter();
  let pass = 0;
  let fail = 0;
  let skip = 0;
  const results = [];

  if (renderDom) casesRoot.innerHTML = "";

  for (const item of allCases) {
    if (!matchesFilter(item, filter)) continue;
    const result = runCase(item);
    results.push({ item, result });
    if (result.ok) pass += 1;
    else fail += 1;
  }

  const visible = allCases.filter((item) => matchesFilter(item, filter)).length;
  skip = visible - pass - fail;

  summaryPass.textContent = `通过 ${pass}`;
  summaryFail.textContent = `失败 ${fail}`;
  summarySkip.textContent = `显示 ${visible}/${allCases.length}`;
  summaryTotal.textContent = `GFM 共 ${allCases.length} 例`;
  summaryFail.className = fail > 0 ? "fail" : "";

  statusEl.textContent = `渲染完成 · ${new Date().toLocaleTimeString()}`;

  if (renderDom) {
    const frag = document.createDocumentFragment();
    for (const entry of results) {
      frag.appendChild(renderCase(entry.item, entry.result));
    }
    casesRoot.appendChild(frag);
    buildNav(results);
  }

  return { pass, fail, visible };
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
  runAll();
}

rerunBtn.addEventListener("click", () => runAll());
filterInput.addEventListener("input", () => runAll());
sectionSelect.addEventListener("change", () => runAll());

init();

window.cherryGfmDemo = { transformer, runAll };

