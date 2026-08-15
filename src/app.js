import {
  analyzeRegex,
  estimateMonthlyCost,
  escapeHtml,
  filterAndSortRadar,
  generateCompose,
  generateAgentGuide,
  highlightMatches,
  jsonLens,
  RADAR_ITEMS,
} from "./toolkit.js";
import { siteConfig } from "../data/site-config.js";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function updateRegex() {
  const pattern = $("#regex-pattern").value;
  const text = $("#regex-test").value;
  const flags = $("#regex-ignore-case").checked ? "gim" : "gm";
  const result = analyzeRegex(pattern, text, flags);
  $("#regex-flags").textContent = flags;
  $("#regex-match-count").textContent = `${result.matches.length} ${result.matches.length === 1 ? "match" : "matches"}`;
  $("#regex-result").innerHTML = result.valid ? highlightMatches(text, result.matches) : escapeHtml(result.error);
  $("#regex-message").textContent = result.valid
    ? result.matches.length ? "Looks good — matching fragments are highlighted." : "No matches yet — try a preset or adjust the pattern."
    : "This pattern needs a small fix before it can run.";
  $("#regex-message").style.color = result.valid ? "" : "#ff9e9e";
}

function initRegex() {
  ["#regex-pattern", "#regex-test", "#regex-ignore-case"].forEach((selector) => $(selector).addEventListener("input", updateRegex));
  $$(".regex-preset").forEach((button) => button.addEventListener("click", () => {
    $("#regex-pattern").value = button.dataset.pattern;
    updateRegex();
  }));
  updateRegex();
}

function composeInputs() {
  return {
    database: $("#docker-database").value,
    version: $("#docker-version").value,
    port: $("#docker-port").value,
    dbName: $("#docker-db-name").value,
    username: $("#docker-user").value,
    password: $("#docker-password").value,
  };
}

function updateCompose() {
  $("#docker-output").textContent = generateCompose(composeInputs());
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function flashButton(button, label) {
  const original = button.textContent;
  button.textContent = label;
  window.setTimeout(() => { button.textContent = original; }, 1300);
}

function downloadText(text, filename, type = "text/plain") {
  const blob = new Blob([text], { type });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(link.href), 0);
}

function initCompose() {
  ["#docker-database", "#docker-version", "#docker-port", "#docker-db-name", "#docker-user", "#docker-password"].forEach((selector) => $(selector).addEventListener("input", updateCompose));
  $("#docker-copy").addEventListener("click", async () => {
    if (await copyText($("#docker-output").textContent)) flashButton($("#docker-copy"), "copied");
  });
  $("#docker-download").addEventListener("click", () => {
    downloadText($("#docker-output").textContent, "docker-compose.yml", "text/yaml");
  });
  updateCompose();
}

let radarFilter = "all";
let radarDescending = true;

function renderRadar() {
  const items = filterAndSortRadar(RADAR_ITEMS, radarFilter, radarDescending);
  $("#radar-list").innerHTML = items.map((item) => `
    <div class="radar-item">
      <div><div class="radar-name">${escapeHtml(item.name)}</div><div class="radar-meta">${escapeHtml(item.description)}</div></div>
      <div class="radar-signal">${String(item.signal).padStart(2, "0")}</div>
    </div>`).join("");
}

function initRadar() {
  $$('[data-radar-filter]').forEach((button) => button.addEventListener("click", () => {
    radarFilter = button.dataset.radarFilter;
    $$('[data-radar-filter]').forEach((item) => item.classList.toggle("active", item === button));
    renderRadar();
  }));
  $("#radar-sort").addEventListener("click", () => {
    radarDescending = !radarDescending;
    $("#radar-sort").textContent = `sort: signal ${radarDescending ? "↓" : "↑"}`;
    renderRadar();
  });
  renderRadar();
}

function updateCost() {
  const cpu = $("#cpu-input").value;
  const ram = $("#ram-input").value;
  const storage = $("#storage-input").value;
  $("#cpu-value").value = cpu;
  $("#cpu-value").textContent = cpu;
  $("#ram-value").value = ram;
  $("#ram-value").textContent = ram;
  $("#storage-value").value = storage;
  $("#storage-value").textContent = storage;
  const { total } = estimateMonthlyCost({ provider: $("#cost-provider").value, cpu, ram, storage });
  $("#cost-total").textContent = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(total);
}

function initCost() {
  ["#cpu-input", "#ram-input", "#storage-input", "#cost-provider"].forEach((selector) => $(selector).addEventListener("input", updateCost));
  updateCost();
}

function agentInputs() {
  return {
    stack: $("#agent-stack").value,
    projectName: $("#agent-project").value,
    goal: $("#agent-goal").value,
    testCommand: $("#agent-test").value,
    notes: $("#agent-notes").value,
  };
}

function updateAgentGuide() {
  $("#agent-output").textContent = generateAgentGuide(agentInputs());
}

function initAgentGuide() {
  ["#agent-stack", "#agent-project", "#agent-goal", "#agent-test", "#agent-notes"].forEach((selector) => $(selector).addEventListener("input", updateAgentGuide));
  $("#agent-copy").addEventListener("click", async () => {
    if (await copyText($("#agent-output").textContent)) flashButton($("#agent-copy"), "copied");
  });
  $("#agent-download").addEventListener("click", () => downloadText($("#agent-output").textContent, "AGENTS.md", "text/markdown"));
  updateAgentGuide();
}

let jsonMode = "format";

function updateJsonLens() {
  const result = jsonLens($("#json-input").value, jsonMode);
  const labels = { format: "formatted JSON", minify: "minified JSON", schema: "starter JSON Schema" };
  $("#json-output-label").textContent = labels[jsonMode];
  $("#json-output").textContent = result.output;
  $("#json-status").textContent = result.valid ? "valid" : "needs a fix";
  $("#json-status").style.color = result.valid ? "" : "#ff9e9e";
  $("#json-message").textContent = result.valid
    ? "Your browser does the parsing; nothing is sent anywhere."
    : "Fix the highlighted parser message, then try again.";
}

function initJsonLens() {
  $("#json-input").addEventListener("input", updateJsonLens);
  $$('[data-json-mode]').forEach((button) => button.addEventListener("click", () => {
    jsonMode = button.dataset.jsonMode;
    $$('[data-json-mode]').forEach((item) => item.classList.toggle("active", item === button));
    updateJsonLens();
  }));
  $("#json-copy").addEventListener("click", async () => {
    if (await copyText($("#json-output").textContent)) flashButton($("#json-copy"), "copied");
  });
  updateJsonLens();
}

function compactNumber(value) {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function formatPulseDate(value) {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.valueOf()) ? value : new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function pulseStats(points) {
  const cleaned = points.map((point) => Number(point.views) || 0);
  const latest = cleaned.at(-1) || 0;
  const previous = cleaned.at(-2) || 0;
  const change = previous ? ((latest - previous) / previous) * 100 : 0;
  const average = cleaned.length ? cleaned.reduce((sum, value) => sum + value, 0) / cleaned.length : 0;
  return { latest, change, average };
}

async function initAiPulse() {
  const tabs = $("#ai-pulse-tabs");
  const chart = $("#ai-pulse-chart");
  try {
    const response = await fetch("data/ai-pulse.json", { cache: "no-cache" });
    if (!response.ok) throw new Error(`Signal data unavailable (${response.status})`);
    const data = await response.json();
    const series = Array.isArray(data.series) ? data.series.filter((item) => Array.isArray(item.points) && item.points.length) : [];
    if (!series.length) throw new Error("No signal series available.");
    let selectedId = (Array.isArray(data.latest_rank) && data.latest_rank[0] && data.latest_rank[0].id) || series[0].id;

    const render = () => {
      const selected = series.find((item) => item.id === selectedId) || series[0];
      const points = selected.points.slice(-12);
      const max = Math.max(...points.map((point) => Number(point.views) || 0), 1);
      const { latest, change, average } = pulseStats(points);
      tabs.innerHTML = series
        .slice()
        .sort((a, b) => (Number(b.points.at(-1)?.views) || 0) - (Number(a.points.at(-1)?.views) || 0))
        .map((item) => `<button type="button" class="ai-pulse-tab ${item.id === selected.id ? "active" : ""}" role="tab" aria-selected="${item.id === selected.id}" data-ai-pulse-id="${escapeHtml(item.id)}">${escapeHtml(item.label)}</button>`)
        .join("");
      chart.innerHTML = points.map((point) => {
        const value = Number(point.views) || 0;
        const height = Math.max(8, Math.round((value / max) * 100));
        const label = `${selected.label}, week of ${formatPulseDate(point.week)}: ${new Intl.NumberFormat("en").format(value)} attention views`;
        return `<button type="button" class="ai-pulse-bar" style="--bar-height:${height}%;--bar-color:${escapeHtml(selected.color || "#63e6e2")}" aria-label="${escapeHtml(label)}"><span>${formatPulseDate(point.week).split(" ")[0]}</span></button>`;
      }).join("");
      $("#ai-pulse-latest").textContent = compactNumber(latest);
      $("#ai-pulse-change").textContent = `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`;
      $("#ai-pulse-change").classList.toggle("is-negative", change < 0);
      $("#ai-pulse-average").textContent = compactNumber(average);
      $$('[data-ai-pulse-id]').forEach((button) => button.addEventListener("click", () => {
        selectedId = button.dataset.aiPulseId;
        render();
      }));
    };

    $("#ai-pulse-as-of").textContent = `as of ${formatPulseDate(data.as_of || "latest")}`;
    $("#ai-pulse-method").textContent = data.methodology || "Weekly attention proxy. Not unique active users.";
    const docs = data.source && Array.isArray(data.source.docs) ? data.source.docs : [];
    if (docs[0]) $("#ai-pulse-source").href = docs[0];
    render();
  } catch (error) {
    tabs.innerHTML = "";
    chart.textContent = "The latest public attention snapshot is not available right now.";
    $("#ai-pulse-as-of").textContent = "refresh pending";
    $("#ai-pulse-method").textContent = "The workflow will retry the Wikimedia refresh automatically.";
  }
}

function isBuyMeACoffeeUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "buymeacoffee.com" && url.pathname.length > 1;
  } catch {
    return false;
  }
}

function initSupport() {
  const link = $("#support-link");
  const configuredUrl = String(siteConfig.buyMeACoffeeUrl || "").trim();
  if (isBuyMeACoffeeUrl(configuredUrl)) {
    link.href = configuredUrl;
    link.target = "_blank";
    link.rel = "noreferrer";
    $("#support-button-label").textContent = "Buy me a coffee";
    $("#support-status").textContent = `Support ${siteConfig.creatorName} through Buy Me a Coffee.`;
    return;
  }
  link.addEventListener("click", (event) => {
    event.preventDefault();
    $("#support-status").textContent = "The public Buy Me a Coffee profile is being prepared. Thanks for wanting to support the lab.";
  });
}

function initTheme() {
  const stored = localStorage.getItem("developer-lab-theme");
  if (stored === "light") {
    document.documentElement.dataset.theme = "light";
    $("#theme-icon").textContent = "☾";
  }
  $("#theme-toggle").addEventListener("click", () => {
    const light = document.documentElement.dataset.theme === "light";
    document.documentElement.dataset.theme = light ? "" : "light";
    localStorage.setItem("developer-lab-theme", light ? "dark" : "light");
    $("#theme-icon").textContent = light ? "☼" : "☾";
  });
}

$("#year").textContent = new Date().getFullYear();
initRegex();
initCompose();
initRadar();
initCost();
initAgentGuide();
initJsonLens();
initAiPulse();
initSupport();
initTheme();
