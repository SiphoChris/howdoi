export interface Example {
  intent: string;
  title: string;
  command: string;
}

export interface ToolEntry {
  tool: string;
  category: string;
  description: string;
  intents: string[];
  examples: Example[];
}

export interface SearchResult {
  tool: ToolEntry;
  matchedIntent: string | undefined; // undefined = show all examples
  score: number;
}

export const CATEGORY_LABELS: Record<string, string> = {
  "text-processing": "Text Processing",
  "file-management": "File Management",
  "file-inspection": "File Inspection",
  git: "Git",
  ssh: "SSH",
};

export const CATEGORY_ORDER = [
  "file-management",
  "text-processing",
  "file-inspection",
  "git",
  "ssh",
];