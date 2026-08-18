import type { JobRecord } from "./job-types";
import { jobsChunk1 } from "./jobs-chunk-1";
import { jobsChunk2 } from "./jobs-chunk-2";
import { jobsChunk3 } from "./jobs-chunk-3";
import { jobsChunk4 } from "./jobs-chunk-4";
import { jobsChunk5 } from "./jobs-chunk-5";
import { jobsChunk6 } from "./jobs-chunk-6";
import { jobsChunk7 } from "./jobs-chunk-7";
import { jobsChunk8 } from "./jobs-chunk-8";

export type { JobRecord } from "./job-types";

export const embeddedCorpusMeta = { totalArchiveRecords: 293, embeddedRecords: 126, label: "Exported evidence subset" } as const;

export const jobRecords: JobRecord[] = [...jobsChunk1,...jobsChunk2,...jobsChunk3,...jobsChunk4,...jobsChunk5,...jobsChunk6,...jobsChunk7,...jobsChunk8];
