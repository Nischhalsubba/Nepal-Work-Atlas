"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import type { JobRecord } from "@/data/job-records";
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

type Metric = "Recovered positions" | "Openings" | "Pay" | "Temporary" | "Gig" | "Foreign" | "Historical";

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

const metrics: Metric[] = ["Recovered positions", "Openings", "Pay", "Temporary", "Gig", "Foreign", "Historical"];

function metricValue(records: JobRecord[], metric: Metric): number | null {
  if (metric === "Recovered positions") return records.length;
  if (metric === "Openings") {
    const known = records.filter((record) => record.openings !== null);
    return known.length ? known.reduce((sum, record) => sum + (record.openings ?? 0), 0) : null;
  }
  if (metric === "Pay") return records.filter((record) => Boolean(record.salary)).length;
  if (metric === "Temporary") {
    return records.filter((record) => record.workTypes.some((type) => /temporary|short-term/i.test(type))).length;
  }
  if (metric === "Gig") return records.filter((record) => record.workTypes.some((type) => /freelance/i.test(type))).length;
  if (metric === "Historical") {
    const dated = records.filter((record) => record.published);
    return dated.length ? dated.filter((record) => record.published && Number(record.published.slice(0, 4)) < 2026).length : null;
  }
  return null;
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
  const [path, setPath] = useState<string[]>([]);
  const [metric, setMetric] = useState<Metric>("Recovered positions");

  const currentNode = useMemo(() => findNode(landscape, path), [path]);
  const visibleNodes = path.length === 0 ? landscape : currentNode?.children ?? [];

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && path.length > 0) setPath((current) => current.slice(0, -1));
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [path.length]);

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

  const metricQualifier =
    metric === "Foreign"
      ? "Foreign destination is not represented in the current recovered schema, so no zero is inferred."
      : metric === "Pay"
        ? "Tile values count records with explicit pay evidence, not salary amounts."
        : metric === "Openings"
          ? "Opening totals sum only records with an explicit worker count."
          : "Tile values are derived only from the embedded recovered evidence subset.";

  return (
    <section className="panel landscape-panel" id="landscape" aria-labelledby="landscape-title">
      <div className="panel-header landscape-header">
        <div>
          <div className="eyebrow">Explore the recovered corpus</div>
          <div className="title-row">
            <h2 id="landscape-title">Opportunity Landscape</h2>
            <span className="prototype-badge">derived classifier</span>
          </div>
          <p className="panel-description">
            Drill into the taxonomy locally. Classification is a transparent interface aid, not a source-authored sector field and not an estimate of Nepal&apos;s total labor market.
          </p>
        </div>
        <div className="landscape-actions">
          <label className="metric-picker">
            <span>Size by</span>
            <select value={metric} onChange={(event: ChangeEvent<HTMLSelectElement>) => setMetric(event.target.value as Metric)}>
              {metrics.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <button
            className="apply-filter"
            type="button"
            disabled={!currentNode}
            onClick={() => currentNode && onApplyScope(currentNode.scope)}
          >
            Apply to dashboard
          </button>
          {appliedScope && (
            <button className="plain-button" type="button" onClick={() => onApplyScope(null)}>
              Clear filter
            </button>
          )}
        </div>
      </div>

      <div className="landscape-status" aria-live="polite">
        <nav className="breadcrumb" aria-label="Opportunity hierarchy">
          {breadcrumb.map((item, index) => (
            <span key={`${item.label}-${item.depth}`}>
              {index > 0 && <span aria-hidden="true">›</span>}
              <button
                type="button"
                onClick={() => setPath((current) => current.slice(0, item.depth))}
                disabled={index === breadcrumb.length - 1}
              >
                {item.label}
              </button>
            </span>
          ))}
        </nav>
        <span className="metric-note">Metric: {metric}</span>
      </div>

      {visibleNodes.length > 0 ? (
        <div className="landscape-grid" data-depth={path.length}>
          {values.map(({ node, scoped, value }, index) => {
            const normalized = value === null ? 0.45 : Math.max(0.28, value / maxValue);
            const span = Math.max(3, Math.min(8, Math.round(3 + normalized * 5)));
            return (
              <button
                className="landscape-tile"
                key={node.id}
                type="button"
                onClick={() => setPath((current) => [...current, node.id])}
                style={{ gridColumn: `span ${span}` }}
                aria-label={`Explore ${node.label}`}
              >
                <span className="tile-index">{String(index + 1).padStart(2, "0")}</span>
                <span className="tile-label">{node.label}</span>
                <span className="tile-value">{value === null ? "Unknown" : value.toLocaleString("en-US")}</span>
                <span className="tile-meta">
                  {node.children?.length ? `${node.children.length} derived sub-sectors` : `${scoped.length} recovered records`}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="landscape-leaf">
          <strong>{currentNode?.label}</strong>
          <span>No deeper reviewed taxonomy is encoded for this branch yet. You can still apply this evidence scope to the rest of the dashboard.</span>
        </div>
      )}

      <div className="landscape-footer">
        <span>{path.length > 0 ? "Escape or breadcrumb moves one level up." : metricQualifier}</span>
        <span className={appliedScope ? "filter-state active" : "filter-state"}>
          {appliedScope ? `Dashboard filter: ${appliedScope.label}` : "No global derived-sector filter applied."}
        </span>
      </div>
      {path.length > 0 && <div className="metric-explainer">{metricQualifier}</div>}
    </section>
  );
}
