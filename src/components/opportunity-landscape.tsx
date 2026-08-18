"use client";

import { useEffect, useMemo, useState } from "react";

type LandscapeNode = {
  id: string;
  label: string;
  children?: LandscapeNode[];
};

const landscape: LandscapeNode[] = [
  {
    id: "it-software",
    label: "IT & Software",
    children: [
      {
        id: "software-engineering",
        label: "Software Engineering",
        children: [
          { id: "frontend", label: "Frontend" },
          { id: "backend", label: "Backend" },
          { id: "full-stack", label: "Full-stack" },
          { id: "mobile", label: "Mobile" },
          { id: "platform", label: "Platform" },
        ],
      },
      { id: "data-ai", label: "Data & AI" },
      { id: "cloud-devops", label: "Cloud & DevOps" },
      { id: "product-ux", label: "Product & UX" },
      { id: "cybersecurity", label: "Cybersecurity" },
      { id: "qa-testing", label: "QA & Testing" },
      { id: "it-support", label: "IT Support & Infrastructure" },
      { id: "enterprise-systems", label: "Enterprise Systems" },
    ],
  },
  { id: "education", label: "Education" },
  { id: "health", label: "Health & Care" },
  { id: "public-service", label: "Public Service" },
  { id: "finance", label: "Finance & Banking" },
  { id: "engineering", label: "Engineering" },
  { id: "hospitality", label: "Hospitality & Tourism" },
  { id: "ngo", label: "NGO / INGO" },
];

const metrics = [
  "Recovered positions",
  "Openings",
  "Pay",
  "Temporary",
  "Gig",
  "Foreign",
  "Historical",
] as const;

function findNode(nodes: LandscapeNode[], path: string[]): LandscapeNode | undefined {
  if (path.length === 0) return undefined;
  let current = nodes.find((node) => node.id === path[0]);
  for (const id of path.slice(1)) {
    current = current?.children?.find((node) => node.id === id);
  }
  return current;
}

export function OpportunityLandscape() {
  const [path, setPath] = useState<string[]>([]);
  const [metric, setMetric] = useState<(typeof metrics)[number]>("Recovered positions");
  const [appliedFilter, setAppliedFilter] = useState<string | null>(null);

  const currentNode = useMemo(() => findNode(landscape, path), [path]);
  const visibleNodes = currentNode?.children ?? landscape;

  const breadcrumb = useMemo(() => {
    const labels = ["All work"];
    let nodes = landscape;
    for (const id of path) {
      const node = nodes.find((entry) => entry.id === id);
      if (!node) break;
      labels.push(node.label);
      nodes = node.children ?? [];
    }
    return labels;
  }, [path]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && path.length > 0) {
        setPath((current) => current.slice(0, -1));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [path.length]);

  const drillInto = (node: LandscapeNode) => {
    if (!node.children?.length) return;
    setPath((current) => [...current, node.id]);
  };

  const selectBreadcrumb = (index: number) => {
    setPath((current) => current.slice(0, Math.max(0, index)));
  };

  const currentLabel = currentNode?.label ?? "All work";

  return (
    <section className="panel landscape-panel" aria-labelledby="landscape-title">
      <div className="panel-header landscape-header">
        <div>
          <div className="eyebrow">Explore the market</div>
          <div className="title-row">
            <h2 id="landscape-title">Opportunity Landscape</h2>
            <span className="prototype-badge">taxonomy prototype</span>
          </div>
          <p className="panel-description">
            Drill into sectors without changing the rest of the dashboard. Tile area is deliberately non-quantitative until corpus-backed sector counts are connected.
          </p>
        </div>
        <div className="landscape-actions">
          <label className="metric-picker">
            <span>Size by</span>
            <select value={metric} onChange={(event) => setMetric(event.target.value as (typeof metrics)[number])}>
              {metrics.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <button
            className="apply-filter"
            type="button"
            disabled={path.length === 0}
            onClick={() => setAppliedFilter(currentLabel)}
          >
            Apply to dashboard
          </button>
        </div>
      </div>

      <div className="landscape-status" aria-live="polite">
        <nav className="breadcrumb" aria-label="Opportunity hierarchy">
          {breadcrumb.map((label, index) => (
            <span key={`${label}-${index}`}>
              {index > 0 && <span aria-hidden="true">›</span>}
              <button type="button" onClick={() => selectBreadcrumb(index)} disabled={index === breadcrumb.length - 1}>
                {label}
              </button>
            </span>
          ))}
        </nav>
        <span className="metric-note">Metric: {metric}</span>
      </div>

      <div className="landscape-grid" data-depth={path.length}>
        {visibleNodes.map((node, index) => (
          <button
            className="landscape-tile"
            key={node.id}
            type="button"
            onClick={() => drillInto(node)}
            aria-label={node.children?.length ? `Open ${node.label}` : `${node.label}, lowest prototype level`}
          >
            <span className="tile-index">{String(index + 1).padStart(2, "0")}</span>
            <span className="tile-label">{node.label}</span>
            <span className="tile-meta">{node.children?.length ? `${node.children.length} sub-sectors` : "Awaiting corpus taxonomy"}</span>
          </button>
        ))}
      </div>

      <div className="landscape-footer">
        <span>{path.length > 0 ? "Escape or breadcrumb moves one level up." : "Select a sector to explore its internal landscape."}</span>
        <span className={appliedFilter ? "filter-state active" : "filter-state"}>
          {appliedFilter
            ? `${appliedFilter} marked as dashboard filter. National checkpoint values remain unchanged until sector evidence is linked.`
            : "No global sector filter applied."}
        </span>
      </div>
    </section>
  );
}
