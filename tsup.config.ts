import { defineConfig } from "tsup";
import { cpSync, chmodSync } from "fs";

export default defineConfig({
  entry: { cli: "src/cli/index.ts" },  // forces output to dist/cli.js
  outDir: "dist",
  outExtension: () => ({ js: ".js" }),
  format: ["esm"],
  target: "node18",
  banner: {
    js: "#!/usr/bin/env node",
  },
  clean: true,
  minify: false,
  bundle: true,
  noExternal: [/.*/],
  onSuccess: async () => {
    cpSync("data", "dist/data", { recursive: true });
    console.log("✓ Copied data/ → dist/data/");
    chmodSync("dist/cli.js", 0o755);
    console.log("✓ chmod +x dist/cli.js");
  },
});
