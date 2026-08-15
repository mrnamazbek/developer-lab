import { readFile, writeFile } from "node:fs/promises";

const statusPath = new URL("../data/daily-status.json", import.meta.url);
const current = JSON.parse(await readFile(statusPath, "utf8"));
const today = new Date().toISOString().slice(0, 10);

const next = {
  ...current,
  lastChecked: today,
  runs: Number(current.runs || 0) + 1,
};

await writeFile(statusPath, `${JSON.stringify(next, null, 2)}\n`);
console.log(`Daily maintenance status refreshed for ${today}.`);
