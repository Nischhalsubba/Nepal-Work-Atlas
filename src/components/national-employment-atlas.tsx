"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { gsap } from "gsap";
import { AnimatedNumber } from "@/components/animated-number";
import { employmentDataIntegrity } from "@/data/data-integrity";
import {
  employmentSources,
  nationalEmploymentMeta,
  occupationGroups,
  provinceNames,
  type OccupationGroup,
  type OccupationId,
} from "@/data/national-employment";
import { formatInteger, formatNepalRupees, formatPeople, formatPercent } from "@/lib/format";
import styles from "./employment-atlas.module.css";

type Layer = "employment" | "women" | "urban" | "earnings";
type TreemapRect = { group: OccupationGroup; x: number; y: number; width: number; height: number };

const LAYERS = {
  employment: { label: "People", description: "Color follows occupation size. Rectangle area always shows the exact 2021 population." },
  women: { label: "Women share", description: "Darker tiles mean a larger share of women. Rectangle area does not change." },
  urban: { label: "Urban share", description: "Darker tiles mean a larger urban share. Rectangle area does not change." },
  earnings: { label: "Historical earnings", description: "Color shows 2017/18 median monthly employee earnings. Rectangle area remains 2021 population." },
} as const satisfies Record<Layer, { label: string; description: string }>;

const percent = (value: number, total: number) => total > 0 ? (value / total) * 100 : 0;
const formatAnimatedInteger = (value: number) => Math.round(value).toLocaleString("en-US");
const formatAnimatedPercent = (value: number) => `${value.toFixed(1)}%`;

function buildTreemap(groups: readonly OccupationGroup[]): TreemapRect[] {
  const sorted = [...groups].sort((a, b) => b.total - a.total);

  function split(items: OccupationGroup[], x: number, y: number, width: number, height: number): TreemapRect[] {
    if (!items.length) return [];
    if (items.length === 1) return [{ group: items[0], x, y, width, height }];
    const total = items.reduce((sum, item) => sum + item.total, 0);
    let splitIndex = 1;
    let running = 0;
    let closest = Number.POSITIVE_INFINITY;
    for (let index = 1; index < items.length; index += 1) {
      running += items[index - 1].total;
      const distance = Math.abs(total / 2 - running);
      if (distance < closest) {
        closest = distance;
        splitIndex = index;
      }
    }
    const first = items.slice(0, splitIndex);
    const second = items.slice(splitIndex);
    const ratio = first.reduce((sum, item) => sum + item.total, 0) / total;
    if (width >= height) {
      const firstWidth = width * ratio;
      return [...split(first, x, y, firstWidth, height), ...split(second, x + firstWidth, y, width - firstWidth, height)];
    }
    const firstHeight = height * ratio;
    return [...split(first, x, y, width, firstHeight), ...split(second, x, y + firstHeight, width, height - firstHeight)];
  }

  return split(sorted, 0, 0, 100, 100);
}

function metricValue(group: OccupationGroup, layer: Layer) {
  if (layer === "employment") return group.total;
  if (layer === "women") return percent(group.female, group.total);
  if (layer === "urban") return percent(group.urban, group.total);
  return group.medianMonthlyEarnings;
}

function metricText(group: OccupationGroup, layer: Layer) {
  if (layer === "employment") return `${formatPercent(percent(group.total, nationalEmploymentMeta.classifiedOccupationPopulation))} of occupation-recorded population`;
  if (layer === "women") return `${formatPercent(percent(group.female, group.total))} women`;
  if (layer === "urban") return `${formatPercent(percent(group.urban, group.total))} urban`;
  return group.medianMonthlyEarnings === null ? "Historical earnings unknown" : `${formatNepalRupees(group.medianMonthlyEarnings)} median monthly employee earnings`;
}

function metricRange(layer: Layer) {
  const values = occupationGroups.map((group) => metricValue(group, layer)).filter((value): value is number => value !== null);
  return { min: Math.min(...values), max: Math.max(...values) };
}

function tileBackground(layer: Layer, value: number | null, min: number, max: number) {
  if (value === null) return "hsl(220 12% 92%)";
  const t = max <= min ? 0.5 : Math.max(0, Math.min(1, (value - min) / (max - min)));
  if (layer === "employment") return `hsl(216 ${54 + t * 22}% ${95 - t * 19}%)`;
  if (layer === "women") return `hsl(${344 - t * 12} ${48 + t * 18}% ${96 - t * 18}%)`;
  if (layer === "urban") return `hsl(${211 - t * 11} ${52 + t * 18}% ${96 - t * 19}%)`;
  return `hsl(${158 - t * 12} ${38 + t * 18}% ${96 - t * 20}%)`;
}

function total(field: "female" | "urban") {
  return occupationGroups.reduce((sum, group) => sum + group[field], 0);
}

export function NationalEmploymentAtlas({ evidenceMode }: { evidenceMode: boolean }) {
  const rootRef = useRef<HTMLElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const mountedLayerRef = useRef(false);
  const [layer, setLayer] = useState<Layer>("employment");
  const [selectedId, setSelectedId] = useState<OccupationId | null>(null);
  const [hoveredId, setHoveredId] = useState<OccupationId | null>(null);

  const classified = nationalEmploymentMeta.classifiedOccupationPopulation;
  const rectangles = useMemo(() => buildTreemap(occupationGroups), []);
  const range = metricRange(layer);
  const selected = selectedId ? occupationGroups.find((group) => group.id === selectedId) ?? null : null;
  const hovered = hoveredId ? occupationGroups.find((group) => group.id === hoveredId) ?? null : null;
  const womenTotal = useMemo(() => total("female"), []);
  const urbanTotal = useMemo(() => total("urban"), []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const context = gsap.context(() => {
      if (reducedMotion) return;
      gsap.timeline({ defaults: { ease: "power2.out" } })
        .fromTo(`.${styles.trustBar}`, { autoAlpha: 0, y: -6 }, { autoAlpha: 1, y: 0, duration: 0.22 })
        .fromTo(`.${styles.metricCard}`, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.28, stagger: 0.03 }, "-=0.08")
        .fromTo(`.${styles.tile}`, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, stagger: 0.02 }, "-=0.08");
    }, root);
    return () => context.revert();
  }, []);

  useEffect(() => {
    if (!mountedLayerRef.current) {
      mountedLayerRef.current = true;
      return;
    }
    const root = rootRef.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const context = gsap.context(() => {
      gsap.fromTo(`.${styles.tile}`, { autoAlpha: 0.72 }, { autoAlpha: 1, duration: 0.28, stagger: 0.012, ease: "power2.inOut", overwrite: "auto" });
    }, root);
    return () => context.revert();
  }, [layer]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const context = gsap.context(() => {
      root.querySelectorAll<HTMLElement>(`.${styles.tile}`).forEach((tile) => {
        const active = tile.dataset.occupationId === selectedId;
        gsap.to(tile, { autoAlpha: selectedId && !active ? 0.46 : 1, duration: reducedMotion ? 0 : 0.18, ease: "power2.out", overwrite: "auto" });
      });
      const panel = root.querySelector(`.${styles.detail}`);
      if (panel && selectedId && !reducedMotion) gsap.fromTo(panel, { autoAlpha: 0, x: 12 }, { autoAlpha: 1, x: 0, duration: 0.26, ease: "power2.out" });
    }, root);
    return () => context.revert();
  }, [selectedId]);

  const legend = layer === "earnings"
    ? [formatNepalRupees(range.min), formatNepalRupees(range.max)]
    : layer === "employment"
      ? [formatPeople(range.min), formatPeople(range.max)]
      : [formatPercent(range.min), formatPercent(range.max)];

  const moveTooltip = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!tooltipRef.current) return;
    tooltipRef.current.style.left = `${Math.min(window.innerWidth - 340, event.clientX + 14)}px`;
    tooltipRef.current.style.top = `${Math.min(window.innerHeight - 180, event.clientY + 14)}px`;
  };

  return (
    <section ref={rootRef} className={styles.shell} id="employment-atlas" aria-labelledby="employment-title">
      <div className={styles.trustBar}>
        <strong>Nepal only</strong>
        <span>Official national employment data</span>
        <span>NPHC 2021</span>
        <span>NSO Nepal</span>
        <span className={styles.integrity}>Data checks passed - {employmentDataIntegrity.passedChecks}</span>
      </div>

      <header className={styles.header}>
        <div>
          <span className={styles.kicker}>Nepal Census 2021</span>
          <h1 id="employment-title">Where people work in Nepal</h1>
          <p>Rectangle area shows the exact number of people. Color changes the comparison layer without changing the population area.</p>
        </div>
        <div className={styles.sourceLinks}>
          <a href={employmentSources.census.dashboardUrl} target="_blank" rel="noreferrer">NSO dashboard</a>
          <a href={employmentSources.census.url} target="_blank" rel="noreferrer">Census report</a>
        </div>
      </header>

      <div className={styles.metricGrid} aria-label="Nepal employment summary">
        <article className={styles.metricCard}><AnimatedNumber value={classified} className={styles.metricNumber} format={formatAnimatedInteger} /><strong>Occupation recorded</strong><span>Nepal Census 2021</span></article>
        <article className={styles.metricCard}><AnimatedNumber value={nationalEmploymentMeta.totalEconomicActivityPopulation} className={styles.metricNumber} format={formatAnimatedInteger} /><strong>People with economic activity</strong><span>NPHC 2021, age 10+</span></article>
        <article className={styles.metricCard}><AnimatedNumber value={percent(womenTotal, classified)} className={styles.metricNumber} format={formatAnimatedPercent} /><strong>Women</strong><span>{formatInteger(womenTotal)} people</span></article>
        <article className={styles.metricCard}><AnimatedNumber value={percent(urbanTotal, classified)} className={styles.metricNumber} format={formatAnimatedPercent} /><strong>Urban</strong><span>{formatInteger(urbanTotal)} people</span></article>
        <article className={styles.metricCard}><AnimatedNumber value={occupationGroups.length} className={styles.metricNumber} format={formatAnimatedInteger} /><strong>Detail available</strong><span>Official major occupation groups</span></article>
      </div>

      <div className={styles.controls}>
        <div className={styles.layerControl}>
          <span>Color by</span>
          <div className={styles.layerButtons}>{(Object.keys(LAYERS) as Layer[]).map((id) => <button key={id} type="button" aria-pressed={layer === id} onClick={() => setLayer(id)}>{LAYERS[id].label}</button>)}</div>
        </div>
        <div className={styles.legend} aria-label={`${LAYERS[layer].label} color range`}><span>{legend[0]}</span><i className={`${styles.gradient} ${styles[`gradient_${layer}`]}`} aria-hidden="true" /><span>{legend[1]}</span></div>
      </div>

      <div className={styles.guide}>
        <div><span>Rectangle area</span><strong>Exact number of people</strong><small>Large rectangle means more people in that occupation.</small></div>
        <div><span>Current color</span><strong>{LAYERS[layer].label}</strong><small>{LAYERS[layer].description}</small></div>
        <div><span>Evidence boundary</span><strong>No invented sub-occupations</strong><small>Deeper detail appears only when official Nepal counts are validated.</small></div>
      </div>

      <div className={styles.graphStage}>
        <div className={styles.treemap} role="group" aria-label="Treemap of Nepal major occupation groups">
          {rectangles.map((rect) => {
            const share = percent(rect.group.total, classified);
            const area = rect.width * rect.height;
            const showDetails = area >= 48;
            const style: CSSProperties = {
              left: `${rect.x}%`,
              top: `${rect.y}%`,
              width: `${rect.width}%`,
              height: `${rect.height}%`,
              background: tileBackground(layer, metricValue(rect.group, layer), range.min, range.max),
            };
            return (
              <button
                key={rect.group.id}
                type="button"
                data-occupation-id={rect.group.id}
                className={`${styles.tile} ${selectedId === rect.group.id ? styles.tileSelected : ""}`}
                style={style}
                aria-pressed={selectedId === rect.group.id}
                aria-label={`${rect.group.label}: ${formatPeople(rect.group.total)}, ${formatPercent(share)} of occupation-recorded population, ${metricText(rect.group, layer)}`}
                onClick={() => setSelectedId((current) => current === rect.group.id ? null : rect.group.id)}
                onPointerEnter={() => {
                  setHoveredId(rect.group.id);
                  if (tooltipRef.current) gsap.to(tooltipRef.current, { autoAlpha: 1, y: 0, duration: 0.1, overwrite: "auto" });
                }}
                onPointerMove={moveTooltip}
                onPointerLeave={() => {
                  setHoveredId(null);
                  if (tooltipRef.current) gsap.to(tooltipRef.current, { autoAlpha: 0, y: 3, duration: 0.08, overwrite: "auto" });
                }}
              >
                <span className={styles.tileTop}><small>ISCO {rect.group.iscoMajorGroup}</small><strong>{rect.group.shortLabel}</strong></span>
                {showDetails && <span className={styles.tileMetric}><b>{formatInteger(rect.group.total)}</b><span>people</span><small>{formatPercent(share)} of occupation recorded</small><small>{metricText(rect.group, layer)}</small></span>}
              </button>
            );
          })}
        </div>

        {selected && (
          <aside className={styles.detail} aria-live="polite">
            <div className={styles.detailHead}><div><span>ISCO {selected.iscoMajorGroup}</span><h3>{selected.label}</h3></div><button type="button" onClick={() => setSelectedId(null)}>Close</button></div>
            <div className={styles.selectedCount}><strong>{formatInteger(selected.total)}</strong><span>people</span><small>{formatPercent(percent(selected.total, classified), 2)} of occupation-recorded population</small></div>
            <dl className={styles.detailGrid}><div><dt>Women</dt><dd>{formatInteger(selected.female)} / {formatPercent(percent(selected.female, selected.total))}</dd></div><div><dt>Men</dt><dd>{formatInteger(selected.male)}</dd></div><div><dt>Urban</dt><dd>{formatInteger(selected.urban)} / {formatPercent(percent(selected.urban, selected.total))}</dd></div><div><dt>Rural</dt><dd>{formatInteger(selected.rural)}</dd></div><div><dt>Historical median earnings</dt><dd>{formatNepalRupees(selected.medianMonthlyEarnings)}</dd></div><div><dt>Earnings reference</dt><dd>{nationalEmploymentMeta.earningsReference}</dd></div></dl>
            <div className={styles.provinces}><h4>People by province</h4>{provinceNames.map((province) => <div className={styles.provinceRow} key={province}><span>{province}</span><div><i style={{ transform: `scaleX(${selected.provinces[province] / Math.max(...provinceNames.map((name) => selected.provinces[name]))})` }} /></div><strong>{formatInteger(selected.provinces[province])}</strong></div>)}</div>
            {evidenceMode && <div className={styles.evidence}><strong>Source boundary</strong><p>{employmentSources.census.definition}</p></div>}
          </aside>
        )}
      </div>

      <div ref={tooltipRef} className={styles.tooltip} aria-hidden="true">
        {hovered && <><strong>{hovered.shortLabel}</strong><span>{formatInteger(hovered.total)} people</span><small>{metricText(hovered, layer)}</small></>}
      </div>

      <div className={styles.sourceStrip}><div><span>Source</span><strong>National Population and Housing Census 2021</strong></div><div><span>Occupation not stated</span><strong>{formatInteger(nationalEmploymentMeta.occupationNotStated)}</strong></div><div><span>Data checks</span><strong>{employmentDataIntegrity.passedChecks} passed</strong></div></div>

      <details className={styles.tableDisclosure} open>
        <summary>Exact occupation values</summary>
        <div className={styles.tableWrap}><table><thead><tr><th>ISCO</th><th>Occupation</th><th>People</th><th>Share</th><th>Women</th><th>Urban</th><th>Historical median earnings</th></tr></thead><tbody>{[...occupationGroups].sort((a, b) => b.total - a.total).map((group) => <tr key={group.id}><td>{group.iscoMajorGroup}</td><td>{group.label}</td><td>{formatInteger(group.total)}</td><td>{formatPercent(percent(group.total, classified), 2)}</td><td>{formatInteger(group.female)} / {formatPercent(percent(group.female, group.total))}</td><td>{formatInteger(group.urban)} / {formatPercent(percent(group.urban, group.total))}</td><td>{formatNepalRupees(group.medianMonthlyEarnings)}</td></tr>)}</tbody></table></div>
      </details>
    </section>
  );
}
