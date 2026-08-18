"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { jobRecords, embeddedCorpusMeta, type JobRecord } from "@/data/job-records";
import { researchCheckpoint } from "@/data/research-checkpoint";
import { OpportunityLandscape } from "@/components/opportunity-landscape";
import { type AppliedScope, classifySector, recordMatchesScope, sectorLabels } from "@/lib/taxonomy";
import { formatDate, safeHost } from "@/lib/format";

type Locale = "en" | "ne";
type SortMode = "relevance" | "latest" | "oldest" | "openings";

const copy = {
  en: {
    overview: "Overview",
    jobs: "Jobs Explorer",
    geography: "Geography",
    history: "History",
    sources: "Sources",
    search: "Search jobs, employers, places or sources",
    evidence: "Evidence mode",
    heading: "Nepal Work Atlas",
    lede: "Explore recovered work opportunities, history, geography and source evidence without pretending the archive is complete.",
    coverage: "Coverage is measured, not assumed.",
    coverageText: "Unknown and under-researched areas stay visible instead of being rendered as zero.",
    results: "Recovered records",
    filters: "Filters",
    all: "All",
    clear: "Clear filters",
    noResults: "No recovered records match these filters.",
    known: "Known",
    unknown: "Unknown",
  },
  ne: {
    overview: "सारांश",
    jobs: "रोजगारी खोज",
    geography: "भूगोल",
    history: "इतिहास",
    sources: "स्रोतहरू",
    search: "रोजगारी, रोजगारदाता, स्थान वा स्रोत खोज्नुहोस्",
    evidence: "प्रमाण मोड",
    heading: "नेपाल वर्क एटलस",
    lede: "अभिलेख पूर्ण छ भन्ने दाबी नगरी भेटिएका रोजगारी, इतिहास, भूगोल र स्रोत प्रमाण अन्वेषण गर्नुहोस्।",
    coverage: "कभरेज मापन गरिन्छ, अनुमान गरिँदैन।",
    coverageText: "अज्ञात र कम अनुसन्धान भएका क्षेत्रहरूलाई शून्य नदेखाई स्पष्ट राखिन्छ।",
    results: "फेला परेका अभिलेख",
    filters: "फिल्टरहरू",
    all: "सबै",
    clear: "फिल्टर हटाउनुहोस्",
    noResults: "यी फिल्टरसँग मिल्ने अभिलेख भेटिएन।",
    known: "ज्ञात",
    unknown: "अज्ञात",
  },
} as const;

const navKeys = ["overview", "jobs", "geography", "history", "sources"] as const;
const navIds: Record<(typeof navKeys)[number], string> = {
  overview: "overview",
  jobs: "jobs-explorer",
  geography: "geography",
  history: "history",
  sources: "sources",
};

const PAGE_SIZE = 12;

function searchText(record: JobRecord) {
  return [
    record.title,
    record.employer,
    record.source,
    record.province,
    record.district,
    record.localLevel,
    record.industry,
    record.workTypes.join(" "),
    record.published,
    record.deadline,
    classifySector(record),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function dateWeight(record: JobRecord) {
  const candidate = record.published ?? record.deadline;
  return candidate ? Date.parse(`${candidate}T00:00:00Z`) || 0 : 0;
}

function normalizeStatus(status: string) {
  if (/active/i.test(status)) return "Active";
  if (/future/i.test(status)) return "Future announced";
  if (/expired|historical/i.test(status)) return "Expired / historical";
  return "Unknown";
}

function locationLabel(record: JobRecord) {
  return [record.localLevel, record.district, record.province].filter(Boolean).join(", ") || "Location unknown";
}

export function AtlasDashboard() {
  const [locale, setLocale] = useState<Locale>("en");
  const [evidenceMode, setEvidenceMode] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [provinceFilter, setProvinceFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [sort, setSort] = useState<SortMode>("relevance");
  const [page, setPage] = useState(1);
  const [selectedJob, setSelectedJob] = useState<JobRecord | null>(null);
  const [appliedScope, setAppliedScope] = useState<AppliedScope | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const t = copy[locale];

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter, provinceFilter, sourceFilter, sort, appliedScope]);

  const scopeRecords = useMemo(
    () => jobRecords.filter((record) => recordMatchesScope(record, appliedScope)),
    [appliedScope],
  );

  const statuses = useMemo(
    () => Array.from(new Set(jobRecords.map((record) => normalizeStatus(record.status)))).sort(),
    [],
  );
  const provinces = useMemo(
    () => Array.from(new Set(jobRecords.map((record) => record.province).filter((value): value is string => Boolean(value)))).sort(),
    [],
  );
  const sources = useMemo(() => Array.from(new Set(jobRecords.map((record) => record.source))).sort(), []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const result = scopeRecords.filter((record) => {
      if (needle && !searchText(record).includes(needle)) return false;
      if (statusFilter !== "All" && normalizeStatus(record.status) !== statusFilter) return false;
      if (provinceFilter !== "All" && record.province !== provinceFilter) return false;
      if (sourceFilter !== "All" && record.source !== sourceFilter) return false;
      return true;
    });

    if (sort === "latest") return [...result].sort((a, b) => dateWeight(b) - dateWeight(a));
    if (sort === "oldest") return [...result].sort((a, b) => dateWeight(a) - dateWeight(b));
    if (sort === "openings") return [...result].sort((a, b) => (b.openings ?? -1) - (a.openings ?? -1));
    return result;
  }, [scopeRecords, query, statusFilter, provinceFilter, sourceFilter, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visibleJobs = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const scopeOpenings = scopeRecords.reduce((sum, record) => sum + (record.openings ?? 0), 0);
  const scopeKnownOpeningRecords = scopeRecords.filter((record) => record.openings !== null).length;

  const geography = useMemo(() => {
    const counts = new Map<string, number>();
    let unknown = 0;
    scopeRecords.forEach((record) => {
      if (!record.province) {
        unknown += 1;
        return;
      }
      const key = record.province.includes("/") ? "Multi-province" : record.province;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return {
      rows: [...counts.entries()].sort((a, b) => b[1] - a[1]),
      unknown,
    };
  }, [scopeRecords]);

  const history = useMemo(() => {
    const counts = new Map<number, number>();
    let unknown = 0;
    scopeRecords.forEach((record) => {
      if (!record.published) {
        unknown += 1;
        return;
      }
      const year = Number(record.published.slice(0, 4));
      if (!Number.isFinite(year)) {
        unknown += 1;
        return;
      }
      counts.set(year, (counts.get(year) ?? 0) + 1);
    });
    const rows = [...counts.entries()].sort((a, b) => a[0] - b[0]);
    return { rows, unknown };
  }, [scopeRecords]);

  const sourceStats = useMemo(() => {
    const map = new Map<string, { count: number; verified: number; urls: Set<string> }>();
    scopeRecords.forEach((record) => {
      const current = map.get(record.source) ?? { count: 0, verified: 0, urls: new Set<string>() };
      current.count += 1;
      if (/verified|high/i.test(record.verification)) current.verified += 1;
      current.urls.add(record.canonicalUrl);
      map.set(record.source, current);
    });
    return [...map.entries()]
      .map(([source, value]) => ({ source, ...value, urlCount: value.urls.size }))
      .sort((a, b) => b.count - a.count);
  }, [scopeRecords]);

  const coverage = {
    provinceKnown: jobRecords.filter((record) => record.province).length,
    publicationKnown: jobRecords.filter((record) => record.published).length,
    payKnown: jobRecords.filter((record) => record.salary).length,
    openingsKnown: jobRecords.filter((record) => record.openings !== null).length,
  };

  const jumpToJobs = () => document.getElementById("jobs-explorer")?.scrollIntoView({ behavior: "smooth", block: "start" });

  const checkpointMetrics = [
    ["Recovered positions", researchCheckpoint.canonicalPositions.toLocaleString("en-US"), "Canonical research-workspace records", "blue"],
    ["Observed URLs", researchCheckpoint.distinctPostingUrls.toLocaleString("en-US"), "Distinct canonical posting URLs", "neutral"],
    ["Known openings", researchCheckpoint.knownOpenings.toLocaleString("en-US"), "Only explicitly stated worker openings", "green"],
    ["Coverage records", researchCheckpoint.coverageRecords.toLocaleString("en-US"), `${researchCheckpoint.postingObservations} posting observations`, "amber"],
  ] as const;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#overview" aria-label="Nepal Work Atlas home">
          <span className="brand-mark" aria-hidden="true"><i /><i /></span>
          <span><strong>Nepal</strong><small>Work Atlas</small></span>
        </a>
        <nav className="primary-nav" aria-label="Primary navigation">
          {navKeys.map((key, index) => (
            <a key={key} className={index === 0 ? "active" : ""} href={`#${navIds[key]}`}>
              <span className="nav-index">0{index + 1}</span><span>{t[key]}</span>
            </a>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="coverage-dot-row"><span className="coverage-dot" /> Research in progress</div>
          <p>Recovered corpus ≠ total Nepal job market.</p>
          <span>Checkpoint {researchCheckpoint.asOf}</span>
        </div>
      </aside>

      <main className="main-canvas">
        <header className="topbar">
          <div className="search-shell" role="search">
            <span aria-hidden="true">⌕</span>
            <input
              ref={searchRef}
              value={query}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)}
              onKeyDown={(event: ReactKeyboardEvent<HTMLInputElement>) => event.key === "Enter" && jumpToJobs()}
              aria-label={t.search}
              placeholder={t.search}
            />
            <kbd>⌘ K</kbd>
          </div>
          <div className="topbar-meta">
            <button className={`status-pill ${evidenceMode ? "active" : ""}`} type="button" onClick={() => setEvidenceMode((value) => !value)} aria-pressed={evidenceMode}>
              <i /> {t.evidence}
            </button>
            <button type="button" className="plain-button" onClick={() => setLocale((current) => current === "en" ? "ne" : "en")}>
              {locale === "en" ? "EN / ने" : "ने / EN"}
            </button>
          </div>
        </header>

        <nav className="mobile-nav" aria-label="Mobile navigation">
          {navKeys.map((key) => <a key={key} href={`#${navIds[key]}`}>{t[key]}</a>)}
        </nav>

        <div className="content-wrap">
          <section className="page-heading" id="overview">
            <div>
              <div className="eyebrow">National labor-market intelligence</div>
              <h1>{t.heading}</h1>
              <p>{t.lede}</p>
            </div>
            <div className="checkpoint-card">
              <span>Research checkpoint</span>
              <strong>{researchCheckpoint.asOf}</strong>
              <small>Earliest recovered publication: {researchCheckpoint.recoveredFrom}</small>
            </div>
          </section>

          <section className="evidence-banner" aria-label="Coverage warning">
            <div className="evidence-icon" aria-hidden="true">!</div>
            <div><strong>{t.coverage}</strong><span>{t.coverageText}</span></div>
            <a href="#sources">View source coverage</a>
          </section>

          <section className="metric-grid" aria-label="Research checkpoint metrics">
            {checkpointMetrics.map(([label, value, detail, tone]) => (
              <article key={label} className={`metric-card tone-${tone}`}>
                <div className="metric-label">{label}</div><strong>{value}</strong><span>{detail}</span>
              </article>
            ))}
          </section>

          <section className={`scope-strip ${appliedScope ? "filtered" : ""}`} aria-live="polite">
            <div>
              <span className="eyebrow">Interactive data scope</span>
              <strong>{appliedScope ? appliedScope.label : "All embedded evidence"}</strong>
            </div>
            <div className="scope-stat"><span>Records in scope</span><strong>{scopeRecords.length}</strong></div>
            <div className="scope-stat"><span>Explicit openings</span><strong>{scopeOpenings.toLocaleString("en-US")}</strong><small>{scopeKnownOpeningRecords} records report counts</small></div>
            <div className="scope-stat"><span>Embedded / archive</span><strong>{embeddedCorpusMeta.embeddedRecords} / {embeddedCorpusMeta.totalArchiveRecords}</strong><small>File-backed subset / research workspace</small></div>
          </section>

          <OpportunityLandscape records={jobRecords} appliedScope={appliedScope} onApplyScope={setAppliedScope} />

          <section className="section-block" id="jobs-explorer">
            <div className="section-heading">
              <div><div className="eyebrow">Search and inspect evidence</div><h2>{t.jobs}</h2><p>Every result below is backed by an embedded research export. Missing fields stay unknown.</p></div>
              <span className="small-badge">{filtered.length} matches</span>
            </div>

            <div className="filter-bar" aria-label={t.filters}>
              <label><span>Status</span><select value={statusFilter} onChange={(e: ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}><option>All</option>{statuses.map((value) => <option key={value}>{value}</option>)}</select></label>
              <label><span>Province</span><select value={provinceFilter} onChange={(e: ChangeEvent<HTMLSelectElement>) => setProvinceFilter(e.target.value)}><option>All</option>{provinces.map((value) => <option key={value}>{value}</option>)}</select></label>
              <label><span>Source</span><select value={sourceFilter} onChange={(e: ChangeEvent<HTMLSelectElement>) => setSourceFilter(e.target.value)}><option>All</option>{sources.map((value) => <option key={value}>{value}</option>)}</select></label>
              <label><span>Sort</span><select value={sort} onChange={(e: ChangeEvent<HTMLSelectElement>) => setSort(e.target.value as SortMode)}><option value="relevance">Source order</option><option value="latest">Latest known date</option><option value="oldest">Oldest known date</option><option value="openings">Opening count</option></select></label>
              <button className="plain-button filter-clear" type="button" onClick={() => { setQuery(""); setStatusFilter("All"); setProvinceFilter("All"); setSourceFilter("All"); setSort("relevance"); }}>
                {t.clear}
              </button>
            </div>

            <div className="explorer-layout">
              <div className="job-list" aria-label="Recovered job records">
                {visibleJobs.length === 0 ? <div className="empty-state">{t.noResults}</div> : visibleJobs.map((record) => (
                  <button key={record.id} className={`job-row ${selectedJob?.id === record.id ? "selected" : ""}`} type="button" onClick={() => setSelectedJob(record)}>
                    <div className="job-row-main">
                      <span className="job-title">{record.title}</span>
                      <span className="job-meta">{record.employer ?? "Employer unknown"} · {locationLabel(record)}</span>
                      <span className="job-source">{record.source} · {sectorLabels[classifySector(record)]}</span>
                    </div>
                    <div className="job-row-aside">
                      <span className={`state-chip ${normalizeStatus(record.status).toLowerCase().startsWith("active") ? "active" : ""}`}>{normalizeStatus(record.status)}</span>
                      <strong>{record.openings === null ? "? openings" : `${record.openings} opening${record.openings === 1 ? "" : "s"}`}</strong>
                      <small>{record.published ? `Published ${formatDate(record.published)}` : record.deadline ? `Deadline ${formatDate(record.deadline)}` : "Date unknown"}</small>
                    </div>
                  </button>
                ))}
                <div className="pagination">
                  <button type="button" className="plain-button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button>
                  <span>Page {page} / {totalPages}</span>
                  <button type="button" className="plain-button" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Next</button>
                </div>
              </div>

              <aside className="job-detail" aria-live="polite">
                {selectedJob ? (
                  <>
                    <div className="job-detail-head"><div><span className="eyebrow">Recovered job record</span><h3>{selectedJob.title}</h3><p>{selectedJob.employer ?? "Employer unknown"}</p></div><button className="detail-close" type="button" onClick={() => setSelectedJob(null)} aria-label="Close job detail">×</button></div>
                    <dl className="detail-grid">
                      <div><dt>Status</dt><dd>{normalizeStatus(selectedJob.status)}</dd></div>
                      <div><dt>Openings</dt><dd>{selectedJob.openings ?? "Unknown"}</dd></div>
                      <div><dt>Published</dt><dd>{formatDate(selectedJob.published)}</dd></div>
                      <div><dt>Deadline</dt><dd>{formatDate(selectedJob.deadline)}</dd></div>
                      <div><dt>Location</dt><dd>{locationLabel(selectedJob)}</dd></div>
                      <div><dt>Pay</dt><dd>{selectedJob.salary ?? "Not stated"}</dd></div>
                      <div><dt>Work type</dt><dd>{selectedJob.workTypes.length ? selectedJob.workTypes.join(", ") : "Unknown"}</dd></div>
                      <div><dt>Derived sector</dt><dd>{sectorLabels[classifySector(selectedJob)]}</dd></div>
                    </dl>
                    <div className="provenance-card">
                      <div><span>Canonical source</span><strong>{safeHost(selectedJob.canonicalUrl)}</strong></div>
                      <a href={selectedJob.canonicalUrl} target="_blank" rel="noreferrer">Open canonical record ↗</a>
                    </div>
                    {selectedJob.evidenceUrl && selectedJob.evidenceUrl !== selectedJob.canonicalUrl && <a className="evidence-link" href={selectedJob.evidenceUrl} target="_blank" rel="noreferrer">Open supporting evidence ↗</a>}
                    {evidenceMode && (
                      <div className="evidence-detail">
                        <div><span>Verification</span><strong>{selectedJob.verification}</strong></div>
                        <div><span>Confidence</span><strong>{Math.round(selectedJob.confidence * 100)}%</strong></div>
                        <div><span>Embedded dataset</span><strong>{selectedJob.dataset}</strong></div>
                        <p>Confidence describes this recovered record&apos;s evidence quality. It is not a probability that the entire Nepal labor market has been observed.</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="detail-placeholder"><strong>Select a recovered record</strong><span>Job-level source, dates, evidence quality and known fields will appear here.</span></div>
                )}
              </aside>
            </div>
          </section>

          <section className="section-block" id="geography">
            <div className="section-heading"><div><div className="eyebrow">Known-place evidence</div><h2>{t.geography}</h2><p>Province counts represent recovered records with an explicit province in the embedded scope. Unknown location remains visible.</p></div><span className="small-badge">{scopeRecords.length - geography.unknown} known · {geography.unknown} unknown</span></div>
            <div className="geo-grid">
              {geography.rows.length ? geography.rows.map(([province, count]) => {
                const max = Math.max(1, ...geography.rows.map(([, value]) => value));
                return <button key={province} type="button" className="geo-row" onClick={() => { setProvinceFilter(province === "Multi-province" ? "All" : province); jumpToJobs(); }}><span>{province}</span><div className="bar-track"><i style={{ width: `${Math.max(5, Math.round((count / max) * 100))}%` }} /></div><strong>{count}</strong></button>;
              }) : <div className="empty-state">No province evidence in this scope.</div>}
              <div className="geo-row unknown-row"><span>Unknown / not recovered</span><div className="bar-track"><i style={{ width: `${scopeRecords.length ? Math.round((geography.unknown / scopeRecords.length) * 100) : 0}%` }} /></div><strong>{geography.unknown}</strong></div>
            </div>
          </section>

          <section className="section-block" id="history">
            <div className="section-heading"><div><div className="eyebrow">Recovered publication chronology</div><h2>{t.history}</h2><p>Only explicit publication dates are plotted. Records with deadline-only evidence are not silently assigned a publication year.</p></div><span className="small-badge">{history.rows.reduce((sum, [, value]) => sum + value, 0)} dated · {history.unknown} unknown</span></div>
            <div className="history-chart" role="img" aria-label="Recovered records by known publication year">
              {history.rows.map(([year, count]) => {
                const max = Math.max(1, ...history.rows.map(([, value]) => value));
                return <button className="year-column" key={year} type="button" onClick={() => { setQuery(String(year)); jumpToJobs(); }} title={`${year}: ${count} recovered records`}><span className="year-value">{count}</span><i style={{ height: `${Math.max(8, Math.round((count / max) * 100))}%` }} /><small>{year}</small></button>;
              })}
            </div>
            <div className="history-unknown"><span>Publication date unknown in this scope</span><strong>{history.unknown}</strong></div>
          </section>

          <section className="section-block" id="sources">
            <div className="section-heading"><div><div className="eyebrow">Provenance</div><h2>{t.sources}</h2><p>Source counts are record counts, not publisher market share. Canonical URLs remain available at job level.</p></div><span className="small-badge">evidence first</span></div>
            <div className="source-table">
              <div className="source-table-head"><span>Source</span><span>Records</span><span>URLs</span><span>Verified evidence</span></div>
              {sourceStats.map((row) => (
                <button className="source-table-row" type="button" key={row.source} onClick={() => { setSourceFilter(row.source); jumpToJobs(); }}>
                  <strong>{row.source}</strong><span>{row.count}</span><span>{row.urlCount}</span><span>{row.verified}/{row.count}</span>
                </button>
              ))}
            </div>

            <div className="coverage-panel panel">
              <div className="panel-header compact"><div><div className="eyebrow">Embedded export completeness</div><h2>Field Coverage</h2></div><span className="small-badge">{embeddedCorpusMeta.embeddedRecords} records</span></div>
              <div className="coverage-bars">
                {[
                  ["Province explicitly known", coverage.provinceKnown],
                  ["Publication date explicitly known", coverage.publicationKnown],
                  ["Opening count explicitly known", coverage.openingsKnown],
                  ["Pay evidence explicitly known", coverage.payKnown],
                ].map(([label, value]) => (
                  <div className="coverage-row" key={String(label)}><div><span>{label}</span><strong>{value}/{embeddedCorpusMeta.embeddedRecords}</strong></div><div className="bar-track"><i style={{ width: `${Math.round((Number(value) / embeddedCorpusMeta.embeddedRecords) * 100)}%` }} /></div></div>
                ))}
              </div>
              <div className="coverage-note">The research workspace contains {researchCheckpoint.canonicalPositions} canonical position records. This build currently embeds {embeddedCorpusMeta.embeddedRecords} records from the audited Run 03 and Run 04 file exports; the remaining workspace-only records are not fabricated or represented as zero.</div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
