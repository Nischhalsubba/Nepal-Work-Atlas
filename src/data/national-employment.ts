export type ProvinceName =
  | "Koshi"
  | "Madhesh"
  | "Bagmati"
  | "Gandaki"
  | "Lumbini"
  | "Karnali"
  | "Sudur Paschim";

export type OccupationId =
  | "armed-forces"
  | "managers"
  | "professionals"
  | "technicians"
  | "clerical"
  | "service-sales"
  | "agriculture"
  | "craft-trades"
  | "plant-machine"
  | "elementary";

export type OccupationGroup = {
  id: OccupationId;
  iscoMajorGroup: string;
  label: string;
  shortLabel: string;
  total: number;
  male: number;
  female: number;
  urban: number;
  rural: number;
  medianMonthlyEarnings: number | null;
  provinces: Record<ProvinceName, number>;
};

export const employmentSources = {
  census: {
    label: "National Population and Housing Census 2021, Table 38",
    organization: "National Statistics Office, Nepal",
    url: "https://data.nsonepal.gov.np/he/dataset/a6e2cfed-dddd-4deb-8053-0b608094b47d/resource/e113b03f-ea64-488b-9f37-00e8ebe537fc/download/national-report_-national-population-and-housing-census-2021.pdf",
    dashboardUrl: "https://censusresults.nsonepal.gov.np/economic",
    definition:
      "Population aged 10 years and above who performed any economic activity in the 12 months preceding the 2021 census, classified by major occupation.",
  },
  earnings: {
    label: "Nepal Labour Force Survey 2017/18, Table 4.11",
    organization: "Central Bureau of Statistics / National Statistics Office, Nepal",
    url: "https://data.nsonepal.gov.np/hu/dataset/nepal-labour-force-survey-2018/resource/ef7be6ee-9ae5-42df-92db-16cb61ffcad3/view/d59da5f5-894c-44ba-9251-4fd0fb4d2dec",
    definition:
      "Median monthly earnings in the main job for employees only. These earnings are from 2017/18 and should not be interpreted as 2021 or current wages.",
  },
} as const;

export const nationalEmploymentMeta = {
  referenceYear: 2021,
  totalEconomicActivityPopulation: 14_983_310,
  classifiedOccupationPopulation: 14_970_562,
  occupationNotStated: 12_748,
  earningsReference: "2017/18",
} as const;

export const provinceNames: ProvinceName[] = [
  "Koshi",
  "Madhesh",
  "Bagmati",
  "Gandaki",
  "Lumbini",
  "Karnali",
  "Sudur Paschim",
];

export const occupationGroups: OccupationGroup[] = [
  {
    id: "armed-forces",
    iscoMajorGroup: "0",
    label: "Armed forces occupations",
    shortLabel: "Armed forces",
    total: 104_669,
    male: 95_804,
    female: 8_865,
    urban: 89_359,
    rural: 15_310,
    medianMonthlyEarnings: null,
    provinces: {
      Koshi: 11_197,
      Madhesh: 6_884,
      Bagmati: 46_971,
      Gandaki: 9_597,
      Lumbini: 14_209,
      Karnali: 7_181,
      "Sudur Paschim": 8_630,
    },
  },
  {
    id: "managers",
    iscoMajorGroup: "1",
    label: "Managers",
    shortLabel: "Managers",
    total: 771_445,
    male: 522_645,
    female: 248_800,
    urban: 630_711,
    rural: 140_734,
    medianMonthlyEarnings: 32_000,
    provinces: {
      Koshi: 139_583,
      Madhesh: 74_508,
      Bagmati: 269_463,
      Gandaki: 92_825,
      Lumbini: 119_060,
      Karnali: 29_761,
      "Sudur Paschim": 46_245,
    },
  },
  {
    id: "professionals",
    iscoMajorGroup: "2",
    label: "Professionals",
    shortLabel: "Professionals",
    total: 568_690,
    male: 341_992,
    female: 226_698,
    urban: 431_026,
    rural: 137_664,
    medianMonthlyEarnings: 22_000,
    provinces: {
      Koshi: 91_450,
      Madhesh: 75_827,
      Bagmati: 192_208,
      Gandaki: 56_934,
      Lumbini: 80_602,
      Karnali: 26_644,
      "Sudur Paschim": 45_025,
    },
  },
  {
    id: "technicians",
    iscoMajorGroup: "3",
    label: "Technicians and associate professionals",
    shortLabel: "Technicians",
    total: 278_586,
    male: 179_889,
    female: 98_697,
    urban: 235_003,
    rural: 43_583,
    medianMonthlyEarnings: 23_500,
    provinces: {
      Koshi: 43_716,
      Madhesh: 30_895,
      Bagmati: 120_102,
      Gandaki: 23_250,
      Lumbini: 34_857,
      Karnali: 10_076,
      "Sudur Paschim": 15_690,
    },
  },
  {
    id: "clerical",
    iscoMajorGroup: "4",
    label: "Clerical support workers",
    shortLabel: "Clerical support",
    total: 197_196,
    male: 112_963,
    female: 84_233,
    urban: 169_077,
    rural: 28_119,
    medianMonthlyEarnings: 15_000,
    provinces: {
      Koshi: 28_537,
      Madhesh: 18_950,
      Bagmati: 90_951,
      Gandaki: 17_529,
      Lumbini: 24_169,
      Karnali: 6_572,
      "Sudur Paschim": 10_488,
    },
  },
  {
    id: "service-sales",
    iscoMajorGroup: "5",
    label: "Service and sales workers",
    shortLabel: "Service & sales",
    total: 870_619,
    male: 560_675,
    female: 309_944,
    urban: 709_906,
    rural: 160_713,
    medianMonthlyEarnings: 12_000,
    provinces: {
      Koshi: 150_428,
      Madhesh: 127_137,
      Bagmati: 307_346,
      Gandaki: 76_142,
      Lumbini: 121_955,
      Karnali: 31_054,
      "Sudur Paschim": 56_557,
    },
  },
  {
    id: "agriculture",
    iscoMajorGroup: "6",
    label: "Skilled agricultural, forestry and fishery workers",
    shortLabel: "Agriculture, forestry & fishery",
    total: 7_502_385,
    male: 3_458_947,
    female: 4_043_438,
    urban: 3_882_801,
    rural: 3_619_584,
    medianMonthlyEarnings: 12_167,
    provinces: {
      Koshi: 1_544_581,
      Madhesh: 1_048_845,
      Bagmati: 1_197_426,
      Gandaki: 681_475,
      Lumbini: 1_417_908,
      Karnali: 646_793,
      "Sudur Paschim": 965_357,
    },
  },
  {
    id: "craft-trades",
    iscoMajorGroup: "7",
    label: "Craft and related trades workers",
    shortLabel: "Craft & trades",
    total: 835_914,
    male: 683_511,
    female: 152_403,
    urban: 619_773,
    rural: 216_141,
    medianMonthlyEarnings: 21_292,
    provinces: {
      Koshi: 149_066,
      Madhesh: 179_310,
      Bagmati: 211_595,
      Gandaki: 68_150,
      Lumbini: 144_158,
      Karnali: 27_577,
      "Sudur Paschim": 56_058,
    },
  },
  {
    id: "plant-machine",
    iscoMajorGroup: "8",
    label: "Plant and machine operators and assemblers",
    shortLabel: "Plant & machine operators",
    total: 402_127,
    male: 382_019,
    female: 20_108,
    urban: 309_179,
    rural: 92_948,
    medianMonthlyEarnings: 15_000,
    provinces: {
      Koshi: 79_037,
      Madhesh: 70_097,
      Bagmati: 115_100,
      Gandaki: 37_611,
      Lumbini: 68_578,
      Karnali: 9_561,
      "Sudur Paschim": 22_143,
    },
  },
  {
    id: "elementary",
    iscoMajorGroup: "9",
    label: "Elementary occupations",
    shortLabel: "Elementary occupations",
    total: 3_438_931,
    male: 1_530_496,
    female: 1_908_435,
    urban: 2_463_565,
    rural: 975_366,
    medianMonthlyEarnings: 12_167,
    provinces: {
      Koshi: 594_832,
      Madhesh: 916_006,
      Bagmati: 694_312,
      Gandaki: 253_463,
      Lumbini: 597_314,
      Karnali: 130_299,
      "Sudur Paschim": 252_705,
    },
  },
];
