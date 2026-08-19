import {
  marketEvidenceItems,
  marketEvidenceKindLabels,
  marketEvidenceMeta,
} from "@/data/market-evidence";
import { researchCheckpoint } from "@/data/research-checkpoint";
import { NationalEmploymentAtlas } from "@/components/national-employment-atlas";

type Locale = "en" | "ne";

type Props = {
  locale: Locale;
  evidenceMode: boolean;
};

const copy = {
  en: {
    eyebrow: "Evidence classes",
    title: "Market Evidence",
    description: "Recovered records, outside benchmarks, source-level totals, and crawl universes answer different questions. The interface keeps them separate on purpose.",
    rule: "Never sum these rows into a national opening total.",
    label: "Measure",
    value: "Value",
    kind: "Evidence class",
    observed: "Observed",
    source: "Source",
  },
  ne: {
    eyebrow: "प्रमाणका वर्गहरू",
    title: "बजार प्रमाण",
    description: "फेला परेका अभिलेख, बाह्य बेन्चमार्क, स्रोत-स्तरका कुल र अनुसन्धान कभरेजले फरक प्रश्नको उत्तर दिन्छन्। त्यसैले तिनीहरूलाई अलग राखिएको छ।",
    rule: "यी पङ्क्तिहरू जोडेर राष्ट्रिय opening कुल नबनाउनुहोस्।",
    label: "मापन",
    value: "मान",
    kind: "प्रमाण वर्ग",
    observed: "अवलोकन",
    source: "स्रोत",
  },
} as const;

function formatValue(value: number | null, displayValue?: string) {
  if (displayValue) return displayValue;
  if (value === null) return "Unknown";
  return value.toLocaleString("en-US");
}

function formatDate(value?: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

export function MarketEvidence({ locale, evidenceMode }: Props) {
  const t = copy[locale];

  return (
    <>
      <NationalEmploymentAtlas evidenceMode={evidenceMode} />

      <section className="flat-section market-evidence-section js-section" id="market-evidence" aria-labelledby="market-evidence-title">
        <div className="flat-heading">
          <div>
            <div className="eyebrow">{t.eyebrow}</div>
            <h2 id="market-evidence-title">{t.title}</h2>
            <p>{t.description}</p>
          </div>
          <span className="method-rule">{t.rule}</span>
        </div>

        <div className="evidence-table" role="table" aria-label="Market evidence classes">
          <div className="evidence-table-head" role="row">
            <span role="columnheader">{t.label}</span>
            <span role="columnheader">{t.value}</span>
            <span role="columnheader">{t.kind}</span>
            <span role="columnheader">{t.observed}</span>
            <span role="columnheader">{t.source}</span>
          </div>

          <div className="evidence-table-row recovered-row" role="row">
            <span role="cell"><strong>Recovered known openings</strong><small>Deduplicated research records only</small></span>
            <span role="cell" className="evidence-number">{researchCheckpoint.knownOpenings.toLocaleString("en-US")}</span>
            <span role="cell">Recovered corpus</span>
            <span role="cell">{researchCheckpoint.asOf}</span>
            <span role="cell">Nepal Work Atlas research archive</span>
          </div>

          {marketEvidenceItems.map((item) => (
            <div className="evidence-table-row" role="row" key={item.id}>
              <span role="cell"><strong>{item.label}</strong>{item.secondary && <small>{item.secondary}</small>}</span>
              <span role="cell" className="evidence-number">{formatValue(item.value, item.displayValue)}</span>
              <span role="cell">{marketEvidenceKindLabels[item.kind]}</span>
              <span role="cell">{formatDate(item.observedOn)}</span>
              <span role="cell" className="source-cell">
                <span>{item.source}</span>
                {item.sourceUrl && <a href={item.sourceUrl} target="_blank" rel="noreferrer">Evidence ↗</a>}
              </span>
              {evidenceMode && <p className="evidence-row-note">{item.note}</p>}
            </div>
          ))}
        </div>

        <div className="research-progress-line" aria-label="Research source progress">
          <span><b>{marketEvidenceMeta.identifiedSourceSystems}</b> identified source systems</span>
          <span><b>{marketEvidenceMeta.nativeSourceRegistryRows}</b> native registry rows</span>
          <span><b>{marketEvidenceMeta.prioritySourcesReverified}</b> priority sources reverified</span>
          <span>{marketEvidenceMeta.researchRun}</span>
        </div>
      </section>
    </>
  );
}
