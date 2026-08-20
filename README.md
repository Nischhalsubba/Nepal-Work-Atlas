# Nepal Work Atlas

Evidence-first labor-market intelligence for Nepal. The product keeps official employment structure, recovered job evidence, Nepal-specific benchmarks, provenance, research gaps, and uncertainty separate instead of collapsing incompatible measures into one number.

## Product structure

The interface has three primary workspaces:

1. **Employment** - official national occupation structure from Nepal's NPHC 2021, shown as a treemap with exact-value table fallback.
2. **Jobs** - recovered hiring evidence with **Jobs**, **Map**, **History**, and **Sources** views.
3. **Research** - evidence classes, source freshness, coverage progress, benchmarks, and explicit unknowns.

The reading order is deliberately simple: **number -> plain-English meaning -> source/year -> deeper detail**.

### Opportunity Landscape

The Jobs workspace includes a contained Opportunity Landscape for derived evidence taxonomy exploration. Normal drill-down changes only that panel. The IT path can reach:

`All work -> IT & Software -> Software Engineering -> Frontend / Backend / Full-stack / Mobile / Platform -> individual recovered records`

Breadcrumb navigation and Escape move up one level. **Apply to dashboard** is a separate action that promotes the currently explored branch into the Jobs/Map/History/Sources filter. Derived classification is an interface aid, not a source-authored Nepal labor statistic.

## National employment evidence

The Employment workspace uses **National Population and Housing Census 2021, Table 38** from Nepal's National Statistics Office.

- People with economic activity: **14,983,310**
- Occupation recorded in the ten official major groups: **14,970,562**
- Occupation not stated: **12,748**
- Employment integrity checks: **45 passed**

Treemap rectangle area always represents the official 2021 occupation population. Changing the comparison layer changes color only, never represented area.

All primary counts are written in full with thousands separators. The interface does not use unexplained `K` or `M` abbreviations.

The earnings comparison uses **Nepal Labour Force Survey 2017/18, Table 4.11** and is explicitly historical median monthly earnings for employees. It is not a current-wage estimate. Armed-forces earnings remain unknown where the source does not provide a corresponding value.

The product does not invent finer employment tiles merely to make the treemap denser. Deeper official occupation detail requires separately validated Nepal counts.

## Recovered jobs and research snapshot

The canonical Notion databases were re-counted on **20 August 2026**:

- **293** canonical Job Archive position records
- **235** distinct canonical posting URLs
- **2,269** explicitly stated worker openings
- **45** Posting Observations
- **46** Research Coverage rows
- latest stored canonical publication: **17 August 2026**

These are recovered research counts, not Nepal's national opening total.

The audited embedded corpus contains **126 records**. The public domestic Jobs view exposes only **75 records with explicit Nepal province evidence**. **50 location-unverified records** and **1 explicit abroad-employment record** are not shown in the domestic public view.

The official Department of Foreign Employment Foreign Job Search was reverified live on **20 August 2026** as a source-freshness check. A freshness check does not create a new canonical job unless a posting is individually extracted, verified, deduplicated, and meets the relevant evidence rules.

The Research workspace keeps non-additive reference points separate, including:

- **5,729 active online job postings** reported for Nepal on 2 February 2026 by the CEIC/Revelio Labs weekly series.
- **1,975 vacant posts across 25 advertisements** reported by the official Sudurpashchim Province Public Service Commission dashboard, retained as a source-level benchmark until advertisement-level extraction and deduplication are complete.
- **753 local governments** in the official MoFAGA directory, treated as a crawl universe rather than a vacancy count.
- **National cumulative openings for 2000-2026: not measured.**

## Visual system

Concept 02 is light-first and optimized for numeric readability:

- canvas `#F6F7F9`
- data surfaces `#FFFFFF`
- primary text `#111318`
- secondary text `#5F6673`
- data blue `#2F6FEB`
- Nepal red `#D72638`, reserved for identity and critical evidence states
- verified green `#157F5B`
- caution amber `#A46512`

Primary metrics use 32-48px tabular numerals. Controls are at least 44px high. The layout is designed for 375, 768, 1024, and 1440+ widths without horizontal page scrolling on mobile.

## Interaction and motion

The motion personality is calm corporate UI motion rather than decorative spectacle.

- navigation indicator and workspace continuity: about 180-240ms
- number interpolation: about 280-360ms
- Opportunity Landscape state/layout continuity: about 240-300ms
- job result refresh: short stagger around 180-260ms
- job inspector: slide/fade around 240-280ms
- Map values and bars: about 220-280ms
- History SVG path reveal: about 320-420ms
- Sources bar growth and GSAP Flip reordering: about 240-320ms
- Research expand/collapse: about 180-240ms

`prefers-reduced-motion` removes number counting, stagger, and large spatial movement while preserving all final states and text meaning.

Three.js/WebGL is intentionally not a core dependency for Employment, Jobs, Map, History, Sources, or Research.

## Runtime and framework

- Node.js **24.19.x LTS**
- Next.js **16.3.1**
- React / React DOM **19.2.8**
- GSAP **3.15.0**
- TypeScript **7.0.2**

No network font dependency is required.

## Development

```bash
npm install
npm run dev
```

Validation:

```bash
npm run typecheck
npm run build
```

Cloudflare Workers static deployment uses Next.js `output: "export"` and serves the generated `out/` directory through `wrangler.jsonc`.

## Evidence rules

1. Official Nepal employment population controls the Employment treemap area, never recovered hiring counts.
2. Recovered positions are not presented as all jobs in Nepal.
3. Employment stock, recovered openings, external benchmarks, source-level recruitment totals, and coverage-universe counts remain separate evidence classes.
4. Missing dates, opening counts, pay, geography, or national totals remain unknown rather than becoming zero.
5. Public domestic jobs require explicit Nepal province evidence. Geography is never inferred from a portal, employer, domain, or missing field.
6. Canonical source URLs and provenance remain available at job-detail level.
7. Karpathy's jobs visualizer is an interaction and density reference only. Nepal Work Atlas does not import US/BLS labor-market statistics.
8. Public UI uses plain language while technical evidence definitions remain available in Research and source detail.
