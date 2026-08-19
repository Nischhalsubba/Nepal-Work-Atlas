"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
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

type EmploymentLayer = "women" | "earnings" | "urban" | "vacancies";
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
    let best = Number.POSITIVE_INFINITY;
    for (let index = 1; index < items.length; index += 1) {
      running += items[index - 1].total;
      const distance = Math.abs(total / 2 - running);
      if (distance < best) { best = distance; splitAt = index; }
    }
    const first = items.slice(0, splitAt);
    const second = items.slice(splitAt);
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

const percent = (value: number, total: number) => total ? value / total * 100 : 0;
const compact = (value: number) => new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
const money = (value: number | null) => value === null ? "Unknown" : `Rs ${value.toLocaleString("en-US")}`;

function layerValue(group: OccupationGroup, layer: EmploymentLayer, vacancy: Record<OccupationId, VacancySignal>) {
  if (layer === "women") return percent(group.female, group.total);
  if (layer === "urban") return percent(group.urban, group.total);
  if (layer === "earnings") return group.medianMonthlyEarnings;
  return vacancy[group.id].records;
}

function rangeFor(layer: EmploymentLayer, vacancy: Record<OccupationId, VacancySignal>) {
  const values = occupationGroups.map((group) => layerValue(group, layer, vacancy)).filter((value): value is number => value !== null);
  return { min: Math.min(...values), max: Math.max(...values) };
}

function normalize(value: number | null, min: number, max: number) {
  if (value === null) return null;
  return max <= min ? .5 : (value - min) / (max - min);
}

function background(layer: EmploymentLayer, value: number | null) {
  if (value === null) return "hsl(214 18% 16%)";
  const t = Math.max(0, Math.min(1, value));
  if (layer === "women") return `hsl(${214 + t * 108} ${42 + t * 10}% ${15 + t * 9}%)`;
  if (layer === "earnings") return `hsl(${190 - t * 154} ${44 + t * 9}% ${15 + t * 10}%)`;
  if (layer === "urban") return `hsl(${218 - t * 42} ${41 + t * 9}% ${15 + t * 9}%)`;
  return `hsl(${218 - t * 204} ${44 + t * 11}% ${14 + t * 10}%)`;
}

function layerText(group: OccupationGroup, layer: EmploymentLayer, vacancy: Record<OccupationId, VacancySignal>) {
  if (layer === "women") return `${percent(group.female, group.total).toFixed(1)}% women`;
  if (layer === "urban") return `${percent(group.urban, group.total).toFixed(1)}% urban`;
  if (layer === "earnings") return group.medianMonthlyEarnings === null ? "Pay unknown" : `${money(group.medianMonthlyEarnings)} / month`;
  return `${vacancy[group.id].records} recovered records`;
}

export function NationalEmploymentAtlas({ evidenceMode }: { evidenceMode: boolean }) {
  const [layer, setLayer] = useState<EmploymentLayer>("women");
  const [selectedId, setSelectedId] = useState<OccupationId | null>(null);
  const rectangles = useMemo(() => buildTreemap(occupationGroups), []);
  const classified = nationalEmploymentMeta.classifiedOccupationPopulation;

  const vacancySignals = useMemo(() => {
    const initial = Object.fromEntries(occupationGroups.map((group) => [group.id, { records: 0, knownOpenings: 0 }])) as Record<OccupationId, VacancySignal>;
    jobRecords.forEach((record) => {
      const id = classifyRecoveredOccupation(record);
      if (!id) return;
      initial[id].records += 1;
      initial[id].knownOpenings += record.openings ?? 0;
    });
    return initial;
  }, []);

  const unclassified = useMemo(() => jobRecords.filter((record) => classifyRecoveredOccupation(record) === null).length, []);
  const selected = selectedId ? occupationGroups.find((group) => group.id === selectedId) ?? null : null;
  const selectedSignal = selected ? vacancySignals[selected.id] : null;
  const range = rangeFor(layer, vacancySignals);
  const largest = occupationGroups.reduce((best, group) => group.total > best.total ? group : best, occupationGroups[0]);
  const femaleShare = occupationGroups.reduce((sum, group) => sum + group.female, 0) / classified * 100;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setSelectedId(null); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const legend = layer === "earnings"
    ? [money(range.min), money(range.max)]
    : layer === "vacancies"
      ? [`${range.min} recovered`, `${range.max} recovered`]
      : [`${range.min.toFixed(0)}%`, `${range.max.toFixed(0)}%`];

  return (
    <section className={styles.employmentShell} aria-labelledby="national-employment-title">
      <div className={styles.header}>
        <div><div className="eyebrow">National occupation structure</div><h2 id="national-employment-title">National Employment Atlas</h2><p>Karpathy-style proportional occupation map for Nepal. Rectangle area is fixed to official NPHC 2021 occupation population; color is a separate comparison layer.</p></div>
        <div className={styles.headerMeta}><span className={`${styles.badge} ${styles.badgeStrong}`}>Official NSO 2021</span><span className={styles.badge}>10 major groups</span></div>
      </div>

      <div className={styles.controlBand}>
        <div className={styles.layerPicker}><span>Color by</span><div className={styles.layerButtons} aria-label="Employment atlas color layer">
          {([ ["women", "Women share"], ["earnings", "Median earnings"], ["urban", "Urban share"], ["vacancies", "Recovered vacancy signal"] ] as [EmploymentLayer, string][]).map(([id, label]) => <button key={id} type="button" aria-pressed={layer === id} onClick={() => setLayer(id)}>{label}</button>)}
          <button type="button" disabled title="Nepal-specific evidence-reviewed scoring is not complete.">AI exposure · queued</button>
        </div></div>
        <div className={styles.legend}><span className={styles.legendTitle}>{layer === "earnings" ? "NLFS 2017/18 employees only" : layer === "vacancies" ? "embedded recovered vacancies only" : "NPHC 2021"}</span><div className={styles.legendRow}><span>{legend[0]}</span><i className={styles.gradient} /><span>{legend[1]}</span></div></div>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}><span>Economic-activity population</span><strong>{compact(nationalEmploymentMeta.totalEconomicActivityPopulation)}</strong><small>NPHC 2021 Table 38</small></div>
        <div className={styles.stat}><span>Occupation classified</span><strong>{compact(classified)}</strong><small>{nationalEmploymentMeta.occupationNotStated.toLocaleString("en-US")} not stated</small></div>
        <div className={styles.stat}><span>Largest major group</span><strong>{percent(largest.total, classified).toFixed(1)}%</strong><small>{largest.shortLabel}</small></div>
        <div className={styles.stat}><span>Women in classified groups</span><strong>{femaleShare.toFixed(1)}%</strong><small>NPHC 2021 sex breakdown</small></div>
        <div className={styles.stat}><span>Vacancy records mapped</span><strong>{jobRecords.length - unclassified}/{jobRecords.length}</strong><small>{unclassified} remain unclassified</small></div>
      </div>

      <div className={styles.graphLayout}>
        <div className={styles.graphColumn}>
          <div className={styles.graphIntro}><span><strong>Area:</strong> people by major occupation</span><span><strong>Color:</strong> {layer === "women" ? "women share" : layer === "earnings" ? "median employee earnings" : layer === "urban" ? "urban share" : "recovered vacancy records"}</span></div>
          <div className={styles.treemap} role="group" aria-label="Proportional treemap of Nepal major occupations">
            {rectangles.map((rect) => {
              const metric = layerValue(rect.group, layer, vacancySignals);
              const areaShare = percent(rect.group.total, classified);
              const style: CSSProperties = { left: `${rect.x}%`, top: `${rect.y}%`, width: `${rect.width}%`, height: `${rect.height}%`, background: background(layer, normalize(metric, range.min, range.max)) };
              const roomy = rect.width * rect.height >= 140;
              return <button key={rect.group.id} type="button" className={`${styles.tile} ${selectedId === rect.group.id ? styles.tileSelected : ""}`} style={style} onClick={() => setSelectedId(rect.group.id)} aria-label={`${rect.group.label}: ${rect.group.total.toLocaleString("en-US")} people, ${areaShare.toFixed(1)} percent, ${layerText(rect.group, layer, vacancySignals)}`}>
                <span><span className={styles.tileCode}>ISCO {rect.group.iscoMajorGroup}</span>{roomy && <span className={styles.tileLabel}>{rect.group.shortLabel}</span>}</span>
                {roomy && <span className={styles.tileMetric}><strong>{compact(rect.group.total)}</strong><small>{areaShare.toFixed(1)}% · {layerText(rect.group, layer, vacancySignals)}</small></span>}
              </button>;
            })}
          </div>
        </div>

        <aside className={styles.detail} aria-live="polite">
          {selected ? <>
            <div className={styles.detailHead}><div><div className="eyebrow">ISCO major group {selected.iscoMajorGroup}</div><h3>{selected.label}</h3><p>Official population structure with separate contextual layers.</p></div><button className={styles.close} type="button" onClick={() => setSelectedId(null)} aria-label="Close occupation detail">×</button></div>
            <div className={styles.detailGrid}>
              <div><span>People</span><strong>{selected.total.toLocaleString("en-US")}</strong></div><div><span>National share</span><strong>{percent(selected.total, classified).toFixed(2)}%</strong></div>
              <div><span>Women</span><strong>{selected.female.toLocaleString("en-US")} · {percent(selected.female, selected.total).toFixed(1)}%</strong></div><div><span>Men</span><strong>{selected.male.toLocaleString("en-US")} · {percent(selected.male, selected.total).toFixed(1)}%</strong></div>
              <div><span>Urban</span><strong>{selected.urban.toLocaleString("en-US")} · {percent(selected.urban, selected.total).toFixed(1)}%</strong></div><div><span>Rural</span><strong>{selected.rural.toLocaleString("en-US")} · {percent(selected.rural, selected.total).toFixed(1)}%</strong></div>
              <div><span>Median monthly earnings</span><strong>{money(selected.medianMonthlyEarnings)}</strong></div><div><span>Recovered vacancy signal</span><strong>{selectedSignal?.records ?? 0} records · {selectedSignal?.knownOpenings ?? 0} known openings</strong></div>
            </div>
            <div className={styles.provinces}><h4>2021 occupation population by province</h4>{provinceNames.map((province) => [province, selected.provinces[province]] as const).sort((a, b) => b[1] - a[1]).map(([province, value]) => <div className={styles.provinceRow} key={province}><span>{province}</span><div className={styles.track}><i style={{ width: `${percent(value, Math.max(...provinceNames.map((name) => selected.provinces[name])))}%` }} /></div><strong>{compact(value)}</strong></div>)}</div>
            <div className={styles.sourceBox}><strong>Primary source</strong><span>{employmentSources.census.label}</span><a href={employmentSources.census.url} target="_blank" rel="noreferrer">Open official census report ↗</a><a href={employmentSources.census.dashboardUrl} target="_blank" rel="noreferrer">Open NSO census dashboard ↗</a>{selected.medianMonthlyEarnings !== null && <a href={employmentSources.earnings.url} target="_blank" rel="noreferrer">Open NLFS earnings table ↗</a>}</div>
            {evidenceMode && <p className={styles.methodNote}>Census area measures people aged 10+ who performed economic activity in the preceding 12 months. Earnings are employee-only medians from 2017/18, not current pay. The vacancy layer is a conservative title-based mapping over the embedded recovered corpus and is not a national vacancy rate.</p>}
          </> : <div className={styles.placeholder}><strong>Select an occupation</strong><span>Inspect exact population, sex, urban/rural and province evidence, historical employee earnings, and the separately derived vacancy signal.</span></div>}
        </aside>
      </div>

      <details className={styles.fallback}><summary>Accessible occupation table · exact values</summary><div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Occupation</th><th>People</th><th>Share</th><th>Women</th><th>Urban</th><th>Median monthly earnings</th><th>Recovered vacancy records</th></tr></thead><tbody>{occupationGroups.map((group) => <tr key={group.id}><td><button type="button" onClick={() => setSelectedId(group.id)}>{group.iscoMajorGroup} · {group.label}</button></td><td>{group.total.toLocaleString("en-US")}</td><td>{percent(group.total, classified).toFixed(2)}%</td><td>{percent(group.female, group.total).toFixed(1)}%</td><td>{percent(group.urban, group.total).toFixed(1)}%</td><td>{money(group.medianMonthlyEarnings)}</td><td>{vacancySignals[group.id].records}</td></tr>)}</tbody></table></div></details>
    </section>
  );
}
