import {
  analyzeRegex,
  estimateMonthlyCost,
  escapeHtml,
  filterAndSortRadar,
  generateCompose,
  highlightMatches,
  RADAR_ITEMS,
} from "./toolkit.js";

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

function initCompose() {
  ["#docker-database", "#docker-version", "#docker-port", "#docker-db-name", "#docker-user", "#docker-password"].forEach((selector) => $(selector).addEventListener("input", updateCompose));
  $("#docker-copy").addEventListener("click", async () => {
    if (await copyText($("#docker-output").textContent)) flashButton($("#docker-copy"), "copied");
  });
  $("#docker-download").addEventListener("click", () => {
    const blob = new Blob([$("#docker-output").textContent], { type: "text/yaml" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "docker-compose.yml";
    link.click();
    URL.revokeObjectURL(link.href);
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
initTheme();
