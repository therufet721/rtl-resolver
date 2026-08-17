import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
import type { RTLPlugin } from "@rtl-resolver/core";
import { validateRTLPlugin } from "@rtl-resolver/core/plugin";
import { analyzeSource, baselineFromFindings, filterFindingsByBaseline, migrateSource } from "@rtl-resolver/css";
import { analyzeFontCoverage, analyzeTextCoverage } from "@rtl-resolver/fonts";

const command = process.argv[2] ?? "audit";
const root = process.argv[3] ?? ".";
const extensions = new Set([".css", ".scss", ".sass", ".less", ".tsx", ".jsx", ".ts", ".js"]);
if (command === "fonts") for (const extension of [".txt", ".md"]) extensions.add(extension);
if (command === "fonts") for (const extension of [".ttf", ".otf", ".woff", ".woff2"]) extensions.add(extension);
const ignored = new Set(["node_modules", ".git", ".next", "dist", "build", "coverage", "playwright-report", "test-results"]);
const files: string[] = [];

if (command === "init") {
  const configFile = path.resolve(root, "rtl-resolver.config.mjs");
  if (fs.existsSync(configFile) && !process.argv.includes("--force")) {
    console.error(`${configFile} already exists; pass --force to replace it.`);
    process.exitCode = 1;
  } else {
    fs.writeFileSync(configFile, `export default {\n  locales: {},\n  physicalExceptions: [],\n  plugins: [],\n};\n`);
    console.log(`Created ${configFile}`);
  }
  process.exit(0);
}

if (command === "test") {
  const result = spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", ["test"], {
    cwd: path.resolve(root), stdio: "inherit",
  });
  process.exit(result.status ?? 1);
}

const configPath = path.resolve(root, "rtl-resolver.config.mjs");
const config = fs.existsSync(configPath)
  ? ((await import(pathToFileURL(configPath).href)).default ?? {}) as {
    physicalExceptions?: readonly string[];
    plugins?: readonly (string | Record<string, unknown>)[];
    ignore?: readonly string[];
  }
  : {};

function ignoredPath(full: string, name: string): boolean {
  if (ignored.has(name)) return true;
  const relative = path.relative(path.resolve(root), full).split(path.sep).join("/");
  for (const pattern of config.ignore ?? []) {
    const normalized = pattern.replace(/\\/g, "/").replace(/\/$/, "");
    if (relative === normalized || relative.startsWith(`${normalized}/`) || name === normalized) return true;
  }
  return false;
}

function visit(directory: string) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (ignoredPath(full, entry.name)) continue;
    if (entry.isDirectory()) visit(full);
    else if (extensions.has(path.extname(entry.name))) files.push(full);
  }
}

visit(path.resolve(root));
const pluginContext = { root: path.resolve(root), files, readFile: (file: string) => fs.readFileSync(file, "utf8") };
const loadedPlugins: RTLPlugin[] = [];
for (const pluginSpec of config.plugins ?? []) {
  try {
    const moduleValue = typeof pluginSpec === "string"
      ? (await import(pathToFileURL(path.resolve(root, pluginSpec)).href))
      : { default: pluginSpec };
    const plugin = (moduleValue.default ?? moduleValue) as RTLPlugin;
    const diagnostics = validateRTLPlugin(plugin);
    for (const diagnostic of diagnostics) {
      console.error(`[${diagnostic.level}] ${diagnostic.message}`);
      if (diagnostic.level === "error") process.exitCode = 1;
    }
    if (diagnostics.some((diagnostic) => diagnostic.level === "error")) continue;
    loadedPlugins.push(plugin);
  } catch (error) {
    console.error(`Failed to load RTL plugin ${String(pluginSpec)}: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
if (command === "fonts") {
  const textFiles = files.filter((file) => /\.(?:txt|md)$/i.test(file));
  const binaryFiles = files.filter((file) => /\.(?:ttf|otf|woff|woff2)$/i.test(file));
  const report = analyzeTextCoverage(textFiles.map((file) => fs.readFileSync(file, "utf8")).join("\n"));
  console.log(`RTL Font Coverage Report\n\nFiles scanned                 ${files.length}`);
  for (const script of report.scripts) console.log(`- corpus ${script}: ${report.counts[script]} code points; ${report.stacks[script]}`);
  for (const file of binaryFiles) {
    const coverage = analyzeFontCoverage(fs.readFileSync(file));
    console.log(`- font ${path.basename(file)}`);
    const marks = coverage.marks;
    for (const script of ["latin", "arabic", "persian", "urdu", "hebrew"] as const) {
      const mark = marks[script] === "yes" ? "yes" : marks[script] === "partial" ? "partial" : "no";
      console.log(`  ${script.padEnd(10)} ${mark}`);
    }
  }
  process.exit(0);
}
if (command === "migrate") {
  const fix = process.argv.includes("--fix") && !process.argv.includes("--dry-run");
  const report = process.argv.includes("--report");
  let changed = 0;
  for (const file of files) {
    const result = migrateSource(fs.readFileSync(file, "utf8"), file);
    changed += result.changed;
    if (fix && result.changed) fs.writeFileSync(file, result.output);
    if (report || !fix) for (const finding of result.findings) console.log(finding.message);
  }
  for (const plugin of loadedPlugins) {
    const migrations = await plugin.migrate?.(pluginContext);
    for (const migration of Array.isArray(migrations) ? migrations : []) {
      if (migration.output && migration.file) {
        changed++;
        if (fix) fs.writeFileSync(path.resolve(root, migration.file), migration.output);
        if (report || !fix) console.log(`[${plugin.name}] ${migration.message ?? `migrate ${migration.file}`}`);
      }
    }
  }
  console.log(`RTL Migration\n\nFiles scanned                 ${files.length}\nSafe changes                  ${changed}\nMode                          ${fix ? "fix" : "dry-run"}`);
} else {
  const allFindings = files.flatMap((file) => analyzeSource(fs.readFileSync(file, "utf8"), file))
    .filter((finding) => !config.physicalExceptions?.includes(finding.property ?? finding.value));
  for (const plugin of loadedPlugins) {
    const pluginFindings = await plugin.audit?.(pluginContext);
    for (const finding of (Array.isArray(pluginFindings) ? pluginFindings : [])) {
      allFindings.push({ kind: "manual-review", value: plugin.name, line: finding.line ?? 1, column: finding.column ?? 1,
        message: `[${plugin.name}] ${finding.message}` } as typeof allFindings[number]);
    }
  }
  const baselineIndex = process.argv.indexOf("--baseline");
  const baselineArg = baselineIndex >= 0 ? process.argv[baselineIndex + 1] : undefined;
  const baseline = baselineArg && !baselineArg.startsWith("--") && fs.existsSync(baselineArg)
    ? JSON.parse(fs.readFileSync(baselineArg, "utf8")) as string[] : [];
  const findings = filterFindingsByBaseline(allFindings, baseline);
  if (process.argv.includes("--write-baseline")) {
    const output = baselineArg && !baselineArg.startsWith("--") ? baselineArg : ".rtl-resolver-baseline.json";
    fs.writeFileSync(output, `${JSON.stringify(baselineFromFindings(allFindings), null, 2)}\n`);
    console.log(`Wrote baseline ${output}`);
  }
  const categories = findings.reduce<Record<string, number>>((counts, finding) => {
    counts[finding.kind] = (counts[finding.kind] ?? 0) + 1;
    return counts;
  }, {});
  const categoryLines = Object.entries(categories).map(([kind, count]) => `  ${kind.padEnd(22)} ${count}`).join("\n");
  console.log(`RTL Audit\n\nFiles scanned                 ${files.length}\nFindings                      ${findings.length}\nBaseline entries              ${baseline.length}\nBy category\n${categoryLines || "  (none)"}`);
  for (const finding of findings) console.log(`- ${finding.message}`);
  if ((process.argv.includes("--strict") || command === "lint") && findings.length) process.exitCode = 1;
}
