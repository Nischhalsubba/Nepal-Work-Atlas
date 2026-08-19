import {
  marketEvidenceItems,
  marketEvidenceKindLabels,
  marketEvidenceMeta,
  type MarketEvidenceKind,
} from "@/data/market-evidence";
import { researchCheckpoint } from "@/data/research-checkpoint";

type Locale = "en" | "ne";

type Props = {
  locale: Locale;
  evidenceMode: boolean;
};

const copy = {
  en: {
    eyebrow: "Internet evidence and research scale",
    title: "Market Evidence",
    description:
      "Recovered records, external market benchmarks, source-level totals, and crawl universes are deliberately kept separate.",
    badge: "do not sum",
    recovered: "Recovered corpus",
    recoveredDetail: "Explicit openings in deduplicated Job Archive records",
    sourceProgress: "Source research progress",
    identified: "Identified source systems",
    normalized: "Native registry rows",
    reverified: "Priority sources reverified in Run 05",
    rule: "Evidence rule",
    ruleText:
      "These cards answer different questions. They must never be added together to create a national opening total.",
    observed: "Observed",
    source: "Source",
    open: "Open evidence",
  },
  ne: {
    eyebrow: "इन्टरनेट प्रमाण र अनुसन्धानको दायरा",
    title: "बजार प्रमाण",
    description:
      "फेला परेका अभिलेख, बाह्य बजार बेन्चमार्क, स्रोत-स्तरका कुल र अनुसन्धान कभरेजलाई जानाजानी अलग राखिएको छ।",
    badge: "जोड नगर्नुहोस्",
    recovered: "फेला परेको अनुसन्धान कोर्पस",
    recoveredDetail: "डिडुप्लिकेट गरिएको Job Archive मा स्पष्ट रूपमा उल्लेख भएका openings",
    sourceProgress: "स्रोत अनुसन्धान प्रगति",
    identified: "पहिचान गरिएका स्रोत प्रणाली",
    normalized: "Notion को नेटिभ रजिस्ट्री पङ्क्ति",
    reverified: "Run 05 मा पुनः प्रमाणित प्राथमिक स्रोत",
    rule: "प्रमाण नियम",
    ruleText:
      "यी कार्डहरूले फरक प्रश्नको उत्तर दिन्छन्। राष्ट्रिय opening कुल बनाउन यिनीहरूलाई कहिल्यै जोडिँदैन।",
    observed: "अवलोकन",
    source: "स्रोत",
    open: "प्रमाण खोल्नुहोस्",
  },
} as const;

const kindTone: Record<MarketEvidenceKind, string> = {
  "recovered-corpus": "recovered",
  "market-benchmark": "benchmark",
  "source-benchmark": "source",
  "coverage-universe": "coverage",
  "unknown-total": "unknown",
};

function formatValue(value: number | null, displayValue?: string) {
  if (displayValue) return displayValue;
  if (value === null) return "Unknown";
  return value.toLocaleString("en-US");
}

function formatDate(value?: string) {
  if (!value) return null;
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
    <section className="market-evidence-panel" id="market-evidence" aria-labelledby="market-evidence-title">
      <div className="market-evidence-heading">
        <div>
          <div className="eyebrow">{t.eyebrow}</div>
          <h2 id="market-evidence-title">{t.title}</h2>
          <p>{t.description}</p>
        </div>
        <span className="small-badge market-evidence-badge">{t.badge}</span>
      </div>

      <div className="market-evidence-legend" aria-label="Evidence type legend">
        <div className="market-legend-item recovered"><i /><span>{t.recovered}</span><strong>{researchCheckpoint.knownOpenings.toLocaleString("en-US")}</strong></div>
        <div className="market-legend-item benchmark"><i /><span>{marketEvidenceKindLabels["market-benchmark"]}</span><strong>context</strong></div>
        <div className="market-legend-item source"><i /><span>{marketEvidenceKindLabels["source-benchmark"]}</span><strong>extract next</strong></div>
        <div className="market-legend-item coverage"><i /><span>{marketEvidenceKindLabels["coverage-universe"]}</span><strong>research scope</strong></div>
      </div>

      <div className="market-evidence-grid">
        {marketEvidenceItems.map((item) => (
          <article key={item.id} className={`market-evidence-card tone-${kindTone[item.kind]}`}>
            <div className="market-evidence-card-top">
              <span className="market-kind">{marketEvidenceKindLabels[item.kind]}</span>
              {item.observedOn && <span className="market-date">{t.observed}: {formatDate(item.observedOn)}</span>}
            </div>
            <span className="market-card-label">{item.label}</span>
            <strong className="market-card-value">{formatValue(item.value, item.displayValue)}</strong>
            {item.secondary && <span className="market-card-secondary">{item.secondary}</span>}
            <div className="market-card-source">
              <span>{t.source}</span>
              <strong>{item.source}</strong>
              {item.sourceUrl && <a href={item.sourceUrl} target="_blank" rel="noreferrer">{t.open} ↗</a>}
            </div>
            {evidenceMode && <p className="market-card-note">{item.note}</p>}
          </article>
        ))}
      </div>

      <div className="market-research-progress">
        <div><span>{t.sourceProgress}</span><strong>{marketEvidenceMeta.researchRun}</strong></div>
        <div><span>{t.identified}</span><strong>{marketEvidenceMeta.identifiedSourceSystems}</strong></div>
        <div><span>{t.normalized}</span><strong>{marketEvidenceMeta.nativeSourceRegistryRows}</strong></div>
        <div><span>{t.reverified}</span><strong>{marketEvidenceMeta.prioritySourcesReverified}</strong></div>
      </div>

      <div className="market-evidence-rule">
        <strong>{t.rule}</strong>
        <span>{t.ruleText}</span>
      </div>
    </section>
  );
}
