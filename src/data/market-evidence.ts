export type MarketEvidenceKind =
  | "recovered-corpus"
  | "market-benchmark"
  | "source-benchmark"
  | "coverage-universe"
  | "unknown-total";

export type MarketEvidenceItem = {
  id: string;
  kind: MarketEvidenceKind;
  label: string;
  value: number | null;
  displayValue?: string;
  secondary?: string;
  observedOn?: string;
  source: string;
  sourceUrl?: string;
  note: string;
};

export const marketEvidenceMeta = {
  asOf: "2026-08-19",
  researchRun: "RUN-05-INTERNET-EVIDENCE",
  identifiedSourceSystems: 256,
  nativeSourceRegistryRows: 37,
  prioritySourcesReverified: 16,
} as const;

export const marketEvidenceItems: readonly MarketEvidenceItem[] = [
  {
    id: "national-cumulative-2000-2026",
    kind: "unknown-total",
    label: "National cumulative openings, 2000–2026",
    value: null,
    displayValue: "Not measured",
    source: "No complete public national series identified",
    note: "The Atlas does not manufacture a cumulative national total by adding incompatible portal snapshots, government recruitment totals, newspaper advertisements, or external benchmarks.",
  },
  {
    id: "revelio-active-2026-02-02",
    kind: "market-benchmark",
    label: "Active online job postings",
    value: 5729,
    secondary: "weekly online-market benchmark",
    observedOn: "2026-02-02",
    source: "CEIC / Revelio Labs",
    sourceUrl: "https://www.ceicdata.com/en/nepal/number-of-job-postings-active-by-industry",
    note: "External aggregate benchmark. It is not deduplicated against the Atlas corpus and is never added to recovered opening totals.",
  },
  {
    id: "sudurpashchim-psc-vacant-posts",
    kind: "source-benchmark",
    label: "Sudurpashchim PSC vacant posts",
    value: 1975,
    secondary: "25 advertisements on the official dashboard",
    observedOn: "2026-08-19",
    source: "Sudurpashchim Province Public Service Commission",
    sourceUrl: "https://psc.sudurpashchim.gov.np/",
    note: "Official source-level scale indicator. The underlying advertisements still require position-level extraction and deduplication before any openings enter the Job Archive.",
  },
  {
    id: "local-government-crawl-universe",
    kind: "coverage-universe",
    label: "Local governments to crawl",
    value: 753,
    secondary: "official local-government directory",
    observedOn: "2026-08-19",
    source: "MoFAGA local government contact directory",
    sourceUrl: "https://www.mofaga.gov.np/local-contact",
    note: "Coverage universe, not a vacancy count. Each local-government site can contain its own current and historical recruitment notices.",
  },
] as const;

export const marketEvidenceKindLabels: Record<MarketEvidenceKind, string> = {
  "recovered-corpus": "Recovered corpus",
  "market-benchmark": "External benchmark",
  "source-benchmark": "Source-level benchmark",
  "coverage-universe": "Coverage universe",
  "unknown-total": "Unknown total",
};
