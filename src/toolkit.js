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

const AGENT_STACKS = {
  node: {
    label: "TypeScript / Node.js",
    setup: "npm install",
    verify: "npm test && npm run check",
    conventions: "Prefer typed boundaries, small modules, and browser-safe dependencies.",
  },
  python: {
    label: "Python",
    setup: "python3 -m venv .venv && source .venv/bin/activate",
    verify: "python3 -m pytest",
    conventions: "Prefer explicit types, small pure functions, and isolated I/O.",
  },
  data: {
    label: "Data / pipelines",
    setup: "python3 -m pip install -r requirements.txt",
    verify: "python3 -m pytest && python3 -m ruff check .",
    conventions: "Keep transformations deterministic, validate inputs, and document lineage.",
  },
};

function cleanLine(value, fallback) {
  const cleaned = String(value || "").trim().replace(/\s+/g, " ");
  return cleaned || fallback;
}

function cleanBlock(value, fallback) {
  const cleaned = String(value || "").trim();
  return cleaned || fallback;
}

export function generateAgentGuide({ projectName, stack = "node", goal, testCommand, notes } = {}) {
  const profile = AGENT_STACKS[stack] || AGENT_STACKS.node;
  const project = cleanLine(projectName, "Project");
  const target = cleanBlock(goal, "Describe the requested change before editing.");
  const verification = cleanLine(testCommand, profile.verify);
  const extraNotes = cleanBlock(notes, "No additional constraints provided.");

  return [
    "# AGENTS.md",
    "",
    `## ${project}`,
    `- Stack: ${profile.label}`,
    `- Current objective: ${target}`,
    "",
    "## Working agreement",
    "1. Read the relevant files and existing conventions before changing code.",
    "2. Keep each change focused; avoid unrelated rewrites and new dependencies unless they are necessary.",
    "3. Preserve user-facing accessibility, privacy, and error states.",
    `4. ${profile.conventions}`,
    "",
    "## Commands",
    `- Setup: \`${profile.setup}\``,
    `- Verify: \`${verification}\``,
    "",
    "## Done means",
    "- The requested behavior is implemented and manually understandable.",
    "- Relevant checks pass or any limitation is stated clearly.",
    "- Documentation and examples stay aligned with the implementation.",
    "",
    "## Additional context",
    extraNotes,
    "",
  ].join("\n");
}

export function formatJson(input) {
  try {
    const value = JSON.parse(input);
    return { valid: true, value, output: JSON.stringify(value, null, 2) };
  } catch (error) {
    return { valid: false, value: null, output: error.message };
  }
}

export function inferJsonSchema(value) {
  if (value === null) return { type: "null" };
  if (Array.isArray(value)) {
    return {
      type: "array",
      items: value.length ? inferJsonSchema(value[0]) : {},
    };
  }
  if (typeof value === "object") {
    const properties = Object.fromEntries(Object.entries(value).map(([key, item]) => [key, inferJsonSchema(item)]));
    return { type: "object", properties, required: Object.keys(value), additionalProperties: false };
  }
  if (typeof value === "number") return { type: Number.isInteger(value) ? "integer" : "number" };
  return { type: typeof value };
}

export function jsonLens(input, mode = "format") {
  const parsed = formatJson(input);
  if (!parsed.valid) return parsed;
  if (mode === "minify") return { ...parsed, output: JSON.stringify(parsed.value) };
  if (mode === "schema") {
    return {
      ...parsed,
      output: JSON.stringify({
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        ...inferJsonSchema(parsed.value),
      }, null, 2),
    };
  }
  return parsed;
}
