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
type TreemapRect = {
  group: OccupationGroup;
  x: number;
  y: number;
  width: number;
  height: number;
};

const LAYERS = {
  employment: {
    label: "People",
    description: "Color follows occupation size. Rectangle size always shows the exact number of people.",
  },
  women: {
    label: "Women share",
    description: "Darker tiles mean a larger share of women. Rectangle size does not change.",
  },
  urban: {
    label: "Urban share",
    description: "Darker tiles mean a larger urban share. Rectangle size does not change.",
  },
  earnings: {
    label: "Earnings",
    description: "Color shows historical median monthly employee earnings from 2017/18. Rectangle size remains 2021 occupation population.",
  },
} as const satisfies Record<Layer, { label: string; description: string }>;

const percent = (value: number, total: number) => (total > 0 ? (value / total) * 100 : 0);

function buildTreemap(groups: readonly OccupationGroup[]): TreemapRect[] {
  const sorted = [...groups].sort((a, b) => b.total - a.total);

  function split(
    items: OccupationGroup[],
    x: number,
    y: number,
    width: number,
    height: number,
  ): TreemapRect[] {
    if (items.length === 0) return [];
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
      return [
        ...split(first, x, y, firstWidth, height),
        ...split(second, x + firstWidth, y, width - firstWidth, height),
      ];
    }

    const firstHeight = height * ratio;
    return [
      ...split(first, x, y, width, firstHeight),
      ...split(second, x, y + firstHeight, width, height - firstHeight),
    ];
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
  if (layer === "employment") {
    return `${formatPercent(percent(group.total, nationalEmploymentMeta.classifiedOccupationPopulation))} of classified occupation population`;
  }
  if (layer === "women") return `${formatPercent(percent(group.female, group.total))} women`;
  if (layer === "urban") return `${formatPercent(percent(group.urban, group.total))} urban`;
  return group.medianMonthlyEarnings === null
    ? "Earnings unknown"
    : `${formatNepalRupees(group.medianMonthlyEarnings)} median monthly employee earnings`;
}

function metricRange(layer: Layer) {
  const values = occupationGroups
    .map((group) => metricValue(group, layer))
    .filter((value): value is number => value !== null);
  return { min: Math.min(...values), max: Math.max(...values) };
}

function tileBackground(layer: Layer, value: number | null, min: number, max: number) {
  if (value === null) return "hsl(240 10% 13%)";
  const t = max <= min ? 0.5 : Math.max(0, Math.min(1, (value - min) / (max - min)));
  if (layer === "employment") return `hsl(229 ${14 + t * 24}% ${15 + t * 20}%)`;
  if (layer === "women") return `hsl(${286 + t * 42} ${28 + t * 34}% ${14 + t * 18}%)`;
  if (layer === "urban") return `hsl(${228 - t * 28} ${32 + t * 34}% ${14 + t * 18}%)`;
  return `hsl(${177 - t * 38} ${28 + t * 32}% ${14 + t * 17}%)`;
}

function total(field: "female" | "urban") {
  return occupationGroups.reduce((sum, group) => sum + group[field], 0);
}

export function NationalEmploymentAtlas({ evidenceMode }: { evidenceMode: boolean }) {
  const rootRef = useRef<HTMLElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const hasMountedLayerRef = useRef(false);
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
    const root = rootRef.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const context = gsap.context(() => {
      gsap.timeline({ defaults: { ease: "power2.out" } })
        .fromTo(`.${styles.trustBar}`, { autoAlpha: 0, y: -8 }, { autoAlpha: 1, y: 0, duration: 0.28 })
        .fromTo(`.${styles.summary} > div`, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.3, stagger: 0.035 }, "-=0.12")
        .fromTo(`.${styles.tile}`, { autoAlpha: 0, scale: 0.985 }, { autoAlpha: 1, scale: 1, duration: 0.42, stagger: 0.025, ease: "power3.out" }, "-=0.05");
    }, root);

    return () => context.revert();
  }, []);

  useEffect(() => {
    if (!hasMountedLayerRef.current) {
      hasMountedLayerRef.current = true;
      return;
    }

    const root = rootRef.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const context = gsap.context(() => {
      gsap.fromTo(
        `.${styles.tile}`,
        { autoAlpha: 0.62, scale: 0.99 },
        { autoAlpha: 1, scale: 1, duration: 0.32, stagger: 0.016, ease: "power3.out" },
      );
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
        gsap.to(tile, {
          autoAlpha: selectedId && !active ? 0.42 : 1,
          scale: active && selectedId ? 1.006 : 1,
          duration: reducedMotion ? 0 : 0.22,
          ease: "power2.out",
        });
      });

      const panel = root.querySelector(`.${styles.detail}`);
      if (panel && selectedId && !reducedMotion) {
        gsap.fromTo(panel, { autoAlpha: 0, x: 14 }, { autoAlpha: 1, x: 0, duration: 0.28, ease: "power2.out" });
      }
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
    tooltipRef.current.style.left = `${Math.min(window.innerWidth - 360, event.clientX + 16)}px`;
    tooltipRef.current.style.top = `${Math.min(window.innerHeight - 190, event.clientY + 16)}px`;
  };

  return (
    <section ref={rootRef} className={styles.shell} id="employment-atlas" aria-labelledby="employment-title">
      <div className={styles.trustBar}>
        <strong>Nepal only</strong>
        <span>Official national employment data</span>
        <span>NPHC 2021</span>
        <span>NSO Nepal</span>
        <span className={styles.integrity}>Reconciliation passed · {employmentDataIntegrity.passedChecks} checks</span>
      </div>

      <header className={styles.header}>
        <div>
          <div className={styles.kicker}>National employment atlas / Nepal / NPHC 2021</div>
          <h2 id="employment-title">Where people work in Nepal</h2>
          <p>Rectangle size shows the <strong>number of people</strong>. Color shows the selected comparison. All primary counts are written in full, with no unexplained K or M abbreviations.</p>
        </div>
        <div className={styles.sourceLinks}>
          <a href={employmentSources.census.dashboardUrl} target="_blank" rel="noreferrer">NSO dashboard</a>
          <a href={employmentSources.census.url} target="_blank" rel="noreferrer">Census report</a>
        </div>
      </header>

      <div className={styles.summary} aria-label="Nepal employment summary">
        <div><span>People with economic activity</span><strong>{formatInteger(nationalEmploymentMeta.totalEconomicActivityPopulation)}</strong><small>NPHC 2021 · age 10+</small></div>
        <div><span>Occupation classified</span><strong>{formatInteger(classified)}</strong><small>{formatInteger(nationalEmploymentMeta.occupationNotStated)} not stated</small></div>
        <div><span>Women</span><strong>{formatPercent(percent(womenTotal, classified))}</strong><small>{formatPeople(womenTotal)}</small></div>
        <div><span>Urban</span><strong>{formatPercent(percent(urbanTotal, classified))}</strong><small>{formatPeople(urbanTotal)}</small></div>
        <div><span>Current data depth</span><strong>{occupationGroups.length} groups</strong><small>official 2021 major occupation level</small></div>
      </div>

      <div className={styles.controls}>
        <div className={styles.layerControl}>
          <span>Color by</span>
          <div className={styles.layerButtons}>
            {(Object.keys(LAYERS) as Layer[]).map((id) => (
              <button key={id} type="button" aria-pressed={layer === id} onClick={() => setLayer(id)}>{LAYERS[id].label}</button>
            ))}
          </div>
        </div>
        <div className={styles.legend} aria-label={`${LAYERS[layer].label} color range`}>
          <span>{legend[0]}</span>
          <i className={`${styles.gradient} ${styles[`gradient_${layer}`]}`} aria-hidden="true" />
          <span>{legend[1]}</span>
        </div>
      </div>

      <div className={styles.guide}>
        <div><span>Rectangle size</span><strong>Exact number of people</strong><small>Large rectangle = more people in that occupation.</small></div>
        <div><span>Current color</span><strong>{LAYERS[layer].label}</strong><small>{LAYERS[layer].description}</small></div>
        <div><span>Data depth</span><strong>10 official major groups</strong><small>No invented sub-occupations. Deeper Nepal detail will appear only after official counts are validated.</small></div>
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
                aria-label={`${rect.group.label}: ${formatPeople(rect.group.total)}, ${formatPercent(share)} of classified occupation population, ${metricText(rect.group, layer)}`}
                onClick={() => setSelectedId((current) => current === rect.group.id ? null : rect.group.id)}
                onPointerEnter={() => {
                  setHoveredId(rect.group.id);
                  if (tooltipRef.current) gsap.to(tooltipRef.current, { autoAlpha: 1, y: 0, duration: 0.14 });
                }}
                onPointerMove={moveTooltip}
                onPointerLeave={() => {
                  setHoveredId(null);
                  if (tooltipRef.current) gsap.to(tooltipRef.current, { autoAlpha: 0, y: 4, duration: 0.1 });
                }}
              >
                <span className={styles.tileTop}><small>ISCO {rect.group.iscoMajorGroup}</small><strong>{rect.group.shortLabel}</strong></span>
                {showDetails && (
                  <span className={styles.tileMetric}>
                    <b>{formatInteger(rect.group.total)}</b>
                    <span>people</span>
                    <small>{formatPercent(share)} of classified occupation population</small>
                    <small>{metricText(rect.group, layer)}</small>
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {selected && (
          <aside className={styles.detail} aria-live="polite">
            <div className={styles.detailHead}>
              <div><span>ISCO major group {selected.iscoMajorGroup}</span><h3>{selected.label}</h3></div>
              <button type="button" onClick={() => setSelectedId(null)}>Close</button>
            </div>
            <div className={styles.selectedCount}><strong>{formatInteger(selected.total)}</strong><span>people</span><small>{formatPercent(percent(selected.total, classified), 2)} of classified occupation population</small></div>
            <dl className={styles.detailGrid}>
              <div><dt>Women</dt><dd>{formatInteger(selected.female)} · {formatPercent(percent(selected.female, selected.total))}</dd></div>
              <div><dt>Men</dt><dd>{formatInteger(selected.male)} · {formatPercent(percent(selected.male, selected.total))}</dd></div>
              <div><dt>Urban</dt><dd>{formatInteger(selected.urban)} · {formatPercent(percent(selected.urban, selected.total))}</dd></div>
              <div><dt>Rural</dt><dd>{formatInteger(selected.rural)} · {formatPercent(percent(selected.rural, selected.total))}</dd></div>
              <div><dt>Median employee earnings</dt><dd>{formatNepalRupees(selected.medianMonthlyEarnings)}</dd></div>
              <div><dt>Earnings reference</dt><dd>{nationalEmploymentMeta.earningsReference}</dd></div>
            </dl>
            <div className={styles.provinces}>
              <h4>2021 occupation population by province</h4>
              {provinceNames.map((province) => [province, selected.provinces[province]] as const).sort((a, b) => b[1] - a[1]).map(([province, value]) => {
                const max = Math.max(...provinceNames.map((name) => selected.provinces[name]));
                return <div className={styles.provinceRow} key={province}><span>{province}</span><div><i style={{ width: `${percent(value, max)}%` }} /></div><strong>{formatInteger(value)}</strong></div>;
              })}
            </div>
            {evidenceMode && <div className={styles.evidence}><strong>Evidence boundary</strong><p>{employmentSources.census.definition}</p><p>{employmentSources.earnings.definition}</p></div>}
          </aside>
        )}
      </div>

      <div className={styles.sourceStrip}>
        <div><span>Primary source</span><strong>National Population and Housing Census 2021 · NSO Nepal</strong></div>
        <div><span>Accuracy rule</span><strong>No invented sub-occupations or unverified counts</strong></div>
        <div><span>Reconciliation</span><strong>{employmentDataIntegrity.passedChecks} checks passed</strong></div>
      </div>

      <details className={styles.tableDisclosure} open>
        <summary>Exact occupation table · official values</summary>
        <div className={styles.tableWrap}>
          <table>
            <thead><tr><th>ISCO</th><th>Occupation</th><th>People</th><th>Share</th><th>Women</th><th>Urban</th><th>Median earnings</th></tr></thead>
            <tbody>{[...occupationGroups].sort((a, b) => b.total - a.total).map((group) => <tr key={group.id}><td>{group.iscoMajorGroup}</td><td>{group.label}</td><td>{formatInteger(group.total)}</td><td>{formatPercent(percent(group.total, classified), 2)}</td><td>{formatInteger(group.female)} · {formatPercent(percent(group.female, group.total))}</td><td>{formatInteger(group.urban)} · {formatPercent(percent(group.urban, group.total))}</td><td>{formatNepalRupees(group.medianMonthlyEarnings)}</td></tr>)}</tbody>
          </table>
        </div>
      </details>

      <div ref={tooltipRef} className={styles.tooltip} role="status" aria-hidden={!hovered}>
        {hovered && <><strong>{hovered.label}</strong><span>{formatPeople(hovered.total)}</span><span>{formatPercent(percent(hovered.total, classified))} of classified occupation population</span><span>{metricText(hovered, layer)}</span><small>Click for exact province, sex, locality, earnings, and source evidence.</small></>}
      </div>
    </section>
  );
}
