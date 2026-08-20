import {
  marketEvidenceItems,
  marketEvidenceKindLabels,
  marketEvidenceMeta,
} from "@/data/market-evidence";
import { researchCheckpoint } from "@/data/research-checkpoint";

type Locale = "en" | "ne";

type Props = {
  locale: Locale;
  evidenceMode: boolean;
};

const copy = {
  en: {
    title: "Evidence classes",
    description: "These values answer different questions. Keeping them separate is part of the method, not a presentation preference.",
    ruleTitle: "Core rule",
    rule: "Employment stock, recovered vacancies, external market snapshots, source-level recruitment totals, and crawl universes are different measures. The Atlas never sums them into a national opening total.",
    progressTitle: "Coverage progress",
    progressDescription: "Research completeness is measured by source coverage and evidence quality, not by pretending to know the denominator of every Nepal job posting.",
    recovered: "Recovered known openings",
    recoveredNote: "Explicit counts in deduplicated recovered research records",
    source: "Source",
  },
  ne: {
    title: "\u092a\u094d\u0930\u092e\u093e\u0923\u0915\u093e \u0935\u0930\u094d\u0917",
    description: "\u092f\u0940 \u092e\u093e\u0928\u0939\u0930\u0942\u0932\u0947 \u092b\u0930\u0915 \u092a\u094d\u0930\u0936\u094d\u0928\u0915\u094b \u0909\u0924\u094d\u0924\u0930 \u0926\u093f\u0928\u094d\u091b\u0928\u094d, \u0924\u094d\u092f\u0938\u0948\u0932\u0947 \u0905\u0932\u0917 \u0930\u093e\u0916\u093f\u090f\u0915\u094b \u091b\u0964",
    ruleTitle: "\u092e\u0941\u0916\u094d\u092f \u0928\u093f\u092f\u092e",
    rule: "\u0930\u094b\u091c\u0917\u093e\u0930\u0940 \u0938\u0902\u0930\u091a\u0928\u093e, \u092b\u0947\u0932\u093e \u092a\u0930\u0947\u0915\u093e \u0930\u093f\u0915\u094d\u0924 \u092a\u0926, \u092c\u093e\u0939\u094d\u092f \u092c\u0947\u0928\u094d\u091a\u092e\u093e\u0930\u094d\u0915 \u0930 \u0915\u092d\u0930\u0947\u091c \u092b\u0930\u0915 \u092e\u093e\u092a\u0928 \u0939\u0941\u0928\u094d\u0964 \u092f\u093f\u0928\u0940\u0939\u0930\u0942\u0932\u093e\u0908 \u091c\u094b\u0921\u0947\u0930 \u0930\u093e\u0937\u094d\u091f\u094d\u0930\u093f\u092f \u0915\u0941\u0932 \u092c\u0928\u093e\u0907\u0901\u0926\u0948\u0928\u0964",
    progressTitle: "\u0915\u092d\u0930\u0947\u091c \u092a\u094d\u0930\u0917\u0924\u093f",
    progressDescription: "\u0905\u0928\u0941\u0938\u0928\u094d\u0927\u093e\u0928 \u092a\u094d\u0930\u0917\u0924\u093f \u0938\u094d\u0930\u094b\u0924 \u0915\u092d\u0930\u0947\u091c \u0930 \u092a\u094d\u0930\u092e\u093e\u0923\u0915\u094b \u0917\u0941\u0923\u0938\u094d\u0924\u0930\u092c\u093e\u091f \u092e\u093e\u092a\u093f\u0928\u094d\u091b\u0964",
    recovered: "\u092b\u0947\u0932\u093e \u092a\u0930\u0947\u0915\u093e \u091c\u094d\u091e\u093e\u0924 \u0930\u093f\u0915\u094d\u0924 \u092a\u0926",
    recoveredNote: "\u0921\u0941\u092a\u094d\u0932\u093f\u0915\u0947\u091f \u0939\u091f\u093e\u0907\u090f\u0915\u093e \u0905\u0928\u0941\u0938\u0928\u094d\u0927\u093e\u0928 \u0905\u092d\u093f\u0932\u0947\u0916\u0915\u093e \u0938\u094d\u092a\u0937\u094d\u091f \u0917\u0923\u0928\u093e \u092e\u093e\u0924\u094d\u0930",
    source: "\u0938\u094d\u0930\u094b\u0924",
  },
} as const;

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
    <section className="research-grid" aria-labelledby="market-evidence-title">
      <div className="research-panel evidence-panel">
        <h2 id="market-evidence-title">{t.title}</h2>
        <p>{t.description}</p>

        <div className="research-evidence-list">
          <div className="research-evidence-row recovered-evidence-row">
            <div>
              <strong>{t.recovered}</strong>
              <small>{t.recoveredNote}</small>
            </div>
            <span className="research-evidence-value">{researchCheckpoint.knownOpenings.toLocaleString("en-US")}</span>
            <span className="research-evidence-kind">Recovered corpus</span>
          </div>

          {marketEvidenceItems.map((item) => (
            <div className="research-evidence-row" key={item.id}>
              <div>
                <strong>{item.label}</strong>
                <small>
                  {item.secondary ?? item.source}
                  {item.observedOn ? ` / ${formatDate(item.observedOn)}` : ""}
                </small>
                {evidenceMode && <p>{item.note}</p>}
              </div>
              <span className="research-evidence-value">{formatValue(item.value, item.displayValue)}</span>
              <span className="research-evidence-kind">{marketEvidenceKindLabels[item.kind]}</span>
              {item.sourceUrl && <a className="research-evidence-link" href={item.sourceUrl} target="_blank" rel="noreferrer">{t.source}</a>}
            </div>
          ))}
        </div>
      </div>

      <div className="research-side">
        <div className="research-rule">
          <strong>{t.ruleTitle}</strong>
          <p>{t.rule}</p>
        </div>

        <div className="research-panel research-progress-panel">
          <h2>{t.progressTitle}</h2>
          <p>{t.progressDescription}</p>
          <div className="research-progress-list">
            <div><span>Archived master source rows</span><strong>{marketEvidenceMeta.archivedMasterSourceRows}</strong></div>
            <div><span>Native registry rows</span><strong>{marketEvidenceMeta.nativeSourceRegistryRows}</strong></div>
            <div><span>Priority sources reverified</span><strong>{marketEvidenceMeta.prioritySourcesReverified}</strong></div>
            <div><span>Research run</span><strong>{marketEvidenceMeta.researchRun}</strong></div>
          </div>
        </div>
      </div>
    </section>
  );
}
