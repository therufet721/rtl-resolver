export default {
  name: "fixture-plugin",
  version: "0.1.0",
  audit({ files }) {
    return files.some((file) => file.endsWith("fixture.css"))
      ? [{ message: "fixture CSS is covered by the plugin", file: "fixture.css", line: 1, column: 1 }]
      : [];
  },
  migrate({ files }) {
    return files.some((file) => file.endsWith("fixture.css"))
      ? [{ file: "fixture.css", output: ".ok { margin-inline-start: 1rem; }\n", message: "rewrote fixture CSS" }]
      : [];
  },
};
