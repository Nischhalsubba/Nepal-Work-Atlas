import type { JobRecord } from "@/data/job-records";

export type SectorId =
  | "it-software"
  | "education"
  | "health"
  | "public-service"
  | "finance"
  | "engineering"
  | "hospitality"
  | "ngo"
  | "other";

export type AppliedScope = {
  kind: "sector" | "it-subsector" | "software-track";
  id: string;
  label: string;
};

export const sectorLabels: Record<SectorId, string> = {
  "it-software": "IT & Software",
  education: "Education",
  health: "Health & Care",
  "public-service": "Public Service",
  finance: "Finance & Banking",
  engineering: "Engineering",
  hospitality: "Hospitality & Tourism",
  ngo: "NGO / INGO",
  other: "Other / Unclassified",
};

const includesAny = (value: string, terms: string[]) => terms.some((term) => value.includes(term));

function searchable(record: JobRecord) {
  return [
    record.title,
    record.employer,
    record.source,
    record.industry,
    record.workTypes.join(" "),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function classifySector(record: JobRecord): SectorId {
  const haystack = searchable(record);

  if (
    includesAny(haystack, [
      "public service commission",
      "lok sewa",
      "nepal police",
      "government",
      "forest guard",
      "kharidar",
      "nayab subba",
      "section officer",
    ]) || record.workTypes.some((type) => type.toLowerCase() === "government")
  ) {
    return "public-service";
  }

  if (
    includesAny(haystack, [
      "teacher",
      "lecturer",
      "professor",
      "faculty",
      "school",
      "college",
      "campus",
      "education",
      "instructor",
      "librarian",
      "academic",
    ])
  ) {
    return "education";
  }

  if (
    includesAny(haystack, [
      "medical",
      "nurse",
      "health",
      "hospital",
      "pediatric",
      "radiograph",
      "laboratory",
      "lab technician",
      "microbiolog",
      "psycholog",
      "veterinary",
      "hygiene",
    ])
  ) {
    return "health";
  }

  if (
    includesAny(haystack, [
      "finance",
      "account",
      "cashier",
      "cfo",
      "fintech",
      "bank",
      "compliance",
    ])
  ) {
    return "finance";
  }

  if (
    includesAny(haystack, [
      "hospitality",
      "tourism",
      "tour ",
      "travel",
      "restaurant",
      "waiter",
      "kitchen",
      "chef",
      "bakery",
      "commis",
    ])
  ) {
    return "hospitality";
  }

  if (
    includesAny(haystack, [
      "ngo",
      "ingo",
      "undp",
      "unicef",
      "world vision",
      "fhi 360",
      "jica",
      "crs",
      "goal",
      "adra",
      "heifer",
      "helvetas",
      "swisscontact",
      "community development",
      "livelihood",
      "humanitarian",
    ])
  ) {
    return "ngo";
  }

  if (
    includesAny(haystack, [
      "software",
      "developer",
      "web designer",
      "ui/ux",
      "ui ux",
      "ai/ml",
      "machine learning",
      "devops",
      "information technology",
      " it ",
      "computer",
      "network",
      "system engineer",
      "hardware",
      "digital",
      "server administrator",
      "technical support",
      "data management",
      "frontend",
      "front-end",
      "full stack",
      "full-stack",
      "php",
      "java developer",
      "python developer",
    ])
  ) {
    return "it-software";
  }

  if (
    includesAny(haystack, [
      "engineer",
      "architect",
      "construction",
      "irrigation",
      "micro-hydro",
      "supervisor",
    ])
  ) {
    return "engineering";
  }

  return "other";
}

export type ItSubsectorId =
  | "software-engineering"
  | "data-ai"
  | "cloud-devops"
  | "product-ux"
  | "cybersecurity"
  | "qa-testing"
  | "it-support"
  | "enterprise-systems"
  | "other-it";

export const itSubsectorLabels: Record<ItSubsectorId, string> = {
  "software-engineering": "Software Engineering",
  "data-ai": "Data & AI",
  "cloud-devops": "Cloud & DevOps",
  "product-ux": "Product & UX",
  cybersecurity: "Cybersecurity",
  "qa-testing": "QA & Testing",
  "it-support": "IT Support & Infrastructure",
  "enterprise-systems": "Enterprise Systems",
  "other-it": "Other IT",
};

export function classifyItSubsector(record: JobRecord): ItSubsectorId {
  const haystack = searchable(record);
  if (includesAny(haystack, ["ai/ml", "machine learning", "data analyst", "data management", "data scientist"])) return "data-ai";
  if (includesAny(haystack, ["devops", "cloud", "server administrator", "platform engineer"])) return "cloud-devops";
  if (includesAny(haystack, ["ui/ux", "ui ux", "graphic designer", "web designer", "product designer", "motion designer"])) return "product-ux";
  if (includesAny(haystack, ["cyber", "security engineer", "information security"])) return "cybersecurity";
  if (includesAny(haystack, ["qa", "quality assurance", "tester", "testing"])) return "qa-testing";
  if (includesAny(haystack, ["support", "network", "hardware", "computer technician", "it administrator", "system engineer"])) return "it-support";
  if (includesAny(haystack, ["enterprise", "erp", "mis officer", "sap", "oracle"])) return "enterprise-systems";
  if (includesAny(haystack, ["software", "developer", "frontend", "front-end", "backend", "full stack", "full-stack", "php", "java", "python", "web developer"])) return "software-engineering";
  return "other-it";
}

export type SoftwareTrackId = "frontend" | "backend" | "full-stack" | "mobile" | "platform" | "other-software";

export const softwareTrackLabels: Record<SoftwareTrackId, string> = {
  frontend: "Frontend",
  backend: "Backend",
  "full-stack": "Full-stack",
  mobile: "Mobile",
  platform: "Platform",
  "other-software": "Other software",
};

export function classifySoftwareTrack(record: JobRecord): SoftwareTrackId {
  const haystack = searchable(record);
  if (includesAny(haystack, ["full stack", "full-stack", "fullstack"])) return "full-stack";
  if (includesAny(haystack, ["frontend", "front-end", "react", "vue", "web designer"])) return "frontend";
  if (includesAny(haystack, ["backend", "back-end", "php", "java developer", "python developer", ".net"])) return "backend";
  if (includesAny(haystack, ["android", "ios", "mobile developer", "flutter", "react native"])) return "mobile";
  if (includesAny(haystack, ["platform", "devops", "cloud", "infrastructure"])) return "platform";
  return "other-software";
}

export function recordMatchesScope(record: JobRecord, scope: AppliedScope | null) {
  if (!scope) return true;
  if (scope.kind === "sector") return classifySector(record) === scope.id;
  if (scope.kind === "it-subsector") {
    return classifySector(record) === "it-software" && classifyItSubsector(record) === scope.id;
  }
  return (
    classifySector(record) === "it-software" &&
    classifyItSubsector(record) === "software-engineering" &&
    classifySoftwareTrack(record) === scope.id
  );
}
