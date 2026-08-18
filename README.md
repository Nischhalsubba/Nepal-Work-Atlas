# Nepal Work Atlas

Evidence-first labor-market intelligence for Nepal. The product distinguishes recovered records from the total labor market and keeps provenance, research gaps, and uncertainty visible.

## Current functionality

- Next.js App Router + TypeScript static application
- National research-checkpoint KPIs kept separate from interactive subset metrics
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
- Evidence-mode toggle for expanded provenance metadata
- Responsive mobile navigation, keyboard focus states and reduced-motion support

## Embedded evidence snapshot

The research workspace checkpoint contains **293 canonical position records**, **235 distinct posting URLs**, and **2,269 explicitly known openings** as of 2026-08-18.

This static build currently embeds **126 file-backed records** from the audited Run 03 canonical archive and Run 04 Edusanjal position export. The remaining workspace-only records are intentionally not fabricated or treated as zero. The UI labels this distinction anywhere interactive subset metrics could otherwise be mistaken for national totals.

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
2. Unknown, under-researched, reposted, archived, and verified states remain distinguishable.
3. A landscape click changes only the Opportunity Landscape until the user explicitly applies that scope to the dashboard.
4. Treemap sizing uses embedded corpus-backed evidence. Derived taxonomy is labeled as derived rather than source-authored.
5. Canonical source URLs and provenance remain available at job-detail level.
6. Missing publication dates, opening counts, pay, geography, or foreign-destination fields remain unknown rather than becoming zero.
