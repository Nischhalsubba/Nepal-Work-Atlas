"use client";

import {
  useDeferredValue,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import { AnimatedNumber } from "@/components/animated-number";
import { MarketScaleSummary } from "@/components/market-scale-summary";
import { NationalEmploymentAtlas } from "@/components/national-employment-atlas";
import { OpportunityLandscape } from "@/components/opportunity-landscape";
import { ResearchCoverageDashboard } from "@/components/research-coverage-dashboard";
import { embeddedCorpusMeta, jobRecords, type JobRecord } from "@/data/job-records";
import { marketEvidenceItems, marketEvidenceKindLabels, marketEvidenceMeta } from "@/data/market-evidence";
import { marketScaleMeta } from "@/data/market-scale-evidence";
import { researchCheckpoint } from "@/data/research-checkpoint";
import { buildAtlasHash, parseAtlasHash, type VacancyRoute, type WorkspaceRoute } from "@/lib/atlas-url-state";
import { formatDate, safeHost } from "@/lib/format";
import {
  classifySector,
  itSubsectorLabels,
  recordMatchesScope,
  sectorLabels,
  softwareTrackLabels,
  type AppliedScope,
  type ItSubsectorId,
  type SectorId,
  type SoftwareTrackId,
} from "@/lib/taxonomy";

gsap.registerPlugin(Flip);

type Locale = "en" | "ne";
type Workspace = WorkspaceRoute;
type VacancyView = VacancyRoute;
type SortMode = "latest" | "oldest" | "openings" | "title";
type SourceSort = "records" | "name";
type EvidenceFilter = "all" | "stated" | "unknown";

type JobFilters = {
  query: string;
  province: string;
  district: string;
  source: string;
  sector: SectorId | "All";
  workType: string;
  status: string;
  remote: string;
  pay: EvidenceFilter;
  openings: EvidenceFilter;
  fromYear: string;
  toYear: string;
  sort: SortMode;
};

type TabItem<T extends string> = { id: T; label: string };

const PAGE_SIZE = 12;
const DEFAULT_FILTERS: JobFilters = {
  query: "",
  province: "All",
  district: "All",
  source: "All",
  sector: "All",
  workType: "All",
  status: "All",
  remote: "All",
  pay: "all",
  openings: "all",
  fromYear: "",
  toYear: "",
  sort: "latest",
};
const sortModes: readonly SortMode[] = ["latest", "oldest", "openings", "title"];
const evidenceFilters: readonly EvidenceFilter[] = ["all", "stated", "unknown"];
const formatWhole = (value: number) => Math.round(value).toLocaleString("en-US");

const labels = {
  en: {
    title: "Nepal Work Atlas",
    subtitle: "labor-market intelligence",
    employment: "Employment",
    vacancies: "Jobs",
    research: "Research",
    jobs: "Jobs",
    geography: "Map",
    timeline: "History",
    sources: "Sources",
  },
  ne: {
    title: "\u0928\u0947\u092a\u093e\u0932 \u0935\u0930\u094d\u0915 \u090f\u091f\u0932\u0938",
    subtitle: "\u0936\u094d\u0930\u092e \u092c\u091c\u093e\u0930 \u0905\u0928\u0941\u0938\u0928\u094d\u0927\u093e\u0928",
    employment: "\u0930\u094b\u091c\u0917\u093e\u0930\u0940",
    vacancies: "\u0915\u093e\u092e",
    research: "\u0905\u0928\u0941\u0938\u0928\u094d\u0927\u093e\u0928",
    jobs: "\u0915\u093e\u092e",
    geography: "\u0928\u0915\u094d\u0938\u093e",
    timeline: "\u0907\u0924\u093f\u0939\u093e\u0938",
    sources: "\u0938\u094d\u0930\u094b\u0924",
  },
} as const;

function normalizeStatus(status: string) {
  if (/active/i.test(status)) return "Active";
  if (/future/i.test(status)) return "Future announced";
  if (/expired|historical/i.test(status)) return "Expired / historical";
  return "Unknown";
}

function normalizeRemote(remote: string | null) {
  if (!remote?.trim()) return "Not stated";
  if (/hybrid/i.test(remote)) return "Hybrid";
  if (/remote/i.test(remote)) return "Remote";
  if (/on.?site|onsite|office/i.test(remote)) return "On-site";
  return remote.trim();
}

function recordDate(record: JobRecord) {
  const raw = record.published ?? record.deadline;
  if (!raw) return 0;
  if (/^\d{4}$/.test(raw)) return Date.UTC(Number(raw), 0, 1);
  return Date.parse(`${raw}T00:00:00Z`) || Date.parse(raw) || 0;
}

function recordYear(record: JobRecord) {
  const raw = record.published ?? record.deadline;
  if (!raw) return null;
  const match = raw.match(/^(\d{4})/);
  return match ? Number(match[1]) : null;
}

function locationLabel(record: JobRecord) {
  return [record.localLevel, record.district, record.province].filter(Boolean).join(", ");
}

function searchText(record: JobRecord) {
  return [
    record.title,
    record.employer,
    record.source,
    record.province,
    record.district,
    record.localLevel,
    record.industry,
    record.published,
    record.deadline,
    record.remote,
    record.verification,
    record.dataset,
    record.workTypes.join(" "),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function validSector(value: string | null): SectorId | "All" {
  if (value && Object.prototype.hasOwnProperty.call(sectorLabels, value)) return value as SectorId;
  return "All";
}

function validSort(value: string | null): SortMode {
  return value && sortModes.includes(value as SortMode) ? value as SortMode : "latest";
}

function validEvidence(value: string | null): EvidenceFilter {
  return value && evidenceFilters.includes(value as EvidenceFilter) ? value as EvidenceFilter : "all";
}

function scopeFromParam(value: string | null): AppliedScope | null {
  if (!value) return null;
  const [kind, id] = value.split(":", 2);
  if (kind === "sector" && Object.prototype.hasOwnProperty.call(sectorLabels, id)) {
    return { kind: "sector", id, label: sectorLabels[id as SectorId] };
  }
  if (kind === "it-subsector" && Object.prototype.hasOwnProperty.call(itSubsectorLabels, id)) {
    return { kind: "it-subsector", id, label: itSubsectorLabels[id as ItSubsectorId] };
  }
  if (kind === "software-track" && Object.prototype.hasOwnProperty.call(softwareTrackLabels, id)) {
    return { kind: "software-track", id, label: softwareTrackLabels[id as SoftwareTrackId] };
  }
  return null;
}

function scopeToParam(scope: AppliedScope | null) {
  return scope ? `${scope.kind}:${scope.id}` : null;
}

function filtersFromParams(params: URLSearchParams): JobFilters {
  return {
    query: params.get("q") ?? "",
    province: params.get("province") ?? "All",
    district: params.get("district") ?? "All",
    source: params.get("source") ?? "All",
    sector: validSector(params.get("sector")),
    workType: params.get("type") ?? "All",
    status: params.get("status") ?? "All",
    remote: params.get("remote") ?? "All",
    pay: validEvidence(params.get("pay")),
    openings: validEvidence(params.get("openings")),
    fromYear: /^\d{4}$/.test(params.get("from") ?? "") ? params.get("from") ?? "" : "",
    toYear: /^\d{4}$/.test(params.get("to") ?? "") ? params.get("to") ?? "" : "",
    sort: validSort(params.get("sort")),
  };
}

function paramsFromState(filters: JobFilters, selectedJob: JobRecord | null, appliedScope: AppliedScope | null) {
  const params = new URLSearchParams();
  if (filters.query.trim()) params.set("q", filters.query.trim());
  if (filters.province !== "All") params.set("province", filters.province);
  if (filters.district !== "All") params.set("district", filters.district);
  if (filters.source !== "All") params.set("source", filters.source);
  if (filters.sector !== "All") params.set("sector", filters.sector);
  if (filters.workType !== "All") params.set("type", filters.workType);
  if (filters.status !== "All") params.set("status", filters.status);
  if (filters.remote !== "All") params.set("remote", filters.remote);
  if (filters.pay !== "all") params.set("pay", filters.pay);
  if (filters.openings !== "all") params.set("openings", filters.openings);
  if (filters.fromYear) params.set("from", filters.fromYear);
  if (filters.toYear) params.set("to", filters.toYear);
  if (filters.sort !== "latest") params.set("sort", filters.sort);
  if (selectedJob) params.set("job", selectedJob.id);
  const scope = scopeToParam(appliedScope);
  if (scope) params.set("scope", scope);
  return params;
}

function csvCell(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function evidenceGaps(record: JobRecord) {
  const gaps: string[] = [];
  if (record.openings === null) gaps.push("Opening count not stated in the recovered record.");
  if (!record.salary) gaps.push("Pay not stated.");
  if (!record.published) gaps.push("Publication date not recovered.");
  if (!record.deadline) gaps.push("Application deadline not recovered.");
  if (!record.district) gaps.push("District not stated; province evidence is available.");
  if (!record.localLevel) gaps.push("Local level not stated.");
  if (!record.remote) gaps.push("Remote/on-site mode not stated.");
  if (!record.evidenceUrl) gaps.push("No separate evidence URL is embedded beyond the canonical source.");
  return gaps;
}

function AnimatedTabs<T extends string>({
  items,
  active,
  onChange,
  ariaLabel,
  className = "animated-tabs",
}: {
  items: TabItem<T>[];
  active: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
}) {
  const rootRef = useRef<HTMLElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const indicator = indicatorRef.current;
    if (!root || !indicator) return;
    const activeButton = root.querySelector<HTMLButtonElement>(`button[data-tab-id="${active}"]`);
    if (!activeButton) return;

    const update = (animate: boolean) => {
      const rootRect = root.getBoundingClientRect();
      const buttonRect = activeButton.getBoundingClientRect();
      const x = buttonRect.left - rootRect.left + root.scrollLeft;
      gsap.to(indicator, {
        x,
        width: buttonRect.width,
        duration: animate ? 0.22 : 0,
        ease: "power2.inOut",
        overwrite: "auto",
      });
    };

    update(!window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const onResize = () => update(false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [active]);

  const onKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const currentIndex = items.findIndex((item) => item.id === active);
    let nextIndex = currentIndex;
    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % items.length;
    if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + items.length) % items.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = items.length - 1;
    onChange(items[nextIndex].id);
    window.setTimeout(() => rootRef.current?.querySelector<HTMLButtonElement>(`button[data-tab-id="${items[nextIndex].id}"]`)?.focus(), 0);
  };

  return (
    <nav ref={rootRef} className={className} aria-label={ariaLabel} onKeyDown={onKeyDown}>
      <span ref={indicatorRef} className="tab-indicator" aria-hidden="true" />
      {items.map((item) => (
        <button key={item.id} data-tab-id={item.id} type="button" aria-pressed={active === item.id} onClick={() => onChange(item.id)}>
          {item.label}
        </button>
      ))}
    </nav>
  );
}

export function AtlasDashboard() {
  const rootRef = useRef<HTMLElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const sourceListRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<SVGSVGElement>(null);
  const skipNextUrlWriteRef = useRef(true);
  const [locale, setLocale] = useState<Locale>("en");
  const [workspace, setWorkspace] = useState<Workspace>("employment");
  const [vacancyView, setVacancyView] = useState<VacancyView>("jobs");
  const [filters, setFilters] = useState<JobFilters>(DEFAULT_FILTERS);
  const [sourceSort, setSourceSort] = useState<SourceSort>("records");
  const [page, setPage] = useState(1);
  const [selectedJob, setSelectedJob] = useState<JobRecord | null>(null);
  const [appliedScope, setAppliedScope] = useState<AppliedScope | null>(null);
  const [expandedEvidence, setExpandedEvidence] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState("");
  const deferredQuery = useDeferredValue(filters.query);
  const t = labels[locale];

  const setFilter = <K extends keyof JobFilters>(key: K, value: JobFilters[K]) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  useEffect(() => {
    const syncFromHash = () => {
      const parsed = parseAtlasHash(window.location.hash);
      skipNextUrlWriteRef.current = true;
      setWorkspace(parsed.workspace);
      setVacancyView(parsed.vacancyView);
      setFilters(filtersFromParams(parsed.params));
      setAppliedScope(scopeFromParam(parsed.params.get("scope")));
      const jobId = parsed.params.get("job");
      setSelectedJob(jobId ? jobRecords.find((record) => record.id === jobId) ?? null : null);
      setPage(1);
    };
    syncFromHash();
    window.addEventListener("popstate", syncFromHash);
    window.addEventListener("hashchange", syncFromHash);
    return () => {
      window.removeEventListener("popstate", syncFromHash);
      window.removeEventListener("hashchange", syncFromHash);
    };
  }, []);

  useEffect(() => {
    if (skipNextUrlWriteRef.current) {
      skipNextUrlWriteRef.current = false;
      return;
    }
    const params = paramsFromState(filters, selectedJob, appliedScope);
    window.history.replaceState(null, "", buildAtlasHash(workspace, vacancyView, params));
  }, [appliedScope, filters, selectedJob, vacancyView, workspace]);

  const navigate = (nextWorkspace: Workspace, nextVacancyView: VacancyView = vacancyView) => {
    const params = paramsFromState(filters, selectedJob, appliedScope);
    window.history.pushState(null, "", buildAtlasHash(nextWorkspace, nextVacancyView, params));
    setWorkspace(nextWorkspace);
    if (nextWorkspace === "vacancies") setVacancyView(nextVacancyView);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        navigate("vacancies", "jobs");
        window.setTimeout(() => searchRef.current?.focus(), 0);
      }
      if (event.key === "Escape") setSelectedJob(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const context = gsap.context(() => {
      if (reducedMotion) {
        gsap.set(view.children, { clearProps: "all" });
        return;
      }
      gsap.fromTo(view.children, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.24, stagger: 0.025, ease: "power2.out", overwrite: "auto" });
    }, view);
    return () => context.revert();
  }, [workspace, vacancyView]);

  const scopedRecords = useMemo(() => jobRecords.filter((record) => recordMatchesScope(record, appliedScope)), [appliedScope]);
  const provinces = useMemo(() => [...new Set(jobRecords.map((record) => record.province))].sort(), []);
  const sources = useMemo(() => [...new Set(jobRecords.map((record) => record.source))].sort(), []);
  const workTypes = useMemo(() => [...new Set(jobRecords.flatMap((record) => record.workTypes).filter(Boolean))].sort(), []);
  const remoteModes = useMemo(() => [...new Set(jobRecords.map((record) => normalizeRemote(record.remote)))].sort(), []);
  const years = useMemo(() => [...new Set(jobRecords.map(recordYear).filter((year): year is number => year !== null))].sort((a, b) => a - b), []);
  const districts = useMemo(() => {
    const rows = filters.province === "All" ? scopedRecords : scopedRecords.filter((record) => record.province === filters.province);
    return [...new Set(rows.map((record) => record.district).filter((value): value is string => Boolean(value)))].sort();
  }, [filters.province, scopedRecords]);

  useEffect(() => {
    if (filters.district !== "All" && !districts.includes(filters.district)) setFilter("district", "All");
  }, [districts, filters.district]);

  const filtered = useMemo(() => {
    const needle = deferredQuery.trim().toLowerCase();
    const fromYear = filters.fromYear ? Number(filters.fromYear) : null;
    const toYear = filters.toYear ? Number(filters.toYear) : null;
    const rows = scopedRecords.filter((record) => {
      if (needle && !searchText(record).includes(needle)) return false;
      if (filters.province !== "All" && record.province !== filters.province) return false;
      if (filters.district !== "All" && record.district !== filters.district) return false;
      if (filters.source !== "All" && record.source !== filters.source) return false;
      if (filters.sector !== "All" && classifySector(record) !== filters.sector) return false;
      if (filters.workType !== "All" && !record.workTypes.includes(filters.workType)) return false;
      if (filters.status !== "All" && normalizeStatus(record.status) !== filters.status) return false;
      if (filters.remote !== "All" && normalizeRemote(record.remote) !== filters.remote) return false;
      if (filters.pay === "stated" && !record.salary) return false;
      if (filters.pay === "unknown" && record.salary) return false;
      if (filters.openings === "stated" && record.openings === null) return false;
      if (filters.openings === "unknown" && record.openings !== null) return false;
      const year = recordYear(record);
      if (fromYear !== null && (year === null || year < fromYear)) return false;
      if (toYear !== null && (year === null || year > toYear)) return false;
      return true;
    });
    return [...rows].sort((a, b) => {
      if (filters.sort === "oldest") return recordDate(a) - recordDate(b);
      if (filters.sort === "openings") return (b.openings ?? -1) - (a.openings ?? -1);
      if (filters.sort === "title") return a.title.localeCompare(b.title);
      return recordDate(b) - recordDate(a);
    });
  }, [deferredQuery, filters, scopedRecords]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visibleJobs = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const searchPending = deferredQuery !== filters.query;
  const summary = useMemo(() => {
    const knownOpeningRows = filtered.filter((record) => record.openings !== null);
    return {
      knownOpenings: knownOpeningRows.length ? knownOpeningRows.reduce((sum, record) => sum + (record.openings ?? 0), 0) : null,
      payRecords: filtered.filter((record) => Boolean(record.salary)).length,
      activeRecords: filtered.filter((record) => normalizeStatus(record.status) === "Active").length,
      provinces: new Set(filtered.map((record) => record.province)).size,
      sources: new Set(filtered.map((record) => record.source)).size,
    };
  }, [filtered]);

  useEffect(() => setPage(1), [appliedScope, filters]);
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    if (workspace !== "vacancies" || vacancyView !== "jobs") return;
    const root = rootRef.current;
    if (!root) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;
    const rows = root.querySelectorAll(".jobs-table-row");
    const tween = gsap.fromTo(rows, { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.22, stagger: 0.022, ease: "power2.out", overwrite: "auto" });
    return () => {
      tween.kill();
    };
  }, [visibleJobs, vacancyView, workspace]);

  useEffect(() => {
    if (!selectedJob || workspace !== "vacancies" || vacancyView !== "jobs") return;
    const inspector = rootRef.current?.querySelector(".job-inspector-inner");
    if (!inspector || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const tween = gsap.fromTo(inspector, { autoAlpha: 0, x: 16 }, { autoAlpha: 1, x: 0, duration: 0.26, ease: "power2.out", overwrite: "auto" });
    return () => {
      tween.kill();
    };
  }, [selectedJob, vacancyView, workspace]);

  const geography = useMemo(() => {
    const counts = new Map<string, number>();
    scopedRecords.forEach((record) => counts.set(record.province, (counts.get(record.province) ?? 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [scopedRecords]);

  useEffect(() => {
    if (workspace !== "vacancies" || vacancyView !== "geography") return;
    const root = rootRef.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const context = gsap.context(() => {
      gsap.from(".province-card", { autoAlpha: 0, y: 8, duration: 0.24, stagger: 0.025, ease: "power2.out" });
      gsap.from(".province-bar-fill", { scaleX: 0, transformOrigin: "left center", duration: 0.28, stagger: 0.03, ease: "power2.out" });
    }, root);
    return () => context.revert();
  }, [geography, vacancyView, workspace]);

  const timeline = useMemo(() => {
    const counts = new Map<number, number>();
    let unknown = 0;
    scopedRecords.forEach((record) => {
      const year = recordYear(record);
      if (year === null) {
        unknown += 1;
        return;
      }
      counts.set(year, (counts.get(year) ?? 0) + 1);
    });
    return { rows: [...counts.entries()].sort((a, b) => a[0] - b[0]), unknown };
  }, [scopedRecords]);

  const historyChart = useMemo(() => {
    const width = 900;
    const height = 250;
    const padX = 44;
    const padY = 28;
    const rows = timeline.rows;
    if (!rows.length) return { width, height, points: [] as { year: number; count: number; x: number; y: number }[], path: "", max: 0 };
    const max = Math.max(1, ...rows.map(([, count]) => count));
    const points = rows.map(([year, count], index) => {
      const x = rows.length === 1 ? width / 2 : padX + (index / (rows.length - 1)) * (width - padX * 2);
      const y = height - padY - (count / max) * (height - padY * 2);
      return { year, count, x, y };
    });
    return { width, height, points, path: points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`).join(" "), max };
  }, [timeline]);

  useEffect(() => {
    if (workspace !== "vacancies" || vacancyView !== "timeline") return;
    const svg = historyRef.current;
    if (!svg || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const path = svg.querySelector<SVGPathElement>(".history-line");
    const points = svg.querySelectorAll(".history-point");
    if (!path) return;
    const length = path.getTotalLength();
    const context = gsap.context(() => {
      gsap.fromTo(path, { strokeDasharray: length, strokeDashoffset: length }, { strokeDashoffset: 0, duration: 0.38, ease: "power2.out" });
      gsap.from(points, { autoAlpha: 0, y: 5, duration: 0.2, stagger: 0.025, ease: "power2.out", delay: 0.12 });
    }, svg);
    return () => context.revert();
  }, [historyChart.path, vacancyView, workspace]);

  const sourceStats = useMemo(() => {
    const map = new Map<string, { records: number; urls: Set<string> }>();
    scopedRecords.forEach((record) => {
      const row = map.get(record.source) ?? { records: 0, urls: new Set<string>() };
      row.records += 1;
      row.urls.add(record.canonicalUrl);
      map.set(record.source, row);
    });
    const rows = [...map.entries()].map(([name, value]) => ({ name, records: value.records, urls: value.urls.size }));
    return rows.sort((a, b) => sourceSort === "name" ? a.name.localeCompare(b.name) : b.records - a.records || a.name.localeCompare(b.name));
  }, [scopedRecords, sourceSort]);

  useEffect(() => {
    if (workspace !== "vacancies" || vacancyView !== "sources") return;
    const root = sourceListRef.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const fills = root.querySelectorAll(".source-bar-fill");
    const context = gsap.context(() => {
      gsap.from(fills, { scaleX: 0, transformOrigin: "left center", duration: 0.3, stagger: 0.025, ease: "power2.out" });
    }, root);
    return () => context.revert();
  }, [sourceStats.length, vacancyView, workspace]);

  const changeSourceSort = (next: SourceSort) => {
    if (next === sourceSort) return;
    const root = sourceListRef.current;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const state = root && !reducedMotion ? Flip.getState(root.querySelectorAll(".source-row")) : null;
    setSourceSort(next);
    if (state) requestAnimationFrame(() => Flip.from(state, { duration: 0.28, ease: "power2.inOut", absolute: false, stagger: 0.012 }));
  };

  useEffect(() => {
    if (workspace !== "research") return;
    const root = rootRef.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const context = gsap.context(() => {
      gsap.from(".research-evidence-row", { autoAlpha: 0, y: 6, duration: 0.22, stagger: 0.025, ease: "power2.out" });
    }, root);
    return () => context.revert();
  }, [workspace]);

  useLayoutEffect(() => {
    if (workspace !== "research") return;
    const root = rootRef.current;
    if (!root) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const details = root.querySelectorAll<HTMLElement>("[data-evidence-detail]");
    const context = gsap.context(() => {
      details.forEach((detail) => {
        const open = detail.dataset.evidenceDetail === expandedEvidence;
        if (reducedMotion) {
          gsap.set(detail, { height: open ? "auto" : 0, autoAlpha: open ? 1 : 0, y: 0 });
          return;
        }
        gsap.to(detail, {
          height: open ? "auto" : 0,
          autoAlpha: open ? 1 : 0,
          y: open ? 0 : -4,
          duration: 0.22,
          ease: open ? "power2.out" : "power1.in",
          overwrite: "auto",
        });
      });
    }, root);
    return () => context.revert();
  }, [expandedEvidence, workspace]);

  const copyUrl = async (job: JobRecord | null = selectedJob) => {
    const params = paramsFromState(filters, job, appliedScope);
    const href = `${window.location.origin}${window.location.pathname}${buildAtlasHash(workspace, vacancyView, params)}`;
    try {
      await navigator.clipboard.writeText(href);
      setCopyStatus(job ? "Record link copied" : "View link copied");
    } catch {
      setCopyStatus("Copy unavailable in this browser");
    }
    window.setTimeout(() => setCopyStatus(""), 2200);
  };

  const downloadCsv = () => {
    const headers = ["Title", "Employer", "Sector", "Province", "District", "Local level", "Status", "Openings", "Pay", "Work types", "Remote", "Published", "Deadline", "Source", "Canonical URL", "Evidence URL", "Verification", "Confidence"];
    const rows = filtered.map((record) => [
      record.title,
      record.employer,
      sectorLabels[classifySector(record)],
      record.province,
      record.district,
      record.localLevel,
      normalizeStatus(record.status),
      record.openings,
      record.salary,
      record.workTypes.join(" | "),
      normalizeRemote(record.remote),
      record.published,
      record.deadline,
      record.source,
      record.canonicalUrl,
      record.evidenceUrl,
      record.verification,
      Math.round(record.confidence * 100),
    ]);
    const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `nepal-work-atlas-jobs-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => setFilters(DEFAULT_FILTERS);
  const filterChips = [
    filters.query && { key: "query", label: `Search: ${filters.query}`, clear: () => setFilter("query", "") },
    filters.sector !== "All" && { key: "sector", label: `Sector: ${sectorLabels[filters.sector]}`, clear: () => setFilter("sector", "All") },
    filters.province !== "All" && { key: "province", label: `Province: ${filters.province}`, clear: () => setFilter("province", "All") },
    filters.district !== "All" && { key: "district", label: `District: ${filters.district}`, clear: () => setFilter("district", "All") },
    filters.status !== "All" && { key: "status", label: `Status: ${filters.status}`, clear: () => setFilter("status", "All") },
    filters.source !== "All" && { key: "source", label: `Source: ${filters.source}`, clear: () => setFilter("source", "All") },
    filters.workType !== "All" && { key: "type", label: `Type: ${filters.workType}`, clear: () => setFilter("workType", "All") },
    filters.remote !== "All" && { key: "remote", label: `Mode: ${filters.remote}`, clear: () => setFilter("remote", "All") },
    filters.pay !== "all" && { key: "pay", label: `Pay: ${filters.pay}`, clear: () => setFilter("pay", "all") },
    filters.openings !== "all" && { key: "openings", label: `Openings: ${filters.openings}`, clear: () => setFilter("openings", "all") },
    filters.fromYear && { key: "from", label: `From: ${filters.fromYear}`, clear: () => setFilter("fromYear", "") },
    filters.toYear && { key: "to", label: `To: ${filters.toYear}`, clear: () => setFilter("toYear", "") },
    filters.sort !== "latest" && { key: "sort", label: `Sort: ${filters.sort}`, clear: () => setFilter("sort", "latest") },
  ].filter(Boolean) as { key: string; label: string; clear: () => void }[];

  const workspaceTabs: TabItem<Workspace>[] = [
    { id: "employment", label: t.employment },
    { id: "vacancies", label: t.vacancies },
    { id: "research", label: t.research },
  ];
  const vacancyTabs: TabItem<VacancyView>[] = [
    { id: "jobs", label: t.jobs },
    { id: "geography", label: t.geography },
    { id: "timeline", label: t.timeline },
    { id: "sources", label: t.sources },
  ];

  return (
    <main ref={rootRef} className="atlas-page fresh-atlas">
      <a className="skip-link" href="#workspace-content">Skip to workspace content</a>
      <div className="atlas-shell">
        <header className="workspace-header">
          <button type="button" className="brand-button" onClick={() => navigate("employment")}>
            <strong>{t.title}</strong>
            <span>{t.subtitle}</span>
          </button>
          <AnimatedTabs items={workspaceTabs} active={workspace} onChange={(value) => navigate(value)} ariaLabel="Main workspace" className="animated-tabs workspace-tabs" />
          <div className="workspace-actions">
            <a href="https://github.com/Nischhalsubba/Nepal-Work-Atlas" target="_blank" rel="noreferrer">GitHub</a>
            <button type="button" onClick={() => setLocale((value) => value === "en" ? "ne" : "en")}>{locale === "en" ? "EN / NE" : "NE / EN"}</button>
          </div>
        </header>

        <div id="workspace-content" ref={viewRef} className={`workspace-view workspace-${workspace}`} tabIndex={-1}>
          {workspace === "employment" && <NationalEmploymentAtlas evidenceMode />}

          {workspace === "vacancies" && (
            <>
              <section className="workspace-hero">
                <div>
                  <span className="section-kicker">Nepal only</span>
                  <h1>Jobs in Nepal we could verify</h1>
                  <p>Every public row has an explicit Nepal province. Records without enough location evidence stay out of this domestic view instead of being guessed into Nepal.</p>
                </div>
                <div className="hero-source">Country NP<br />Location verified before display</div>
              </section>

              <MarketScaleSummary />

              <div className="surface-heading recovered-heading">
                <div><span className="section-kicker">Recovered research corpus</span><h2>What the Atlas has recovered so far</h2><p>These are archive and public-bundle counts, not estimates of every job that existed in Nepal.</p></div>
                <span>Canonical snapshot 20 Aug 2026</span>
              </div>

              <section className="metric-grid metric-grid-four" aria-label="Recovered jobs evidence summary">
                <article className="metric-card"><AnimatedNumber value={researchCheckpoint.canonicalPositions} className="metric-number" /><strong>Recovered research positions</strong><span>{researchCheckpoint.distinctPostingUrls.toLocaleString("en-US")} distinct canonical URLs</span></article>
                <article className="metric-card"><AnimatedNumber value={researchCheckpoint.knownOpenings} className="metric-number" /><strong>Openings with a stated number</strong><span>Explicit counts in the canonical research archive</span></article>
                <article className="metric-card"><AnimatedNumber value={marketScaleMeta.verifiedProvinceArchiveRecords} className="metric-number" /><strong>Province-verified archive records</strong><span>Exact Nepal province plus verified evidence</span></article>
                <article className="metric-card"><AnimatedNumber value={scopedRecords.length} className="metric-number" /><strong>Public records in this view</strong><span>{appliedScope ? `Filtered to ${appliedScope.label}` : "All province-verified public records"}</span></article>
              </section>

              <OpportunityLandscape records={jobRecords} appliedScope={appliedScope} onApplyScope={setAppliedScope} />

              {appliedScope && <div className="applied-scope" role="status"><span>Dashboard filter</span><strong>{appliedScope.label}</strong><button type="button" onClick={() => setAppliedScope(null)}>Clear</button></div>}

              <AnimatedTabs items={vacancyTabs} active={vacancyView} onChange={(value) => navigate("vacancies", value)} ariaLabel="Jobs views" className="animated-tabs vacancy-tabs" />

              <div className="vacancy-panel">
                {vacancyView === "jobs" && (
                  <section className="jobs-view">
                    <div className="data-surface filter-surface">
                      <div className="jobs-filter-primary">
                        <label className="search-box">
                          <span>Search jobs</span>
                          <div><input ref={searchRef} value={filters.query} onChange={(event: ChangeEvent<HTMLInputElement>) => setFilter("query", event.target.value)} placeholder="Role, employer, place, source or year" /><kbd>Cmd/Ctrl K</kbd></div>
                        </label>
                        <label><span>Sector</span><select value={filters.sector} onChange={(event) => setFilter("sector", event.target.value as SectorId | "All")}><option>All</option>{Object.entries(sectorLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
                        <label><span>Province</span><select value={filters.province} onChange={(event) => setFilter("province", event.target.value)}><option>All</option>{provinces.map((value) => <option key={value}>{value}</option>)}</select></label>
                        <label><span>District</span><select value={filters.district} onChange={(event) => setFilter("district", event.target.value)}><option>All</option>{districts.map((value) => <option key={value}>{value}</option>)}</select></label>
                        <label><span>Status</span><select value={filters.status} onChange={(event) => setFilter("status", event.target.value)}><option>All</option><option>Active</option><option>Future announced</option><option>Expired / historical</option><option>Unknown</option></select></label>
                      </div>

                      <details className="jobs-filter-advanced">
                        <summary>More filters and sorting</summary>
                        <div className="jobs-filter-advanced-grid">
                          <label><span>Source</span><select value={filters.source} onChange={(event) => setFilter("source", event.target.value)}><option>All</option>{sources.map((value) => <option key={value}>{value}</option>)}</select></label>
                          <label><span>Work type</span><select value={filters.workType} onChange={(event) => setFilter("workType", event.target.value)}><option>All</option>{workTypes.map((value) => <option key={value}>{value}</option>)}</select></label>
                          <label><span>Work mode</span><select value={filters.remote} onChange={(event) => setFilter("remote", event.target.value)}><option>All</option>{remoteModes.map((value) => <option key={value}>{value}</option>)}</select></label>
                          <label><span>Pay evidence</span><select value={filters.pay} onChange={(event) => setFilter("pay", event.target.value as EvidenceFilter)}><option value="all">All</option><option value="stated">Pay stated</option><option value="unknown">Pay unknown</option></select></label>
                          <label><span>Opening evidence</span><select value={filters.openings} onChange={(event) => setFilter("openings", event.target.value as EvidenceFilter)}><option value="all">All</option><option value="stated">Count stated</option><option value="unknown">Count unknown</option></select></label>
                          <label><span>From year</span><select value={filters.fromYear} onChange={(event) => setFilter("fromYear", event.target.value)}><option value="">Any</option>{years.map((value) => <option key={value}>{value}</option>)}</select></label>
                          <label><span>To year</span><select value={filters.toYear} onChange={(event) => setFilter("toYear", event.target.value)}><option value="">Any</option>{years.map((value) => <option key={value}>{value}</option>)}</select></label>
                          <label><span>Sort</span><select value={filters.sort} onChange={(event) => setFilter("sort", event.target.value as SortMode)}><option value="latest">Latest known date</option><option value="oldest">Oldest known date</option><option value="openings">Stated openings</option><option value="title">Role title</option></select></label>
                        </div>
                      </details>

                      <div className="jobs-filter-actions">
                        <div className="result-count"><AnimatedNumber value={filtered.length} /> <span>{searchPending ? "updating matches" : "matches"}</span></div>
                        <button className="secondary-button" type="button" onClick={() => copyUrl(null)}>Copy view link</button>
                        <button className="secondary-button" type="button" onClick={downloadCsv} disabled={filtered.length === 0}>Download CSV</button>
                        <button className="secondary-button filter-clear" type="button" onClick={clearFilters} disabled={filterChips.length === 0}>Clear filters</button>
                        <span className="copy-status" aria-live="polite">{copyStatus}</span>
                      </div>

                      {filterChips.length > 0 && <div className="filter-chip-row" aria-label="Active filters"><span>Active filters</span>{filterChips.map((chip) => <button type="button" className="filter-chip" key={chip.key} onClick={chip.clear}>{chip.label} ×</button>)}</div>}

                      <div className="filter-summary-strip" aria-label="Filtered evidence summary">
                        <div><strong>{filtered.length.toLocaleString("en-US")}</strong><span>records</span></div>
                        <div><strong>{summary.knownOpenings === null ? "Unknown" : summary.knownOpenings.toLocaleString("en-US")}</strong><span>stated openings</span></div>
                        <div><strong>{summary.payRecords.toLocaleString("en-US")}</strong><span>with stated pay</span></div>
                        <div><strong>{summary.activeRecords.toLocaleString("en-US")}</strong><span>active records</span></div>
                        <div><strong>{summary.provinces.toLocaleString("en-US")} / {summary.sources.toLocaleString("en-US")}</strong><span>provinces / sources</span></div>
                      </div>
                    </div>

                    <div className="jobs-layout">
                      <div className="data-surface jobs-table" role="table" aria-label="Location verified Nepal job records">
                        <div className="jobs-table-head" role="row"><span>Role</span><span>Employer</span><span>Location</span><span>Status</span><span>Openings</span><span>Date</span></div>
                        {visibleJobs.length === 0 ? <div className="empty-state"><strong>No verified jobs match these filters.</strong><span>Remove a filter or widen the year range. Missing evidence is not converted to zero.</span></div> : visibleJobs.map((record) => (
                          <button key={record.id} type="button" className={`jobs-table-row ${selectedJob?.id === record.id ? "selected" : ""}`} aria-pressed={selectedJob?.id === record.id} onClick={() => setSelectedJob(record)}>
                            <span className="role-cell"><strong>{record.title}</strong><small>{sectorLabels[classifySector(record)]} / {record.source}</small></span>
                            <span data-label="Employer">{record.employer ?? "Unknown"}</span>
                            <span data-label="Location">{locationLabel(record)}</span>
                            <span data-label="Status">{normalizeStatus(record.status)}</span>
                            <span data-label="Openings" className="number-cell">{record.openings ?? "Unknown"}</span>
                            <span data-label="Date" className="number-cell">{formatDate(record.published ?? record.deadline)}</span>
                          </button>
                        ))}
                        <div className="pagination"><button type="button" className="secondary-button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button><span>Page {page} of {totalPages}</span><button type="button" className="secondary-button" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Next</button></div>
                      </div>

                      <aside className="data-surface job-inspector" aria-live="polite">
                        {selectedJob ? (
                          <div className="job-inspector-inner">
                            <div className="inspector-head"><div><span>Location verified · {sectorLabels[classifySector(selectedJob)]}</span><h3>{selectedJob.title}</h3><p>{selectedJob.employer ?? "Employer unknown"}</p></div><button type="button" onClick={() => setSelectedJob(null)}>Close</button></div>
                            <div className="inspector-actions"><button className="secondary-button" type="button" onClick={() => copyUrl(selectedJob)}>Copy record link</button><a className="primary-button" href={selectedJob.canonicalUrl} target="_blank" rel="noreferrer">Open canonical source</a></div>
                            <dl className="inspector-grid">
                              <div><dt>Country</dt><dd>{selectedJob.country} ({selectedJob.countryCode})</dd></div>
                              <div><dt>Province</dt><dd>{selectedJob.province}</dd></div>
                              <div><dt>District</dt><dd>{selectedJob.district ?? "Not stated"}</dd></div>
                              <div><dt>Local level</dt><dd>{selectedJob.localLevel ?? "Not stated"}</dd></div>
                              <div><dt>Status</dt><dd>{normalizeStatus(selectedJob.status)}</dd></div>
                              <div><dt>Openings</dt><dd>{selectedJob.openings ?? "Unknown"}</dd></div>
                              <div><dt>Pay</dt><dd>{selectedJob.salary ?? "Not stated"}</dd></div>
                              <div><dt>Work type</dt><dd>{selectedJob.workTypes.length ? selectedJob.workTypes.join(", ") : "Not stated"}</dd></div>
                              <div><dt>Work mode</dt><dd>{normalizeRemote(selectedJob.remote)}</dd></div>
                              <div><dt>Industry</dt><dd>{selectedJob.industry ?? "Not stated"}</dd></div>
                              <div><dt>Published</dt><dd>{formatDate(selectedJob.published)}</dd></div>
                              <div><dt>Deadline</dt><dd>{formatDate(selectedJob.deadline)}</dd></div>
                              <div><dt>Verification</dt><dd>{selectedJob.verification || "Not stated"}</dd></div>
                              <div><dt>Confidence</dt><dd>{Math.round(selectedJob.confidence * 100)}%</dd></div>
                            </dl>
                            <div className="inspector-section"><span>Source evidence</span><strong>{safeHost(selectedJob.canonicalUrl)}</strong><div className="inspector-link-grid"><a href={selectedJob.canonicalUrl} target="_blank" rel="noreferrer"><span>Canonical source</span><span>Open ↗</span></a>{selectedJob.evidenceUrl && selectedJob.evidenceUrl !== selectedJob.canonicalUrl && <a href={selectedJob.evidenceUrl} target="_blank" rel="noreferrer"><span>Supporting evidence</span><span>Open ↗</span></a>}</div></div>
                            <div className="inspector-section"><span>Evidence gaps</span>{evidenceGaps(selectedJob).length ? <ul className="evidence-gap-list">{evidenceGaps(selectedJob).map((gap) => <li key={gap}>{gap}</li>)}</ul> : <strong>No missing fields in the public evidence contract.</strong>}</div>
                            <div className="inspector-record-meta">Record {selectedJob.id} · Dataset {selectedJob.dataset} · Geography {selectedJob.geographyVerification}</div>
                          </div>
                        ) : (
                          <div className="inspector-placeholder"><span>Job evidence</span><strong>Select a verified record</strong><p>The inspector now exposes the recovered dates, work type, work mode, industry, verification, evidence links and missing fields instead of reducing a job to a generic listing.</p></div>
                        )}
                      </aside>
                    </div>
                  </section>
                )}

                {vacancyView === "geography" && (
                  <section className="data-surface analysis-view map-view">
                    <div className="surface-heading"><div><span className="section-kicker">Location verified</span><h2>Jobs by Nepal province</h2><p>Province counts describe this recovered evidence subset, not the size of each province's labor market.</p></div><strong>{scopedRecords.length.toLocaleString("en-US")} records</strong></div>
                    {geography.length ? (
                      <>
                        <div className="province-map-grid" aria-label="Province distribution overview">
                          {geography.map(([name, count]) => <button className="province-card" type="button" key={name} onClick={() => { setFilters((current) => ({ ...current, province: name, district: "All" })); navigate("vacancies", "jobs"); }}><AnimatedNumber value={count} className="province-number" /><strong>{name}</strong><span>verified records</span></button>)}
                        </div>
                        <div className="province-table" role="table" aria-label="Exact province counts">
                          {geography.map(([name, count]) => {
                            const max = Math.max(1, ...geography.map(([, value]) => value));
                            return <button className="province-row" type="button" key={name} onClick={() => { setFilters((current) => ({ ...current, province: name, district: "All" })); navigate("vacancies", "jobs"); }}><span>{name}</span><div className="bar-track"><i className="province-bar-fill" style={{ transform: `scaleX(${count / max})` }} /></div><strong>{count.toLocaleString("en-US")}</strong></button>;
                          })}
                        </div>
                      </>
                    ) : <div className="empty-state"><strong>No province data in this applied scope.</strong><span>Clear the Opportunity Landscape filter to return to all verified Nepal records.</span></div>}
                  </section>
                )}

                {vacancyView === "timeline" && (
                  <section className="data-surface analysis-view history-view">
                    <div className="surface-heading"><div><span className="section-kicker">Recovered history</span><h2>Known publication history</h2><p>Only known publication or deadline years are plotted. Missing dates remain unknown.</p></div><span>{timeline.rows.reduce((sum, [, count]) => sum + count, 0).toLocaleString("en-US")} dated / {timeline.unknown.toLocaleString("en-US")} unknown</span></div>
                    {historyChart.points.length ? (
                      <>
                        <div className="history-chart-wrap">
                          <svg ref={historyRef} className="history-chart" viewBox={`0 0 ${historyChart.width} ${historyChart.height}`} role="img" aria-label={`History of recovered job records from ${historyChart.points[0].year} to ${historyChart.points[historyChart.points.length - 1].year}.`}>
                            <path className="history-baseline" d={`M44,${historyChart.height - 28} L${historyChart.width - 44},${historyChart.height - 28}`} />
                            <path className="history-line" d={historyChart.path} />
                            {historyChart.points.map((point) => <g className="history-point" key={point.year} transform={`translate(${point.x} ${point.y})`}><circle r="5" /><text y="-12" textAnchor="middle">{point.count}</text><text y={historyChart.height - point.y - 8} textAnchor="middle" className="history-year">{point.year}</text></g>)}
                          </svg>
                        </div>
                        <div className="history-table" role="table" aria-label="Exact history values">
                          {timeline.rows.map(([year, count]) => <button type="button" key={year} onClick={() => { setFilters((current) => ({ ...current, fromYear: String(year), toYear: String(year) })); navigate("vacancies", "jobs"); }}><span>{year}</span><strong>{count.toLocaleString("en-US")}</strong><small>records</small></button>)}
                        </div>
                      </>
                    ) : <div className="empty-state"><strong>No dated records in this scope.</strong><span>Unknown dates are preserved as unknown.</span></div>}
                  </section>
                )}

                {vacancyView === "sources" && (
                  <section className="data-surface analysis-view sources-view">
                    <div className="surface-heading"><div><span className="section-kicker">Provenance</span><h2>Sources in this verified subset</h2><p>Counts describe recovered coverage, not market share.</p></div><label className="compact-select"><span>Order</span><select value={sourceSort} onChange={(event: ChangeEvent<HTMLSelectElement>) => changeSourceSort(event.target.value as SourceSort)}><option value="records">Most records</option><option value="name">Source name</option></select></label></div>
                    <div ref={sourceListRef} className="source-list">
                      {sourceStats.map((row) => {
                        const max = Math.max(1, ...sourceStats.map((item) => item.records));
                        return <button type="button" className="source-row" data-flip-id={row.name} key={row.name} onClick={() => { setFilter("source", row.name); navigate("vacancies", "jobs"); }}><div><strong>{row.name}</strong><span>Location verified</span></div><div className="bar-track"><i className="source-bar-fill" style={{ transform: `scaleX(${row.records / max})` }} /></div><span>{row.records.toLocaleString("en-US")} records</span><small>{row.urls.toLocaleString("en-US")} URLs</small></button>;
                      })}
                    </div>
                  </section>
                )}
              </div>

              <div className="boundary-note"><strong>Evidence boundary</strong><span>{embeddedCorpusMeta.archiveRecordsNotPublic.toLocaleString("en-US")} of the {embeddedCorpusMeta.totalArchiveRecords.toLocaleString("en-US")} canonical archive records are not in the public Jobs table because they do not yet meet the exact-province public evidence gate. The 150 shown records are recovered evidence, not a national vacancy census.</span></div>
            </>
          )}

          {workspace === "research" && (
            <>
              <section className="workspace-hero research-hero">
                <div><span className="section-kicker">Evidence before certainty</span><h1>Research status and source evidence</h1><p>Different measures answer different questions. Employment stock, recovered jobs, source benchmarks and coverage universes stay separate.</p></div>
                <div className="hero-source">Database snapshot checked {researchCheckpoint.databaseSnapshotVerifiedOn}<br />Latest stored publication {researchCheckpoint.latestCanonicalPublication}</div>
              </section>

              <MarketScaleSummary
                title="Nepal labour-market scale"
                description="National employment stock, labour approvals and online-posting benchmarks show scale. Recovered Atlas records are tracked separately below."
              />

              <div className="surface-heading recovered-heading research-recovered-heading">
                <div><span className="section-kicker">Recovered research corpus</span><h2>What has been individually recovered</h2><p>Every count below comes from canonical research records or observed evidence. It is a progress measure, not a complete national total.</p></div>
                <span>As checked {marketEvidenceMeta.asOf}</span>
              </div>

              <section className="metric-grid metric-grid-four research-metrics" aria-label="Recovered research checkpoint">
                <article className="metric-card"><AnimatedNumber value={researchCheckpoint.canonicalPositions} className="metric-number" /><strong>Recovered positions</strong><span>{researchCheckpoint.distinctPostingUrls.toLocaleString("en-US")} distinct canonical URLs</span></article>
                <article className="metric-card"><AnimatedNumber value={researchCheckpoint.knownOpenings} className="metric-number" /><strong>Openings with a stated number</strong><span>Deduplicated research records only</span></article>
                <article className="metric-card"><AnimatedNumber value={marketScaleMeta.verifiedProvinceArchiveRecords} className="metric-number" /><strong>Province-verified archive records</strong><span>Eligible for the strict public Nepal Jobs view</span></article>
                <article className="metric-card"><AnimatedNumber value={researchCheckpoint.postingObservations} className="metric-number" /><strong>Posting observations</strong><span>{researchCheckpoint.coverageRecords.toLocaleString("en-US")} coverage records</span></article>
              </section>

              <ResearchCoverageDashboard />

              <section className="research-layout">
                <div className="data-surface research-evidence">
                  <div className="surface-heading"><div><span className="section-kicker">Evidence classes</span><h2>Nepal market evidence</h2><p>Expand a row for the definition and source boundary.</p></div><span>As checked {marketEvidenceMeta.asOf}</span></div>

                  <div className="research-evidence-row recovered-research-row">
                    <div><strong>Openings with a stated number</strong><span>Explicit counts in canonical research records</span></div><span className="research-value">{researchCheckpoint.knownOpenings.toLocaleString("en-US")}</span><small>Recovered corpus</small>
                  </div>

                  {marketEvidenceItems.map((item) => {
                    const expanded = expandedEvidence === item.id;
                    return (
                      <div className="research-evidence-row" key={item.id}>
                        <button type="button" aria-expanded={expanded} onClick={() => setExpandedEvidence((current) => current === item.id ? null : item.id)}>
                          <div><strong>{item.label}</strong><span>{item.secondary ?? item.source}</span></div>
                          <span className="research-value">{item.displayValue ?? (item.value === null ? "Unknown" : item.value.toLocaleString("en-US"))}</span>
                          <small>{marketEvidenceKindLabels[item.kind]}</small>
                          <b aria-hidden="true">{expanded ? "-" : "+"}</b>
                        </button>
                        <div className="research-detail" data-evidence-detail={item.id} aria-hidden={!expanded}>
                          <p>{item.note}</p>
                          <div><span>{item.source}</span>{item.observedOn && <span>Observed {item.observedOn}</span>}{item.sourceUrl && <a href={item.sourceUrl} target="_blank" rel="noreferrer" tabIndex={expanded ? 0 : -1}>Open source</a>}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <aside className="research-side">
                  <div className="data-surface freshness-card"><span className="section-kicker">Freshness</span><h2>Coverage queried 21 Aug 2026</h2><p>The Research Coverage database was re-queried for this release. Job Archive counts remain the canonical 20 Aug checkpoint unless separately re-counted.</p><a href={researchCheckpoint.liveSourceSpotCheck.url} target="_blank" rel="noreferrer">DOFE official foreign-job search evidence source</a></div>
                  <div className="data-surface research-progress"><span className="section-kicker">Coverage</span><h2>Research remains partial</h2><dl><div><dt>Archived master source rows</dt><dd>{marketEvidenceMeta.archivedMasterSourceRows}</dd></div><div><dt>Native registry rows</dt><dd>{marketEvidenceMeta.nativeSourceRegistryRows}</dd></div><div><dt>Highest assigned source ID</dt><dd>{marketEvidenceMeta.highestAssignedSourceId}</dd></div><div><dt>Priority sources reverified</dt><dd>{marketEvidenceMeta.prioritySourcesReverified}</dd></div><div><dt>Research run</dt><dd>{marketEvidenceMeta.researchRun}</dd></div></dl></div>
                </aside>
              </section>

              <details className="data-surface research-methods">
                <summary>Accuracy boundary and method</summary>
                <div><p><strong>Employment stock</strong> is official Nepal national statistics. <strong>Public jobs</strong> require explicit Nepal province evidence. <strong>External benchmarks</strong> are shown only when the metric is explicitly Nepal-specific.</p><p>Unknown stays unknown. The Atlas does not infer geography from a portal name, employer, domain or missing field, and it never adds incompatible evidence classes into one national total.</p></div>
              </details>
            </>
          )}
        </div>

        <footer className="atlas-footer"><span>Nepal Work Atlas</span><span>Numbers first. Plain language. Sources beside the claim.</span></footer>
      </div>
    </main>
  );
}
