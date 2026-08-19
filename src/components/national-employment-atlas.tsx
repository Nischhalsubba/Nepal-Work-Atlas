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
import { jobRecords, type JobRecord } from "@/data/job-records";
import {
  employmentSources,
  nationalEmploymentMeta,
  occupationGroups,
  provinceNames,
  type OccupationGroup,
  type OccupationId,
} from "@/data/national-employment";
import styles from "./employment-atlas.module.css";

type EmploymentLayer = "employment" | "women" | "earnings" | "urban" | "vacancies";
type Rect = { group: OccupationGroup; x: number; y: number; width: number; height: number };
type VacancySignal = { records: number; knownOpenings: number };

const occupationMatchers: Array<[OccupationId, RegExp]> = [
  ["armed-forces", /\b(army|armed force|armed police|police|soldier|constable)\b/i],
  ["craft-trades", /\b(electrician|plumber|carpenter|mason|welder|mechanic|tailor|craft)\b/i],
  ["plant-machine", /\b(driver|machine operator|plant operator|equipment operator|excavator|crane operator)\b/i],
  ["clerical", /\b(clerk|clerical|receptionist|secretary|data entry|office assistant|administrative assistant)\b/i],
  ["technicians", /\b(technician|lab assistant|laboratory assistant|health assistant|medical assistant|overseer|assistant engineer)\b/i],
  ["agriculture", /\b(agriculture|agricultural|forestry|forest ranger|fishery|fisheries|farm worker|farmer)\b/i],
  ["service-sales", /\b(sales|marketing|waiter|waitress|chef|cook|cashier|security guard|hospitality|housekeeping|barista)\b/i],
  ["elementary", /\b(helper|labourer|laborer|cleaner|peon|messenger|loader|unskilled)\b/i],
  ["managers", /\b(manager|director|chief|head of|team lead|coordinator|supervisor|administrator)\b/i],
  ["professionals", /\b(engineer|developer|programmer|software|teacher|professor|lecturer|doctor|nurse|accountant|lawyer|architect|analyst|consultant|researcher|pharmacist|dentist|veterinarian|designer|officer)\b/i],
];

const layerLabels: Record<EmploymentLayer, string> = {
  employment: "Employment",
  women: "Women share",
  earnings: "Median earnings",
  urban: "Urban share",
  vacancies: "Recovered hiring",
};

function classifyRecoveredOccupation(record: JobRecord): OccupationId | null {
  const text = `${record.title} ${record.industry ?? ""}`;
  return occupationMatchers.find(([, matcher]) => matcher.test(text))?.[0] ?? null;
}

function buildTreemap(groups: OccupationGroup[]): Rect[] {
  const sorted = [...groups].sort((a, b) => b.total - a.total);
  const split = (items: OccupationGroup[], x: number, y: number, width: number, height: number): Rect[] => {
    if (!items.length) return [];
    if (items.length === 1) return [{ group: items[0], x, y, width, height }];

    const total = items.reduce((sum, item) => sum + item.total, 0);
    let running = 0;
    let splitAt = 1;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (let index = 1; index < items.length; index += 1) {
      running += items[index - 1].total;
      const distance = Math.abs(total / 2 - running);
      if (distance < bestDistance) {
        bestDistance = distance;
        splitAt = index;
      }
    }

    const first = items.slice(0, splitAt);
    const second = items.slice(splitAt);
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
  };

  return split(sorted, 0, 0, 100, 100);
}

const percent = (value: number, total: number) => (total ? (value / total) * 100 : 0);
const compact = (value: number) => new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
const money = (value: number | null) => (value === null ? "Unknown" : `Rs ${value.toLocaleString("en-US")}`);

function layerValue(group: OccupationGroup, layer: EmploymentLayer, vacancy: Record<OccupationId, VacancySignal>) {
  if (layer === "employment") return group.total;
  if (layer === "women") return percent(group.female, group.total);
  if (layer === "urban") return percent(group.urban, group.total);
  if (layer === "earnings") return group.medianMonthlyEarnings;
  return vacancy[group.id].records;
}

function rangeFor(layer: EmploymentLayer, vacancy: Record<OccupationId, VacancySignal>) {
  const values = occupationGroups
    .map((group) => layerValue(group, layer, vacancy))
    .filter((value): value is number => value !== null);
  return { min: Math.min(...values), max: Math.max(...values) };
}

function normalize(value: number | null, min: number, max: number) {
  if (value === null) return null;
  return max <= min ? 0.5 : (value - min) / (max - min);
}

function tileBackground(layer: EmploymentLayer, value: number | null) {
  if (value === null) return "hsl(240 10% 13%)";
  const t = Math.max(0, Math.min(1, value));
  if (layer === "employment") return `hsl(229 ${12 + t * 18}% ${14 + t * 16}%)`;
  if (layer === "women") return `hsl(${286 + t * 44} ${28 + t * 28}% ${14 + t * 14}%)`;
  if (layer === "earnings") return `hsl(${177 - t * 38} ${28 + t * 26}% ${14 + t * 13}%)`;
  if (layer === "urban") return `hsl(${228 - t * 27} ${32 + t * 28}% ${14 + t * 14}%)`;
  return `hsl(${42 - t * 30} ${32 + t * 34}% ${14 + t * 13}%)`;
}

function layerText(group: OccupationGroup, layer: EmploymentLayer, vacancy: Record<OccupationId, VacancySignal>) {
  if (layer === "employment") return `${percent(group.total, nationalEmploymentMeta.classifiedOccupationPopulation).toFixed(1)}% of classified employment`;
  if (layer === "women") return `${percent(group.female, group.total).toFixed(1)}% women`;
  if (layer === "urban") return `${percent(group.urban, group.total).toFixed(1)}% urban`;
  if (layer === "earnings") return group.medianMonthlyEarnings === null ? "Pay unknown" : `${money(group.medianMonthlyEarnings)} / month`;
  return `${vacancy[group.id].records} recovered records`;
}

export function NationalEmploymentAtlas({ evidenceMode }: { evidenceMode: boolean }) {
  const rootRef = useRef<HTMLElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [layer, setLayer] = useState<EmploymentLayer>("employment");
  const [selectedId, setSelectedId] = useState<OccupationId | null>(null);
  const [hoveredId, setHoveredId] = useState<OccupationId | null>(null);
  const rectangles = useMemo(() => buildTreemap(occupationGroups), []);
  const classified = nationalEmploymentMeta.classifiedOccupationPopulation;

  const vacancySignals = useMemo(() => {
    const initial = Object.fromEntries(
      occupationGroups.map((group) => [group.id, { records: 0, knownOpenings: 0 }]),
    ) as Record<OccupationId, VacancySignal>;

    jobRecords.forEach((record) => {
      const id = classifyRecoveredOccupation(record);
      if (!id) return;
      initial[id].records += 1;
      initial[id].knownOpenings += record.openings ?? 0;
    });
    return initial;
  }, []);

  const unclassified = useMemo(
    () => jobRecords.filter((record) => classifyRecoveredOccupation(record) === null).length,
    [],
  );
  const selected = selectedId ? occupationGroups.find((group) => group.id === selectedId) ?? null : null;
  const hovered = hoveredId ? occupationGroups.find((group) => group.id === hoveredId) ?? null : null;
  const selectedSignal = selected ? vacancySignals[selected.id] : null;
  const range = rangeFor(layer, vacancySignals);
  const largest = occupationGroups.reduce((best, group) => (group.total > best.total ? group : best), occupationGroups[0]);
  const femaleShare = (occupationGroups.reduce((sum, group) => sum + group.female, 0) / classified) * 100;

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
    const mm = gsap.matchMedia();
    const ctx = gsap.context(() => {
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          `.${styles.tile}`,
          { autoAlpha: 0, y: 6 },
          { autoAlpha: 1, y: 0, duration: 0.3, stagger: 0.018, ease: "power2.out", clearProps: "transform" },
        );
      });
    }, root);
    return () => {
      mm.revert();
      ctx.revert();
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const tiles = root.querySelectorAll(`.${styles.tile}`);
    gsap.fromTo(
      tiles,
      { autoAlpha: 0.7 },
      { autoAlpha: 1, duration: 0.22, stagger: 0.012, ease: "power2.out", overwrite: "auto" },
    );
  }, [layer]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tiles = Array.from(root.querySelectorAll<HTMLElement>(`.${styles.tile}`));
    tiles.forEach((tile) => {
      const isSelected = tile.dataset.occupationId === selectedId;
      gsap.to(tile, {
        autoAlpha: selectedId && !isSelected ? 0.5 : 1,
        duration: reduce ? 0 : 0.18,
        ease: "power2.out",
        overwrite: "auto",
      });
    });

    if (selectedId) {
      const detail = root.querySelector(`.${styles.detailInner}`);
      const bars = root.querySelectorAll(`.${styles.provinceFill}`);
      if (detail) {
        gsap.fromTo(detail, { autoAlpha: 0, x: reduce ? 0 : 8 }, { autoAlpha: 1, x: 0, duration: reduce ? 0 : 0.22, ease: "power2.out" });
      }
      if (!reduce && bars.length) {
        gsap.fromTo(bars, { scaleX: 0 }, { scaleX: 1, duration: 0.26, stagger: 0.025, ease: "power2.out", transformOrigin: "left center" });
      }
    }
  }, [selectedId]);

  const legend = layer === "earnings"
    ? [money(range.min), money(range.max)]
    : layer === "vacancies"
      ? [`${range.min} recovered`, `${range.max} recovered`]
      : layer === "employment"
        ? [compact(range.min), compact(range.max)]
        : [`${range.min.toFixed(0)}%`, `${range.max.toFixed(0)}%`];

  const moveTooltip = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!tooltipRef.current) return;
    tooltipRef.current.style.left = `${Math.min(window.innerWidth - 330, event.clientX + 16)}px`;
    tooltipRef.current.style.top = `${Math.min(window.innerHeight - 180, event.clientY + 16)}px`;
  };

  const showTooltip = (id: OccupationId) => {
    setHoveredId(id);
    if (!tooltipRef.current) return;
    gsap.to(tooltipRef.current, { autoAlpha: 1, duration: 0.1, ease: "power2.out", overwrite: "auto" });
  };

  const hideTooltip = () => {
    if (tooltipRef.current) gsap.to(tooltipRef.current, { autoAlpha: 0, duration: 0.08, ease: "power1.in", overwrite: "auto" });
    setHoveredId(null);
  };

  return (
    <section ref={rootRef} className={styles.shell} id="employment-atlas" aria-labelledby="national-employment-title">
      <div className={styles.intro}>
        <div>
          <div className={styles.kicker}>Nepal occupation structure · NPHC 2021</div>
          <h2 id="national-employment-title">National Employment Atlas</h2>
          <p>
            Each rectangle&apos;s <strong>area</strong> is proportional to Nepal&apos;s official major-occupation population.
            <strong> Color</strong> changes with the selected Nepal-backed metric. Recovered vacancy evidence is a separate hiring signal, not employment stock.
          </p>
        </div>
        <div className={styles.sourceLinks}>
          <a href={employmentSources.census.url} target="_blank" rel="noreferrer">Census report ↗</a>
          <a href={employmentSources.census.dashboardUrl} target="_blank" rel="noreferrer">NSO dashboard ↗</a>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.layerControl}>
          <span className={styles.controlLabel}>Color layer</span>
          <div className={styles.layerButtons} aria-label="Employment atlas color layer">
            {(Object.entries(layerLabels) as [EmploymentLayer, string][]).map(([id, label]) => (
              <button key={id} type="button" aria-pressed={layer === id} onClick={() => setLayer(id)}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.legend} aria-label={`${layerLabels[layer]} legend`}>
          <span>{legend[0]}</span><i className={`${styles.gradient} ${styles[`gradient_${layer}`]}`} /><span>{legend[1]}</span>
        </div>
      </div>

      <div className={styles.stats}>
        <div><span>Economic-activity population</span><strong>{nationalEmploymentMeta.totalEconomicActivityPopulation.toLocaleString("en-US")}</strong><small>NPHC 2021 Table 38</small></div>
        <div><span>Occupation classified</span><strong>{classified.toLocaleString("en-US")}</strong><small>{nationalEmploymentMeta.occupationNotStated.toLocaleString("en-US")} occupation not stated</small></div>
        <div><span>Largest major group</span><strong>{percent(largest.total, classified).toFixed(1)}%</strong><small>{largest.shortLabel}</small></div>
        <div><span>Women in classified groups</span><strong>{femaleShare.toFixed(1)}%</strong><small>NPHC sex breakdown</small></div>
      </div>

      <div className={styles.graphLayout}>
        <div className={styles.graphColumn}>
          <div className={styles.graphMeta}>
            <span><b>Area</b> employment population</span>
            <span><b>Color</b> {layerLabels[layer].toLowerCase()}</span>
            <span><b>Click</b> inspect exact evidence</span>
          </div>
          <div className={styles.treemap} role="group" aria-label="Proportional treemap of Nepal major occupations">
            {rectangles.map((rect) => {
              const metric = layerValue(rect.group, layer, vacancySignals);
              const areaShare = percent(rect.group.total, classified);
              const style: CSSProperties = {
                left: `${rect.x}%`,
                top: `${rect.y}%`,
                width: `${rect.width}%`,
                height: `${rect.height}%`,
                background: tileBackground(layer, normalize(metric, range.min, range.max)),
              };
              const roomy = rect.width * rect.height >= 135;
              return (
                <button
                  key={rect.group.id}
                  type="button"
                  data-occupation-id={rect.group.id}
                  className={`${styles.tile} ${selectedId === rect.group.id ? styles.tileSelected : ""}`}
                  style={style}
                  onClick={() => setSelectedId((current) => current === rect.group.id ? null : rect.group.id)}
                  onPointerEnter={() => showTooltip(rect.group.id)}
                  onPointerMove={moveTooltip}
                  onPointerLeave={hideTooltip}
                  aria-pressed={selectedId === rect.group.id}
                  aria-label={`${rect.group.label}: ${rect.group.total.toLocaleString("en-US")} people, ${areaShare.toFixed(1)} percent, ${layerText(rect.group, layer, vacancySignals)}`}
                >
                  <span className={styles.tileTop}><span className={styles.tileCode}>ISCO {rect.group.iscoMajorGroup}</span>{roomy && <span className={styles.tileLabel}>{rect.group.shortLabel}</span>}</span>
                  {roomy && <span className={styles.tileMetric}><strong>{compact(rect.group.total)}</strong><small>{areaShare.toFixed(1)}% · {layerText(rect.group, layer, vacancySignals)}</small></span>}
                </button>
              );
            })}
          </div>
        </div>

        <aside className={styles.detail} aria-live="polite">
          {selected ? (
            <div className={styles.detailInner}>
              <div className={styles.detailHead}>
                <div><span>ISCO major group {selected.iscoMajorGroup}</span><h3>{selected.label}</h3></div>
                <button type="button" onClick={() => setSelectedId(null)} aria-label="Close occupation detail">Close</button>
              </div>
              <dl className={styles.detailGrid}>
                <div><dt>People</dt><dd>{selected.total.toLocaleString("en-US")}</dd></div>
                <div><dt>National share</dt><dd>{percent(selected.total, classified).toFixed(2)}%</dd></div>
                <div><dt>Women</dt><dd>{selected.female.toLocaleString("en-US")} · {percent(selected.female, selected.total).toFixed(1)}%</dd></div>
                <div><dt>Men</dt><dd>{selected.male.toLocaleString("en-US")} · {percent(selected.male, selected.total).toFixed(1)}%</dd></div>
                <div><dt>Urban</dt><dd>{selected.urban.toLocaleString("en-US")} · {percent(selected.urban, selected.total).toFixed(1)}%</dd></div>
                <div><dt>Rural</dt><dd>{selected.rural.toLocaleString("en-US")} · {percent(selected.rural, selected.total).toFixed(1)}%</dd></div>
                <div><dt>Median monthly employee earnings</dt><dd>{money(selected.medianMonthlyEarnings)}</dd></div>
                <div><dt>Recovered hiring signal</dt><dd>{selectedSignal?.records ?? 0} records · {selectedSignal?.knownOpenings ?? 0} known openings</dd></div>
              </dl>

              <div className={styles.provinces}>
                <h4>2021 occupation population by province</h4>
                {provinceNames
                  .map((province) => [province, selected.provinces[province]] as const)
                  .sort((a, b) => b[1] - a[1])
                  .map(([province, value]) => {
                    const max = Math.max(...provinceNames.map((name) => selected.provinces[name]));
                    return (
                      <div className={styles.provinceRow} key={province}>
                        <span>{province}</span>
                        <div className={styles.track}><i className={styles.provinceFill} style={{ width: `${percent(value, max)}%` }} /></div>
                        <strong>{compact(value)}</strong>
                      </div>
                    );
                  })}
              </div>

              {evidenceMode && (
                <div className={styles.methodNote}>
                  <strong>Evidence boundary</strong>
                  <p>{employmentSources.census.definition}</p>
                  <p>{employmentSources.earnings.definition}</p>
                  <p>{jobRecords.length - unclassified} of {jobRecords.length} embedded recovered vacancy records map to these broad occupation groups through a conservative title classifier; {unclassified} remain unclassified.</p>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.detailPlaceholder}>
              <span>Occupation inspector</span>
              <strong>Select a rectangle</strong>
              <p>Exact employment, sex, urban/rural, province, earnings, and recovered hiring evidence will appear here.</p>
            </div>
          )}
        </aside>
      </div>

      <details className={styles.tableDisclosure}>
        <summary>Exact occupation table</summary>
        <div className={styles.tableWrap}>
          <table>
            <thead><tr><th>ISCO</th><th>Occupation</th><th>People</th><th>Share</th><th>Women</th><th>Urban</th><th>Median earnings</th><th>Recovered records</th></tr></thead>
            <tbody>
              {[...occupationGroups].sort((a, b) => b.total - a.total).map((group) => (
                <tr key={group.id}>
                  <td>{group.iscoMajorGroup}</td><td>{group.label}</td><td>{group.total.toLocaleString("en-US")}</td><td>{percent(group.total, classified).toFixed(2)}%</td><td>{percent(group.female, group.total).toFixed(1)}%</td><td>{percent(group.urban, group.total).toFixed(1)}%</td><td>{money(group.medianMonthlyEarnings)}</td><td>{vacancySignals[group.id].records}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      <div ref={tooltipRef} className={styles.tooltip} role="status" aria-hidden={!hovered}>
        {hovered && (
          <>
            <strong>{hovered.label}</strong>
            <span>{hovered.total.toLocaleString("en-US")} people · {percent(hovered.total, classified).toFixed(1)}%</span>
            <span>{layerText(hovered, layer, vacancySignals)}</span>
          </>
        )}
      </div>
    </section>
  );
}
