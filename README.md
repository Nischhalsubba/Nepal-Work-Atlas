# Nepal Work Atlas

Evidence-first labor-market intelligence for Nepal. The product distinguishes recovered records from the total labor market and keeps provenance, research gaps, and uncertainty visible.

## Current functionality

- Next.js App Router + TypeScript static application
- National research-checkpoint KPIs kept separate from interactive subset metrics
- Market Evidence panel that separates recovered corpus counts, external labor-demand benchmarks, source-level recruitment totals, coverage universes, and unknown national totals
- Direct evidence links for external benchmarks and official source-level scale indicators
- Research-progress indicators for the identified source universe, native Notion registry normalization, and the current verification run
- Keyboard-search shortcut (`Cmd/Ctrl + K`) and working recovered-record search
- Jobs Explorer with status, province, source and sorting controls
- Job-level provenance panel with canonical/evidence URLs, dates, openings, pay, verification and confidence
- Opportunity Landscape with local drilldown, breadcrumb/Escape navigation and explicit apply-to-dashboard filtering
- Corpus-backed landscape metrics for recovered positions, known openings, pay evidence, temporary work, freelance/gig evidence and dated historical records
- Explicit `Unknown` treatment for unsupported foreign-destination metrics
- Geography aggregation using only explicit province evidence
- Historical chart using only explicit publication dates
- Source aggregation with record/URL/evidence counts
- English/Nepali interface toggle for navigation and core UI labels
- Evidence-mode toggle for expanded provenance and market-evidence methodology notes
- Responsive mobile navigation, keyboard focus states and reduced-motion support

## Evidence snapshot

The research workspace checkpoint contains **293 canonical position records**, **235 distinct posting URLs**, and **2,269 explicitly known openings** as of 2026-08-19. Those are recovered research counts, not Nepal's national opening total.

This static build currently embeds **126 file-backed records** from the audited Run 03 canonical archive and Run 04 Edusanjal position export. The remaining workspace-only records are intentionally not fabricated or treated as zero.

Research Run 05 adds a separate market-evidence layer. It currently exposes these non-additive reference points:

- **5,729 active online job postings** reported for Nepal on 2 Feb 2026 by the CEIC/Revelio Labs weekly series.
- **1,975 vacant posts across 25 advertisements** reported by the official Sudurpashchim Province Public Service Commission dashboard; these are a source-level benchmark until the underlying advertisements are extracted and deduplicated.
- **753 local governments** in the official MoFAGA contact directory, treated as a crawl universe rather than an opening count.
- **National cumulative openings for 2000–2026: not measured.** No complete public national series has been identified, so the application does not fabricate one by summing incompatible datasets.

The wider source inventory identifies **256 source systems**. The native Notion Source Registry currently contains **37 rows**, including **16 priority sources reverified or added in Research Run 05**. Registry normalization and source-by-source extraction remain in progress.

## Development

Use Node.js `24.18.x`.

```bash
npm install
npm run dev
```

Validation:

```bash
npm run typecheck
npm run build
```

Cloudflare Workers static deployment uses `next build` with `output: "export"` and serves the generated `out/` directory through `wrangler.jsonc`.

## Evidence rules

1. Recovered positions are not presented as all jobs in Nepal.
2. Recovered openings, external market benchmarks, source-level recruitment totals, and coverage-universe counts are distinct evidence classes and are never summed together.
3. Unknown, under-researched, reposted, archived, and verified states remain distinguishable.
4. A landscape click changes only the Opportunity Landscape until the user explicitly applies that scope to the dashboard.
5. Treemap sizing uses embedded corpus-backed evidence. Derived taxonomy is labeled as derived rather than source-authored.
6. Canonical source URLs and provenance remain available at job-detail level.
7. Missing publication dates, opening counts, pay, geography, foreign-destination fields, or national cumulative totals remain unknown rather than becoming zero.
