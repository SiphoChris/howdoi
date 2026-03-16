import Fuse from "fuse.js";
import type { ToolEntry, SearchResult } from "./types.js";

interface IntentIndex {
  intent: string;
  tool: ToolEntry;
}

export class SearchEngine {
  private fuse: Fuse<IntentIndex>;
  private index: IntentIndex[];

  constructor(tools: ToolEntry[]) {
    this.index = [];

    for (const tool of tools) {
      // Index the tool description itself as an intent
      this.index.push({ intent: tool.description, tool });

      // Index every declared intent phrase
      for (const intent of tool.intents) {
        this.index.push({ intent, tool });
      }

      // Index the tool name itself
      this.index.push({ intent: tool.tool, tool });
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

    // Deduplicate by tool name — keep best score per tool
    const seen = new Map<string, SearchResult>();

    for (const r of raw) {
      const toolName = r.item.tool.tool;
      const score = r.score ?? 1;

      if (!seen.has(toolName) || score < (seen.get(toolName)!.score)) {
        seen.set(toolName, {
          tool: r.item.tool,
          matchedIntent: r.item.intent,
          score,
        });
      }
    }

    return Array.from(seen.values()).sort((a, b) => a.score - b.score);
  }

  getAllIntents(): string[] {
    return [...new Set(this.index.map((i) => i.intent))].sort();
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
