import type { JobRecord } from "./job-types";
import { supplementRows1 } from "./jobs-verified-supplement-1";
import { supplementRows2 } from "./jobs-verified-supplement-2";
import { supplementRows3 } from "./jobs-verified-supplement-3";
import { supplementRows4 } from "./jobs-verified-supplement-4";
import { supplementRows5 } from "./jobs-verified-supplement-5";

const rows = [
  ...supplementRows1,
  ...supplementRows2,
  ...supplementRows3,
  ...supplementRows4,
  ...supplementRows5,
];

const normalizeProvince = (province: string) => province === "Sudurpashchim" ? "Sudur Paschim" : province;

export const jobsVerifiedSupplement: JobRecord[] = rows.map((row) => ({
  id: `NWM-ARCHIVE-${String(row.archiveId).padStart(6, "0")}`,
  title: row.title,
  employer: row.employer ?? null,
  source: row.source,
  canonicalUrl: row.canonicalUrl,
  evidenceUrl: row.canonicalUrl,
  published: row.published ?? null,
  deadline: row.deadline ?? null,
  status: row.status,
  openings: row.openings ?? null,
  salary: row.salary ?? null,
  workTypes: row.workTypes,
  province: normalizeProvince(row.province),
  district: row.district ?? null,
  localLevel: row.localLevel ?? null,
  industry: row.industry ?? null,
  remote: row.remote ?? null,
  verification: row.verification,
  confidence: row.confidence,
  dataset: "Canonical Job Archive - verified province expansion - 2026-08-20",
}));

if (jobsVerifiedSupplement.length !== 75) {
  throw new Error(`[Nepal Work Atlas] Verified archive supplement expected 75 records, received ${jobsVerifiedSupplement.length}.`);
}
