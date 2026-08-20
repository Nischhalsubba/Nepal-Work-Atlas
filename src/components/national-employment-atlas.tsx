"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { gsap } from "gsap";
import { employmentSources, nationalEmploymentMeta, occupationGroups, provinceNames, type OccupationGroup, type OccupationId } from "@/data/national-employment";
import { employmentDataIntegrity } from "@/data/data-integrity";
import styles from "./employment-atlas.module.css";

type Layer = "employment" | "women" | "urban" | "earnings";
type Rect = { group: OccupationGroup; x: number; y: number; width: number; height: number };

const labels: Record<Layer, string> = { employment: "Employment", women: "Women", urban: "Urban", earnings: "Earnings" };
const percent = (value: number, total: number) => total ? (value / total) * 100 : 0;
const compact = (value: number) => new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
const money = (value: number | null) => value === null ? "Unknown" : `Rs ${value.toLocaleString("en-US")}`;

function buildTreemap(groups: OccupationGroup[]): Rect[] {
  const sorted = [...groups].sort((a, b) => b.total - a.total);
  const split = (items: OccupationGroup[], x: number, y: number, width: number, height: number): Rect[] => {
    if (!items.length) return [];
    if (items.length === 1) return [{ group: items[0], x, y, width, height }];
    const total = items.reduce((sum, item) => sum + item.total, 0);
    let best = 1;
    let running = 0;
    let distance = Infinity;
    for (let index = 1; index < items.length; index += 1) {
      running += items[index - 1].total;
      const next = Math.abs(total / 2 - running);
      if (next < distance) { distance = next; best = index; }
    }
    const first = items.slice(0, best);
    const second = items.slice(best);
    const ratio = first.reduce((sum, item) => sum + item.total, 0) / total;
    if (width >= height) {
      const firstWidth = width * ratio;
      return [...split(first, x, y, firstWidth, height), ...split(second, x + firstWidth, y, width - firstWidth, height)];
    }
    const firstHeight = height * ratio;
    return [...split(first, x, y, width, firstHeight), ...split(second, x, y + firstHeight, width, height - firstHeight)];
  };
  return split(sorted, 0, 0, 100, 100);
}

function valueFor(group: OccupationGroup, layer: Layer) {
  if (layer === "employment") return group.total;
  if (layer === "women") return percent(group.female, group.total);
  if (layer === "urban") return percent(group.urban, group.total);
  return group.medianMonthlyEarnings;
}

function rangeFor(layer: Layer) {
  const values = occupationGroups.map((group) => valueFor(group, layer)).filter((value): value is number => value !== null);
  return { min: Math.min(...values), max: Math.max(...values) };
}

function normalize(value: number | null, min: number, max: number) {
  if (value === null) return null;
  return max <= min ? 0.5 : (value - min) / (max - min);
}

function background(layer: Layer, normalized: number | null) {
  if (normalized === null) return "hsl(240 10% 13%)";
  const t = Math.max(0, Math.min(1, normalized));
  if (layer === "employment") return `hsl(229 ${14 + t * 24}% ${15 + t * 20}%)`;
  if (layer === "women") return `hsl(${286 + t * 42} ${28 + t * 34}% ${14 + t * 18}%)`;
  if (layer === "urban") return `hsl(${228 - t * 28} ${32 + t * 34}% ${14 + t * 18}%)`;
  return `hsl(${177 - t * 38} ${28 + t * 32}% ${14 + t * 17}%)`;
}

function layerText(group: OccupationGroup, layer: Layer) {
  if (layer === "employment") return `${percent(group.total, nationalEmploymentMeta.classifiedOccupationPopulation).toFixed(1)}% of classified employment`;
  if (layer === "women") return `${percent(group.female, group.total).toFixed(1)}% women`;
  if (layer === "urban") return `${percent(group.urban, group.total).toFixed(1)}% urban`;
  return group.medianMonthlyEarnings === null ? "Earnings unknown" : `${money(group.medianMonthlyEarnings)} / month`;
}

function leader(value: (group: OccupationGroup) => number | null) {
  return occupationGroups.reduce<OccupationGroup | null>((best, group) => {
    const current = value(group);
    if (current === null) return best;
    if (!best) return group;
    const bestValue = value(best);
    return bestValue === null || current > bestValue ? group : best;
  }, null);
}

export function NationalEmploymentAtlas({ evidenceMode }: { evidenceMode: boolean }) {
  const rootRef = useRef<HTMLElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const firstLayerRef = useRef(true);
  const [layer, setLayer] = useState<Layer>("employment");
  const [selectedId, setSelectedId] = useState<OccupationId | null>(null);
  const [hoveredId, setHoveredId] = useState<OccupationId | null>(null);
  const rectangles = useMemo(() => buildTreemap(occupationGroups), []);
  const selected = selectedId ? occupationGroups.find((group) => group.id === selectedId) ?? null : null;
  const hovered = hoveredId ? occupationGroups.find((group) => group.id === hoveredId) ?? null : null;
  const classified = nationalEmploymentMeta.classifiedOccupationPopulation;
  const range = rangeFor(layer);
  const leaders = useMemo(() => ({ largest: leader((group) => group.total), women: leader((group) => percent(group.female, group.total)), urban: leader((group) => percent(group.urban, group.total)), earnings: leader((group) => group.medianMonthlyEarnings) }), []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.timeline({ defaults: { ease: "power2.out" } })
        .fromTo(`.${styles.trustBar}`, { autoAlpha: 0, y: -10 }, { autoAlpha: 1, y: 0, duration: 0.32 })
        .fromTo(`.${styles.intro} > *`, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.38, stagger: 0.06 }, "-=0.12")
        .fromTo(`.${styles.stats} > div`, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.32, stagger: 0.045 }, "-=0.2")
        .fromTo(`.${styles.tile}`, { autoAlpha: 0, scale: 0.985 }, { autoAlpha: 1, scale: 1, duration: 0.46, stagger: 0.035, ease: "power3.out" }, "-=0.08")
        .fromTo(`.${styles.detail}`, { autoAlpha: 0, x: 16 }, { autoAlpha: 1, x: 0, duration: 0.38 }, "-=0.36");
    }, root);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (firstLayerRef.current) { firstLayerRef.current = false; return; }
    const root = rootRef.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(`.${styles.tile}`, { autoAlpha: 0.58, scale: 0.988 }, { autoAlpha: 1, scale: 1, duration: 0.36, stagger: 0.022, ease: "power3.out" });
    }, root);
    return () => ctx.revert();
  }, [layer]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = gsap.context(() => {
      root.querySelectorAll<HTMLElement>(`.${styles.tile}`).forEach((tile) => {
        const active = tile.dataset.occupationId === selectedId;
        gsap.to(tile, { autoAlpha: selectedId && !active ? 0.36 : 1, scale: active && selectedId ? 1.008 : 1, duration: reduced ? 0 : 0.26, ease: "power2.out" });
      });
      const panel = root.querySelector(`.${styles.detail}`);
      if (panel && !reduced) gsap.fromTo(panel, { autoAlpha: 0.72, x: 10 }, { autoAlpha: 1, x: 0, duration: 0.3, ease: "power2.out" });
      if (selectedId && !reduced) {
        const bars = root.querySelectorAll(`.${styles.provinceFill}`);
        gsap.fromTo(bars, { scaleX: 0 }, { scaleX: 1, duration: 0.38, stagger: 0.035, ease: "power3.out", transformOrigin: "left center" });
      }
    }, root);
    return () => ctx.revert();
  }, [selectedId]);

  const legend = layer === "earnings" ? [money(range.min), money(range.max)] : layer === "employment" ? [compact(range.min), compact(range.max)] : [`${range.min.toFixed(0)}%`, `${range.max.toFixed(0)}%`];

  const moveTooltip = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!tooltipRef.current) return;
    tooltipRef.current.style.left = `${Math.min(window.innerWidth - 340, event.clientX + 16)}px`;
    tooltipRef.current.style.top = `${Math.min(window.innerHeight - 170, event.clientY + 16)}px`;
  };

  return (
    <section ref={rootRef} className={styles.shell} id="employment-atlas" aria-labelledby="national-employment-title">
      <div className={styles.trustBar}><strong>Nepal only</strong><span>Official national employment data</span><span>NPHC 2021</span><span>NSO Nepal</span><span className={styles.integrityPass}>Reconciliation passed · {employmentDataIntegrity.passedChecks} checks</span></div>

      <div className={styles.intro}>
        <div><div className={styles.kicker}>National employment atlas / Nepal / NPHC 2021</div><h2 id="national-employment-title">Where people work in Nepal</h2><p>Rectangle <strong>area</strong> is the official number of people in each major occupation. Color adds one Nepal-specific comparison layer. Select any occupation for exact counts, provincial distribution, source year, and evidence.</p></div>
        <div className={styles.sourceLinks}><a href={employmentSources.census.dashboardUrl} target="_blank" rel="noreferrer">NSO dashboard</a><a href={employmentSources.census.url} target="_blank" rel="noreferrer">Census report</a></div>
      </div>

      <div className={styles.stats}>
        <div><span>Economic activity population</span><strong>{nationalEmploymentMeta.totalEconomicActivityPopulation.toLocaleString("en-US")}</strong><small>NPHC 2021</small></div>
        <div><span>Occupation classified</span><strong>{classified.toLocaleString("en-US")}</strong><small>{nationalEmploymentMeta.occupationNotStated.toLocaleString("en-US")} occupation not stated</small></div>
        <div><span>Major occupation groups</span><strong>{occupationGroups.length}</strong><small>official major groups</small></div>
        <div><span>Integrity checks</span><strong>{employmentDataIntegrity.passedChecks}</strong><small>all passed</small></div>
      </div>

      <div className={styles.controls}><div className={styles.layerControl}><span className={styles.controlLabel}>Color by</span><div className={styles.layerButtons}>{(Object.entries(labels) as [Layer, string][]).map(([id, label]) => <button key={id} type="button" aria-pressed={layer === id} onClick={() => setLayer(id)}>{label}</button>)}</div></div><div className={styles.legend}><span>{legend[0]}</span><i className={`${styles.gradient} ${styles[`gradient_${layer}`]}`} /><span>{legend[1]}</span></div></div>

      <div className={styles.graphLayout}>
        <div className={styles.graphColumn}><div className={styles.graphMeta}><span><b>Area</b> official employment count</span><span><b>Color</b> {labels[layer].toLowerCase()}</span><span><b>Select</b> exact evidence</span></div><div className={styles.treemap} role="group" aria-label="Proportional treemap of Nepal major occupations">
          {rectangles.map((rect) => {
            const metric = valueFor(rect.group, layer);
            const share = percent(rect.group.total, classified);
            const style: CSSProperties = { left: `${rect.x}%`, top: `${rect.y}%`, width: `${rect.width}%`, height: `${rect.height}%`, background: background(layer, normalize(metric, range.min, range.max)) };
            const roomy = rect.width * rect.height >= 120;
            return <button key={rect.group.id} type="button" data-occupation-id={rect.group.id} className={`${styles.tile} ${selectedId === rect.group.id ? styles.tileSelected : ""}`} style={style} aria-pressed={selectedId === rect.group.id} onClick={() => setSelectedId((current) => current === rect.group.id ? null : rect.group.id)} onPointerEnter={() => { setHoveredId(rect.group.id); if (tooltipRef.current) gsap.to(tooltipRef.current, { autoAlpha: 1, y: 0, duration: 0.14 }); }} onPointerMove={moveTooltip} onPointerLeave={() => { setHoveredId(null); if (tooltipRef.current) gsap.to(tooltipRef.current, { autoAlpha: 0, y: 4, duration: 0.1 }); }} aria-label={`${rect.group.label}: ${rect.group.total.toLocaleString("en-US")} people, ${share.toFixed(1)} percent, ${layerText(rect.group, layer)}`}><span className={styles.tileTop}><span className={styles.tileCode}>ISCO {rect.group.iscoMajorGroup}</span>{roomy && <span className={styles.tileLabel}>{rect.group.shortLabel}</span>}</span>{roomy && <span className={styles.tileMetric}><strong>{compact(rect.group.total)}</strong><small>{share.toFixed(1)}% · {layerText(rect.group, layer)}</small></span>}</button>;
          })}
        </div></div>

        <aside className={styles.detail} aria-live="polite">
          {selected ? <div className={styles.detailInner}><div className={styles.detailHead}><div><span>ISCO major group {selected.iscoMajorGroup}</span><h3>{selected.label}</h3></div><button type="button" onClick={() => setSelectedId(null)}>Close</button></div><dl className={styles.detailGrid}><div><dt>People</dt><dd>{selected.total.toLocaleString("en-US")}</dd></div><div><dt>National share</dt><dd>{percent(selected.total, classified).toFixed(2)}%</dd></div><div><dt>Women</dt><dd>{selected.female.toLocaleString("en-US")} / {percent(selected.female, selected.total).toFixed(1)}%</dd></div><div><dt>Men</dt><dd>{selected.male.toLocaleString("en-US")} / {percent(selected.male, selected.total).toFixed(1)}%</dd></div><div><dt>Urban</dt><dd>{selected.urban.toLocaleString("en-US")} / {percent(selected.urban, selected.total).toFixed(1)}%</dd></div><div><dt>Rural</dt><dd>{selected.rural.toLocaleString("en-US")} / {percent(selected.rural, selected.total).toFixed(1)}%</dd></div><div><dt>Median employee earnings</dt><dd>{money(selected.medianMonthlyEarnings)}</dd></div><div><dt>Earnings reference</dt><dd>{nationalEmploymentMeta.earningsReference}</dd></div></dl><div className={styles.provinces}><h4>2021 population by province</h4>{provinceNames.map((province) => [province, selected.provinces[province]] as const).sort((a, b) => b[1] - a[1]).map(([province, value]) => { const max = Math.max(...provinceNames.map((name) => selected.provinces[name])); return <div className={styles.provinceRow} key={province}><span>{province}</span><div className={styles.track}><i className={styles.provinceFill} style={{ width: `${percent(value, max)}%` }} /></div><strong>{compact(value)}</strong></div>; })}</div>{evidenceMode && <div className={styles.methodNote}><strong>Evidence boundary</strong><p>{employmentSources.census.definition}</p><p>{employmentSources.earnings.definition}</p></div>}</div> : <div className={styles.trustPanel}><div className={styles.trustPanelHead}><span>Data trust</span><strong>Official Nepal employment structure</strong><p>The graph is intentionally populated before selection so the right rail explains what the numbers mean instead of sitting empty.</p></div><div className={styles.integrityCard}><i className={styles.integrityDot} /><div><strong>{employmentDataIntegrity.passedChecks} reconciliation checks passed</strong><p>Sex totals, urban/rural totals, seven-province sums, occupation totals, and the national denominator reconcile.</p></div></div><dl className={styles.trustGrid}><div><dt>Country</dt><dd>Nepal (NP)</dd></div><div><dt>Primary source</dt><dd>NSO Nepal</dd></div><div><dt>Employment year</dt><dd>2021</dd></div><div><dt>Earnings year</dt><dd>2017/18</dd></div></dl><div className={styles.quickRead}><h3>Quick read</h3>{leaders.largest && <button type="button" onClick={() => setSelectedId(leaders.largest!.id)}><span>Largest group</span><strong>{leaders.largest.label}</strong><small>{compact(leaders.largest.total)}</small></button>}{leaders.women && <button type="button" onClick={() => setSelectedId(leaders.women!.id)}><span>Highest women share</span><strong>{leaders.women.label}</strong><small>{percent(leaders.women.female, leaders.women.total).toFixed(1)}%</small></button>}{leaders.urban && <button type="button" onClick={() => setSelectedId(leaders.urban!.id)}><span>Highest urban share</span><strong>{leaders.urban.label}</strong><small>{percent(leaders.urban.urban, leaders.urban.total).toFixed(1)}%</small></button>}{leaders.earnings && <button type="button" onClick={() => setSelectedId(leaders.earnings!.id)}><span>Highest listed earnings</span><strong>{leaders.earnings.label}</strong><small>{money(leaders.earnings.medianMonthlyEarnings)}</small></button>}</div><div className={styles.trustLinks}><a href={employmentSources.census.dashboardUrl} target="_blank" rel="noreferrer">Open NSO source</a><a href={employmentSources.earnings.url} target="_blank" rel="noreferrer">Open labour survey</a></div></div>}
        </aside>
      </div>

      <details className={styles.tableDisclosure} open><summary>Exact occupation table · official values</summary><div className={styles.tableWrap}><table><thead><tr><th>ISCO</th><th>Occupation</th><th>People</th><th>Share</th><th>Women</th><th>Urban</th><th>Median earnings</th></tr></thead><tbody>{[...occupationGroups].sort((a, b) => b.total - a.total).map((group) => <tr key={group.id}><td>{group.iscoMajorGroup}</td><td>{group.label}</td><td>{group.total.toLocaleString("en-US")}</td><td>{percent(group.total, classified).toFixed(2)}%</td><td>{percent(group.female, group.total).toFixed(1)}%</td><td>{percent(group.urban, group.total).toFixed(1)}%</td><td>{money(group.medianMonthlyEarnings)}</td></tr>)}</tbody></table></div></details>

      <div ref={tooltipRef} className={styles.tooltip} role="status" aria-hidden={!hovered}>{hovered && <><strong>{hovered.label}</strong><span>{hovered.total.toLocaleString("en-US")} people · {percent(hovered.total, classified).toFixed(1)}%</span><span>{layerText(hovered, layer)}</span></>}</div>
    </section>
  );
}
