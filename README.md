# Nepal Work Atlas

Evidence-first labor-market intelligence for Nepal. The product distinguishes national employment structure, recovered vacancy evidence, external market benchmarks, provenance, research gaps, and uncertainty instead of collapsing them into one misleading total.

## Current functionality

- Next.js App Router + TypeScript static application
- National Employment Atlas inspired by proportional occupation treemaps, with rectangle area fixed to official NPHC 2021 major-occupation population
- Employment color layers for women share, urban share, NLFS 2017/18 median monthly employee earnings, and a separately labeled recovered-vacancy signal
- Exact occupation detail with national share, sex split, urban/rural split, all seven province counts, source links, and an accessible table fallback
- Separate National Employment Atlas and Recovered Opportunity Landscape so employment stock is never confused with vacancy flow
- AI-exposure layer intentionally held as research-queued until a Nepal-specific evidence-reviewed scoring rubric exists
- National research-checkpoint KPIs kept separate from interactive subset metrics
- Market Evidence panel that separates recovered corpus counts, external labor-demand benchmarks, source-level recruitment totals, coverage universes, and unknown national totals
- Direct evidence links for external benchmarks and official source-level scale indicators
- Research-progress indicators for the identified source universe, native Notion registry normalization, and the current verification run
- Keyboard-search shortcut (`Cmd/Ctrl + K`) and working recovered-record search
- Jobs Explorer with status, province, source and sorting controls
- Job-level provenance panel with canonical/evidence URLs, dates, openings, pay, verification and confidence
- Recovered Opportunity Landscape with local drilldown, breadcrumb/Escape navigation and explicit apply-to-dashboard filtering
- Corpus-backed vacancy metrics for recovered positions, known openings, pay evidence, temporary work, freelance/gig evidence and dated historical records
- Explicit `Unknown` treatment for unsupported foreign-destination metrics
- Geography aggregation using only explicit province evidence
- Historical chart using only explicit publication dates
- Source aggregation with record/URL/evidence counts
- English/Nepali interface toggle for navigation and core UI labels
- Evidence-mode toggle for expanded provenance and market-evidence methodology notes
- Responsive mobile navigation, keyboard focus states and reduced-motion support

## National employment evidence

The National Employment Atlas uses **National Population and Housing Census 2021, Table 38** from Nepal's National Statistics Office. Its denominator is the population aged 10 years and above who performed any economic activity in the 12 months preceding the census.

- Total economic-activity population in Table 38: **14,983,310**
- Classified into the ten major occupation groups: **14,970,562**
- Occupation not stated: **12,748**

Rectangle **area always represents the 2021 classified occupation population**. Changing a color layer never changes area.

The median-earnings layer uses **Nepal Labour Force Survey 2017/18, Table 4.11** and is explicitly labeled as median monthly earnings in the main job for **employees only**. It is historical context, not a 2021 or current-pay estimate. Armed-forces earnings remain unknown because that table does not provide a corresponding value.

The recovered-vacancy color layer is derived only from the app's embedded vacancy evidence. It is a discovery signal, not a national vacancy rate. Records that cannot be conservatively mapped to a major occupation remain unclassified rather than being forced into a category.

## Vacancy evidence snapshot

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

1. National occupation area is controlled by official employment/economic-activity population, never by recovered vacancy counts.
2. Recovered positions are not presented as all jobs in Nepal.
3. Recovered openings, external market benchmarks, source-level recruitment totals, coverage-universe counts, and national employment counts are distinct evidence classes and are never summed together.
4. Unknown, under-researched, reposted, archived, and verified states remain distinguishable.
5. Color layers do not alter treemap area and their source year/definition remains visible.
6. Derived vacancy-to-occupation mapping is labeled as derived; unmatched records remain unclassified.
7. A recovered-vacancy landscape click changes only that landscape until the user explicitly applies its derived scope to the dashboard.
8. Canonical source URLs and provenance remain available at job-detail level.
9. Missing publication dates, opening counts, pay, geography, foreign-destination fields, AI-exposure scores, or national cumulative vacancy totals remain unknown rather than becoming zero.
