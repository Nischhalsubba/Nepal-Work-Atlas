import type { JobRecord as RawJobRecord, NepalJobRecord, NepalProvince } from "./job-types";
import { jobsChunk1 } from "./jobs-chunk-1";
import { jobsChunk2 } from "./jobs-chunk-2";
import { jobsChunk3 } from "./jobs-chunk-3";
import { jobsChunk4 } from "./jobs-chunk-4";
import { jobsChunk5 } from "./jobs-chunk-5";
import { jobsChunk6 } from "./jobs-chunk-6";
import { jobsChunk7 } from "./jobs-chunk-7";
import { jobsChunk8 } from "./jobs-chunk-8";

export type { NepalJobRecord as JobRecord } from "./job-types";

const nepalProvinces = new Set<NepalProvince>([
  "Koshi",
  "Madhesh",
  "Bagmati",
  "Gandaki",
  "Lumbini",
  "Karnali",
  "Sudur Paschim",
]);

const rawEmbeddedJobRecords: RawJobRecord[] = [
  ...jobsChunk1,
  ...jobsChunk2,
  ...jobsChunk3,
  ...jobsChunk4,
  ...jobsChunk5,
  ...jobsChunk6,
  ...jobsChunk7,
  ...jobsChunk8,
];

function isExplicitOutsideNepal(record: RawJobRecord) {
  return record.workTypes.some((value) => /\b(abroad|foreign) employment\b/i.test(value));
}

function hasVerifiedNepalProvince(
  record: RawJobRecord,
): record is RawJobRecord & { province: NepalProvince } {
  return Boolean(record.province && nepalProvinces.has(record.province as NepalProvince));
}

const explicitlyOutsideNepal = rawEmbeddedJobRecords.filter(isExplicitOutsideNepal);
const locationUnverified = rawEmbeddedJobRecords.filter(
  (record) => !isExplicitOutsideNepal(record) && !hasVerifiedNepalProvince(record),
);
const provinceEvidencedNepal = rawEmbeddedJobRecords.filter(
  (record): record is RawJobRecord & { province: NepalProvince } =>
    !isExplicitOutsideNepal(record) && hasVerifiedNepalProvince(record),
);

export const jobRecords: NepalJobRecord[] = provinceEvidencedNepal.map((record) => ({
  ...record,
  province: record.province,
  country: "Nepal",
  countryCode: "NP",
  geographyVerification: "Province-evidenced",
}));

export const embeddedCorpusMeta = {
  totalArchiveRecords: 293,
  sourceRecords: rawEmbeddedJobRecords.length,
  embeddedRecords: jobRecords.length,
  displayedNepalRecords: jobRecords.length,
  excludedOutsideNepalRecords: explicitlyOutsideNepal.length,
  excludedLocationUnverifiedRecords: locationUnverified.length,
  marketCountry: "Nepal",
  marketCountryCode: "NP",
  geographyRule: "Public vacancy views require explicit Nepal province evidence",
  label: "Province-evidenced Nepal subset",
} as const;

const duplicateIds = jobRecords
  .map((record) => record.id)
  .filter((id, index, ids) => ids.indexOf(id) !== index);
const invalidDomesticRows = jobRecords.filter(
  (record) =>
    record.countryCode !== "NP" ||
    !nepalProvinces.has(record.province) ||
    record.confidence < 0 ||
    record.confidence > 1 ||
    !/^https:\/\//.test(record.canonicalUrl),
);

if (duplicateIds.length || invalidDomesticRows.length) {
  throw new Error(
    `[Nepal Work Atlas] Domestic vacancy integrity failed: ${duplicateIds.length} duplicate IDs, ${invalidDomesticRows.length} invalid Nepal rows.`,
  );
}
