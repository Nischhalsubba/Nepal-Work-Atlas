"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { jobRecords, embeddedCorpusMeta, type JobRecord } from "@/data/job-records";
import { researchCheckpoint } from "@/data/research-checkpoint";
import { OpportunityLandscape } from "@/components/opportunity-landscape";
import { MarketEvidence } from "@/components/market-evidence";
import { type AppliedScope, classifySector, recordMatchesScope, sectorLabels } from "@/lib/taxonomy";
import { formatDate, safeHost } from "@/lib/format";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

type Locale = "en" | "ne";
type SortMode = "relevance" | "latest" | "oldest" | "openings";
type NavKey = "employment" | "evidence" | "jobs" | "geography" | "history" | "sources";

const copy = {
  en: {
    employment: "Employment map",
    evidence: "Evidence",
    jobs: "Jobs explorer",
    geography: "Geography",
    history: "Timeline",
    sources: "Sources",
    search: "Search recovered jobs, employers, places, or sources",
    evidenceMode: "Evidence mode",
    title: "Nepal Work Atlas",
    intro: "A research tool for visually exploring Nepal's employment structure and recovered hiring evidence. National employment stock and observed vacancy demand are kept separate so incomplete web archives are never presented as the whole labor market.",
    methods: "Methods and coverage boundary",
    results: "Recovered records",
    clear: "Clear filters",
    noResults: "No recovered records match these filters.",
  },
  ne: {
    employment: "रोजगारी नक्सा",
    evidence: "प्रमाण",
    jobs: "रोजगारी खोज",
    geography: "भूगोल",
    history: "समयरेखा",
    sources: "स्रोतहरू",
    search: "फेला परेका रोजगारी, रोजगारदाता, स्थान वा स्रोत खोज्नुहोस्",
    evidenceMode: "प्रमाण मोड",
    title: "नेपाल वर्क एटलस",
    intro: "नेपालको रोजगारी संरचना र फेला परेको hiring evidence दृश्य रूपमा अन्वेषण गर्ने अनुसन्धान उपकरण। राष्ट्रिय employment stock र भेटिएका vacancy संकेत अलग राखिन्छन् ताकि अपूर्ण वेब अभिलेखलाई सम्पूर्ण श्रम बजार नदेखाइयोस्।",
    methods: "विधि र कभरेज सीमा",
    results: "फेला परेका अभिलेख",
    clear: "फिल्टर हटाउनुहोस्",
    noResults: "यी फिल्टरसँग मिल्ने अभिलेख भेटिएन।",
  },
} as const;

const navItems: Array<{ key: NavKey; id: string }> = [
  { key: "employment", id: "employment-atlas" },
  { key: "evidence", id: "market-evidence" },
  { key: "jobs", id: "jobs-explorer" },
  { key: "geography", id: "geography" },
  { key: "history", id: "history" },
  { key: "sources", id: "sources" },
];

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
  if (!candidate) return 0;
  if (/^\d{4}$/.test(candidate)) return Date.UTC(Number(candidate), 0, 1);
  return Date.parse(`${candidate}T00:00:00Z`) || Date.parse(candidate) || 0;
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

function scrollToId(id: string) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById(id)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
}

export function AtlasDashboard() {
  const rootRef = useRef<HTMLElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
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
  const [activeSection, setActiveSection] = useState<NavKey>("employment");
  const t = copy[locale];

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === "Escape" && selectedJob) setSelectedJob(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedJob]);

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter, provinceFilter, sourceFilter, sort, appliedScope]);

  useEffect(() => {
    const observed = navItems
      .map(({ key, id }) => ({ key, element: document.getElementById(id) }))
      .filter((item): item is { key: NavKey; element: HTMLElement } => Boolean(item.element));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const item = observed.find(({ element }) => element === visible.target);
        if (item) setActiveSection(item.key);
      },
      { rootMargin: "-18% 0px -64% 0px", threshold: [0.05, 0.2, 0.5] },
    );
    observed.forEach(({ element }) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const mm = gsap.matchMedia();
    const ctx = gsap.context(() => {
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const intro = gsap.timeline({ defaults: { ease: "power2.out" } });
        intro
          .fromTo(".js-header-title", { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.28 })
          .fromTo(".js-header-copy", { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.24 }, "<0.06")
          .fromTo(".js-header-controls", { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.22 }, "<0.06");

        ScrollTrigger.batch(".js-section", {
          start: "top 88%",
          once: true,
          onEnter: (elements: Element[]) => {
            gsap.fromTo(elements, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.28, stagger: 0.035, ease: "power2.out" });
          },
        });
      });
    }, root);

    return () => {
      mm.revert();
      ctx.revert();
    };
  }, []);

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

  useEffect(() => {
    const root = rootRef.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rows = root.querySelectorAll(".jobs-table-row");
    gsap.fromTo(rows, { autoAlpha: 0.55, y: 4 }, { autoAlpha: 1, y: 0, duration: 0.18, stagger: 0.015, ease: "power2.out", overwrite: "auto" });
  }, [visibleJobs]);

  useEffect(() => {
    if (!selectedJob || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const detail = rootRef.current?.querySelector(".job-inspector-inner");
    if (detail) gsap.fromTo(detail, { autoAlpha: 0, x: 8 }, { autoAlpha: 1, x: 0, duration: 0.2, ease: "power2.out" });
  }, [selectedJob]);

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
    return { rows: [...counts.entries()].sort((a, b) => b[1] - a[1]), unknown };
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
    return { rows: [...counts.entries()].sort((a, b) => a[0] - b[0]), unknown };
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

  const checkpointMetrics = [
    ["Recovered positions", researchCheckpoint.canonicalPositions.toLocaleString("en-US"), "canonical research records"],
    ["Observed URLs", researchCheckpoint.distinctPostingUrls.toLocaleString("en-US"), "distinct canonical posting URLs"],
    ["Recovered known openings", researchCheckpoint.knownOpenings.toLocaleString("en-US"), "explicit counts in recovered records"],
    ["Coverage records", researchCheckpoint.coverageRecords.toLocaleString("en-US"), `${researchCheckpoint.postingObservations} posting observations`],
  ] as const;

  return (
    <main ref={rootRef} className="atlas-page" id="overview">
      <a className="skip-link" href="#employment-atlas">Skip to employment atlas</a>

      <div className="atlas-wrapper">
        <header className="atlas-header">
          <div className="atlas-intro js-header-title">
            <div className="atlas-title-line">
              <h1>{t.title}</h1>
              <a href="https://github.com/Nischhalsubba/Nepal-Work-Atlas" target="_blank" rel="noreferrer">GitHub ↗</a>
            </div>
            <p className="js-header-copy">{t.intro}</p>
            <details className="method-details js-header-copy">
              <summary>{t.methods}</summary>
              <div>
                <p><strong>Employment stock:</strong> official Nepal population/labor evidence. <strong>Vacancy demand:</strong> recovered advertisements and opening counts. They are different measures and are never silently summed.</p>
                <p>The research target is 2000–2026, but the earliest recovered publication currently stored is {researchCheckpoint.recoveredFrom}. Missing years and fields are coverage gaps, not zero hiring.</p>
              </div>
            </details>
          </div>

          <div className="atlas-toolbar js-header-controls">
            <nav className="atlas-nav" aria-label="Primary navigation">
              {navItems.map(({ key, id }) => (
                <a key={key} href={`#${id}`} aria-current={activeSection === key ? "location" : undefined}>{t[key]}</a>
              ))}
            </nav>

            <div className="toolbar-actions">
              <label className="global-search">
                <span className="sr-only">{t.search}</span>
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)}
                  onKeyDown={(event: ReactKeyboardEvent<HTMLInputElement>) => event.key === "Enter" && scrollToId("jobs-explorer")}
                  placeholder={t.search}
                />
                <kbd>⌘K</kbd>
              </label>
              <button className="toolbar-button" type="button" onClick={() => setEvidenceMode((value) => !value)} aria-pressed={evidenceMode}>{t.evidenceMode}: {evidenceMode ? "on" : "off"}</button>
              <button className="toolbar-button" type="button" onClick={() => setLocale((current) => current === "en" ? "ne" : "en")}>{locale === "en" ? "EN / ने" : "ने / EN"}</button>
            </div>
          </div>
        </header>

        <MarketEvidence locale={locale} evidenceMode={evidenceMode} />

        <section className="checkpoint-strip js-section" aria-label="Recovered research checkpoint">
          {checkpointMetrics.map(([label, value, detail]) => (
            <div key={label}>
              <span>{label}</span><strong>{value}</strong><small>{detail}</small>
            </div>
          ))}
        </section>

        <section className={`scope-line js-section ${appliedScope ? "scope-active" : ""}`} aria-live="polite">
          <div><span>Interactive vacancy scope</span><strong>{appliedScope ? appliedScope.label : "All embedded recovered records"}</strong></div>
          <div><span>Records</span><strong>{scopeRecords.length}</strong></div>
          <div><span>Explicit openings</span><strong>{scopeOpenings.toLocaleString("en-US")}</strong><small>{scopeKnownOpeningRecords} records state counts</small></div>
          <div><span>Embedded / archive</span><strong>{embeddedCorpusMeta.embeddedRecords} / {embeddedCorpusMeta.totalArchiveRecords}</strong></div>
          {appliedScope && <button type="button" className="text-button" onClick={() => setAppliedScope(null)}>Clear scope</button>}
        </section>

        <div className="js-section"><OpportunityLandscape records={jobRecords} appliedScope={appliedScope} onApplyScope={setAppliedScope} /></div>

        <section className="flat-section js-section" id="jobs-explorer">
          <div className="flat-heading">
            <div><div className="eyebrow">Recovered vacancy evidence</div><h2>{t.jobs}</h2><p>Search and inspect the embedded evidence subset. Missing fields remain unknown.</p></div>
            <span className="count-label">{filtered.length} matches</span>
          </div>

          <div className="filter-row" aria-label="Job filters">
            <label><span>Status</span><select value={statusFilter} onChange={(e: ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}><option>All</option>{statuses.map((value) => <option key={value}>{value}</option>)}</select></label>
            <label><span>Province</span><select value={provinceFilter} onChange={(e: ChangeEvent<HTMLSelectElement>) => setProvinceFilter(e.target.value)}><option>All</option>{provinces.map((value) => <option key={value}>{value}</option>)}</select></label>
            <label><span>Source</span><select value={sourceFilter} onChange={(e: ChangeEvent<HTMLSelectElement>) => setSourceFilter(e.target.value)}><option>All</option>{sources.map((value) => <option key={value}>{value}</option>)}</select></label>
            <label><span>Sort</span><select value={sort} onChange={(e: ChangeEvent<HTMLSelectElement>) => setSort(e.target.value as SortMode)}><option value="relevance">Source order</option><option value="latest">Latest known date</option><option value="oldest">Oldest known date</option><option value="openings">Opening count</option></select></label>
            <button className="toolbar-button filter-clear" type="button" onClick={() => { setQuery(""); setStatusFilter("All"); setProvinceFilter("All"); setSourceFilter("All"); setSort("relevance"); }}>{t.clear}</button>
          </div>

          <div className="jobs-layout">
            <div className="jobs-table" role="table" aria-label="Recovered job records">
              <div className="jobs-table-head" role="row"><span>Role</span><span>Employer</span><span>Location</span><span>Source</span><span>Status</span><span>Openings</span><span>Date</span></div>
              {visibleJobs.length === 0 ? <div className="empty-state">{t.noResults}</div> : visibleJobs.map((record) => (
                <button key={record.id} className={`jobs-table-row ${selectedJob?.id === record.id ? "selected" : ""}`} type="button" onClick={() => setSelectedJob(record)}>
                  <span className="role-cell"><strong>{record.title}</strong><small>{sectorLabels[classifySector(record)]}</small></span>
                  <span>{record.employer ?? "Unknown"}</span>
                  <span>{locationLabel(record)}</span>
                  <span>{record.source}</span>
                  <span>{normalizeStatus(record.status)}</span>
                  <span className="number-cell">{record.openings ?? "—"}</span>
                  <span className="number-cell">{record.published ? formatDate(record.published) : record.deadline ? formatDate(record.deadline) : "—"}</span>
                </button>
              ))}
              <div className="pagination">
                <button type="button" className="toolbar-button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button>
                <span>Page {page} / {totalPages}</span>
                <button type="button" className="toolbar-button" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Next</button>
              </div>
            </div>

            <aside className="job-inspector" aria-live="polite">
              {selectedJob ? (
                <div className="job-inspector-inner">
                  <div className="inspector-head"><div><span>Recovered job record</span><h3>{selectedJob.title}</h3><p>{selectedJob.employer ?? "Employer unknown"}</p></div><button type="button" onClick={() => setSelectedJob(null)}>Close</button></div>
                  <dl className="inspector-grid">
                    <div><dt>Status</dt><dd>{normalizeStatus(selectedJob.status)}</dd></div>
                    <div><dt>Openings</dt><dd>{selectedJob.openings ?? "Unknown"}</dd></div>
                    <div><dt>Published</dt><dd>{formatDate(selectedJob.published)}</dd></div>
                    <div><dt>Deadline</dt><dd>{formatDate(selectedJob.deadline)}</dd></div>
                    <div><dt>Location</dt><dd>{locationLabel(selectedJob)}</dd></div>
                    <div><dt>Pay</dt><dd>{selectedJob.salary ?? "Not stated"}</dd></div>
                    <div><dt>Work type</dt><dd>{selectedJob.workTypes.length ? selectedJob.workTypes.join(", ") : "Unknown"}</dd></div>
                    <div><dt>Derived sector</dt><dd>{sectorLabels[classifySector(selectedJob)]}</dd></div>
                  </dl>
                  <div className="canonical-source"><span>Canonical source</span><strong>{safeHost(selectedJob.canonicalUrl)}</strong><a href={selectedJob.canonicalUrl} target="_blank" rel="noreferrer">Open record ↗</a></div>
                  {selectedJob.evidenceUrl && selectedJob.evidenceUrl !== selectedJob.canonicalUrl && <a className="secondary-evidence" href={selectedJob.evidenceUrl} target="_blank" rel="noreferrer">Supporting evidence ↗</a>}
                  {evidenceMode && <div className="inspector-evidence"><span>Verification <b>{selectedJob.verification}</b></span><span>Confidence <b>{Math.round(selectedJob.confidence * 100)}%</b></span><span>Dataset <b>{selectedJob.dataset}</b></span><p>Confidence describes this recovered record&apos;s evidence quality. It is not an estimate of archive completeness.</p></div>}
                </div>
              ) : <div className="inspector-placeholder"><span>Job inspector</span><strong>Select a recovered record</strong><p>Source, dates, known fields, and provenance will appear here.</p></div>}
            </aside>
          </div>
        </section>

        <section className="flat-section js-section" id="geography">
          <div className="flat-heading"><div><div className="eyebrow">Known-place evidence</div><h2>{t.geography}</h2><p>Province counts describe recovered records with an explicit province. Unknown geography remains visible.</p></div><span className="count-label">{scopeRecords.length - geography.unknown} known · {geography.unknown} unknown</span></div>
          <div className="bar-table">
            {geography.rows.length ? geography.rows.map(([province, count]) => {
              const max = Math.max(1, ...geography.rows.map(([, value]) => value));
              return <button key={province} type="button" className="bar-table-row" onClick={() => { setProvinceFilter(province === "Multi-province" ? "All" : province); scrollToId("jobs-explorer"); }}><span>{province}</span><div className="thin-track"><i style={{ transform: `scaleX(${count / max})` }} /></div><strong>{count}</strong></button>;
            }) : <div className="empty-state">No province evidence in this scope.</div>}
            <div className="bar-table-row unknown-row"><span>Unknown / not recovered</span><div className="thin-track"><i style={{ transform: `scaleX(${scopeRecords.length ? geography.unknown / scopeRecords.length : 0})` }} /></div><strong>{geography.unknown}</strong></div>
          </div>
        </section>

        <section className="flat-section js-section" id="history">
          <div className="flat-heading"><div><div className="eyebrow">Recovered publication chronology</div><h2>{t.history}</h2><p>Only explicit publication dates are plotted. Missing years are not interpreted as zero hiring.</p></div><span className="count-label">{history.rows.reduce((sum, [, value]) => sum + value, 0)} dated · {history.unknown} unknown</span></div>
          <div className="timeline-chart" role="img" aria-label="Recovered records by known publication year">
            {history.rows.map(([year, count]) => {
              const max = Math.max(1, ...history.rows.map(([, value]) => value));
              return <button className="timeline-column" key={year} type="button" onClick={() => { setQuery(String(year)); scrollToId("jobs-explorer"); }} title={`${year}: ${count} recovered records`}><span>{count}</span><i style={{ transform: `scaleY(${count / max})` }} /><small>{year}</small></button>;
            })}
          </div>
          <div className="unknown-line"><span>Publication date unknown in this scope</span><strong>{history.unknown}</strong></div>
        </section>

        <section className="flat-section js-section" id="sources">
          <div className="flat-heading"><div><div className="eyebrow">Provenance</div><h2>{t.sources}</h2><p>Source counts are recovered-record counts, not publisher market share.</p></div><span className="count-label">{sourceStats.length} sources in scope</span></div>
          <div className="source-table">
            <div className="source-table-head"><span>Source</span><span>Records</span><span>URLs</span><span>Verified evidence</span></div>
            {sourceStats.map((row) => <button className="source-table-row" type="button" key={row.source} onClick={() => { setSourceFilter(row.source); scrollToId("jobs-explorer"); }}><strong>{row.source}</strong><span>{row.count}</span><span>{row.urlCount}</span><span>{row.verified}/{row.count}</span></button>)}
          </div>

          <div className="field-coverage">
            <div><div className="eyebrow">Embedded export completeness</div><h3>Field coverage</h3><p>{embeddedCorpusMeta.embeddedRecords} embedded records from audited exports; {researchCheckpoint.canonicalPositions} canonical research-workspace records at the current checkpoint.</p></div>
            <div className="coverage-list">
              {[
                ["Province explicitly known", coverage.provinceKnown],
                ["Publication date explicitly known", coverage.publicationKnown],
                ["Opening count explicitly known", coverage.openingsKnown],
                ["Pay evidence explicitly known", coverage.payKnown],
              ].map(([label, value]) => <div className="coverage-item" key={String(label)}><div><span>{label}</span><strong>{value}/{embeddedCorpusMeta.embeddedRecords}</strong></div><div className="thin-track"><i style={{ transform: `scaleX(${Number(value) / embeddedCorpusMeta.embeddedRecords})` }} /></div></div>)}
            </div>
          </div>
        </section>

        <footer className="atlas-footer">
          <span>Nepal Work Atlas · evidence-first research interface</span>
          <span>Research checkpoint {researchCheckpoint.asOf} · target period 2000–2026 · recovered evidence currently begins {researchCheckpoint.recoveredFrom}</span>
        </footer>
      </div>
    </main>
  );
}
