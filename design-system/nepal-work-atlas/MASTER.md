# Nepal Work Atlas Design System

## Scope and reference boundary

Nepal Work Atlas uses analytical minimalism and proportional-treemap interaction patterns as UI references only. Product statistics must come from Nepal-specific project datasets and cited Nepal evidence. US/BLS occupation counts, pay, projections, education requirements, or AI-exposure values do not belong in the product dataset.

## Visual thesis

Nepal Work Atlas is an analytical research instrument. The graph is the hero, chrome is quiet, typography is compact, surfaces are near-black, separators are thin, and exact values remain readable. The interface should feel closer to a scientific data tool than a conventional SaaS dashboard.

Forbidden visual patterns: decorative gradients, glassmorphism, glow, oversized marketing typography, floating shadow cards, large rounded pills, emoji icons, ornamental illustrations, ambient loops, cyberpunk/neon treatment.

## Information architecture

The product has exactly three primary workspaces:

1. **Employment** - official national employment structure. This is the default workspace and contains the national treemap plus occupation inspection.
2. **Vacancies** - recovered hiring evidence. Secondary tabs are Jobs, Geography, Timeline, and Sources.
3. **Research** - methodology, evidence classes, outside benchmarks, source progress, coverage gaps, and unknown totals.

Only one workspace is presented as the primary task at a time. The application must not reproduce the old long-page model where Employment, Evidence, Jobs, Geography, Timeline, Sources, checkpoints, and methods all compete simultaneously.

Progressive disclosure rules:

- Employment shows source links and exact occupation detail on selection. Deep methodology stays out of the default graph view.
- Vacancies show search and provenance when the Jobs tab is active; geography, timeline, and source analysis live in separate secondary tabs.
- Research holds cross-dataset caveats and benchmark explanations.
- `Cmd/Ctrl+K` switches to Vacancies / Jobs and focuses search.
- Browser back/forward must preserve workspace and vacancy-subtab history.

## Interaction thesis

The interface behaves like a fast analytical instrument.

- Hover feedback: 80-100ms.
- Button/control feedback: 120-150ms.
- List/inspector transitions: 180-220ms.
- Workspace/subtab transition: 220ms.
- Treemap layer and selection transitions: 180-260ms.
- Primary easing: `power2.out` / CSS `cubic-bezier(0.2, 0, 0, 1)`.
- No bounce, overshoot, parallax, or continuously looping animation.
- GSAP is used for workspace continuity, visible list refresh, and inspector/treemap state changes.
- Scroll-triggered choreography is not part of the primary experience because workspaces replace the old long scrolling dashboard.
- Reduced motion collapses spatial and staggered choreography to direct state changes.

## Tokens

### Color

```css
--bg: #0a0a0f;
--bg-2: #12121a;
--bg-3: #171720;
--fg: #e0e0e8;
--fg-strong: #f7f7fb;
--fg-muted: #888894;
--fg-faint: #7c7c88;
--border: rgba(255, 255, 255, 0.10);
--border-soft: rgba(255, 255, 255, 0.06);
--hover: rgba(255, 255, 255, 0.04);
--active: rgba(255, 255, 255, 0.08);
--focus: #93b4ff;
--info: #76a7ff;
--success: #78c995;
--warning: #d6b46b;
--danger: #e07a83;
--nepal-red: #d92332;
```

`--nepal-red` is reserved for Nepal identity marks and critical evidence warnings. It is not the default action color.

### Typography

No network font dependency.

- UI sans: `-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif`
- Data mono: `"SF Mono", "Menlo", "Consolas", ui-monospace, monospace`
- H1: 26px / 1.1 / 700 / -0.03em
- H2: 18-26px depending on workspace context
- Body: 12-14px / 1.55
- Labels: 10px / 1.3 / 600 / uppercase / 0.06-0.08em
- Primary metric: 26px / 1 / 700 / -0.03em
- Numeric tables and metrics use tabular numerals.

### Spacing and shape

Base unit: 4px. Main scale: 4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 64.

- Main max width: 1400px.
- Desktop horizontal gutter: 28px.
- Tablet gutter: 16-20px.
- Mobile gutter: 12-16px.
- Interactive targets: at least 44px high where practical.
- Radius: 1-4px in normal flow, 8px only for tooltip/overlay surfaces.
- No card shadows in normal flow. Borders and surface value carry hierarchy.

## Layout

- Sticky compact header with brand, three centered workspace tabs, and quiet utility controls.
- Employment opens directly into the treemap and occupation inspector.
- Vacancies uses a second tab row for Jobs / Geography / Timeline / Sources.
- Research uses a two-column evidence/progress layout on desktop and one column on smaller screens.
- Tables are preferred over decorative cards for lists and provenance.
- A long global dashboard index is forbidden.

## Treemap

- Rectangle area in the national graph is fixed to official Nepal NPHC 2021 major-occupation population.
- Employment workspace color layers are Employment, Women, Urban, and historical Earnings.
- Recovered vacancy demand is not a color layer in the Employment workspace. Vacancy evidence lives in the Vacancies workspace.
- Tiles use direct labels, exact-value tooltip/detail, and an exact table fallback.
- Selection increases border contrast and dims non-selected tiles slightly without scaling perceived area.
- Color never stands alone: layer name, exact values, legend endpoints, and accessible text remain visible.

## Responsive rules

- 1440: centered analytical canvas, treemap plus right inspector, full workspace and vacancy tabs.
- 1024: workspace tabs move to a second header row; graph inspector can move below the graph.
- 768: workspace metrics collapse, controls wrap, research grid becomes one column.
- 375: horizontally scrollable tabs, full-width controls, tap-based treemap selection, simplified table columns.

## Accessibility

- Normal text >= 4.5:1 contrast; large text >= 3:1.
- Every interactive element is keyboard-operable with visible focus.
- Workspace and vacancy tabs support left/right arrow navigation.
- `Cmd/Ctrl+K` opens Vacancies / Jobs and focuses search.
- Escape closes occupation/job detail.
- Browser back/forward preserves workspace state.
- Treemap has an exact table alternative.
- Color is never the only status or metric cue.
- `prefers-reduced-motion` disables spatial/staggered GSAP choreography.

## Motion tokens

```text
quick: 0.12s
standard: 0.22s
slow: 0.32s
enter: power2.out
state: power2.inOut
exit: power1.in
```

## Implementation stack

- Next.js App Router
- React
- GSAP core
- CSS variables + CSS modules/global CSS
- No additional icon or font dependency required
