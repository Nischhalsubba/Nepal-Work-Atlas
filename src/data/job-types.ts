export type NepalProvince =
  | "Koshi"
  | "Madhesh"
  | "Bagmati"
  | "Gandaki"
  | "Lumbini"
  | "Karnali"
  | "Sudur Paschim";

export type JobRecord = {
  id: string;
  title: string;
  employer: string | null;
  source: string;
  canonicalUrl: string;
  evidenceUrl: string | null;
  published: string | null;
  deadline: string | null;
  status: string;
  openings: number | null;
  salary: string | null;
  workTypes: string[];
  province: string | null;
  district: string | null;
  localLevel: string | null;
  industry: string | null;
  remote: string | null;
  verification: string;
  confidence: number;
  dataset: string;
};

export type NepalJobRecord = Omit<JobRecord, "province"> & {
  province: NepalProvince;
  country: "Nepal";
  countryCode: "NP";
  geographyVerification: "Province-evidenced";
};
