import assert from "node:assert/strict";
import test from "node:test";
import { formatNepalRupees } from "../src/lib/format.ts";

test("rupee formatter displays valid amounts without changing their value", () => {
  assert.equal(formatNepalRupees(125000), "Rs 125,000");
  assert.equal(formatNepalRupees(0), "Rs 0");
});

test("missing or nonfinite rupee amounts remain unknown", () => {
  assert.equal(formatNepalRupees(null), "Unknown");
  assert.equal(formatNepalRupees(Number.NaN), "Unknown");
  assert.equal(formatNepalRupees(Infinity), "Unknown");
  assert.equal(formatNepalRupees(-Infinity), "Unknown");
});
