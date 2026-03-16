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
import enquirer from "enquirer";

// enquirer is CJS — pull constructors from the default export
const { AutoComplete, Select } = enquirer as any;

async function promptAutocomplete(
  message: string,
  choices: string[]
): Promise<string | null> {
  const prompt = new AutoComplete({
    name: "query",
    message,
    limit: 10,
    choices,
    suggest(input: string, choices: any[]) {
      if (!input) return choices.slice(0, 10);
      const lower = input.toLowerCase();
      return choices.filter((c: any) =>
        (typeof c === "string" ? c : c.value ?? c.name ?? "")
          .toLowerCase()
          .includes(lower)
      );
    },
    footer: chalk.dim("  ↑↓ navigate  Enter select  Ctrl+C exit"),
  });

  try {
    return await prompt.run();
  } catch {
    // User pressed Ctrl+C or ESC
    return null;
  }
}

async function promptSelect(
  message: string,
  choices: { name: string; value: string; hint?: string }[]
): Promise<string | null> {
  const prompt = new Select({
    name: "choice",
    message,
    choices: choices.map((c) => ({
      name: c.value,
      message: c.hint ? `${c.name}  ${chalk.dim(c.hint)}` : c.name,
    })),
    footer: chalk.dim("  ↑↓ navigate  Enter select  Ctrl+C exit"),
  });

  try {
    return await prompt.run();
  } catch {
    return null;
  }
}

async function guidedMode(engine: SearchEngine): Promise<void> {
  renderWelcome();

  const categoryMap = engine.getToolsByCategory();

  const categoryChoices = CATEGORY_ORDER.filter((c) => categoryMap.has(c)).map(
    (c) => ({
      name: CATEGORY_LABELS[c] ?? c,
      value: c,
      hint: `(${categoryMap.get(c)!.length} tools)`,
    })
  );

  const selectedCategory = await promptSelect(
    "What area are you working in?",
    categoryChoices
  );

  if (!selectedCategory) {
    console.log(chalk.dim("\n  Bye!\n"));
    return;
  }

  const tools = categoryMap.get(selectedCategory) ?? [];

  const toolChoices = tools.map((t) => ({
    name: t.tool,
    value: t.tool,
    hint: t.description,
  }));

  const selectedTool = await promptSelect(
    `Which ${CATEGORY_LABELS[selectedCategory]} tool?`,
    toolChoices
  );

  if (!selectedTool) {
    console.log(chalk.dim("\n  Bye!\n"));
    return;
  }

  const tool = tools.find((t) => t.tool === selectedTool);
  if (tool) {
    renderToolCard(tool);
  }
}

async function intentMode(
  query: string,
  engine: SearchEngine
): Promise<void> {
  const allIntents = engine.getAllIntents();

  const selected = await promptAutocomplete(
    `howdoi ${chalk.dim("→")} ${query}`,
    allIntents
  );

  if (!selected) {
    console.log(chalk.dim("\n  Bye!\n"));
    return;
  }

  const results = engine.search(selected);

  if (results.length === 0) {
    renderNoResults(selected);
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
    for (const tool of tools) {
      renderToolLine(tool);
    }
    console.log();
  }
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

  if (args.length === 0) {
    await guidedMode(engine);
    return;
  }

  const query = args.join(" ").trim();

  // Exact tool name match → show all examples directly, no prompt
  const exactTool = tools.find(
    (t) => t.tool.toLowerCase() === query.toLowerCase()
  );
  if (exactTool) {
    renderToolCard(exactTool);
    return;
  }

  // Otherwise → autocomplete intent selection
  await intentMode(query, engine);
}

function printHelp(): void {
  console.log();
  console.log(chalk.bold.white("  howdoi") + "  — Unix & Git command discovery");
  console.log();
  console.log("  " + chalk.bold("Usage"));
  console.log(`    ${chalk.green("howdoi")}                    ${chalk.dim("guided category browser")}`);
  console.log(`    ${chalk.green("howdoi")} ${chalk.yellow("<intent>")}          ${chalk.dim("fuzzy search with autocomplete")}`);
  console.log(`    ${chalk.green("howdoi")} ${chalk.yellow("<tool>")}            ${chalk.dim("show all examples for a tool directly")}`);
  console.log(`    ${chalk.green("howdoi")} ${chalk.yellow("--list")}            ${chalk.dim("list every available tool")}`);
  console.log();
  console.log("  " + chalk.bold("Examples"));
  console.log(`    ${chalk.green("howdoi")}`);
  console.log(`    ${chalk.green("howdoi")} search for text in file`);
  console.log(`    ${chalk.green("howdoi")} delete folder`);
  console.log(`    ${chalk.green("howdoi")} undo last commit`);
  console.log(`    ${chalk.green("howdoi")} grep`);
  console.log(`    ${chalk.green("howdoi")} --list`);
  console.log();
}

main().catch((err) => {
  console.error(chalk.red("Error: ") + err.message);
  process.exit(1);
});
