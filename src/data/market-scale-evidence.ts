export type EvidenceSource = {
  label: string;
  url: string;
};

export type MarketScaleEvidence = {
  id: string;
  numericValue: number;
  displayValue: string;
  label: string;
  detail: string;
  evidenceClass: "official-stock" | "administrative-flow" | "external-benchmark";
  sources: readonly EvidenceSource[];
  note: string;
};

export const marketScaleMeta = {
  asOf: "2026-08-20",
  recoveredArchivePositions: 293,
  recoveredArchiveOpenings: 2269,
  recoveredArchiveUrls: 235,
  verifiedProvinceArchiveRecords: 150,
  currentEmbeddedPublicRecords: 150,
  earlyForeignPermitTotal2000To2008: 1_130_018,
  newForeignApprovalFloor2008To2024: 5_700_000,
  newForeignApprovals2024To2025: 505_957,
  newForeignApprovals2025To2026: 406_404,
} as const;

export const foreignEmploymentApprovalLowerBound =
  marketScaleMeta.earlyForeignPermitTotal2000To2008 +
  marketScaleMeta.newForeignApprovalFloor2008To2024 +
  marketScaleMeta.newForeignApprovals2024To2025 +
  marketScaleMeta.newForeignApprovals2025To2026;

export const marketScaleEvidence: readonly MarketScaleEvidence[] = [
  {
    id: "economic-activity-census-2021",
    numericValue: 14_983_310,
    displayValue: "14,983,310",
    label: "People engaged in economic activity",
    detail: "Worked in the 12 months before Nepal Census 2021",
    evidenceClass: "official-stock",
    sources: [
      {
        label: "National Population and Housing Census 2021",
        url: "https://censusnepal.cbs.gov.np/results/files/result-folder/National%20Report_English.pdf",
      },
    ],
    note: "This is a population stock measure, not a count of vacancy postings.",
  },
  {
    id: "usually-employed-census-2021",
    numericValue: 10_270_447,
    displayValue: "10,270,447",
    label: "Usually employed",
    detail: "Usually economically active population, Nepal Census 2021",
    evidenceClass: "official-stock",
    sources: [
      {
        label: "National Population and Housing Census 2021",
        url: "https://censusnepal.cbs.gov.np/results/files/result-folder/National%20Report_English.pdf",
      },
    ],
    note: "This is an employment stock measure with the census reference-period definition.",
  },
  {
    id: "foreign-approval-lower-bound-2000-2026",
    numericValue: foreignEmploymentApprovalLowerBound,
    displayValue: `>${foreignEmploymentApprovalLowerBound.toLocaleString("en-US")}`,
    label: "Foreign-employment approvals since FY2000/01",
    detail: "Derived lower bound through FY2025/26",
    evidenceClass: "administrative-flow",
    sources: [
      {
        label: "DoFE historical permit series, 2000/01-2007/08",
        url: "https://www.ceslam.org/wp-content/uploads/2024/11/STATE-OF-MIGRATION-IN-NEPAL1404964819.pdf",
      },
      {
        label: "Nepal Labour Migration Report 2024",
        url: "https://giwmscdntwo.gov.np/media/pdf_upload/Nepal%20Labour%20Migration%20Report%202024%20Final%20_11%20Nov%202025%20%281%29_lttkbii.pdf",
      },
      {
        label: "FY2025/26 DoFE totals reported by Kathmandu Post",
        url: "https://kathmandupost.com/national/2026/08/06/manpower-companies-threaten-to-halt-overseas-job-placement-unless-policy-reforms-implemented",
      },
    ],
    note: "Derived as 1,130,018 permits in FY2000/01-FY2007/08 + more than 5.7 million new approvals in FY2008/09-FY2023/24 + 505,957 new approvals in FY2024/25 + 406,404 new approvals in FY2025/26. This is not a unique-job count, not a unique-worker count, and it excludes India and other flows outside the DoFE approval system.",
  },
  {
    id: "active-online-postings-2026-02-02",
    numericValue: 5_729,
    displayValue: "5,729",
    label: "Active online job postings",
    detail: "Nepal online-market benchmark, 2 Feb 2026",
    evidenceClass: "external-benchmark",
    sources: [
      {
        label: "CEIC / Revelio Labs",
        url: "https://www.ceicdata.com/en/nepal/number-of-job-postings-active-by-industry",
      },
    ],
    note: "External benchmark. It is not deduplicated against the Atlas archive and is never added to recovered opening totals.",
  },
] as const;

if (foreignEmploymentApprovalLowerBound !== 7_742_379) {
  throw new Error("[Nepal Work Atlas] Foreign-employment approval lower-bound reconciliation failed.");
}
