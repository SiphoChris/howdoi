import chalk from "chalk";
import type { ToolEntry, Example } from "../engine/types.js";

const BORDER = chalk.dim("─");

function rule(width = 56): string {
  return chalk.dim(BORDER.repeat(width));
}

function badge(category: string): string {
  const labels: Record<string, string> = {
    "text-processing": chalk.bgCyan.black(" TEXT "),
    "file-management": chalk.bgYellow.black(" FILE "),
    "file-inspection": chalk.bgMagenta.black(" INSPECT "),
    git: chalk.bgRed.black(" GIT "),
  };
  return labels[category] ?? chalk.bgWhite.black(` ${category.toUpperCase()} `);
}

export function renderToolCard(tool: ToolEntry, intentFilter?: string): void {
  const examples = intentFilter
    ? tool.examples.filter((e) => e.intent === intentFilter)
    : tool.examples;

  console.log();
  console.log(
    `${badge(tool.category)}  ${chalk.bold.white(tool.tool)}  ${chalk.dim(tool.description)}`
  );
  console.log(rule());

  if (examples.length === 0) {
    console.log(chalk.dim("  No examples found for that intent."));
  } else {
    for (const example of examples) {
      renderExample(example);
    }
  }

  console.log(rule());
  console.log();
}

export function renderExample(example: Example): void {
  console.log();
  console.log(`  ${chalk.dim("▸")} ${chalk.white(example.title)}`);
  console.log(`    ${chalk.green.bold(example.command)}`);
}

export function renderMultipleTools(tools: ToolEntry[]): void {
  for (const tool of tools) {
    renderToolCard(tool);
  }
}

export function renderNoResults(query: string): void {
  console.log();
  console.log(
    chalk.yellow("  No results found for: ") + chalk.bold(`"${query}"`)
  );
  console.log(
    chalk.dim(
      "  Try rephrasing — e.g. 'search file for text' or 'delete folder'"
    )
  );
  console.log();
}

export function renderWelcome(): void {
  console.log();
  console.log(chalk.bold.white("  howdoi") + chalk.dim(" — intent-based Unix & Git command discovery"));
  console.log(chalk.dim("  ") + rule(52));
  console.log();
}

export function renderCategoryHeader(label: string): void {
  console.log(chalk.bold.yellow(`  ${label}`));
}

export function renderToolLine(tool: ToolEntry): void {
  console.log(
    `    ${chalk.green(tool.tool.padEnd(20))} ${chalk.dim(tool.description)}`
  );
}
