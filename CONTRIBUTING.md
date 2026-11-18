# Contributing evidence to Nepal Work Atlas

Nepal Work Atlas is an **evidence-first research product**, not an estimate of every job in Nepal. Changes must preserve the separation between census employment stock, administrative flows, recovered posting evidence, external benchmarks, and derived interface taxonomy. Read the root [README](README.md) for the current product definitions.

## Choose the correct evidence class

| Class | Allowed interpretation | Never imply |
| --- | --- | --- |
| Official employment counts | Population measured by the named official table, year and methodology | Current open jobs or hiring demand |
| Administrative approvals | Recorded approvals/flows over a specified period | Unique workers or distinct vacancies |
| Recovered job postings | Observed postings collected from identifiable sources | Exhaustive national market coverage |
| External snapshots | The external provider's metric on the stated observation date | Deduplicated union with the local archive |
| Derived classifications | Explorer/UI assistance with explicit derivation rules | A source-authored occupational statistic |

Never sum across incompatible classes or silently reinterpret missing observations as zero.

## Required evidence record

For any numeric or categorical source change, provide:

1. **Source identity:** publisher, document/page/record, canonical URL or stable citation, and source type.
2. **Temporal context:** publication date, effective year/period, and the date the record was accessed or verified; leave unknown dates unknown.
3. **Exact claim:** raw value and unit, geographic scope, inclusion/exclusion criteria, original wording where needed and any transformation.
4. **Provenance:** screenshot/archived source where permitted, extraction notes, deduplication key, and reviewer-visible uncertainty.
5. **Coverage:** whether the figure reflects national counts, a partial collected corpus, a local geography, or a third-party benchmark.

Never infer a Nepal province from an employer name, job portal or missing location. The public Jobs view requires explicitly verified Nepal province evidence.

## Pull-request review sequence

- Locate related records first and document why the change is not a duplicate.
- Store source links and uncertainty with the data, not only in a PR comment.
- Preserve historical values until the source supports a correction; distinguish a new observation from a revision.
- Keep public copy explicit: statistic, plain-English meaning, source and year, then drill-down.
- Review whether a taxonomy change affects Jobs, Map, History and Sources filters and URL state.
- Confirm accessibility, numeric precision, empty states, and narrow viewport readability.

## Run the actual project checks

At repository root, using the Node version in \`.nvmrc\`:

~~~bash
npm install
npm run test
npm run typecheck
npm run build
~~~

The repository also provides \`npm run check\` to run these gates together. If a check fails, include the command, exit status and relevant log excerpt in the PR. Automated tests do not validate the truth of source claims: a human must inspect provenance.

## PR description contract

State the research question, evidence class, before/after behavior, records and source references changed, validation commands and results, unanswered questions, and rollback approach. Do not manufacture citations or label a source as freshly verified without actually checking it.

## Rollback

Revert the focused change without erasing the prior evidence trail. If a formerly public record loses its geographic verification, remove it from public results while preserving its appropriately labelled research record where applicable.
