import {
  nationalEmploymentMeta,
  occupationGroups,
  provinceNames,
} from "./national-employment";

export type IntegrityCheck = {
  id: string;
  passed: boolean;
  detail: string;
};

const checks: IntegrityCheck[] = [];

function recordCheck(id: string, passed: boolean, detail: string) {
  checks.push({ id, passed, detail });
}

recordCheck(
  "major-groups",
  occupationGroups.length === 10,
  `${occupationGroups.length} major occupation groups`,
);
recordCheck(
  "province-count",
  provinceNames.length === 7,
  `${provinceNames.length} Nepal provinces`,
);
recordCheck(
  "unique-occupation-ids",
  new Set(occupationGroups.map((group) => group.id)).size === occupationGroups.length,
  "occupation IDs are unique",
);

for (const group of occupationGroups) {
  recordCheck(
    `${group.id}-sex-total`,
    group.male + group.female === group.total,
    `${group.label}: male + female = total`,
  );
  recordCheck(
    `${group.id}-locality-total`,
    group.urban + group.rural === group.total,
    `${group.label}: urban + rural = total`,
  );
  recordCheck(
    `${group.id}-province-total`,
    provinceNames.reduce((sum, province) => sum + group.provinces[province], 0) === group.total,
    `${group.label}: seven provinces = national total`,
  );
  recordCheck(
    `${group.id}-nonnegative`,
    [group.total, group.male, group.female, group.urban, group.rural, ...provinceNames.map((province) => group.provinces[province])].every((value) => value >= 0),
    `${group.label}: all displayed counts are non-negative`,
  );
}

const classifiedSum = occupationGroups.reduce((sum, group) => sum + group.total, 0);
recordCheck(
  "classified-total",
  classifiedSum === nationalEmploymentMeta.classifiedOccupationPopulation,
  `${classifiedSum.toLocaleString("en-US")} classified occupation records`,
);
recordCheck(
  "economic-activity-total",
  nationalEmploymentMeta.classifiedOccupationPopulation + nationalEmploymentMeta.occupationNotStated === nationalEmploymentMeta.totalEconomicActivityPopulation,
  "classified + occupation not stated = economic activity population",
);

const failedChecks = checks.filter((check) => !check.passed);

if (failedChecks.length) {
  throw new Error(
    `[Nepal Work Atlas] Employment integrity failed: ${failedChecks.map((check) => check.id).join(", ")}`,
  );
}

export const employmentDataIntegrity = {
  country: "Nepal",
  countryCode: "NP",
  sourceClass: "Official national statistics",
  passed: true,
  passedChecks: checks.length,
  failedChecks: 0,
  checks,
} as const;
