"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { gsap } from "gsap";
import { jobRecords, embeddedCorpusMeta, type JobRecord } from "@/data/job-records";
import { MarketEvidence } from "@/components/market-evidence";
import { NationalEmploymentAtlas } from "@/components/national-employment-atlas";
import { classifySector, sectorLabels } from "@/lib/taxonomy";
import { formatDate, safeHost } from "@/lib/format";

type Locale = "en" | "ne";
type Workspace = "employment" | "vacancies" | "research";
type VacancyView = "jobs" | "geography" | "timeline" | "sources";
type SortMode = "latest" | "oldest" | "openings";

const PAGE_SIZE = 12;
const workspaces: Workspace[] = ["employment", "vacancies", "research"];
const vacancyViews: VacancyView[] = ["jobs", "geography", "timeline", "sources"];

const copy = {
  en: {
    title: "Nepal Work Atlas",
    subtitle: "research tool",
    employment: "Employment",
    vacancies: "Vacancies",
    research: "Research",
    jobs: "Jobs",
    geography: "Geography",
    timeline: "Timeline",
    sources: "Sources",
    vacancyTitle: "Verified Nepal-location vacancies",
    vacancyIntro: "Only recovered records with explicit Nepal province evidence are shown here. Location-unverified and explicit abroad-employment records are withheld from this public domestic view.",
    researchTitle: "Nepal market evidence",
    researchIntro: "Official Nepal statistics and Nepal-specific research benchmarks live here. Different evidence classes are never added into one invented national total.",
    search: "Search verified Nepal jobs, employers, places, or sources",
    noResults: "No verified Nepal records match these filters.",
  },
  ne: {
    title: "नेपाल वर्क एटलस",
    subtitle: "अनुसन्धान उपकरण",
    employment: "रोजगारी",
    vacancies: "रिक्त पद",
    research: "अनुसन्धान",
    jobs: "रोजगारी",
    geography: "भूगोल",
    timeline: "समयरेखा",
    sources: "स्रोत",
    vacancyTitle: "नेपाल स्थान प्रमाणित रिक्त पद",
    vacancyIntro: "स्पष्ट नेपाल प्रदेश प्रमाण भएका अभिलेख मात्र यहाँ देखाइन्छन्। स्थान अप्रमाणित वा विदेश रोजगारीका अभिलेख सार्वजनिक घरेलु दृश्यमा समावेश हुँदैनन्।",
    researchTitle: "नेपाल श्रम बजार प्रमाण",
    researchIntro: "आधिकारिक नेपाल तथ्याङ्क र नेपाल-विशिष्ट अनुसन्धान बेन्चमार्क यहाँ छन्। फरक प्रमाण प्रकारलाई एउटै बनावटी राष्ट्रिय कुलमा जोडिँदैन।",
    search: "प्रमाणित नेपाल रोजगारी, रोजगारदाता, स्थान वा स्रोत खोज्नुहोस्",
    noResults: "यी फिल्टरसँग मिल्ने प्रमाणित नेपाल अभिलेख भेटिएन।",
  },
} as const;

function normalizeStatus(status: string) {
  if (/active/i.test(status)) return "Active";
  if (/future/i.test(status)) return "Future announced";
  if (/expired|historical/i.test(status)) return "Expired / historical";
  return "Unknown";
}

function recordDate(record: JobRecord) {
  const raw = record.published ?? record.deadline;
  if (!raw) return 0;
  if (/^\d{4}$/.test(raw)) return Date.UTC(Number(raw), 0, 1);
  return Date.parse(`${raw}T00:00:00Z`) || Date.parse(raw) || 0;
}

function locationLabel(record: JobRecord) {
  return [record.localLevel, record.district, record.province].filter(Boolean).join(", ");
}

function searchText(record: JobRecord) {
  return [record.title, record.employer, record.source, record.province, record.district, record.localLevel, record.industry, record.workTypes.join(" ")]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function AtlasDashboard() {
  const rootRef = useRef<HTMLElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [locale, setLocale] = useState<Locale>("en");
  const [workspace, setWorkspace] = useState<Workspace>("employment");
  const [vacancyView, setVacancyView] = useState<VacancyView>("jobs");
  const [query, setQuery] = useState("");
  const [province, setProvince] = useState("All");
  const [source, setSource] = useState("All");
  const [sort, setSort] = useState<SortMode>("latest");
  const [page, setPage] = useState(1);
  const [selectedJob, setSelectedJob] = useState<JobRecord | null>(null);
  const t = copy[locale];

  useEffect(() => {
    const syncFromHash = () => {
      const raw = window.location.hash.replace(/^#/, "");
      const [workspacePart, vacancyPart] = raw.split("/");
      if (workspaces.includes(workspacePart as Workspace)) setWorkspace(workspacePart as Workspace);
      if (vacancyViews.includes(vacancyPart as VacancyView)) setVacancyView(vacancyPart as VacancyView);
    };
    syncFromHash();
    window.addEventListener("popstate", syncFromHash);
    return () => window.removeEventListener("popstate", syncFromHash);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setWorkspace("vacancies");
        setVacancyView("jobs");
        window.history.pushState(null, "", "#vacancies/jobs");
        window.setTimeout(() => searchRef.current?.focus(), 0);
      }
      if (event.key === "Escape") setSelectedJob(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const tween = gsap.fromTo(view, { autoAlpha: 0.45, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.28, ease: "power2.out", clearProps: "transform,opacity" });
    return () => { tween.kill(); };
  }, [workspace, vacancyView]);

  const provinces = useMemo(() => [...new Set(jobRecords.map((record) => record.province))].sort(), []);
  const sources = useMemo(() => [...new Set(jobRecords.map((record) => record.source))].sort(), []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const rows = jobRecords.filter((record) => {
      if (needle && !searchText(record).includes(needle)) return false;
      if (province !== "All" && record.province !== province) return false;
      if (source !== "All" && record.source !== source) return false;
      return true;
    });
    return [...rows].sort((a, b) => {
      if (sort === "oldest") return recordDate(a) - recordDate(b);
      if (sort === "openings") return (b.openings ?? -1) - (a.openings ?? -1);
      return recordDate(b) - recordDate(a);
    });
  }, [query, province, source, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visibleJobs = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const knownOpenings = jobRecords.reduce((sum, record) => sum + (record.openings ?? 0), 0);
  const knownOpeningRecords = jobRecords.filter((record) => record.openings !== null).length;

  useEffect(() => { setPage(1); }, [query, province, source, sort]);

  useEffect(() => {
    if (workspace !== "vacancies" || vacancyView !== "jobs" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rows = rootRef.current?.querySelectorAll(".jobs-table-row");
    if (!rows?.length) return;
    const tween = gsap.fromTo(rows, { autoAlpha: 0.45, y: 7 }, { autoAlpha: 1, y: 0, duration: 0.24, stagger: 0.025, ease: "power2.out" });
    return () => { tween.kill(); };
  }, [visibleJobs, workspace, vacancyView]);

  const geography = useMemo(() => {
    const counts = new Map<string, number>();
    jobRecords.forEach((record) => counts.set(record.province, (counts.get(record.province) ?? 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, []);

  const timeline = useMemo(() => {
    const counts = new Map<number, number>();
    let unknown = 0;
    jobRecords.forEach((record) => {
      const raw = record.published ?? record.deadline;
      if (!raw) { unknown += 1; return; }
      const year = Number(raw.slice(0, 4));
      if (!Number.isFinite(year)) { unknown += 1; return; }
      counts.set(year, (counts.get(year) ?? 0) + 1);
    });
    return { rows: [...counts.entries()].sort((a, b) => a[0] - b[0]), unknown };
  }, []);

  const sourceStats = useMemo(() => {
    const map = new Map<string, { records: number; urls: Set<string> }>();
    jobRecords.forEach((record) => {
      const row = map.get(record.source) ?? { records: 0, urls: new Set<string>() };
      row.records += 1;
      row.urls.add(record.canonicalUrl);
      map.set(record.source, row);
    });
    return [...map.entries()].map(([name, value]) => ({ name, records: value.records, urls: value.urls.size })).sort((a, b) => b.records - a.records);
  }, []);

  const navigate = (nextWorkspace: Workspace, nextVacancyView: VacancyView = vacancyView) => {
    setWorkspace(nextWorkspace);
    if (nextWorkspace === "vacancies") setVacancyView(nextVacancyView);
    window.history.pushState(null, "", nextWorkspace === "vacancies" ? `#vacancies/${nextVacancyView}` : `#${nextWorkspace}`);
  };

  return (
    <main ref={rootRef} className="atlas-page simplified-atlas">
      <a className="skip-link" href="#workspace-content">Skip to workspace content</a>
      <div className="atlas-wrapper simplified-wrapper">
        <header className="workspace-header">
          <div className="workspace-brand"><button type="button" className="quiet-control" onClick={() => navigate("employment")}><strong>{t.title}</strong><span>{t.subtitle}</span></button></div>
          <nav className="workspace-tabs" aria-label="Main workspace">
            {workspaces.map((item) => <button key={item} type="button" aria-pressed={workspace === item} onClick={() => navigate(item)}>{t[item]}</button>)}
          </nav>
          <div className="workspace-actions">
            <a className="quiet-link" href="https://github.com/Nischhalsubba/Nepal-Work-Atlas" target="_blank" rel="noreferrer">GitHub</a>
            <button className="quiet-control" type="button" onClick={() => setLocale((value) => value === "en" ? "ne" : "en")}>{locale === "en" ? "EN / ने" : "ने / EN"}</button>
          </div>
        </header>

        <div id="workspace-content" ref={viewRef} key={`${workspace}-${vacancyView}`} className={`workspace-view workspace-${workspace}`} tabIndex={-1}>
          {workspace === "employment" && <NationalEmploymentAtlas evidenceMode />}

          {workspace === "vacancies" && (
            <>
              <section className="workspace-intro">
                <div><div className="eyebrow">Nepal only / province-evidenced</div><h1>{t.vacancyTitle}</h1><p>{t.vacancyIntro}</p></div>
                <div className="workspace-context">Country NP · geography verified before display</div>
              </section>
              <section className="workspace-metrics" aria-label="Verified Nepal vacancy subset">
                <div><span>Verified Nepal records</span><strong>{jobRecords.length}</strong><small>explicit province evidence</small></div>
                <div><span>Known openings</span><strong>{knownOpenings.toLocaleString("en-US")}</strong><small>{knownOpeningRecords} records with explicit counts</small></div>
                <div><span>Withheld from public view</span><strong>{embeddedCorpusMeta.excludedLocationUnverifiedRecords + embeddedCorpusMeta.excludedOutsideNepalRecords}</strong><small>{embeddedCorpusMeta.excludedLocationUnverifiedRecords} location-unverified · {embeddedCorpusMeta.excludedOutsideNepalRecords} outside Nepal</small></div>
              </section>

              <nav className="vacancy-subnav" aria-label="Vacancy views">
                {vacancyViews.map((item) => <button key={item} type="button" aria-pressed={vacancyView === item} onClick={() => navigate("vacancies", item)}>{t[item]}</button>)}
              </nav>

              <div className="vacancy-panel">
                {vacancyView === "jobs" && (
                  <section className="vacancy-jobs">
                    <div className="vacancy-search-row">
                      <label className="vacancy-search"><span className="sr-only">{t.search}</span><input ref={searchRef} value={query} onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)} placeholder={t.search} /><kbd>Cmd/Ctrl K</kbd></label>
                      <span className="count-label">{filtered.length} matches</span>
                    </div>
                    <div className="filter-row compact-filters">
                      <label><span>Province</span><select value={province} onChange={(event) => setProvince(event.target.value)}><option>All</option>{provinces.map((value) => <option key={value}>{value}</option>)}</select></label>
                      <label><span>Source</span><select value={source} onChange={(event) => setSource(event.target.value)}><option>All</option>{sources.map((value) => <option key={value}>{value}</option>)}</select></label>
                      <label><span>Sort</span><select value={sort} onChange={(event) => setSort(event.target.value as SortMode)}><option value="latest">Latest known date</option><option value="oldest">Oldest known date</option><option value="openings">Known openings</option></select></label>
                      <button className="toolbar-button filter-clear" type="button" onClick={() => { setQuery(""); setProvince("All"); setSource("All"); setSort("latest"); }}>Clear filters</button>
                    </div>
                    <div className="jobs-layout simplified-jobs-layout">
                      <div className="jobs-table" role="table" aria-label="Verified Nepal job records">
                        <div className="jobs-table-head" role="row"><span>Role</span><span>Employer</span><span>Location</span><span>Source</span><span>Status</span><span>Openings</span><span>Date</span></div>
                        {visibleJobs.length === 0 ? <div className="empty-state">{t.noResults}</div> : visibleJobs.map((record) => (
                          <button key={record.id} type="button" className={`jobs-table-row ${selectedJob?.id === record.id ? "selected" : ""}`} onClick={() => setSelectedJob(record)}>
                            <span className="role-cell"><strong>{record.title}</strong><small>{sectorLabels[classifySector(record)]}</small></span>
                            <span>{record.employer ?? "Unknown"}</span><span>{locationLabel(record)}</span><span>{record.source}</span><span>{normalizeStatus(record.status)}</span><span className="number-cell">{record.openings ?? "-"}</span><span className="number-cell">{formatDate(record.published ?? record.deadline)}</span>
                          </button>
                        ))}
                        <div className="pagination"><button type="button" className="toolbar-button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button><span>Page {page} / {totalPages}</span><button type="button" className="toolbar-button" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Next</button></div>
                      </div>
                      <aside className="job-inspector" aria-live="polite">
                        {selectedJob ? <div className="job-inspector-inner"><div className="inspector-head"><div><span>Verified Nepal record</span><h3>{selectedJob.title}</h3><p>{selectedJob.employer ?? "Employer unknown"}</p></div><button type="button" onClick={() => setSelectedJob(null)}>Close</button></div><dl className="inspector-grid"><div><dt>Country</dt><dd>{selectedJob.country} ({selectedJob.countryCode})</dd></div><div><dt>Province</dt><dd>{selectedJob.province}</dd></div><div><dt>Location</dt><dd>{locationLabel(selectedJob)}</dd></div><div><dt>Status</dt><dd>{normalizeStatus(selectedJob.status)}</dd></div><div><dt>Openings</dt><dd>{selectedJob.openings ?? "Unknown"}</dd></div><div><dt>Pay</dt><dd>{selectedJob.salary ?? "Not stated"}</dd></div><div><dt>Geography verification</dt><dd>{selectedJob.geographyVerification}</dd></div><div><dt>Confidence</dt><dd>{Math.round(selectedJob.confidence * 100)}%</dd></div></dl><div className="canonical-source"><span>Canonical source</span><strong>{safeHost(selectedJob.canonicalUrl)}</strong><a href={selectedJob.canonicalUrl} target="_blank" rel="noreferrer">Open source record</a></div></div> : <div className="inspector-placeholder"><span>Nepal-only vacancy view</span><strong>Province evidence is required</strong><p>Every displayed row is country NP and has an explicit Nepal province before it can enter this view.</p></div>}
                      </aside>
                    </div>
                  </section>
                )}

                {vacancyView === "geography" && <section className="flat-section vacancy-analysis-section"><div className="flat-heading"><div><div className="eyebrow">Verified geography</div><h2>Records by Nepal province</h2><p>All displayed records already passed the explicit province gate.</p></div><span className="count-label">{jobRecords.length}/{jobRecords.length} province-evidenced</span></div><div className="bar-table">{geography.map(([name, count]) => { const max = Math.max(...geography.map(([, value]) => value)); return <button key={name} type="button" className="bar-table-row" onClick={() => { setProvince(name); navigate("vacancies", "jobs"); }}><span>{name}</span><div className="thin-track"><i style={{ transform: `scaleX(${count / max})` }} /></div><strong>{count}</strong></button>; })}</div></section>}

                {vacancyView === "timeline" && <section className="flat-section vacancy-analysis-section"><div className="flat-heading"><div><div className="eyebrow">Verified Nepal subset</div><h2>Known publication timeline</h2><p>Dates describe this recovered Nepal subset only. Missing dates remain unknown.</p></div><span className="count-label">{timeline.rows.reduce((sum, [, count]) => sum + count, 0)} dated · {timeline.unknown} unknown</span></div><div className="timeline-chart">{timeline.rows.map(([year, count]) => { const max = Math.max(...timeline.rows.map(([, value]) => value)); return <button className="timeline-column" key={year} type="button" title={`${year}: ${count} records`} onClick={() => { setQuery(String(year)); navigate("vacancies", "jobs"); }}><span>{count}</span><i style={{ transform: `scaleY(${count / max})` }} /><small>{year}</small></button>; })}</div></section>}

                {vacancyView === "sources" && <section className="flat-section vacancy-analysis-section"><div className="flat-heading"><div><div className="eyebrow">Provenance</div><h2>Sources in the verified Nepal subset</h2><p>Source counts describe recovered coverage, not market share.</p></div><span className="count-label">{sourceStats.length} sources</span></div><div className="source-table"><div className="source-table-head"><span>Source</span><span>Records</span><span>URLs</span><span>Geography</span></div>{sourceStats.map((row) => <button className="source-table-row" key={row.name} type="button" onClick={() => { setSource(row.name); navigate("vacancies", "jobs"); }}><strong>{row.name}</strong><span>{row.records}</span><span>{row.urls}</span><span>NP verified</span></button>)}</div></section>}
              </div>

              <div className="vacancy-boundary-note"><strong>{jobRecords.length} public Nepal records</strong><span>{embeddedCorpusMeta.excludedLocationUnverifiedRecords} location-unverified records and {embeddedCorpusMeta.excludedOutsideNepalRecords} explicit outside-Nepal record are withheld. No missing value is converted to zero and this remains a recovered sample, not a national vacancy census.</span></div>
            </>
          )}

          {workspace === "research" && <><section className="workspace-intro research-intro"><div><div className="eyebrow">Country NP</div><h1>{t.researchTitle}</h1><p>{t.researchIntro}</p></div><div className="workspace-context">Nepal-specific evidence only</div></section><MarketEvidence locale={locale} evidenceMode /><details className="research-methods" open><summary>Accuracy boundary</summary><div><p><strong>Employment stock</strong> is official Nepal national statistics. <strong>Public vacancies</strong> require explicit Nepal province evidence. <strong>External benchmarks</strong> are allowed only when the metric itself is explicitly Nepal-specific.</p><p>Unknown stays unknown. The Atlas does not infer geography from a portal name, employer name, domain, or missing field, and it never adds incompatible evidence classes into one national total.</p></div></details></>}
        </div>

        <footer className="atlas-footer simplified-footer"><span>Nepal Work Atlas / evidence-first labor-market research</span><span>Official Nepal employment · province-evidenced Nepal vacancies · Nepal-specific research benchmarks</span></footer>
      </div>
    </main>
  );
}
