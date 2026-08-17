import type { WorkspacePackage } from "./workspaces.d.mts";

export function tsupEntryToSubpath(entry: string): string | null;
export function tsupEntryKeys(tsupSource: string): string[];
export function exportSpecifiers(pkg: WorkspacePackage): Array<{
  subpath: string;
  specifier: string;
  target: unknown;
}>;
export function assertTsupEntriesAreExported(packages?: WorkspacePackage[]): string[];
export function assertPublishedSubpathsResolve(packages?: WorkspacePackage[]): string[];
export function assertBidiEngineExports(): string[];
