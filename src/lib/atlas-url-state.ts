export type WorkspaceRoute = "employment" | "vacancies" | "research";
export type VacancyRoute = "jobs" | "geography" | "timeline" | "sources";

export const workspaceRoutes: readonly WorkspaceRoute[] = ["employment", "vacancies", "research"];
export const vacancyRoutes: readonly VacancyRoute[] = ["jobs", "geography", "timeline", "sources"];

export function parseAtlasHash(hash: string) {
  const raw = hash.replace(/^#/, "");
  const [route = "employment", query = ""] = raw.split("?", 2);
  const [workspaceRaw, vacancyRaw] = route.split("/");
  const workspace: WorkspaceRoute = workspaceRoutes.includes(workspaceRaw as WorkspaceRoute)
    ? workspaceRaw as WorkspaceRoute
    : "employment";
  const vacancyView: VacancyRoute = vacancyRoutes.includes(vacancyRaw as VacancyRoute)
    ? vacancyRaw as VacancyRoute
    : "jobs";
  return { workspace, vacancyView, params: new URLSearchParams(query) };
}

export function buildAtlasHash(workspace: WorkspaceRoute, vacancyView: VacancyRoute, params?: URLSearchParams) {
  const route = workspace === "vacancies" ? `${workspace}/${vacancyView}` : workspace;
  const query = params?.toString();
  return `#${route}${query ? `?${query}` : ""}`;
}
