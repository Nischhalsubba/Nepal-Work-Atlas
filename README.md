# Nepal Work Atlas

Evidence-first labor-market intelligence for Nepal. The product keeps national employment structure, recovered vacancy evidence, external Nepal-specific market benchmarks, provenance, research gaps, and uncertainty separate instead of collapsing incompatible measures into one number.

## Product structure

The interface has three primary workspaces:

1. **Employment** - the national occupation treemap. Rectangle area is fixed to official NPHC 2021 major-occupation population. Color can show employment, women share, urban share, or historical median employee earnings.
2. **Vacancies** - the recovered hiring archive. Jobs, geography, timeline, and source views all describe recovered evidence, not Nepal's complete vacancy market.
3. **Research** - methodology, evidence classes, Nepal-specific external benchmarks, source progress, coverage gaps, and explicit unknowns.

The default experience shows one primary task at a time. Research detail is progressively disclosed instead of being mixed into every exploration screen.

## National employment evidence

The Employment workspace uses **National Population and Housing Census 2021, Table 38** from Nepal's National Statistics Office.

- Total economic-activity population in Table 38: **14,983,310**
- Classified into the ten major occupation groups: **14,970,562**
- Occupation not stated: **12,748**

Rectangle **area always represents the 2021 classified occupation population**. Changing a color layer never changes area.

Primary employment labels use full, human-readable counts such as **7,502,385 people** instead of unexplained compact abbreviations such as `7.5M`. Hover, selection, province details, and the exact-value table all preserve explicit numeric values.

The earnings color layer uses **Nepal Labour Force Survey 2017/18, Table 4.11** and is labeled as historical median monthly earnings in the main job for **employees only**. It is not a current-wage estimate. Armed-forces earnings remain unknown because that table does not provide a corresponding value.

The production 2021 dataset currently supports **10 official major occupation groups**. The application does not invent finer occupation tiles for visual density. A deeper treemap requires a separately validated Nepal NSCO/ISCO occupation dataset with defensible employment counts.

## Vacancy evidence snapshot

The research checkpoint contains **293 canonical position records**, **235 distinct posting URLs**, and **2,269 explicitly known openings** as of 2026-08-19. These are recovered research counts, not Nepal's national opening total.

The audited embedded corpus contains **126 records**. The public domestic vacancy view currently exposes only **75 records with explicit Nepal province evidence**. **50 location-unverified records** and **1 explicit abroad-employment record** are withheld from that Nepal-only public view rather than being silently classified as domestic.

The Research workspace keeps the following non-additive reference points separate:

- **5,729 active online job postings** reported for Nepal on 2 Feb 2026 by the CEIC/Revelio Labs weekly series.
- **1,975 vacant posts across 25 advertisements** reported by the official Sudurpashchim Province Public Service Commission dashboard; this remains a source-level benchmark until the advertisements are extracted and deduplicated.
- **753 local governments** in the official MoFAGA contact directory, treated as a crawl universe rather than a vacancy count.
- **National cumulative openings for 2000-2026: not measured.** No complete public national series has been identified.

## Interaction and motion

The application uses GSAP for short functional transitions only:

- workspace and vacancy-view changes
- treemap entrance and metric changes
- occupation selection and evidence-panel entrance
- province-bar drawing
- vacancy-row refresh

`prefers-reduced-motion` removes spatial and staggered choreography and preserves the final interface state directly.

## Runtime and framework

The production runtime tracks the **latest Node.js 24 LTS patch**, rather than the non-LTS Current channel. Framework and library versions are pinned to stable releases:

- Node.js **24.19.0 LTS**
- Next.js **16.3.1**
- React / React DOM **19.2.8**
- GSAP **3.15.0**
- TypeScript **7.0.2**
- React type definitions **19.2.18**
- Node type definitions **24.3.0**, aligned to the Node 24 production runtime

Using the latest LTS runtime instead of Node Current keeps production on a supported stability line while still taking the newest stable patch release.

## Development

Use Node.js `24.19.x`.

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
5. Geography, timeline, and source views describe only the verified public Nepal vacancy subset unless explicitly labeled otherwise.
6. Canonical source URLs and provenance remain available at job-detail level.
7. Karpathy's US visualizer is a UI and interaction reference only. Nepal Work Atlas does not import US/BLS labor-market statistics.
8. Public employment labels favor explicit human-readable values over compact `K` / `M` abbreviations.
