import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import yaml from "js-yaml";
import type { ToolEntry } from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function getDataDir(): string {
  /**
   * Path resolution priority:
   *
   * 1. __dirname/data  — bundled output (npm global install, npx)
   *    tsup bundles src → dist/cli.js, onSuccess copies data/ → dist/data/
   *    At runtime __dirname === .../node_modules/howdoi-cli/dist/
   *
   * 2. ../../data — dev mode (bun run src/cli/index.ts)
   *    __dirname === src/engine/, so ../../data resolves to project root data/
   *
   * 3. ../data    — fallback
   */
  const candidates = [
    join(__dirname, "data"),             // bundled: dist/data  (primary)
    join(__dirname, "..", "..", "data"), // dev: src/engine/../../data
    join(__dirname, "..", "data"),       // fallback
  ];

  for (const candidate of candidates) {
    try {
      readdirSync(candidate);
      return candidate;
    } catch {
      // try next
    }
  }

  throw new Error(
    "Could not locate data directory.\n" +
      "If installing from source, run: bun run build\n" +
      "Otherwise try reinstalling: npm install -g howdoi-cli"
  );
}

export function loadAllTools(): ToolEntry[] {
  const dataDir = getDataDir();
  const tools: ToolEntry[] = [];

  const categories = readdirSync(dataDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  for (const category of categories) {
    const categoryDir = join(dataDir, category);
    const files = readdirSync(categoryDir).filter((f) => f.endsWith(".yaml"));

    for (const file of files) {
      const raw = readFileSync(join(categoryDir, file), "utf-8");
      const parsed = yaml.load(raw) as ToolEntry;
      tools.push(parsed);
    }
  }

  return tools;
}
