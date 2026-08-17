export interface RTLPluginContext {
  root: string;
  files: readonly string[];
  readFile(file: string): string;
}

export interface RTLPluginFinding {
  kind: string;
  message: string;
  file?: string;
  line?: number;
  column?: number;
}

export interface RTLPlugin {
  name: string;
  version?: string;
  audit?(context: RTLPluginContext): RTLPluginFinding[] | Promise<RTLPluginFinding[]>;
  migrate?(context: RTLPluginContext): RTLPluginMigration[] | Promise<RTLPluginMigration[]>;
}

export interface RTLPluginMigration {
  file: string;
  output: string;
  message?: string;
}

export interface RTLPluginDiagnostic {
  level: "error" | "warning";
  message: string;
}

/** v1 plugins expose `name` plus `audit` and/or `migrate`. */
export function validateRTLPlugin(plugin: unknown): RTLPluginDiagnostic[] {
  const diagnostics: RTLPluginDiagnostic[] = [];
  if (!plugin || typeof plugin !== "object") {
    return [{ level: "error", message: "plugin must be an object with a name" }];
  }
  const value = plugin as RTLPlugin;
  if (!value.name || typeof value.name !== "string") {
    diagnostics.push({ level: "error", message: "plugin.name is required" });
  }
  if (typeof value.audit !== "function" && typeof value.migrate !== "function") {
    diagnostics.push({ level: "error", message: `${value.name || "plugin"} must implement audit() and/or migrate()` });
  }
  if (value.version !== undefined && !/^\d+\.\d+/.test(String(value.version))) {
    diagnostics.push({ level: "warning", message: `${value.name} version should be a semver-like string` });
  }
  if (value.version === undefined) {
    diagnostics.push({ level: "warning", message: `${value.name || "plugin"} has no version; treat it as experimental` });
  }
  return diagnostics;
}
