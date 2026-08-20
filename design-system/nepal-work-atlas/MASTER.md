# Nepal Work Atlas Design System

## Scope and evidence boundary

Nepal Work Atlas is a Nepal-only labor-market intelligence product. The interface may borrow interaction density and treemap behavior from analytical references, but every factual metric displayed by the product must come from Nepal-specific project data and cited evidence. Unknown values stay unknown. Missing geography is never inferred from a portal, employer or domain.

## Product hierarchy

The default reading order is:

**Number -> plain-English meaning -> source/year -> deeper detail**

Primary workspaces are **Employment**, **Jobs** and **Research**. Jobs contains **Jobs**, **Map**, **History** and **Sources** views. Opportunity Landscape exploration is local until the user deliberately selects **Apply to dashboard**.

## Light-first visual system

```css
--canvas: #F6F7F9;
--surface: #FFFFFF;
--text: #111318;
--text-secondary: #5F6673;
--border: #E3E6EB;
--data-blue: #2F6FEB;
--nepal-red: #D72638;
--verified: #157F5B;
--caution: #A46512;
```

- Soft neutral canvas with white data surfaces.
- Primary numbers are the strongest visual element.
- Nepal red is reserved for identity and critical evidence warnings, not routine actions.
- Verified green communicates evidence that passed its gate.
- Data blue is the primary quantitative and interaction accent.
- Normal body text must reach WCAG AA contrast.

## Typography

No network font dependency.

- UI: system sans stack.
- Body: 16-18px fluid on desktop and high-density displays, 16px minimum on mobile, 1.5-1.65 line-height.
- Ordinary UI labels: 14-15.5px. Supporting text: 13-15px. Captions and provenance metadata: 12-13.5px; routine interface text must not fall below 12px.
- Primary metric: 38-60px, 700-760 weight, tabular numerals.
- Section heading: 24-36px.
- Display heading: 36-64px depending on available width.
- Monospace is reserved for IDs, URLs and machine-like provenance details.
- Sentence case is preferred over tiny uppercase research jargon.

## Spacing, shape and surfaces

Base rhythm is 8px with 4px substeps. Main increments: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64.

- Main content may use up to 1680px on standard analytical screens and up to 2400px on ultra-wide displays at 2200px and above. Large canvases gain type size and gutters instead of merely adding empty space.
- Data surfaces: 8-12px radius, subtle 1px border, very light elevation.
- Controls: at least 44px tall.
- Mobile shows one clear task at a time and must not create horizontal page scrolling.

## Plain-language vocabulary

| Technical or old wording | Interface wording |
|---|---|
| Vacancies | Jobs |
| Geography | Map |
| Timeline | History |
| Verified Nepal-location vacancies | Jobs in Nepal we could verify |
| Province-evidenced | Location verified |
| Known openings | Openings with a stated number |
| Withheld from public view | Not shown yet |
| Occupation classified | Occupation recorded |
| Current data depth | Detail available |
| Reconciliation passed - 45 checks | Data checks passed - 45 |

Technical definitions remain available in Research, source detail and evidence panels.

## Motion system

Personality: **Corporate**. Calm, responsive and controlled.

```text
micro: 120ms
standard: 220ms
scene/data: 320-380ms
enter: power2.out
state: power2.inOut
exit: power1.in
```

- Main and secondary navigation use a gliding active indicator plus short content crossfade/8px continuity.
- Changed headline numbers interpolate over roughly 280-360ms.
- Opportunity Landscape hierarchy changes remain inside a fixed panel footprint and use a short in-place state transition.
- Search/filter results use short row stagger.
- Job inspector slides/fades from the side.
- Map province values and bars transition on entry.
- History uses an SVG line/path reveal with exact values available in a table.
- Sources animate bars and use GSAP Flip for user-triggered reordering.
- Research evidence expands with short opacity/position continuity.
- Button press feedback is about scale 0.985 and never shifts surrounding layout.
- No bounce, ambient loops, parallax or decorative spectacle in data workspaces.

Reduced motion removes number counting, large spatial movement and stagger. Meaning remains available without animation.

## Employment workspace

- Official NPHC 2021 occupation population controls treemap area.
- Primary metric copy is number first: occupation recorded, economic activity, women, urban and detail available.
- Layer buttons change color only; area remains fixed.
- Exact table remains available as the accessibility and precision fallback.
- Selection changes border emphasis and dims unrelated tiles without changing represented area.

## Jobs workspace and Opportunity Landscape

Hierarchy:

`All work -> IT & Software -> Software Engineering -> Frontend / Backend / Full-stack / Mobile / Platform -> individual evidence records when available`

- Normal landscape click changes only the landscape panel.
- Breadcrumb and Escape move one level up.
- **Apply to dashboard** is the only control that promotes a landscape branch into the Jobs/Map/History/Sources filter.
- Tiles are keyboard-operable and expose exact values in a table fallback.

## Charts

- Treemap for hierarchy overview, always with exact table/tree fallback.
- Bar for category comparison and ranking.
- Line for history over time, with direct point values and table fallback.
- Map only when geography is the insight. Province values remain available in a table/list.
- Color never carries meaning alone.

## Accessibility and responsive gates

- 4.5:1 normal text contrast.
- Visible focus on every interactive element.
- 44x44px minimum primary touch targets.
- Keyboard navigation for tabs, treemap/landscape, filters and detail views.
- Cmd/Ctrl+K opens Jobs and focuses search.
- Escape closes job/occupation detail and moves Opportunity Landscape up a level.
- Test 375, 768, 1024, 1440 and 2200+ widths, including 1080p and 4K/high-density desktop displays.
- No horizontal page scrolling on mobile.
- Static or short-fade behavior under `prefers-reduced-motion`.

## Technology boundary

- Next.js App Router
- React
- GSAP core and Flip
- CSS variables, CSS modules and global CSS
- No Three.js/WebGL dependency in Employment, Jobs, Map, History, Sources or Research

A later branded landing/header experiment may evaluate one lazy-loaded Three.js accent only if it improves the product without covering text or consuming the data-workspace performance budget.

## Market scale versus recovered corpus

The Jobs and Research workspaces must never let the recovered archive look like Nepal's total labour market. Use two explicit layers:

1. **National / market-scale evidence**: official employment stock, administrative labour-flow measures and clearly labeled external benchmarks. Current evidence includes 14,983,310 people engaged in economic activity in NPHC 2021, 10,270,447 usually employed, a derived lower bound above 7,742,379 foreign-employment approvals from FY2000/01 through FY2025/26, and the 5,729 active-online-posting benchmark observed for 2 February 2026. These measures are not interchangeable and are never summed into a fake national vacancy total.
2. **Recovered Atlas corpus**: 293 canonical research positions, 235 canonical posting URLs, 2,269 explicitly stated worker openings, and 150 records that meet the exact-province public evidence gate as checked 20 August 2026.

The public Jobs bundle should contain all 150 province-verified archive records in this release. The remaining 143 canonical archive records stay outside the public Jobs table until they satisfy the exact-province evidence rule.

The hierarchy remains **number -> plain-English meaning -> source/year -> deeper detail**. A number without its evidence class is incomplete UI.
