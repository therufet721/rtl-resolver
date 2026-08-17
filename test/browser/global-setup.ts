import { execSync } from "node:child_process";

export default function globalSetup(): void {
  execSync("npx tsup --config test/browser/tsup.config.ts", { stdio: "inherit" });
}
