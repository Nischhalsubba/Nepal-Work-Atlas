import { OpportunityLandscape } from "@/components/opportunity-landscape";
import { checkpointMetrics, researchCheckpoint } from "@/data/research-checkpoint";

const navItems = ["Overview", "Jobs Explorer", "Geography", "History", "Sources"];

const coverageRows = [
  { label: "Canonical position records", value: researchCheckpoint.canonicalPositions, max: 320 },
  { label: "Distinct posting URLs", value: researchCheckpoint.distinctPostingUrls, max: 320 },
  { label: "Posting observations", value: researchCheckpoint.postingObservations, max: 80 },
  { label: "Research coverage records", value: researchCheckpoint.coverageRecords, max: 80 },
];

const sourceGroups = [
  { label: "Government & public service", status: "active", note: "Deep archive traversal required" },
  { label: "Private job portals", status: "active", note: "Current + historical enumeration" },
  { label: "Education aggregators", status: "verified", note: "Resolve reposts to origin" },
  { label: "NGO / INGO / international", status: "queued", note: "Source pass queued" },
];

export default function Home() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#top" aria-label="Nepal Work Atlas home">
          <span className="brand-mark" aria-hidden="true"><i /><i /></span>
          <span><strong>Nepal</strong><small>Work Atlas</small></span>
        </a>

        <nav className="primary-nav" aria-label="Primary navigation">
          {navItems.map((item, index) => (
            <a key={item} className={index === 0 ? "active" : ""} href={`#${item.toLowerCase().replace(" ", "-")}`}>
              <span className="nav-index">0{index + 1}</span>
              <span>{item}</span>
            </a>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className="coverage-dot-row"><span className="coverage-dot" /> Research in progress</div>
          <p>Recovered corpus ≠ total Nepal job market.</p>
          <span>Checkpoint {researchCheckpoint.asOf}</span>
        </div>
      </aside>

      <main id="top" className="main-canvas">
        <header className="topbar">
          <div className="search-shell" role="search">
            <span aria-hidden="true">⌕</span>
            <input aria-label="Search jobs, sectors, places or sources" placeholder="Search jobs, sectors, places or sources" />
            <kbd>⌘ K</kbd>
          </div>
          <div className="topbar-meta">
            <span className="status-pill"><i /> Evidence mode</span>
            <button type="button" className="plain-button">EN / ने</button>
          </div>
        </header>

        <div className="content-wrap">
          <section className="page-heading" id="overview">
            <div>
              <div className="eyebrow">National labor-market intelligence</div>
              <h1>Nepal Work Atlas</h1>
              <p>Explore recovered work opportunities, history, geography and source evidence without pretending the archive is complete.</p>
            </div>
            <div className="checkpoint-card">
              <span>Research checkpoint</span>
              <strong>{researchCheckpoint.asOf}</strong>
              <small>Earliest recovered publication: {researchCheckpoint.recoveredFrom}</small>
            </div>
          </section>

          <section className="evidence-banner" aria-label="Coverage warning">
            <div className="evidence-icon" aria-hidden="true">!</div>
            <div>
              <strong>Coverage is measured, not assumed.</strong>
              <span>Unknown and under-researched areas stay visible instead of being rendered as zero.</span>
            </div>
            <a href="#sources">View source coverage</a>
          </section>

          <section className="metric-grid" aria-label="Research checkpoint metrics">
            {checkpointMetrics.map((metric) => (
              <article key={metric.label} className={`metric-card tone-${metric.tone}`}>
                <div className="metric-label">{metric.label}</div>
                <strong>{metric.value}</strong>
                <span>{metric.detail}</span>
              </article>
            ))}
          </section>

          <OpportunityLandscape />

          <section className="lower-grid">
            <article className="panel coverage-panel" id="history">
              <div className="panel-header compact">
                <div><div className="eyebrow">Archive health</div><h2>Research Coverage</h2></div>
                <span className="small-badge">checkpoint</span>
              </div>
              <div className="coverage-bars">
                {coverageRows.map((row) => {
                  const width = Math.min(100, Math.round((row.value / row.max) * 100));
                  return (
                    <div className="coverage-row" key={row.label}>
                      <div><span>{row.label}</span><strong>{row.value.toLocaleString("en-US")}</strong></div>
                      <div className="bar-track" aria-hidden="true"><span style={{ width: `${width}%` }} /></div>
                    </div>
                  );
                })}
              </div>
              <div className="coverage-legend">
                <span><i className="legend recovered" /> recovered</span>
                <span><i className="legend unknown" /> unknown / gap</span>
              </div>
            </article>

            <article className="panel source-panel" id="sources">
              <div className="panel-header compact">
                <div><div className="eyebrow">Provenance</div><h2>Source Work Queue</h2></div>
                <span className="small-badge">evidence first</span>
              </div>
              <div className="source-list">
                {sourceGroups.map((source) => (
                  <div className="source-row" key={source.label}>
                    <span className={`source-status ${source.status}`} aria-hidden="true" />
                    <div><strong>{source.label}</strong><span>{source.note}</span></div>
                    <small>{source.status}</small>
                  </div>
                ))}
              </div>
            </article>
          </section>
        </div>
      </main>
    </div>
  );
}
