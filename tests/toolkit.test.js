import test from "node:test";
import assert from "node:assert/strict";
import {
  analyzeRegex,
  estimateMonthlyCost,
  filterAndSortRadar,
  generateAgentGuide,
  generateCompose,
  highlightMatches,
  jsonLens,
} from "../src/toolkit.js";

test("analyzeRegex finds global matches", () => {
  const result = analyzeRegex("cat", "cat scat catalog");
  assert.equal(result.valid, true);
  assert.deepEqual(result.matches.map((match) => match.index), [0, 5, 9]);
});

test("analyzeRegex reports invalid expressions", () => {
  const result = analyzeRegex("[", "hello");
  assert.equal(result.valid, false);
  assert.match(result.error, /unterminated|invalid/i);
});

test("highlightMatches escapes text and marks matches", () => {
  const output = highlightMatches("<x>", [{ index: 0, value: "<x>" }]);
  assert.equal(output, "<mark>&lt;x&gt;</mark>");
});

test("generateCompose uses the selected database image and port", () => {
  const compose = generateCompose({ database: "mysql", version: "8.4", port: 3307, dbName: "demo", username: "dev", password: "p'ass" });
  assert.match(compose, /image: mysql:8\.4/);
  assert.match(compose, /'3307:3306'/);
  assert.match(compose, /MYSQL_PASSWORD: 'p''ass'/);
});

test("radar filtering keeps the strongest signal first", () => {
  const items = [{ name: "low", categories: ["data"], signal: 20 }, { name: "high", categories: ["data"], signal: 90 }, { name: "other", categories: ["infra"], signal: 100 }];
  assert.deepEqual(filterAndSortRadar(items, "data").map((item) => item.name), ["high", "low"]);
});

test("cost estimate returns positive compute, storage, and total values", () => {
  const result = estimateMonthlyCost({ provider: "gcp", cpu: 4, ram: 16, storage: 100 });
  assert.ok(result.compute > 0);
  assert.ok(result.disk > 0);
  assert.equal(result.total, result.compute + result.disk);
});

test("agent guide includes the project objective and verification command", () => {
  const guide = generateAgentGuide({
    projectName: "Pulse Kit",
    stack: "python",
    goal: "Add a transparent metric.",
    testCommand: "pytest -q",
    notes: "Do not add tracking.",
  });
  assert.match(guide, /## Pulse Kit/);
  assert.match(guide, /Current objective: Add a transparent metric\./);
  assert.match(guide, /Verify: `pytest -q`/);
  assert.match(guide, /Do not add tracking\./);
});

test("JSON lens creates a nested starter schema", () => {
  const result = jsonLens('{"name":"lab","checks":{"pass":true},"tags":["ai"]}', "schema");
  assert.equal(result.valid, true);
  const schema = JSON.parse(result.output);
  assert.equal(schema.type, "object");
  assert.equal(schema.properties.checks.properties.pass.type, "boolean");
  assert.equal(schema.properties.tags.items.type, "string");
});

test("JSON lens returns parser feedback for invalid payloads", () => {
  const result = jsonLens('{invalid}', "format");
  assert.equal(result.valid, false);
  assert.match(result.output, /Unexpected token|Expected property name/i);
});
