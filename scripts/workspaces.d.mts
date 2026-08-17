export interface PackageManifest {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  peerDependenciesMeta?: Record<string, { optional?: boolean }>;
  publishConfig?: { access?: string };
  repository?: { type?: string; url?: string; directory?: string };
  homepage?: string;
  bugs?: { url?: string };
  exports?: Record<string, unknown>;
  files?: string[];
  engines?: { node?: string };
}

export interface WorkspacePackage {
  name: string;
  path: string;
  manifest: PackageManifest;
  root?: boolean;
}

export function readJson(path: string): PackageManifest;
export function writeJson(path: string, value: unknown): void;
export function workspacePackages(): WorkspacePackage[];
export function workspaceNames(packages?: WorkspacePackage[]): Set<string>;
export function publishOrder(): WorkspacePackage[];
export const root: string;
