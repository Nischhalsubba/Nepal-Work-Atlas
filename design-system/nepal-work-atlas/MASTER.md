# Nepal Work Atlas Design System

## Scope and reference boundary

This design system applies Karpathy-style analytical minimalism to Nepal Work Atlas **only at the UI, interaction, density, and treemap-presentation layer**. No US/BLS occupation data, US pay figures, US growth projections, education requirements, or AI-exposure scores are part of the design reference. Product statistics must come only from Nepal-specific project datasets and cited Nepal evidence.

## Visual thesis

Nepal Work Atlas is an analytical research instrument. The graph is the hero. Chrome is quiet, typography is compact, surfaces are near-black, separators are thin, and exact values remain readable. The interface should feel closer to a scientific notebook or data tool than a conventional SaaS dashboard.

Forbidden visual patterns: gradients used as decoration, glassmorphism, glow, oversized marketing typography, floating cards with shadows, large rounded pills, emoji icons, ornamental illustrations, animated ambient backgrounds, cyberpunk/neon treatment.

## Interaction thesis

The interface behaves like a fast analytical instrument.

- Hover feedback: 80-100ms.
- Button/control feedback: 120-150ms.
- Filter and inspector transitions: 180-220ms.
- Treemap layer changes/drill-in: 240-300ms.
- Section entrances: 260-320ms, only once and only where they improve orientation.
- Primary easing: `power2.out` / CSS `cubic-bezier(0.2, 0, 0, 1)`.
- State-to-state motion: `power2.inOut`.
- Exits: 140-180ms `power1.in`.
- No bounce, no overshoot, no parallax, no continuously looping animation.
- GSAP timelines are used for coordinated interface reveals and treemap/detail state changes; ScrollTrigger is limited to subtle below-fold entrance choreography.
- Reduced motion: all spatial/staggered choreography collapses to direct state changes or short opacity-only transitions.

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
- H1: 26px / 1.15 / 700 / -0.02em
- H2: 20px / 1.25 / 650 / -0.015em
- H3: 14px / 1.35 / 600
- Body: 14-15px / 1.6 / 400
- Compact body: 12-13px / 1.45
- Labels: 10-11px / 1.3 / 600 / uppercase / 0.08em
- Primary metric: 28-32px / 1 / 700 / -0.03em
- All numeric tables and metrics use `font-variant-numeric: tabular-nums`.

### Spacing

Base unit: 4px.

Scale: 4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 64.

- Main max width: 1400px.
- Desktop horizontal gutter: 28px.
- Tablet gutter: 20px.
- Mobile gutter: 14px.
- Dense table row minimum visual height: 40px; interactive rows keep at least 44px hit area.

### Shape and elevation

- Radius XS: 2px.
- Radius SM: 4px.
- Radius MD: 6px.
- Radius LG: 8px, only tooltips/overlays.
- No pill radius except tiny status chips where semantics benefit.
- No card shadows in normal flow.
- Tooltip/overlay shadow only: `0 8px 32px rgba(0,0,0,.55)`.
- Borders carry hierarchy; elevation is rare.

### Layout

- Single centered analytical canvas, not a permanent sidebar dashboard.
- Header contains title, concise methodology, source links, search, evidence mode, language control.
- Employment treemap appears above general research KPIs and is the first major interactive visualization.
- Navigation is a compact horizontal index on desktop and a horizontally scrollable strip on mobile.
- Supporting sections use flat separators instead of floating cards.
- Tables are preferred over decorative cards for lists and provenance.

### Base components

**Button**: transparent background, 1px border, 4px radius, compact label; hover uses `--hover`, active uses `--active`, focus uses 2px `--focus` outline.

**Input/select**: `--bg-2`, 1px border, 4px radius, 44px minimum hit height on touch breakpoints; no inner shadow.

**Metric**: label + large tabular value + one-line source/context. No decorative icon.

**Table row**: thin bottom border, hover tint, selected row uses left inset keyline plus `--active` surface.

**Inspector**: flat right-hand column on desktop, inline disclosure on mobile. Clear close control and Escape support.

**Evidence link**: underlined on hover/focus; external-link mark is text, not an icon dependency.

## Treemap

- Rectangle area in the national graph is fixed to official Nepal employment population from NPHC 2021.
- Layer changes alter color/context only. A future size selector must be explicit and must use a separate Nepal-backed metric; color-layer changes never silently alter area.
- Tiles use 1px gaps/borders, 2-4px radii maximum, direct labels, and exact-value tooltip/detail.
- Selection increases border contrast and dims non-selected tiles slightly; no scaling that changes perceived area.
- Color never stands alone: selected layer name, exact values, legend endpoints, and accessible table are always present.

## Responsive rules

- 1440: graph + right inspector, full control row.
- 1024: graph remains full width; inspector moves below graph if needed.
- 768: controls wrap; summary metrics collapse to 2 columns; tables retain horizontal labels without truncating core values.
- 375: graph uses a minimum usable height and tap selection; hover-only tooltip is replaced by persistent selected detail; filters stack to full-width 44px controls; horizontal navigation can scroll.

## Accessibility

- Normal text >= 4.5:1 contrast; large text >= 3:1.
- Every interactive element keyboard-operable with visible focus.
- `Cmd/Ctrl+K` focuses global search.
- Escape closes occupation/job detail and backs out of analytical drilldown.
- Touch targets >= 44x44 CSS px.
- Treemap has a sortable/exact table alternative.
- Color is never the only status or metric cue.
- `prefers-reduced-motion` disables spatial/staggered GSAP choreography and smooth scrolling.

## Motion tokens

```text
micro: 0.10s
fast: 0.15s
normal: 0.22s
slow: 0.30s
enter: power2.out
state: power2.inOut
exit: power1.in
```

## Implementation stack

- Next.js 16.3 App Router
- React 19.2
- GSAP 3.15.0 with ScrollTrigger from the GSAP package
- CSS variables + CSS modules/global CSS
- No additional icon or font package required
