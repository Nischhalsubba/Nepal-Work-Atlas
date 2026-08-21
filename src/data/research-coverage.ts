export type CoverageStatus =
  | "Not started"
  | "Discovery only"
  | "Partial"
  | "Current crawled"
  | "Historical crawled"
  | "Crawled and verified"
  | "Access blocked"
  | "Private/inaccessible"
  | "No surviving archive";

export type YearCoverageRow = {
  year: number;
  status: CoverageStatus;
  knownGap: string;
  urlsObserved: number | null;
  uniqueJobsExtracted: number | null;
};

export type SourceCoverageRow = {
  target: string;
  status: CoverageStatus;
  knownGap: string;
  nextPass: string;
  lastChecked: string;
  urlsObserved: number;
  uniqueJobsExtracted: number;
  totalOpenings: number;
};

export const researchCoverageSnapshot = {
  queriedOn: "2026-08-21",
  source: "Nepal Work Market — Research Coverage",
  totalRows: 46,
  statuses: [
    { status: "Partial", rows: 38 },
    { status: "Discovery only", rows: 3 },
    { status: "No surviving archive", rows: 2 },
    { status: "Not started", rows: 1 },
    { status: "Current crawled", rows: 1 },
    { status: "Access blocked", rows: 1 },
  ] as const,
  targetTypes: [
    { type: "Year", rows: 27 },
    { type: "Source", rows: 12 },
    { type: "Work category", rows: 3 },
    { type: "Archive", rows: 2 },
    { type: "Platform", rows: 1 },
    { type: "Local government", rows: 1 },
  ] as const,
} as const;

export const yearCoverage: readonly YearCoverageRow[] = [
  { year: 2000, status: "Discovery only", knownGap: "JobsNepal launch evidence exists, but no individually verified 2000 posting URL has yet been recovered.", urlsObserved: null, uniqueJobsExtracted: null },
  { year: 2001, status: "No surviving archive", knownGap: "No individually verified public posting URL recovered in this pass.", urlsObserved: null, uniqueJobsExtracted: null },
  { year: 2002, status: "No surviving archive", knownGap: "No individually verified public posting URL recovered in this pass.", urlsObserved: null, uniqueJobsExtracted: null },
  { year: 2003, status: "Discovery only", knownGap: "TSC-era archive evidence exists, but job-level URL extraction is incomplete.", urlsObserved: null, uniqueJobsExtracted: null },
  { year: 2004, status: "Partial", knownGap: "Only verified surviving pages were captured; this is not a complete year census.", urlsObserved: 2, uniqueJobsExtracted: 2 },
  { year: 2005, status: "Partial", knownGap: "Representative recovery only.", urlsObserved: 1, uniqueJobsExtracted: 1 },
  { year: 2006, status: "Partial", knownGap: "Portal and newspaper coverage remain incomplete.", urlsObserved: 4, uniqueJobsExtracted: 4 },
  { year: 2007, status: "Partial", knownGap: "Multi-role adverts require further position splitting.", urlsObserved: 6, uniqueJobsExtracted: 6 },
  { year: 2008, status: "Partial", knownGap: "Merojob coverage begins late in the year; earlier material remains sparse.", urlsObserved: 3, uniqueJobsExtracted: 3 },
  { year: 2009, status: "Partial", knownGap: "Substantial portal history exists but has not been exhaustively enumerated.", urlsObserved: null, uniqueJobsExtracted: null },
  { year: 2010, status: "Partial", knownGap: "Representative technical and administrative postings captured only.", urlsObserved: null, uniqueJobsExtracted: null },
  { year: 2011, status: "Partial", knownGap: "Not an exhaustive crawl of all posting IDs.", urlsObserved: null, uniqueJobsExtracted: null },
  { year: 2012, status: "Partial", knownGap: "Portal coverage is sampled rather than complete.", urlsObserved: null, uniqueJobsExtracted: null },
  { year: 2013, status: "Partial", knownGap: "Merojob and other sources not yet exhaustively backfilled for the year.", urlsObserved: null, uniqueJobsExtracted: null },
  { year: 2014, status: "Partial", knownGap: "Representative recoveries only.", urlsObserved: null, uniqueJobsExtracted: null },
  { year: 2015, status: "Partial", knownGap: "Private portal and government historical coverage incomplete.", urlsObserved: null, uniqueJobsExtracted: null },
  { year: 2016, status: "Partial", knownGap: "Several multi-role campaigns need role-level extraction.", urlsObserved: null, uniqueJobsExtracted: null },
  { year: 2017, status: "Partial", knownGap: "Representative recovery only.", urlsObserved: null, uniqueJobsExtracted: null },
  { year: 2018, status: "Partial", knownGap: "Possible re-advertisements require duplicate resolution.", urlsObserved: null, uniqueJobsExtracted: null },
  { year: 2019, status: "Partial", knownGap: "Insufficient source diversity.", urlsObserved: null, uniqueJobsExtracted: null },
  { year: 2020, status: "Partial", knownGap: "COVID-era temporary, relief and local jobs are under-represented.", urlsObserved: null, uniqueJobsExtracted: null },
  { year: 2021, status: "Partial", knownGap: "Remote, freelance, social and local-government sources incomplete.", urlsObserved: null, uniqueJobsExtracted: null },
  { year: 2022, status: "Partial", knownGap: "Only selected roles have been extracted.", urlsObserved: null, uniqueJobsExtracted: null },
  { year: 2023, status: "Partial", knownGap: "Very sparse verified corpus in the current pass.", urlsObserved: null, uniqueJobsExtracted: null },
  { year: 2024, status: "Partial", knownGap: "Social, local, government, employer and gig records incomplete.", urlsObserved: null, uniqueJobsExtracted: null },
  { year: 2025, status: "Partial", knownGap: "Only a handful of verified job-level pages captured.", urlsObserved: null, uniqueJobsExtracted: null },
  { year: 2026, status: "Current crawled", knownGap: "This is a verified cross-source sample, not every current posting. Social, local-government, foreign and direct-employer enumeration remains incomplete.", urlsObserved: null, uniqueJobsExtracted: null },
] as const;

export const sourceCoverage: readonly SourceCoverageRow[] = [
  {
    target: "DOFE foreign-employment job-level archive",
    status: "Discovery only",
    knownGap: "Pre-permission/job rows have not been exhaustively enumerated by lot, post, country, foreign employer, agency, salary and approved opening count. Historical job-level coverage remains sparse.",
    nextPass: "Determine stable search/API behavior, enumerate pre-permission and job rows, preserve approval identifiers and worker counts, and reconcile with licensed agencies and Shram Sansar advertisements.",
    lastChecked: "2026-08-19",
    urlsObserved: 0,
    uniqueJobsExtracted: 0,
    totalOpenings: 0,
  },
  {
    target: "Edusanjal vacancy detail batch — 24 advertisements",
    status: "Partial",
    knownGap: "Only the first 24 detail pages were processed. Full pagination, earlier years, deleted pages and archived captures remain. Some pages state no numeric opening count.",
    nextPass: "Continue Edusanjal pagination and historical URL recovery, then deduplicate against original school/college/employer notices.",
    lastChecked: "2026-08-18",
    urlsObserved: 24,
    uniqueJobsExtracted: 75,
    totalOpenings: 43,
  },
  {
    target: "F1Soft Group direct careers sample",
    status: "Partial",
    knownGap: "The careers site lists many additional current and recent roles across group companies.",
    nextPass: "Enumerate all pages, organizations, categories and expired roles.",
    lastChecked: "2026-08-18",
    urlsObserved: 2,
    uniqueJobsExtracted: 2,
    totalOpenings: 2,
  },
  {
    target: "Federal Public Service Commission sample",
    status: "Partial",
    knownGap: "Advertisement PDFs, organized institutions, office-specific notices and historical pages have not yet been fully split into position records.",
    nextPass: "Traverse all current and historical advertisement categories and PDFs.",
    lastChecked: "2026-08-18",
    urlsObserved: 1,
    uniqueJobsExtracted: 3,
    totalOpenings: 62,
  },
  {
    target: "Gandaki Province Public Service Commission sample",
    status: "Partial",
    knownGap: "Only selected advertisements were split; full archive and all seven provincial commissions remain incomplete.",
    nextPass: "Enumerate every advertisement and extract all positions/openings.",
    lastChecked: "2026-08-18",
    urlsObserved: 1,
    uniqueJobsExtracted: 2,
    totalOpenings: 89,
  },
  {
    target: "JobsNepal job-level archive",
    status: "Partial",
    knownGap: "The portal launched in 2000, but job-ID space and deleted/archived pages have not been exhaustively enumerated. 2000–2003 individual URLs remain unresolved.",
    nextPass: "Enumerate historical IDs, archived captures, newspaper attributions and current pagination.",
    lastChecked: "2026-08-18",
    urlsObserved: 112,
    uniqueJobsExtracted: 112,
    totalOpenings: 220,
  },
  {
    target: "Kumari Job current listings",
    status: "Partial",
    knownGap: "Full pagination, expired pages and historical archives remain unenumerated.",
    nextPass: "Crawl every listing page and recover expired job IDs.",
    lastChecked: "2026-08-18",
    urlsObserved: 13,
    uniqueJobsExtracted: 13,
    totalOpenings: 59,
  },
  {
    target: "Merojob job-level archive",
    status: "Partial",
    knownGap: "Only a small portion of the historical and current URL space has been enumerated.",
    nextPass: "Enumerate numeric and slug page history, current categories and archived captures.",
    lastChecked: "2026-08-18",
    urlsObserved: 57,
    uniqueJobsExtracted: 57,
    totalOpenings: 181,
  },
  {
    target: "Nepal Police official recruitment sample",
    status: "Partial",
    knownGap: "Full vacancy archive, Myadi Police, technical posts and older PDF notices remain unenumerated.",
    nextPass: "Traverse vacancy archive and split every campaign by position and opening count.",
    lastChecked: "2026-08-18",
    urlsObserved: 1,
    uniqueJobsExtracted: 2,
    totalOpenings: 1594,
  },
  {
    target: "Rojgari job-level archive",
    status: "Partial",
    knownGap: "Search pagination and historic job-detail space have not been exhaustively crawled.",
    nextPass: "Enumerate current and expired job detail URLs, especially daily-wage and skilled work.",
    lastChecked: "2026-08-18",
    urlsObserved: 5,
    uniqueJobsExtracted: 5,
    totalOpenings: 7,
  },
  {
    target: "User-supplied 80-source master list — Research Run 04",
    status: "Partial",
    knownGap: "This row tracks the source manifest and first detailed batch; it is not complete job-level enumeration of all 80 sources or of 2000-present. Full pagination, archive IDs, PDFs, deleted pages, foreign-employment rows, newspapers and access-limited/social sources remain.",
    nextPass: "Continue source-by-source enumeration beginning with major portals and official archives, while writing every posting URL to Posting Observations and splitting every multi-position advertisement into Job Archive records.",
    lastChecked: "2026-08-18",
    urlsObserved: 80,
    uniqueJobsExtracted: 75,
    totalOpenings: 43,
  },
  {
    target: "WorldLink direct career pages",
    status: "Partial",
    knownGap: "Three pages state 'Few' rather than a number; current and historical career URLs are not exhaustively enumerated.",
    nextPass: "Enumerate all career pages and archive removed roles.",
    lastChecked: "2026-08-18",
    urlsObserved: 7,
    uniqueJobsExtracted: 7,
    totalOpenings: 5,
  },
] as const;
