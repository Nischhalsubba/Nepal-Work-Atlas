# Nepal Work Atlas

Evidence-first labor-market intelligence for Nepal. The product keeps official employment structure, recovered job evidence, national-scale administrative evidence, Nepal-specific benchmarks, provenance, research gaps, and uncertainty separate instead of collapsing incompatible measures into one number.

## Product structure

The interface has three primary workspaces:

1. **Employment** - official national occupation structure from Nepal's NPHC 2021, shown as a treemap with exact-value table fallback.
2. **Jobs** - province-verified recovered hiring evidence with **Jobs**, **Map**, **History**, and **Sources** views.
3. **Research** - national-scale context, recovered-corpus progress, evidence classes, source freshness, coverage progress, benchmarks, and explicit unknowns.

The reading order is deliberately simple: **number -> plain-English meaning -> source/year -> deeper detail**.

### Opportunity Landscape

The Jobs workspace includes a contained Opportunity Landscape for derived evidence-taxonomy exploration. Normal drill-down changes only that panel. The IT path can reach:

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

## Market scale versus recovered research

Nepal Work Atlas deliberately separates national-scale measures from recovered posting evidence. These figures answer different questions and are never summed into a fake national vacancy total.

Current market-scale anchors include:

- **14,983,310** people engaged in economic activity in Nepal Census 2021.
- **10,270,447** usually employed people in Nepal Census 2021.
- **>7,742,379** foreign-employment approvals from FY2000/01 through FY2025/26 as a derived administrative-flow lower bound. This is not a unique-job count and not a unique-worker count.
- **5,729** active online job postings reported for Nepal on 2 February 2026 by the CEIC / Revelio Labs series. This external benchmark is not deduplicated against the Atlas archive.

The canonical research databases were re-counted on **20 August 2026**:

- **293** canonical Job Archive position records
- **235** distinct canonical posting URLs
- **2,269** explicitly stated worker openings
- **45** Posting Observations
- **46** Research Coverage rows
- latest stored canonical publication: **17 August 2026**

These are recovered research counts, not Nepal's national opening total.

The strict public Jobs view now contains **150 records with an explicit Nepal province and verified evidence**. The remaining **143** canonical archive records are not in the public Jobs table until they satisfy that exact-province evidence gate. Missing geography is never inferred from a portal, employer, domain, or absent field.

The official Department of Foreign Employment Foreign Job Search was reverified live on **20 August 2026** as a source-freshness check. A freshness check does not create a new canonical job unless a posting is individually extracted, verified, deduplicated, and meets the relevant evidence rules.

The Research workspace also keeps non-additive reference points separate, including:

- **1,975 vacant posts across 25 advertisements** reported by the official Sudurpashchim Province Public Service Commission dashboard, retained as a source-level benchmark until advertisement-level extraction and deduplication are complete.
- **753 local governments** in the official MoFAGA directory, treated as a crawl universe rather than a vacancy count.
- **National cumulative domestic openings for 2000-2026: not measured.** No complete public national posting series has been identified.

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

Typography is deliberately larger than the original dense dashboard treatment:

- body: **16-18px fluid desktop**, **16px minimum mobile**
- ordinary UI labels: roughly **14-15.5px**
- supporting text: roughly **13-15px**
- captions/provenance: roughly **12-13.5px**
- primary metrics: **38-60px** tabular numerals
- section headings: **24-36px**
- display headings: **36-64px**

The analytical canvas supports up to **1680px** on standard wide screens and up to **2400px** at the **2200px+** ultra-wide tier. The responsive gates cover 375, 768, 1024, 1440, and 2200+ widths, including 1080p and 4K/high-density desktop displays. Controls remain at least 44px high and mobile must not produce horizontal page scrolling.

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
- Bun **1.2.15** in the repository build gate
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

GitHub's `Build` workflow runs for pull requests and pushes to `main` using Node 24.19.0 and Bun 1.2.15. Cloudflare Workers static deployment uses Next.js `output: "export"` and serves the generated `out/` directory through `wrangler.jsonc`.

## Evidence rules

1. Official Nepal employment population controls the Employment treemap area, never recovered hiring counts.
2. Recovered positions are not presented as all jobs in Nepal.
3. Employment stock, labour-approval flows, recovered openings, external benchmarks, source-level recruitment totals, and coverage-universe counts remain separate evidence classes.
4. Missing dates, opening counts, pay, geography, or national totals remain unknown rather than becoming zero.
5. Public domestic jobs require explicit Nepal province evidence. Geography is never inferred from a portal, employer, domain, or missing field.
6. Canonical source URLs and provenance remain available at job-detail level.
7. Karpathy's jobs visualizer is an interaction and density reference only. Nepal Work Atlas does not import US/BLS labor-market statistics.
8. Public UI uses plain language while technical evidence definitions remain available in Research and source detail.
