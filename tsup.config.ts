import { defineConfig } from "tsup";
import { cpSync, chmodSync } from "fs";

export default defineConfig({
  entry: { cli: "src/cli/index.ts" },
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
  // Keep CJS modules that use dynamic require() as externals —
  // tsup cannot safely bundle them into ESM
  external: ["enquirer"],
  noExternal: [/^(?!enquirer).*/],
  onSuccess: async () => {
    cpSync("data", "dist/data", { recursive: true });
    console.log("✓ Copied data/ → dist/data/");
    chmodSync("dist/cli.js", 0o755);
    console.log("✓ chmod +x dist/cli.js");
  },
});