# Nepal Work Atlas

Evidence-first labor-market intelligence for Nepal. The product is designed to distinguish recovered records from the total labor market and to keep provenance, research gaps, and uncertainty visible.

## Current foundation

- Next.js App Router + TypeScript
- Responsive analytical dashboard shell
- Research-checkpoint KPIs using the August 18, 2026 corpus checkpoint
- Opportunity Landscape drilldown with sector-only local state
- Explicit separation between landscape exploration and global filtering
- Keyboard-operable hierarchy with Escape-to-go-up behavior
- Reduced-motion support and high-contrast focus treatment
- Coverage and provenance panels that avoid treating unknown values as zero

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

## Evidence rules

1. Recovered positions are not presented as all jobs in Nepal.
2. Unknown, under-researched, reposted, archived, and verified states remain distinguishable.
3. A sector click changes only the Opportunity Landscape unless the user explicitly applies the sector as a dashboard filter.
4. Treemap sizing must use corpus-backed metrics before it is presented as quantitative data.
5. Canonical source URLs and provenance should remain available at job-detail level as the data layer is added.
