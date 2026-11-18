import assert from "node:assert/strict";
import test from "node:test";
import { buildAtlasHash, parseAtlasHash } from "../src/lib/atlas-url-state.ts";

test("hash router preserves question marks in unescaped search values", () => {
  const result = parseAtlasHash("#vacancies/jobs?q=what?when&sort=newest");
  assert.equal(result.workspace, "vacancies");
  assert.equal(result.vacancyView, "jobs");
  assert.equal(result.params.get("q"), "what?when");
  assert.equal(result.params.get("sort"), "newest");
});

test("building and parsing a filter hash retains all query values", () => {
  const params = new URLSearchParams({ q: "what?when", province: "Koshi" });
  const result = parseAtlasHash(buildAtlasHash("vacancies", "geography", params));
  assert.equal(result.vacancyView, "geography");
  assert.equal(result.params.get("q"), "what?when");
  assert.equal(result.params.get("province"), "Koshi");
});
