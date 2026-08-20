export const researchCheckpoint = {
  asOf: "2026-08-20",
  databaseSnapshotVerifiedOn: "20 Aug 2026",
  recoveredFrom: "2004-04-18",
  latestCanonicalPublication: "17 Aug 2026",
  canonicalPositions: 293,
  distinctPostingUrls: 235,
  knownOpenings: 2269,
  postingObservations: 45,
  coverageRecords: 46,
  liveSourceSpotCheck: {
    observedOn: "2026-08-20",
    source: "Department of Foreign Employment - Foreign Job Search",
    url: "https://foreignjob.dofe.gov.np/Home/Index",
  },
} as const;

export const checkpointMetrics = [
  {
    label: "Recovered positions",
    value: researchCheckpoint.canonicalPositions.toLocaleString("en-US"),
    detail: "Canonical position records",
    tone: "blue",
  },
  {
    label: "Observed URLs",
    value: researchCheckpoint.distinctPostingUrls.toLocaleString("en-US"),
    detail: "Distinct canonical posting URLs",
    tone: "neutral",
  },
  {
    label: "Openings with a stated number",
    value: researchCheckpoint.knownOpenings.toLocaleString("en-US"),
    detail: "Explicit counts in deduplicated research records only",
    tone: "green",
  },
  {
    label: "Coverage records",
    value: researchCheckpoint.coverageRecords.toLocaleString("en-US"),
    detail: `${researchCheckpoint.postingObservations} posting observations`,
    tone: "amber",
  },
] as const;
