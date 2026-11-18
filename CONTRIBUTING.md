# Contributing to Nepal Work Atlas

This project distinguishes **official employment stock**, **administrative approval flows**, **recovered job postings**, **external benchmarks**, and **derived UI classifications**. Changes must preserve that distinction. The root README defines the available workspaces and dataset limits.

## Evidence classes and invalid inferences

| Evidence | Permitted claim | Claim to avoid |
| --- | --- | --- |
| Census counts | People measured by a named census table and year | Current job openings |
| Approval series | Approval events over a defined interval | Unique people or vacancies |
| Recovered postings | Source-backed postings in the collected archive | All vacancies in Nepal |
| External snapshots | Provider's count at a particular time | Deduplicated union with the local archive |
| Derived taxonomy | User-facing navigation or classification | Official census occupation categories |

Never sum incompatible classes or use zero as a substitute for missing evidence.

## Required fields for a source change

1. Publisher and canonical source link or stable citation; the exact record/table where possible.
2. Publication or reference period, verification/observation date, and explicit unknowns.
3. Raw value, unit, geography, original source meaning, and transformation logic.
4. Inclusion/exclusion rules and a duplicate-detection key where applicable.
5. Whether the record is nationally representative, a partial recovered corpus, or a third-party benchmark.
6. Reviewer-friendly proof for nontrivial edits, with uncertainty noted next to the record.

**Public Jobs geography gate:** A Nepal province must be explicitly supported by the underlying posting. Do not infer it from employer names, websites, or incomplete text.

## Implementation and acceptance

- Search the existing corpus before creating a canonical record.
- Preserve a source trail for corrected/removed measurements.
- Review how any taxonomy update affects Jobs, Map, History, Sources, URL filters and keyboard interactions.
- Keep the reading order clear: number → meaning → source/year → detail.
- Use full numeric counts, honest dates, explicit unknowns and meaningful empty states.

## Local checks

Use the Node version specified by \`.nvmrc\`. From repository root:

~~~bash
npm install
npm run test
npm run typecheck
npm run build
~~~

\`npm run check\` combines the tests, typecheck and build. Automated tests are *not* proof that the source claim is true; the reviewer must inspect provenance.

## Pull request evidence

Describe the question being answered, evidence class, source/verification date, records and logic changed, before/after behavior, command results and unresolved uncertainties. Do not state a source has been checked live unless that check actually occurred.

## Reversal policy

Revert the smallest incorrect change while preserving the historical provenance trail. If a record loses explicit province evidence, remove it from the public Jobs result set until verified; do not silently reclassify it.
