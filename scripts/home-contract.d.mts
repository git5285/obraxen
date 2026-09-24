export const HOME_ROUTES: string[];
export const HOME_ROUTE_FILES: string[];
export type HomeContract = { schemaVersion: number; subsystem: string; ok: boolean; violations: string[]; routes: string[]; publicationAuthorized: boolean };
export function inspectHomeContract(input: { html: string; scripts?: string[]; routeFiles?: string[]; publicFiles?: string[] }): HomeContract;
export function assertHomeContract(app: string): HomeContract;
