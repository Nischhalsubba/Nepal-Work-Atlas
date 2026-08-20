import { marketScaleEvidence } from "@/data/market-scale-evidence";

type Props = {
  title?: string;
  description?: string;
};

export function MarketScaleSummary({
  title = "Nepal work at national scale",
  description = "These measures show the scale of work and labour flows. They are not interchangeable with recovered job postings.",
}: Props) {
  return (
    <section className="market-scale-section" aria-labelledby="market-scale-title">
      <div className="surface-heading market-scale-heading">
        <div>
          <span className="section-kicker">Market scale</span>
          <h2 id="market-scale-title">{title}</h2>
          <p>{description}</p>
        </div>
        <span>Evidence checked 20 Aug 2026</span>
      </div>

      <div className="market-scale-grid">
        {marketScaleEvidence.map((item) => (
          <article className="market-scale-card" key={item.id}>
            <span className="market-scale-number">{item.displayValue}</span>
            <strong>{item.label}</strong>
            <span className="market-scale-detail">{item.detail}</span>
            <span className="market-scale-class">{item.evidenceClass.replaceAll("-", " ")}</span>
            <details>
              <summary>Definition and sources</summary>
              <p>{item.note}</p>
              <div className="market-scale-sources">
                {item.sources.map((source) => (
                  <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label}</a>
                ))}
              </div>
            </details>
          </article>
        ))}
      </div>
    </section>
  );
}
