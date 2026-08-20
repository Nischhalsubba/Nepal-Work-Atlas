"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import type { JobRecord } from "@/data/job-records";
import { AnimatedNumber } from "@/components/animated-number";
import {
  type AppliedScope,
  type ItSubsectorId,
  type SectorId,
  type SoftwareTrackId,
  itSubsectorLabels,
  recordMatchesScope,
  sectorLabels,
  softwareTrackLabels,
} from "@/lib/taxonomy";

gsap.registerPlugin(Flip);

type Metric = "Public records" | "Openings" | "Pay evidence" | "Temporary" | "Gig" | "Historical";

type LandscapeNode = {
  id: string;
  label: string;
  scope: AppliedScope;
  children?: LandscapeNode[];
};

const softwareTracks: LandscapeNode[] = (Object.entries(softwareTrackLabels) as [SoftwareTrackId, string][]).map(([id, label]) => ({
  id,
  label,
  scope: { kind: "software-track", id, label },
}));

const itChildren: LandscapeNode[] = (Object.entries(itSubsectorLabels) as [ItSubsectorId, string][]).map(([id, label]) => ({
  id,
  label,
  scope: { kind: "it-subsector", id, label },
  children: id === "software-engineering" ? softwareTracks : undefined,
}));

const landscape: LandscapeNode[] = (Object.entries(sectorLabels) as [SectorId, string][])
  .filter(([id]) => id !== "other")
  .map(([id, label]) => ({
    id,
    label,
    scope: { kind: "sector", id, label },
    children: id === "it-software" ? itChildren : undefined,
  }));

const metrics: Metric[] = ["Public records", "Openings", "Pay evidence", "Temporary", "Gig", "Historical"];

function metricValue(records: JobRecord[], metric: Metric): number | null {
  if (metric === "Public records") return records.length;
  if (metric === "Openings") {
    const known = records.filter((record) => record.openings !== null);
    return known.length ? known.reduce((sum, record) => sum + (record.openings ?? 0), 0) : null;
  }
  if (metric === "Pay evidence") return records.filter((record) => Boolean(record.salary)).length;
  if (metric === "Temporary") return records.filter((record) => record.workTypes.some((type) => /temporary|short-term/i.test(type))).length;
  if (metric === "Gig") return records.filter((record) => record.workTypes.some((type) => /freelance|gig|task/i.test(type))).length;
  const dated = records.filter((record) => record.published);
  return dated.length ? dated.filter((record) => record.published && Number(record.published.slice(0, 4)) < 2026).length : null;
}

function findNode(nodes: LandscapeNode[], path: string[]) {
  let current: LandscapeNode | undefined;
  let level = nodes;
  for (const id of path) {
    current = level.find((node) => node.id === id);
    if (!current) return undefined;
    level = current.children ?? [];
  }
  return current;
}

export function OpportunityLandscape({
  records,
  appliedScope,
  onApplyScope,
}: {
  records: JobRecord[];
  appliedScope: AppliedScope | null;
  onApplyScope: (scope: AppliedScope | null) => void;
}) {
  const rootRef = useRef<HTMLElement>(null);
  const [path, setPath] = useState<string[]>([]);
  const [metric, setMetric] = useState<Metric>("Public records");

  const currentNode = useMemo(() => findNode(landscape, path), [path]);
  const visibleNodes = path.length === 0 ? landscape : currentNode?.children ?? [];
  const leafRecords = useMemo(
    () => currentNode && !currentNode.children?.length
      ? records.filter((record) => recordMatchesScope(record, currentNode.scope)).sort((a, b) => a.title.localeCompare(b.title))
      : [],
    [currentNode, records],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && path.length > 0) setPath((current) => current.slice(0, -1));
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [path.length]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tiles = root.querySelectorAll(".landscape-tile");
    const context = gsap.context(() => {
      if (reducedMotion) {
        gsap.set(tiles, { clearProps: "all" });
        return;
      }
      gsap.fromTo(
        tiles,
        { autoAlpha: 0, y: 8 },
        { autoAlpha: 1, y: 0, duration: 0.26, stagger: 0.025, ease: "power2.out", overwrite: "auto" },
      );
    }, root);
    return () => context.revert();
  }, [path]);

  const breadcrumb = useMemo(() => {
    const items: { label: string; depth: number }[] = [{ label: "All work", depth: 0 }];
    let nodes = landscape;
    path.forEach((id, index) => {
      const node = nodes.find((entry) => entry.id === id);
      if (!node) return;
      items.push({ label: node.label, depth: index + 1 });
      nodes = node.children ?? [];
    });
    return items;
  }, [path]);

  const values = visibleNodes.map((node) => {
    const scoped = records.filter((record) => recordMatchesScope(record, node.scope));
    return { node, scoped, value: metricValue(scoped, metric) };
  });
  const maxValue = Math.max(1, ...values.map((entry) => entry.value ?? 0));

  const qualifier = metric === "Pay evidence"
    ? "Values count records with stated pay, not salary amounts."
    : metric === "Openings"
      ? "Opening totals use only records with a stated worker count."
      : "Values come only from the 150 province-verified public archive records.";

  const enterNode = (node: LandscapeNode) => {
    setPath((current) => [...current, node.id]);
  };

  const changeMetric = (next: Metric) => {
    if (next === metric) return;
    const root = rootRef.current;
    const reducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const state = root && !reducedMotion ? Flip.getState(root.querySelectorAll(".landscape-tile")) : null;
    setMetric(next);
    if (state) {
      requestAnimationFrame(() => {
        Flip.from(state, { duration: 0.26, ease: "power2.inOut", absolute: false, simple: true, stagger: 0.01 });
      });
    }
  };

  return (
    <section ref={rootRef} className="data-surface landscape-panel" aria-labelledby="landscape-title">
      <div className="surface-heading landscape-heading">
        <div>
          <span className="section-kicker">Explore the province-verified public archive</span>
          <h2 id="landscape-title">Opportunity Landscape</h2>
          <p>
            Explore sectors without changing the rest of the dashboard. Use <strong>Apply to dashboard</strong> only when you want the current branch to filter Jobs, Map, History and Sources.
          </p>
        </div>
        <div className="landscape-actions">
          <label className="compact-select">
            <span>Size by</span>
            <select value={metric} onChange={(event: ChangeEvent<HTMLSelectElement>) => changeMetric(event.target.value as Metric)}>
              {metrics.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <button className="primary-button" type="button" disabled={!currentNode} onClick={() => currentNode && onApplyScope(currentNode.scope)}>
            Apply to dashboard
          </button>
          {appliedScope && <button className="secondary-button" type="button" onClick={() => onApplyScope(null)}>Clear applied filter</button>}
        </div>
      </div>

      <div className="landscape-toolbar">
        <nav className="breadcrumb" aria-label="Opportunity hierarchy">
          {breadcrumb.map((item, index) => (
            <span key={`${item.label}-${item.depth}`}>
              {index > 0 && <span aria-hidden="true">/</span>}
              <button type="button" disabled={index === breadcrumb.length - 1} onClick={() => setPath((current) => current.slice(0, item.depth))}>
                {item.label}
              </button>
            </span>
          ))}
        </nav>
        <span className="landscape-live" aria-live="polite">Showing {breadcrumb.map((item) => item.label).join(" / ")}</span>
      </div>

      {visibleNodes.length > 0 ? (
        <div className="landscape-grid" data-depth={path.length}>
          {values.map(({ node, scoped, value }, index) => {
            const normalized = value === null ? 0.32 : Math.max(0.18, value / maxValue);
            const span = Math.max(3, Math.min(8, Math.round(3 + normalized * 5)));
            return (
              <button
                className="landscape-tile"
                data-flip-id={node.id}
                key={node.id}
                type="button"
                onClick={() => enterNode(node)}
                style={{ gridColumn: `span ${span}` }}
                aria-label={`Explore ${node.label}. ${value === null ? "Value unknown" : `${value.toLocaleString("en-US")} for ${metric.toLowerCase()}`}.`}
              >
                <span className="tile-index">{String(index + 1).padStart(2, "0")}</span>
                <strong>{node.label}</strong>
                <AnimatedNumber value={value ?? 0} className={value === null ? "tile-number unknown" : "tile-number"} format={(next) => value === null ? "Unknown" : Math.round(next).toLocaleString("en-US")} />
                <small>{node.children?.length ? `${node.children.length} deeper groups` : `${scoped.length} public records`}</small>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="landscape-leaf">
          <div className="landscape-leaf-heading">
            <div><span className="section-kicker">Individual jobs</span><strong>{currentNode?.label}</strong><p>{leafRecords.length ? `${leafRecords.length.toLocaleString("en-US")} public records match this branch. Opening a record does not change the dashboard filter.` : "No recovered job currently matches this reviewed branch. Unknown is not converted to zero."}</p></div>
          </div>
          {leafRecords.length > 0 && (
            <div className="landscape-job-list" role="list" aria-label={`Individual jobs in ${currentNode?.label ?? "this branch"}`}>
              {leafRecords.map((record) => (
                <a key={record.id} role="listitem" href={record.canonicalUrl} target="_blank" rel="noreferrer" className="landscape-job-row">
                  <span><strong>{record.title}</strong><small>{record.employer ?? "Employer not stated"}</small></span>
                  <span>{record.province}</span>
                  <span>{record.openings === null ? "Openings unknown" : `${record.openings.toLocaleString("en-US")} openings`}</span>
                  <small>{record.source}</small>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="surface-note landscape-note">
        <span>{path.length > 0 ? "Escape or the breadcrumb moves one level up." : qualifier}</span>
        <strong>{appliedScope ? `Dashboard filter: ${appliedScope.label}` : "No landscape filter applied"}</strong>
      </div>

      <details className="data-fallback">
        <summary>Exact values for this level</summary>
        <div className="table-scroll">
          {visibleNodes.length > 0 ? (
            <table>
              <thead><tr><th>Group</th><th>{metric}</th><th>Public records</th></tr></thead>
              <tbody>{values.map(({ node, scoped, value }) => <tr key={node.id}><td>{node.label}</td><td>{value === null ? "Unknown" : value.toLocaleString("en-US")}</td><td>{scoped.length.toLocaleString("en-US")}</td></tr>)}</tbody>
            </table>
          ) : (
            <table>
              <thead><tr><th>Job</th><th>Employer</th><th>Province</th><th>Openings</th><th>Source</th></tr></thead>
              <tbody>{leafRecords.map((record) => <tr key={record.id}><td><a href={record.canonicalUrl} target="_blank" rel="noreferrer">{record.title}</a></td><td>{record.employer ?? "Not stated"}</td><td>{record.province}</td><td>{record.openings === null ? "Unknown" : record.openings.toLocaleString("en-US")}</td><td>{record.source}</td></tr>)}</tbody>
            </table>
          )}
        </div>
      </details>
    </section>
  );
}
