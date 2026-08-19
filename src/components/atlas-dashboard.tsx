"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { gsap } from "gsap";
import { jobRecords, embeddedCorpusMeta, type JobRecord } from "@/data/job-records";
import { researchCheckpoint } from "@/data/research-checkpoint";
import { MarketEvidence } from "@/components/market-evidence";
import { NationalEmploymentAtlas } from "@/components/national-employment-atlas";
import { classifySector, sectorLabels } from "@/lib/taxonomy";
import { formatDate, safeHost } from "@/lib/format";

type Locale = "en" | "ne";
type Workspace = "employment" | "vacancies" | "research";
type VacancyView = "jobs" | "geography" | "timeline" | "sources";
type SortMode = "relevance" | "latest" | "oldest" | "openings";

const PAGE_SIZE = 12;

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
    vacancyTitle: "Recovered vacancies in Nepal",
    vacancyIntro:
      "Search the recovered hiring archive without confusing it with Nepal's total labor market. Every count below is evidence from the recovered corpus or the embedded interactive subset.",
    researchTitle: "What the Atlas knows, and what it does not",
    researchIntro:
      "Methodology, outside benchmarks, coverage gaps, and source progress live here so the exploration screens can stay focused.",
    search: "Search recovered jobs, employers, places, or sources",
    clear: "Clear filters",
    noResults: "No recovered records match these filters.",
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
    vacancyTitle: "नेपालमा फेला परेका रिक्त पद",
    vacancyIntro:
      "फेला परेको भर्ना अभिलेख खोज्नुहोस्। यो नेपालको सम्पूर्ण श्रम बजार होइन।",
    researchTitle: "एटलसले के जान्छ, र के जान्दैन",
    researchIntro:
      "विधि, बाह्य बेन्चमार्क, कभरेज ग्याप र स्रोत प्रगति यहाँ राखिएको छ।",
    search: "फेला परेका रोजगारी, रोजगारदाता, स्थान वा स्रोत खोज्नुहोस्",
    clear: "फिल्टर हटाउनुहोस्",
    noResults: "यी फिल्टरसँग मिल्ने अभिलेख भेटिएन।",
  },
} as const;

const workspaces: Workspace[] = ["employment", "vacancies", "research"];
const vacancyViews: VacancyView[] = ["jobs", "geography", "timeline", "sources"];

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

function locationState(): { workspace: Workspace; vacancyView: VacancyView } {
  if (typeof window === "undefined") return { workspace: "employment", vacancyView: "jobs" };
  const [workspacePart, vacancyPart] = window.location.hash.replace(/^#/, "").split("/");
  const workspace = workspaces.includes(workspacePart as Workspace) ? (workspacePart as Workspace) : "employment";
  const vacancyView = vacancyViews.includes(vacancyPart as VacancyView) ? (vacancyPart as VacancyView) : "jobs";
  return { workspace, vacancyView };
}

function workspaceHash(workspace: Workspace, vacancyView: VacancyView) {
  return workspace === "vacancies" ? `#vacancies/${vacancyView}` : `#${workspace}`;
}

export function AtlasDashboard() {
  const rootRef = useRef<HTMLElement>(null);
  const workspaceViewRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [locale, setLocale] = useState<Locale>("en");
  const [workspace, setWorkspace] = useState<Workspace>("employment");
  const [vacancyView, setVacancyView] = useState<VacancyView>("jobs");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [provinceFilter, setProvinceFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [sort, setSort] = useState<SortMode>("relevance");
  const [page, setPage] = useState(1);
  const [selectedJob, setSelectedJob] = useState<JobRecord | null>(null);
  const [focusSearchRequest, setFocusSearchRequest] = useState(0);
  const t = copy[locale];

  const navigateWorkspace = (next: Workspace, nextVacancyView = vacancyView, replace = false) => {
    setWorkspace(next);
    if (next === "vacancies") setVacancyView(nextVacancyView);
    if (typeof window !== "undefined") {
      const url = workspaceHash(next, nextVacancyView);
      if (replace) window.history.replaceState(null, "", url);
      else window.history.pushState(null, "", url);
    }
  };

  const navigateVacancyView = (next: VacancyView, replace = false) => {
    setWorkspace("vacancies");
    setVacancyView(next);
    if (typeof window !== "undefined") {
      const url = workspaceHash("vacancies", next);
      if (replace) window.history.replaceState(null, "", url);
      else window.history.pushState(null, "", url);
    }
  };

  useEffect(() => {
    const initial = locationState();
    setWorkspace(initial.workspace);
    setVacancyView(initial.vacancyView);
    if (!window.location.hash) window.history.replaceState(null, "", workspaceHash(initial.workspace, initial.vacancyView));

    const onPopState = () => {
      const next = locationState();
      setWorkspace(next.workspace);
      setVacancyView(next.vacancyView);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        navigateWorkspace("vacancies", "jobs");
        setFocusSearchRequest((value) => value + 1);
      }
      if (event.key === "Escape" && selectedJob) setSelectedJob(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedJob, vacancyView]);

  useEffect(() => {
    if (!focusSearchRequest || workspace !== "vacancies" || vacancyView !== "jobs") return;
    window.setTimeout(() => searchRef.current?.focus(), 0);
  }, [focusSearchRequest, workspace, vacancyView]);

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter, provinceFilter, sourceFilter, sort]);

  useEffect(() => {
    const view = workspaceViewRef.current;
    if (!view || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const tween = gsap.fromTo(
      view,
      { autoAlpha: 0.45, y: 8 },
      { autoAlpha: 1, y: 0, duration: 0.22, ease: "power2.out", overwrite: "auto", clearProps: "transform,opacity" },
    );
    return () => {
      tween.kill();
    };
  }, [workspace, vacancyView]);

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
    const result = jobRecords.filter((record) => {
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
  }, [query, statusFilter, provinceFilter, sourceFilter, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visibleJobs = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || workspace !== "vacancies" || vacancyView !== "jobs") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rows = root.querySelectorAll(".jobs-table-row");
    const tween = gsap.fromTo(
      rows,
      { autoAlpha: 0.6, y: 4 },
      { autoAlpha: 1, y: 0, duration: 0.18, stagger: 0.015, ease: "power2.out", overwrite: "auto" },
    );
    return () => {
      tween.kill();
    };
  }, [visibleJobs, workspace, vacancyView]);

  useEffect(() => {
    if (!selectedJob || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const detail = rootRef.current?.querySelector(".job-inspector-inner");
    if (!detail) return;
    const tween = gsap.fromTo(detail, { autoAlpha: 0, x: 8 }, { autoAlpha: 1, x: 0, duration: 0.2, ease: "power2.out" });
    return () => {
      tween.kill();
    };
  }, [selectedJob]);

  const embeddedKnownOpenings = jobRecords.reduce((sum, record) => sum + (record.openings ?? 0), 0);
  const embeddedKnownOpeningRecords = jobRecords.filter((record) => record.openings !== null).length;

  const geography = useMemo(() => {
    const counts = new Map<string, number>();
    let unknown = 0;
    jobRecords.forEach((record) => {
      if (!record.province) {
        unknown += 1;
        return;
      }
      const key = record.province.includes("/") ? "Multi-province" : record.province;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return { rows: [...counts.entries()].sort((a, b) => b[1] - a[1]), unknown };
  }, []);

  const history = useMemo(() => {
    const counts = new Map<number, number>();
    let unknown = 0;
    jobRecords.forEach((record) => {
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
  }, []);

  const sourceStats = useMemo(() => {
    const map = new Map<string, { count: number; verified: number; urls: Set<string> }>();
    jobRecords.forEach((record) => {
      const current = map.get(record.source) ?? { count: 0, verified: 0, urls: new Set<string>() };
      current.count += 1;
      if (/verified|high/i.test(record.verification)) current.verified += 1;
      current.urls.add(record.canonicalUrl);
      map.set(record.source, current);
    });
    return [...map.entries()]
      .map(([source, value]) => ({ source, ...value, urlCount: value.urls.size }))
      .sort((a, b) => b.count - a.count);
  }, []);

  const coverage = {
    provinceKnown: jobRecords.filter((record) => record.province).length,
    publicationKnown: jobRecords.filter((record) => record.published).length,
    payKnown: jobRecords.filter((record) => record.salary).length,
    openingsKnown: jobRecords.filter((record) => record.openings !== null).length,
  };

  const handleWorkspaceTabKey = (event: ReactKeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const delta = event.key === "ArrowRight" ? 1 : -1;
    const nextIndex = (index + delta + workspaces.length) % workspaces.length;
    const next = workspaces[nextIndex];
    navigateWorkspace(next, vacancyView);
    rootRef.current?.querySelector<HTMLButtonElement>(`[data-workspace-tab="${next}"]`)?.focus();
  };

  const handleVacancyTabKey = (event: ReactKeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const delta = event.key === "ArrowRight" ? 1 : -1;
    const nextIndex = (index + delta + vacancyViews.length) % vacancyViews.length;
    const next = vacancyViews[nextIndex];
    navigateVacancyView(next);
    rootRef.current?.querySelector<HTMLButtonElement>(`[data-vacancy-tab="${next}"]`)?.focus();
  };

  const showJobsForProvince = (province: string) => {
    setProvinceFilter(province === "Multi-province" ? "All" : province);
    navigateVacancyView("jobs");
  };

  const showJobsForYear = (year: number) => {
    setQuery(String(year));
    navigateVacancyView("jobs");
  };

  const showJobsForSource = (source: string) => {
    setSourceFilter(source);
    navigateVacancyView("jobs");
  };

  return (
    <main ref={rootRef} className="atlas-page simplified-atlas">
      <a className="skip-link" href="#workspace-content">Skip to workspace content</a>

      <div className="atlas-wrapper simplified-wrapper">
        <header className="workspace-header">
          <div className="workspace-brand">
            <a href="#employment" onClick={(event: ReactMouseEvent<HTMLAnchorElement>) => { event.preventDefault(); navigateWorkspace("employment"); }}>
              <strong>{t.title}</strong>
              <span>{t.subtitle}</span>
            </a>
          </div>

          <nav className="workspace-tabs" role="tablist" aria-label="Main workspace">
            {workspaces.map((item, index) => (
              <button
                key={item}
                type="button"
                role="tab"
                data-workspace-tab={item}
                aria-selected={workspace === item}
                aria-controls="workspace-content"
                tabIndex={workspace === item ? 0 : -1}
                onClick={() => navigateWorkspace(item)}
                onKeyDown={(event: ReactKeyboardEvent<HTMLButtonElement>) => handleWorkspaceTabKey(event, index)}
              >
                {t[item]}
              </button>
            ))}
          </nav>

          <div className="workspace-actions">
            <a className="quiet-link" href="https://github.com/Nischhalsubba/Nepal-Work-Atlas" target="_blank" rel="noreferrer">GitHub</a>
            <button className="quiet-control" type="button" onClick={() => setLocale((current) => current === "en" ? "ne" : "en")}>{locale === "en" ? "EN / ने" : "ने / EN"}</button>
          </div>
        </header>

        <div
          id="workspace-content"
          ref={workspaceViewRef}
          key={`${workspace}-${workspace === "vacancies" ? vacancyView : "root"}`}
          className={`workspace-view workspace-${workspace}`}
          role="tabpanel"
          tabIndex={-1}
        >
          {workspace === "employment" && <NationalEmploymentAtlas evidenceMode={false} />}

          {workspace === "vacancies" && (
            <>
              <section className="workspace-intro">
                <div>
                  <h1>{t.vacancyTitle}</h1>
                  <p>{t.vacancyIntro}</p>
                </div>
                <div className="workspace-context">Research checkpoint {researchCheckpoint.asOf}</div>
              </section>

              <section className="workspace-metrics" aria-label="Recovered vacancy checkpoint">
                <div><span>Recovered position records</span><strong>{researchCheckpoint.canonicalPositions.toLocaleString("en-US")}</strong><small>research workspace</small></div>
                <div><span>Recovered known openings</span><strong>{researchCheckpoint.knownOpenings.toLocaleString("en-US")}</strong><small>explicit counts only</small></div>
                <div><span>Interactive records</span><strong>{embeddedCorpusMeta.embeddedRecords.toLocaleString("en-US")}</strong><small>embedded audited subset</small></div>
              </section>

              <nav className="vacancy-subnav" role="tablist" aria-label="Vacancy views">
                {vacancyViews.map((item, index) => (
                  <button
                    key={item}
                    type="button"
                    role="tab"
                    data-vacancy-tab={item}
                    aria-selected={vacancyView === item}
                    aria-controls="vacancy-panel"
                    tabIndex={vacancyView === item ? 0 : -1}
                    onClick={() => navigateVacancyView(item)}
                    onKeyDown={(event: ReactKeyboardEvent<HTMLButtonElement>) => handleVacancyTabKey(event, index)}
                  >
                    {t[item]}
                  </button>
                ))}
              </nav>

              <div id="vacancy-panel" className="vacancy-panel" role="tabpanel">
                {vacancyView === "jobs" && (
                  <section className="vacancy-jobs" aria-labelledby="jobs-title">
                    <h2 id="jobs-title" className="sr-only">Recovered job records</h2>
                    <div className="vacancy-search-row">
                      <label className="vacancy-search">
                        <span className="sr-only">{t.search}</span>
                        <input
                          ref={searchRef}
                          value={query}
                          onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)}
                          placeholder={t.search}
                        />
                        <kbd>Cmd/Ctrl K</kbd>
                      </label>
                      <span className="count-label">{filtered.length} matches</span>
                    </div>

                    <div className="filter-row compact-filters" aria-label="Job filters">
                      <label><span>Status</span><select value={statusFilter} onChange={(event: ChangeEvent<HTMLSelectElement>) => setStatusFilter(event.target.value)}><option>All</option>{statuses.map((value) => <option key={value}>{value}</option>)}</select></label>
                      <label><span>Province</span><select value={provinceFilter} onChange={(event: ChangeEvent<HTMLSelectElement>) => setProvinceFilter(event.target.value)}><option>All</option>{provinces.map((value) => <option key={value}>{value}</option>)}</select></label>
                      <label><span>Source</span><select value={sourceFilter} onChange={(event: ChangeEvent<HTMLSelectElement>) => setSourceFilter(event.target.value)}><option>All</option>{sources.map((value) => <option key={value}>{value}</option>)}</select></label>
                      <label><span>Sort</span><select value={sort} onChange={(event: ChangeEvent<HTMLSelectElement>) => setSort(event.target.value as SortMode)}><option value="relevance">Source order</option><option value="latest">Latest known date</option><option value="oldest">Oldest known date</option><option value="openings">Opening count</option></select></label>
                      <button className="toolbar-button filter-clear" type="button" onClick={() => { setQuery(""); setStatusFilter("All"); setProvinceFilter("All"); setSourceFilter("All"); setSort("relevance"); }}>{t.clear}</button>
                    </div>

                    <div className="jobs-layout simplified-jobs-layout">
                      <div className="jobs-table" role="table" aria-label="Recovered job records">
                        <div className="jobs-table-head" role="row"><span>Role</span><span>Employer</span><span>Location</span><span>Source</span><span>Status</span><span>Openings</span><span>Date</span></div>
                        {visibleJobs.length === 0 ? <div className="empty-state">{t.noResults}</div> : visibleJobs.map((record) => (
                          <button key={record.id} className={`jobs-table-row ${selectedJob?.id === record.id ? "selected" : ""}`} type="button" onClick={() => setSelectedJob(record)}>
                            <span className="role-cell"><strong>{record.title}</strong><small>{sectorLabels[classifySector(record)]}</small></span>
                            <span>{record.employer ?? "Unknown"}</span>
                            <span>{locationLabel(record)}</span>
                            <span>{record.source}</span>
                            <span>{normalizeStatus(record.status)}</span>
                            <span className="number-cell">{record.openings ?? "-"}</span>
                            <span className="number-cell">{record.published ? formatDate(record.published) : record.deadline ? formatDate(record.deadline) : "-"}</span>
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
                            <div className="canonical-source"><span>Canonical source</span><strong>{safeHost(selectedJob.canonicalUrl)}</strong><a href={selectedJob.canonicalUrl} target="_blank" rel="noreferrer">Open record</a></div>
                            {selectedJob.evidenceUrl && selectedJob.evidenceUrl !== selectedJob.canonicalUrl && <a className="secondary-evidence" href={selectedJob.evidenceUrl} target="_blank" rel="noreferrer">Supporting evidence</a>}
                            <div className="inspector-evidence compact-evidence"><span>Verification <b>{selectedJob.verification}</b></span><span>Confidence <b>{Math.round(selectedJob.confidence * 100)}%</b></span><span>Dataset <b>{selectedJob.dataset}</b></span></div>
                          </div>
                        ) : <div className="inspector-placeholder"><span>Job inspector</span><strong>Select a recovered record</strong><p>Source, dates, known fields, and provenance appear here.</p></div>}
                      </aside>
                    </div>

                    <div className="vacancy-boundary-note">
                      <strong>{embeddedCorpusMeta.embeddedRecords} interactive records</strong>
                      <span>{embeddedKnownOpenings.toLocaleString("en-US")} explicitly represented openings across {embeddedKnownOpeningRecords} records with known counts. This interactive subset is not the full {researchCheckpoint.canonicalPositions}-record research workspace and is not a national vacancy census.</span>
                    </div>
                  </section>
                )}

                {vacancyView === "geography" && (
                  <section className="flat-section vacancy-analysis-section">
                    <div className="flat-heading"><div><div className="eyebrow">Known-place evidence</div><h2>Recovered records by province</h2><p>Only records with explicit province evidence are counted. Unknown geography remains visible.</p></div><span className="count-label">{jobRecords.length - geography.unknown} known / {geography.unknown} unknown</span></div>
                    <div className="bar-table">
                      {geography.rows.length ? geography.rows.map(([province, count]) => {
                        const max = Math.max(1, ...geography.rows.map(([, value]) => value));
                        return <button key={province} type="button" className="bar-table-row" onClick={() => showJobsForProvince(province)}><span>{province}</span><div className="thin-track"><i style={{ transform: `scaleX(${count / max})` }} /></div><strong>{count}</strong></button>;
                      }) : <div className="empty-state">No province evidence in the embedded subset.</div>}
                      <div className="bar-table-row unknown-row"><span>Unknown / not recovered</span><div className="thin-track"><i style={{ transform: `scaleX(${jobRecords.length ? geography.unknown / jobRecords.length : 0})` }} /></div><strong>{geography.unknown}</strong></div>
                    </div>
                  </section>
                )}

                {vacancyView === "timeline" && (
                  <section className="flat-section vacancy-analysis-section">
                    <div className="flat-heading"><div><div className="eyebrow">Recovered publication chronology</div><h2>Recovered publication timeline</h2><p>Only explicit publication dates are plotted. Missing years are coverage gaps, not zero hiring.</p></div><span className="count-label">{history.rows.reduce((sum, [, value]) => sum + value, 0)} dated / {history.unknown} unknown</span></div>
                    <div className="timeline-chart" role="img" aria-label="Recovered records by known publication year">
                      {history.rows.map(([year, count]) => {
                        const max = Math.max(1, ...history.rows.map(([, value]) => value));
                        return <button className="timeline-column" key={year} type="button" onClick={() => showJobsForYear(year)} title={`${year}: ${count} recovered records`}><span>{count}</span><i style={{ transform: `scaleY(${count / max})` }} /><small>{year}</small></button>;
                      })}
                    </div>
                    <div className="unknown-line"><span>Publication date unknown in the embedded subset</span><strong>{history.unknown}</strong></div>
                  </section>
                )}

                {vacancyView === "sources" && (
                  <section className="flat-section vacancy-analysis-section">
                    <div className="flat-heading"><div><div className="eyebrow">Provenance</div><h2>Recovered sources</h2><p>Source counts describe corpus coverage, not publisher market share.</p></div><span className="count-label">{sourceStats.length} sources in the embedded subset</span></div>
                    <div className="source-table">
                      <div className="source-table-head"><span>Source</span><span>Records</span><span>URLs</span><span>Verified evidence</span></div>
                      {sourceStats.map((row) => <button className="source-table-row" type="button" key={row.source} onClick={() => showJobsForSource(row.source)}><strong>{row.source}</strong><span>{row.count}</span><span>{row.urlCount}</span><span>{row.verified}/{row.count}</span></button>)}
                    </div>

                    <div className="field-coverage simplified-field-coverage">
                      <div><div className="eyebrow">Embedded subset completeness</div><h3>Field coverage</h3><p>Missing fields remain unknown rather than being converted to zero.</p></div>
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
                )}
              </div>
            </>
          )}

          {workspace === "research" && (
            <>
              <section className="workspace-intro research-intro">
                <div><h1>{t.researchTitle}</h1><p>{t.researchIntro}</p></div>
                <div className="workspace-context">Run 05 / evidence expansion</div>
              </section>

              <MarketEvidence locale={locale} evidenceMode />

              <details className="research-methods">
                <summary>Methodology and coverage boundary</summary>
                <div>
                  <p><strong>Employment stock</strong> comes from official Nepal population and labor evidence. <strong>Vacancy demand</strong> comes from recovered advertisements and explicit opening counts. They are different measures.</p>
                  <p>The historical research target is 2000-2026, but the earliest recovered publication currently stored is {researchCheckpoint.recoveredFrom}. Missing years and fields are coverage gaps, not zero hiring.</p>
                  <p>No complete public national cumulative vacancy series has been identified. The Atlas therefore does not add portal snapshots, government recruitment totals, newspaper advertisements, or external market benchmarks into one invented national total.</p>
                </div>
              </details>
            </>
          )}
        </div>

        <footer className="atlas-footer simplified-footer">
          <span>Nepal Work Atlas / evidence-first labor-market research</span>
          <span>Employment, recovered vacancies, and research benchmarks remain separate evidence classes.</span>
        </footer>
      </div>
    </main>
  );
}
