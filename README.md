# Nepal Work Atlas

Evidence-first labor-market intelligence for Nepal. The product keeps national employment structure, recovered vacancy evidence, external market benchmarks, provenance, research gaps, and uncertainty separate instead of collapsing incompatible measures into one number.

## Product structure

The interface has three primary workspaces:

1. **Employment** - the national occupation treemap. Rectangle area is fixed to official NPHC 2021 major-occupation population. Color can show employment, women share, urban share, or historical median employee earnings.
2. **Vacancies** - the recovered hiring archive. Jobs, geography, timeline, and source views all describe recovered evidence, not Nepal's complete vacancy market.
3. **Research** - methodology, evidence classes, outside benchmarks, source progress, coverage gaps, and explicit unknowns.

The default experience shows one primary task at a time. Research detail is progressively disclosed instead of being mixed into every exploration screen.

## National employment evidence

The Employment workspace uses **National Population and Housing Census 2021, Table 38** from Nepal's National Statistics Office.

- Total economic-activity population in Table 38: **14,983,310**
- Classified into the ten major occupation groups: **14,970,562**
- Occupation not stated: **12,748**

Rectangle **area always represents the 2021 classified occupation population**. Changing a color layer never changes area.

The earnings color layer uses **Nepal Labour Force Survey 2017/18, Table 4.11** and is labeled as historical median monthly earnings in the main job for **employees only**. It is not a current-wage estimate. Armed-forces earnings remain unknown because that table does not provide a corresponding value.

## Vacancy evidence snapshot

The research checkpoint contains **293 canonical position records**, **235 distinct posting URLs**, and **2,269 explicitly known openings** as of 2026-08-19. These are recovered research counts, not Nepal's national opening total.

The static application currently embeds **126 audited records** for interactive exploration. The remaining research-workspace records are not fabricated or treated as zero.

The Research workspace keeps the following non-additive reference points separate:

- **5,729 active online job postings** reported for Nepal on 2 Feb 2026 by the CEIC/Revelio Labs weekly series.
- **1,975 vacant posts across 25 advertisements** reported by the official Sudurpashchim Province Public Service Commission dashboard; this remains a source-level benchmark until the advertisements are extracted and deduplicated.
- **753 local governments** in the official MoFAGA contact directory, treated as a crawl universe rather than a vacancy count.
- **National cumulative openings for 2000-2026: not measured.** No complete public national series has been identified.

## Interaction and motion

The application uses GSAP for short functional transitions only:

- workspace and vacancy-view changes: about 220ms
- job-row refresh: about 180ms
- inspector entrance: about 200-220ms
- occupation layer/selection feedback: about 100-260ms

`prefers-reduced-motion` removes spatial and staggered choreography and preserves the final interface state directly.

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
2. Recovered positions are not presented as all jobs in Nepal.
3. Employment stock, recovered openings, external market benchmarks, source-level recruitment totals, and coverage-universe counts are distinct evidence classes and are never summed together.
4. Missing publication dates, opening counts, pay, geography, or national totals remain unknown rather than becoming zero.
5. Geography, timeline, and source views describe only the recovered interactive vacancy subset unless explicitly labeled otherwise.
6. Canonical source URLs and provenance remain available at job-detail level.
7. Karpathy's US visualizer is a UI and interaction reference only. Nepal Work Atlas does not import US/BLS labor-market statistics.
