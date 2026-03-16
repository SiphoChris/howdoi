import { loadAllTools } from "../engine/loader.js";
import { SearchEngine } from "../engine/search.js";
import {
  renderToolCard,
  renderNoResults,
  renderWelcome,
  renderCategoryHeader,
  renderToolLine,
} from "../renderer/display.js";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "../engine/types.js";
import chalk from "chalk";
import { select } from "@inquirer/prompts";

async function promptSelect(
  message: string,
  choices: { name: string; value: string; description?: string }[]
): Promise<string | null> {
  try {
    return await select({
      message,
      choices: choices.map((c) => ({
        name: c.description ? `${c.name}  ${chalk.dim(c.description)}` : c.name,
        value: c.value,
      })),
      pageSize: 12,
    });
  } catch {
    return null;
  }
}

async function guidedMode(engine: SearchEngine): Promise<void> {
  renderWelcome();

  const categoryMap = engine.getToolsByCategory();

  const selectedCategory = await promptSelect(
    "What area are you working in?",
    CATEGORY_ORDER.filter((c) => categoryMap.has(c)).map((c) => ({
      name: CATEGORY_LABELS[c] ?? c,
      value: c,
      description: `${categoryMap.get(c)!.length} tools`,
    }))
  );

  if (!selectedCategory) {
    console.log(chalk.dim("\n  Bye!\n"));
    return;
  }

  const tools = categoryMap.get(selectedCategory) ?? [];

  const selectedTool = await promptSelect(
    `Which ${CATEGORY_LABELS[selectedCategory]} tool?`,
    tools.map((t) => ({
      name: t.tool,
      value: t.tool,
      description: t.description,
    }))
  );

  if (!selectedTool) {
    console.log(chalk.dim("\n  Bye!\n"));
    return;
  }

  const tool = tools.find((t) => t.tool === selectedTool);
  if (tool) renderToolCard(tool);
}

function intentSearch(query: string, engine: SearchEngine): void {
  const results = engine.search(query);

  if (results.length === 0) {
    renderNoResults(query);
    return;
  }

  const top = results[0];
  renderToolCard(top.tool, top.matchedIntent);

  if (results.length > 1) {
    console.log(chalk.dim("  Also relevant:"));
    for (const r of results.slice(1, 4)) {
      console.log(
        `    ${chalk.cyan(r.tool.tool.padEnd(20))} ${chalk.dim(r.tool.description)}`
      );
    }
    console.log();
  }
}

async function listMode(engine: SearchEngine): Promise<void> {
  renderWelcome();
  const categoryMap = engine.getToolsByCategory();
  for (const cat of CATEGORY_ORDER) {
    const tools = categoryMap.get(cat);
    if (!tools) continue;
    renderCategoryHeader(CATEGORY_LABELS[cat] ?? cat);
    for (const tool of tools) renderToolLine(tool);
    console.log();
  }
}

function printHelp(): void {
  console.log();
  console.log(chalk.bold.white("  howdoi") + "  — Unix & Git command discovery");
  console.log();
  console.log("  " + chalk.bold("Usage"));
  console.log(`    ${chalk.green("howdoi")}                    ${chalk.dim("guided category browser")}`);
  console.log(`    ${chalk.green("howdoi")} ${chalk.yellow("<intent>")}          ${chalk.dim("search by what you want to do")}`);
  console.log(`    ${chalk.green("howdoi")} ${chalk.yellow("<tool>")}            ${chalk.dim("show all examples for a tool directly")}`);
  console.log(`    ${chalk.green("howdoi")} ${chalk.yellow("--list")}            ${chalk.dim("list every available tool")}`);
  console.log();
  console.log("  " + chalk.bold("Examples"));
  console.log(`    ${chalk.green("howdoi")}`);
  console.log(`    ${chalk.green("howdoi")} search for text in file`);
  console.log(`    ${chalk.green("howdoi")} delete folder recursively`);
  console.log(`    ${chalk.green("howdoi")} undo last commit`);
  console.log(`    ${chalk.green("howdoi")} follow log file live`);
  console.log(`    ${chalk.green("howdoi")} grep`);
  console.log(`    ${chalk.green("howdoi")} --list`);
  console.log();
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const tools = loadAllTools();
  const engine = new SearchEngine(tools);

  if (args[0] === "--list" || args[0] === "-l") {
    await listMode(engine);
    return;
  }

  if (args[0] === "--help" || args[0] === "-h") {
    printHelp();
    return;
  }

  // No args → guided browser
  if (args.length === 0) {
    await guidedMode(engine);
    return;
  }

  const query = args.join(" ").trim();

  // Exact tool name → show all examples directly
  const exactTool = tools.find(
    (t) => t.tool.toLowerCase() === query.toLowerCase()
  );
  if (exactTool) {
    renderToolCard(exactTool);
    return;
  }

  // Intent query → direct search, instant results
  intentSearch(query, engine);
}

main().catch((err) => {
  console.error(chalk.red("Error: ") + err.message);
  process.exit(1);
});