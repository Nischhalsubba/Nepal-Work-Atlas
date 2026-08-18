export const researchCheckpoint = {
  asOf: "2026-08-18",
  recoveredFrom: "2004-04-18",
  canonicalPositions: 293,
  distinctPostingUrls: 235,
  knownOpenings: 2269,
  postingObservations: 38,
  coverageRecords: 46,
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
    label: "Known openings",
    value: researchCheckpoint.knownOpenings.toLocaleString("en-US"),
    detail: "Only explicitly stated worker openings",
    tone: "green",
  },
  {
    label: "Coverage records",
    value: researchCheckpoint.coverageRecords.toLocaleString("en-US"),
    detail: `${researchCheckpoint.postingObservations} posting observations`,
    tone: "amber",
  },
] as const;
