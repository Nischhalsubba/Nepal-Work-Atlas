# Nepal Work Atlas

Evidence-first labor-market intelligence for Nepal. Nepal Work Atlas separates official national employment structure, recovered vacancy evidence, external market benchmarks, provenance, research gaps, and uncertainty instead of collapsing them into one misleading total.

## Interface

The application uses a graph-first analytical interface built around the National Employment Atlas. The design borrows the **interaction density and treemap presentation pattern** of analytical job-market visualizers, while the statistics, occupation counts, geography, earnings context, vacancy evidence, and source links remain Nepal-specific.

The production UI is intentionally restrained:

- near-black analytical canvas with thin separators rather than floating dashboard cards
- National Employment Atlas as the primary visual, with employment population controlling rectangle area
- compact metric controls, exact-value tooltips, click/tap inspection, and an accessible table alternative
- dense tabular Jobs Explorer and provenance inspector
- flat evidence, geography, timeline, source, and field-coverage sections
- system sans + system mono typography with no network font dependency
- GSAP motion used only for orientation and state continuity, with reduced-motion fallbacks
- keyboard search via `Cmd/Ctrl + K`, visible focus states, Escape dismissal, and 44px control targets

The canonical interface rules live in `design-system/nepal-work-atlas/MASTER.md`. The accompanying `DESIGN_DNA.json` captures the design-system, style, and effects decisions in structured form.

## Data boundary

**No US/BLS job-market data is used by Nepal Work Atlas.** External products may be referenced for interface design patterns only. Product statistics must come from Nepal-specific project datasets or explicitly labeled Nepal market benchmarks.

The National Employment Atlas uses **National Population and Housing Census 2021, Table 38** from Nepal's National Statistics Office:

- Total economic-activity population: **14,983,310**
- Classified into the ten major occupation groups: **14,970,562**
- Occupation not stated: **12,748**

Rectangle **area remains fixed to the 2021 classified occupation population**. Changing the color layer does not change area.

The historical earnings context uses **Nepal Labour Force Survey 2017/18, Table 4.11** and is labeled as median monthly earnings in the main job for employees only. It is not presented as current pay. Where the source does not support a value, the application keeps it unknown.

## Vacancy evidence snapshot

The research workspace checkpoint currently contains:

- **293** recovered canonical position records
- **235** distinct canonical posting URLs
- **2,269** explicitly known openings in recovered records
- **46** research coverage records
- **38** posting observations

These are **recovered research counts, not Nepal's national vacancy total**.

The static application currently embeds **126 file-backed recovered records** from audited exports. Missing workspace-only records are not fabricated and missing fields do not become zero.

The separate Market Evidence section also contains non-additive Nepal reference points such as external posting benchmarks, official source-level recruitment totals, and source/crawl universes. Evidence classes are labeled and are never summed to manufacture a national total.

## Current functionality

- National Employment Atlas using official Nepal occupation population
- Nepal-backed color layers for employment, women share, urban share, historical median employee earnings, and recovered hiring evidence
- exact occupation inspector with all seven province counts and official source links
- accessible exact-value occupation table fallback
- recovered Opportunity Landscape with local taxonomy drilldown and explicit apply-to-dashboard filtering
- Jobs Explorer with search, status/province/source filters, sorting, pagination, and provenance details
- Geography, recovered publication Timeline, Sources, and Field Coverage views
- Market Evidence separation between recovered corpus, market benchmarks, source benchmarks, coverage universes, and unknown totals
- English/Nepali interface toggle for core navigation and controls
- Evidence Mode for expanded methodology and provenance
- GSAP entrance/state transitions with `prefers-reduced-motion` handling
- responsive layouts for desktop, tablet, and mobile

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

1. National occupation area is controlled by official Nepal employment/economic-activity population, never by recovered vacancy counts.
2. Recovered positions and known openings are not presented as all jobs in Nepal.
3. Recovered openings, external market benchmarks, source-level recruitment totals, coverage-universe counts, and national employment counts are distinct evidence classes and are never summed together.
4. Unknown, under-researched, reposted, archived, and verified states remain distinguishable.
5. Color layers do not alter treemap area; source year and definition remain visible.
6. Derived vacancy-to-occupation and vacancy-sector mapping is labeled as derived; unmatched records remain unclassified.
7. A recovered-vacancy landscape click remains local until the user explicitly applies its derived scope to the rest of the interface.
8. Canonical source URLs and provenance remain available at job-detail level.
9. Missing publication dates, opening counts, pay, geography, foreign-destination fields, modeled scores, or national cumulative vacancy totals remain unknown rather than becoming zero.
