export function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[character]);
}

export function analyzeRegex(pattern, text, flags = "g") {
  try {
    const regex = new RegExp(pattern, flags);
    const matches = [];
    if (regex.global) {
      let match;
      while ((match = regex.exec(text)) !== null) {
        matches.push({ index: match.index, value: match[0] });
        if (match[0] === "") regex.lastIndex += 1;
      }
    } else {
      const match = regex.exec(text);
      if (match) matches.push({ index: match.index, value: match[0] });
    }
    return { valid: true, matches };
  } catch (error) {
    return { valid: false, matches: [], error: error.message };
  }
}

export function highlightMatches(text, matches) {
  if (!matches.length) return escapeHtml(text);
  let cursor = 0;
  return matches.map(({ index, value }) => {
    const before = escapeHtml(text.slice(cursor, index));
    const highlighted = `<mark>${escapeHtml(value) || "∅"}</mark>`;
    cursor = index + value.length;
    return before + highlighted;
  }).join("") + escapeHtml(text.slice(cursor));
}

const DATABASES = {
  postgres: { image: "postgres", port: 5432, dataPath: "/var/lib/postgresql/data", env: [["POSTGRES_DB", "dbName"], ["POSTGRES_USER", "username"], ["POSTGRES_PASSWORD", "password"]] },
  mysql: { image: "mysql", port: 3306, dataPath: "/var/lib/mysql", env: [["MYSQL_DATABASE", "dbName"], ["MYSQL_USER", "username"], ["MYSQL_PASSWORD", "password"], ["MYSQL_ROOT_PASSWORD", "password"]] },
  mongodb: { image: "mongo", port: 27017, dataPath: "/data/db", env: [["MONGO_INITDB_DATABASE", "dbName"]] },
  redis: { image: "redis", port: 6379, dataPath: "/data", env: [] },
};

function yamlQuote(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function safeVersion(value) {
  const cleaned = String(value || "latest").trim().replace(/[^a-zA-Z0-9._-]/g, "");
  return cleaned || "latest";
}

function safePort(value, fallback) {
  const port = Number.parseInt(value, 10);
  return Number.isInteger(port) && port > 0 && port < 65536 ? port : fallback;
}

export function generateCompose({ database = "postgres", version = "latest", port, dbName = "app", username = "app_user", password = "local_only" } = {}) {
  const config = DATABASES[database] || DATABASES.postgres;
  const hostPort = safePort(port, config.port);
  const lines = [
    "services:",
    "  db:",
    `    image: ${config.image}:${safeVersion(version)}`,
    "    restart: unless-stopped",
  ];
  if (config.env.length) {
    lines.push("    environment:");
    for (const [key, source] of config.env) {
      const values = { dbName, username, password };
      lines.push(`      ${key}: ${yamlQuote(values[source])}`);
    }
  }
  lines.push(
    "    ports:",
    `      - ${yamlQuote(`${hostPort}:${config.port}`)}`,
    "    volumes:",
    `      - ${database}_data:${config.dataPath}`,
    "",
    "volumes:",
    `  ${database}_data:`,
  );
  return lines.join("\n");
}

export const RADAR_ITEMS = [
  { name: "uv", description: "fast Python packaging", categories: ["python"], signal: 96 },
  { name: "Polars", description: "expressive dataframe engine", categories: ["python", "data"], signal: 91 },
  { name: "DuckDB", description: "analytics where your data lives", categories: ["data"], signal: 89 },
  { name: "dbt", description: "software engineering for analytics", categories: ["data"], signal: 86 },
  { name: "Zellij", description: "terminal workspace multiplexer", categories: ["infra"], signal: 80 },
  { name: "Caddy", description: "HTTPS by default", categories: ["infra"], signal: 78 },
  { name: "Ruff", description: "one tool for Python quality", categories: ["python"], signal: 94 },
  { name: "OpenTofu", description: "open infrastructure as code", categories: ["infra"], signal: 76 },
];

export function filterAndSortRadar(items, filter = "all", descending = true) {
  const filtered = filter === "all" ? [...items] : items.filter((item) => item.categories.includes(filter));
  return filtered.sort((a, b) => descending ? b.signal - a.signal : a.signal - b.signal);
}

const COST_BASELINES = {
  aws: { cpu: 0.021, ram: 0.0032, storage: 0.085 },
  gcp: { cpu: 0.019, ram: 0.0030, storage: 0.080 },
  azure: { cpu: 0.022, ram: 0.0034, storage: 0.090 },
};

export function estimateMonthlyCost({ provider = "aws", cpu = 4, ram = 16, storage = 100 } = {}) {
  const baseline = COST_BASELINES[provider] || COST_BASELINES.aws;
  const hours = 730;
  const compute = (Number(cpu) * baseline.cpu + Number(ram) * baseline.ram) * hours;
  const disk = Number(storage) * baseline.storage;
  return { compute, disk, total: compute + disk };
}
