import Fuse from "fuse.js";
import type { ToolEntry, SearchResult } from "./types.js";

interface IntentIndex {
  intent: string;
  tool: ToolEntry;
  isExampleIntent: boolean; // true only if this phrase appears in examples
}

export class SearchEngine {
  private fuse: Fuse<IntentIndex>;
  private index: IntentIndex[];

  constructor(tools: ToolEntry[]) {
    this.index = [];

    for (const tool of tools) {
      // Collect the set of intents that actually tag examples
      const exampleIntents = new Set(tool.examples.map((e) => e.intent));

      // Index tool name and description for matching — but not as example intents
      this.index.push({ intent: tool.tool, tool, isExampleIntent: false });
      this.index.push({ intent: tool.description, tool, isExampleIntent: false });

      // Index declared intent phrases
      for (const intent of tool.intents) {
        this.index.push({
          intent,
          tool,
          isExampleIntent: exampleIntents.has(intent),
        });
      }
    }

    this.fuse = new Fuse(this.index, {
      keys: ["intent"],
      threshold: 0.4,
      distance: 120,
      minMatchCharLength: 2,
      includeScore: true,
    });
  }

  search(query: string): SearchResult[] {
    const raw = this.fuse.search(query);

    // Deduplicate by tool — keep best score per tool
    const seen = new Map<string, SearchResult>();

    for (const r of raw) {
      const toolName = r.item.tool.tool;
      const score = r.score ?? 1;

      if (!seen.has(toolName) || score < (seen.get(toolName)!.score)) {
        seen.set(toolName, {
          tool: r.item.tool,
          // Only pass matchedIntent if it actually tags examples — otherwise
          // renderToolCard will show all examples for the tool
          matchedIntent: r.item.isExampleIntent ? r.item.intent : undefined,
          score,
        });
      }
    }

    return Array.from(seen.values()).sort((a, b) => a.score - b.score);
  }

  // Only expose real intent phrases in autocomplete — not descriptions or tool names
  getAllIntents(): string[] {
    return [
      ...new Set(
        this.index
          .filter((i) => i.isExampleIntent)
          .map((i) => i.intent)
      ),
    ].sort();
  }

  getToolsByCategory(): Map<string, ToolEntry[]> {
    const map = new Map<string, ToolEntry[]>();
    const seen = new Set<string>();

    for (const entry of this.index) {
      const tool = entry.tool;
      if (seen.has(tool.tool)) continue;
      seen.add(tool.tool);

      const list = map.get(tool.category) ?? [];
      list.push(tool);
      map.set(tool.category, list);
    }

    return map;
  }
}