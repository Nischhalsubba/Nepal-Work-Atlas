"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import {
  researchCoverageSnapshot,
  sourceCoverage,
  yearCoverage,
  type CoverageStatus,
} from "@/data/research-coverage";

const statusClass: Record<CoverageStatus, string> = {
  "Not started": "not-started",
  "Discovery only": "discovery",
  Partial: "partial",
  "Current crawled": "current",
  "Historical crawled": "historical",
  "Crawled and verified": "verified",
  "Access blocked": "blocked",
  "Private/inaccessible": "blocked",
  "No surviving archive": "no-archive",
};

function shortStatus(status: CoverageStatus) {
  if (status === "Current crawled") return "Current";
  if (status === "Discovery only") return "Discovery";
  if (status === "No surviving archive") return "No archive";
  return status;
}

export function ResearchCoverageDashboard() {
  const rootRef = useRef<HTMLElement>(null);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [sourceStatus, setSourceStatus] = useState<CoverageStatus | "All">("All");

  const selected = yearCoverage.find((row) => row.year === selectedYear) ?? yearCoverage[yearCoverage.length - 1];
  const filteredSources = useMemo(
    () => sourceCoverage.filter((row) => sourceStatus === "All" || row.status === sourceStatus),
    [sourceStatus],
  );

  useEffect(() => {
    const root = rootRef.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const detail = root.querySelector(".coverage-year-detail");
    if (!detail) return;
    const tween = gsap.fromTo(detail, { autoAlpha: 0.35, y: 5 }, { autoAlpha: 1, y: 0, duration: 0.2, ease: "power2.out", overwrite: "auto" });
    return () => {
      tween.kill();
    };
  }, [selectedYear]);

  return (
    <section ref={rootRef} className="research-coverage-dashboard" aria-labelledby="coverage-dashboard-title">
      <div className="surface-heading coverage-heading">
        <div>
          <span className="section-kicker">Research operations</span>
          <h2 id="coverage-dashboard-title">Where the archive is strong, partial or missing</h2>
          <p>Coverage status is a research-progress measure. It never means a year or source had zero jobs.</p>
        </div>
        <span>Coverage database queried {researchCoverageSnapshot.queriedOn}</span>
      </div>

      <div className="coverage-status-grid" aria-label="Research coverage status counts">
        {researchCoverageSnapshot.statuses.map((item) => (
          <article className={`coverage-status-card ${statusClass[item.status]}`} key={item.status}>
            <strong>{item.rows.toLocaleString("en-US")}</strong>
            <span>{item.status}</span>
            <small>coverage records</small>
          </article>
        ))}
      </div>

      <div className="coverage-layout">
        <div className="data-surface coverage-years">
          <div className="surface-heading compact-heading">
            <div><span className="section-kicker">2000–2026</span><h3>Year-by-year recovery status</h3><p>Every cell includes a text status so color is never the only signal.</p></div>
          </div>
          <div className="coverage-year-grid" role="list" aria-label="Research coverage by year">
            {yearCoverage.map((row) => (
              <button
                key={row.year}
                type="button"
                role="listitem"
                className={`coverage-year-cell ${statusClass[row.status]} ${selectedYear === row.year ? "selected" : ""}`}
                aria-pressed={selectedYear === row.year}
                onClick={() => setSelectedYear(row.year)}
              >
                <strong>{row.year}</strong>
                <span>{shortStatus(row.status)}</span>
              </button>
            ))}
          </div>
          <div className={`coverage-year-detail ${statusClass[selected.status]}`} aria-live="polite">
            <div><span>{selected.status}</span><strong>{selected.year}</strong></div>
            <p>{selected.knownGap}</p>
            <dl>
              <div><dt>URLs observed</dt><dd>{selected.urlsObserved ?? "Not stated"}</dd></div>
              <div><dt>Jobs extracted</dt><dd>{selected.uniqueJobsExtracted ?? "Not stated"}</dd></div>
            </dl>
          </div>
        </div>

        <aside className="data-surface coverage-targets">
          <div className="surface-heading compact-heading"><div><span className="section-kicker">Coverage model</span><h3>What is being tracked</h3></div></div>
          <dl>
            {researchCoverageSnapshot.targetTypes.map((item) => <div key={item.type}><dt>{item.type}</dt><dd>{item.rows}</dd></div>)}
          </dl>
          <p>The database tracks years and sources most heavily today. Province, district and local-government coverage still needs substantially broader enumeration.</p>
        </aside>
      </div>

      <div className="data-surface coverage-source-queue">
        <div className="surface-heading">
          <div><span className="section-kicker">Source work queue</span><h3>Major source families still needing recovery work</h3><p>Expand a source to see the known gap and the next research pass.</p></div>
          <label className="compact-select"><span>Status</span><select value={sourceStatus} onChange={(event) => setSourceStatus(event.target.value as CoverageStatus | "All")}><option>All</option><option>Partial</option><option>Discovery only</option><option>Current crawled</option></select></label>
        </div>
        <div className="coverage-source-list">
          {filteredSources.map((row) => (
            <details className="coverage-source-row" key={row.target}>
              <summary>
                <span><strong>{row.target}</strong><small>Checked {row.lastChecked}</small></span>
                <span className={`coverage-badge ${statusClass[row.status]}`}>{row.status}</span>
                <span>{row.uniqueJobsExtracted.toLocaleString("en-US")} jobs</span>
                <span>{row.totalOpenings.toLocaleString("en-US")} stated openings</span>
              </summary>
              <div className="coverage-source-detail">
                <div><strong>Known gap</strong><p>{row.knownGap}</p></div>
                <div><strong>Next pass</strong><p>{row.nextPass}</p></div>
                <dl><div><dt>URLs observed</dt><dd>{row.urlsObserved}</dd></div><div><dt>Jobs extracted</dt><dd>{row.uniqueJobsExtracted}</dd></div><div><dt>Stated openings</dt><dd>{row.totalOpenings}</dd></div></dl>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
